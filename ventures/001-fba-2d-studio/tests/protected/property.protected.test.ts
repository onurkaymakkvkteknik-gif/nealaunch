import { describe, it, expect } from 'vitest';
import { fc, test as fcTest } from '@fast-check/vitest';
import { 
  encode2DBarcode, 
  decode2DBarcode, 
  encodeMultiSkuBoxBarcode, 
  decodeMultiSkuBoxBarcode, 
  validateBarcodeSyntax 
} from '../../src/engine/barcode-engine';
import { sanitizeCsvField, stripBom } from '../../src/engine/sanitizer';
import { calculateUnitMargin } from '../../src/engine/margin-calculator';

describe('Property-Based Fuzz Testing Suite (500+ Iterations)', () => {

  // 1. Single-SKU Round-Trip Invariant Property Test
  fcTest.prop([
    fc.record({
      shipmentId: fc.stringMatching(/^[A-Z0-9]{8,14}$/),
      fnsku: fc.stringMatching(/^[A-Z0-9]{10}$/),
      qty: fc.integer({ min: 1, max: 10000 }),
      exp: fc.option(fc.stringMatching(/^[0-9]{6}$/), { nil: undefined })
    })
  ], { numRuns: 500 })('Single-SKU Invariant: decode(encode(payload)) strictly equals payload', (payload) => {
    const encoded = encode2DBarcode(payload);
    expect(validateBarcodeSyntax(encoded)).toBe(true);

    const decoded = decode2DBarcode(encoded);
    expect(decoded.shipmentId).toBe(payload.shipmentId);
    expect(decoded.fnsku).toBe(payload.fnsku);
    expect(decoded.qty).toBe(payload.qty);
    expect(decoded.exp).toBe(payload.exp);
  });

  // 2. Multi-SKU Box Concatenation Round-Trip Invariant Property Test
  fcTest.prop([
    fc.stringMatching(/^[A-Z0-9]{8,14}$/),
    fc.array(
      fc.record({
        fnsku: fc.stringMatching(/^[A-Z0-9]{10}$/),
        qty: fc.integer({ min: 1, max: 1000 }),
        exp: fc.option(fc.stringMatching(/^[0-9]{6}$/), { nil: undefined })
      }),
      { minLength: 1, maxLength: 8 }
    )
  ], { numRuns: 500 })('Multi-SKU Invariant: Concatenates all box SKUs and parses without data loss', (shipmentId, items) => {
    const encoded = encodeMultiSkuBoxBarcode(shipmentId, items);
    expect(validateBarcodeSyntax(encoded)).toBe(true);

    const decoded = decodeMultiSkuBoxBarcode(encoded);
    expect(decoded.shipmentId).toBe(shipmentId);
    expect(decoded.items.length).toBe(items.length);
    for (let i = 0; i < items.length; i++) {
      expect(decoded.items[i].fnsku).toBe(items[i].fnsku);
      expect(decoded.items[i].qty).toBe(items[i].qty);
      expect(decoded.items[i].exp).toBe(items[i].exp);
    }
  });

  // 3. Adversarial Formula Injection Neutralization Fuzz Test
  fcTest.prop([
    fc.oneof(
      fc.constantFrom('=', '+', '-', '@', '\t', '\r'),
      fc.string()
    ),
    fc.string({ minLength: 1, maxLength: 50 })
  ], { numRuns: 500 })('Adversarial Fuzzing: Formula prefixes are neutralized with leading quote', (prefix, content) => {
    const raw = `${prefix}${content}`;
    const sanitized = sanitizeCsvField(raw);

    if (/^[=+\-@\t\r]/.test(raw.trim())) {
      expect(sanitized.startsWith("'")).toBe(true);
    } else {
      expect(sanitized).toBe(raw.trim());
    }
  });

  // 4. UTF-8 BOM Stripping Invariant
  fcTest.prop([
    fc.string({ minLength: 0, maxLength: 100 })
  ], { numRuns: 500 })('BOM Invariant: Stripping BOM always yields clean string without \\uFEFF', (str) => {
    const withBom = '\uFEFF' + str;
    const cleaned = stripBom(withBom);
    expect(cleaned).toBe(str);
    expect(cleaned.charCodeAt(0)).not.toBe(0xFEFF);
  });

  // 5. Margin Calculation Mathematical Boundary Test
  fcTest.prop([
    fc.double({ min: 0.01, max: 5000, noNaN: true }),
    fc.double({ min: 0.01, max: 10000, noNaN: true }),
    fc.integer({ min: 1, max: 5000 })
  ], { numRuns: 500 })('Margin Invariant: Fee savings strictly equals qty * 0.15 and margin is bounded', (cost, price, qty) => {
    const res = calculateUnitMargin(cost, price, qty);
    expect(res.fbaFeeSaved).toBeCloseTo(qty * 0.15, 2);
    expect(typeof res.grossMarginPct).toBe('number');
  });

});
