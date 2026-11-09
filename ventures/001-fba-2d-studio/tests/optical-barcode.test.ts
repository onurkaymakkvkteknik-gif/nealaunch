import { describe, it, expect } from 'vitest';
import { encodeMultiSkuBoxBarcode } from '../src/engine/barcode-engine';
import { writeBarcode, readBarcodes } from 'zxing-wasm/full';

describe('Venture #1 Optical Barcode Invariant Test (zxing-wasm)', () => {
  it('optically decodes multi-SKU BOX 1 PDF417 barcode with exact string recovery D(G(x)) === x', async () => {
    const shipmentId = 'FBA9916948U';
    const boxItems = [
      { fnsku: 'X005YCP1', qty: 17 },
      { fnsku: 'X005YDCA', qty: 24 },
      { fnsku: 'X005YDZJ', qty: 31 }
    ];

    const expectedPayload = encodeMultiSkuBoxBarcode(shipmentId, boxItems);
    expect(expectedPayload).toBe('AMZN,PO:FBA9916948U,FNSKU:X005YCP1,QTY:17,FNSKU:X005YDCA,QTY:24,FNSKU:X005YDZJ,QTY:31');

    // 1. Physically render optical PDF417 matrix
    const written = await writeBarcode(expectedPayload, { format: 'PDF417' });
    expect(written.image).toBeDefined();

    // 2. Independently decode image pixels via ZXing WASM
    const decoded = await readBarcodes(written.image, { formats: ['PDF417'] });
    expect(decoded.length).toBeGreaterThan(0);
    expect(decoded[0].isValid).toBe(true);
    expect(decoded[0].format).toBe('PDF417');
    expect(decoded[0].text).toBe(expectedPayload);

    console.log('[VITEST OPTICAL PROOF] Multi-SKU BOX 1 Encoded:', expectedPayload);
    console.log('[VITEST OPTICAL PROOF] zxing-wasm Decoded Text :', decoded[0].text);
    console.log('[VITEST OPTICAL PROOF] Status: BIT-EXACT RECOVERY CONFIRMED (I_rt = 1)');
  }, 30000);
});
