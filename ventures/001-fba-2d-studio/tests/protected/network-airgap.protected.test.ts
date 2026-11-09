import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { encode2DBarcode, encodeMultiSkuBoxBarcode } from '../../src/engine/barcode-engine';
import { calculateUnitMargin } from '../../src/engine/margin-calculator';
import { sanitizeCsvField, stripBom } from '../../src/engine/sanitizer';

interface CapturedNetworkRequest {
  type: 'fetch' | 'xhr' | 'beacon' | 'websocket';
  url: string;
  body?: string;
}

describe('Protected Acceptance Test: Zero Network Egress & Air-Gap Invariant', () => {
  const capturedRequests: CapturedNetworkRequest[] = [];

  const originalFetch = globalThis.fetch;
  const originalXHR = (globalThis as any).XMLHttpRequest;
  const originalBeacon = (globalThis as any).navigator?.sendBeacon;
  const originalWebSocket = (globalThis as any).WebSocket;

  beforeEach(() => {
    capturedRequests.length = 0;

    // Intercept fetch
    globalThis.fetch = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;
      const body = init?.body ? String(init.body) : undefined;
      capturedRequests.push({ type: 'fetch', url, body });
      return new Response(JSON.stringify({ status: 'ok' }));
    });

    // Intercept XMLHttpRequest
    class MockXMLHttpRequest {
      private _url: string = '';
      open(method: string, url: string) {
        this._url = url;
      }
      send(body?: any) {
        capturedRequests.push({
          type: 'xhr',
          url: this._url,
          body: body ? String(body) : undefined,
        });
      }
      setRequestHeader() {}
    }
    (globalThis as any).XMLHttpRequest = MockXMLHttpRequest;

    // Intercept navigator.sendBeacon
    if (!(globalThis as any).navigator) {
      (globalThis as any).navigator = {};
    }
    (globalThis as any).navigator.sendBeacon = vi.fn((url: string | URL, data?: any) => {
      capturedRequests.push({
        type: 'beacon',
        url: String(url),
        body: data ? String(data) : undefined,
      });
      return true;
    });

    // Intercept WebSocket
    class MockWebSocket {
      constructor(url: string) {
        capturedRequests.push({ type: 'websocket', url });
      }
      send(data: any) {
        capturedRequests.push({ type: 'websocket', url: 'active-socket', body: String(data) });
      }
      close() {}
    }
    (globalThis as any).WebSocket = MockWebSocket;
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
    (globalThis as any).XMLHttpRequest = originalXHR;
    if (originalBeacon) {
      (globalThis as any).navigator.sendBeacon = originalBeacon;
    }
    (globalThis as any).WebSocket = originalWebSocket;
  });

  // Helper function to scan network requests for user inputs
  function assertNoNetworkLeak(userInputTokens: string[], requests: CapturedNetworkRequest[]) {
    for (const req of requests) {
      const combined = `${req.url} ${req.body || ''}`;
      for (const token of userInputTokens) {
        if (token && token.length > 2 && combined.includes(token)) {
          throw new Error(
            `[AIRGAP SECURITY VIOLATION] Network egress detected carrying sensitive user input! Token: "${token}" in request to ${req.url}`
          );
        }
      }
    }
  }

  it('POSITIVE: Barcode generation and margin calculation execute with ZERO network requests', async () => {
    const sensitiveUserData = {
      shipmentId: 'FBA9916948U',
      fnsku: 'X005YCP1',
      sku: 'SKU-PROD-CONFIDENTIAL-01',
      title: 'Proprietary Industrial Titanium Carabiner',
      qty: 48,
      cost: 14.85,
      price: 49.99,
      margin: '70.3%'
    };

    const sensitiveTokens = [
      sensitiveUserData.shipmentId,
      sensitiveUserData.fnsku,
      sensitiveUserData.sku,
      sensitiveUserData.title,
      String(sensitiveUserData.cost),
      String(sensitiveUserData.price)
    ];

    // Execute core domain engines
    const singlePayload = encode2DBarcode({
      shipmentId: sensitiveUserData.shipmentId,
      fnsku: sensitiveUserData.fnsku,
      qty: sensitiveUserData.qty
    });
    expect(singlePayload).toContain('AMZN,PO:FBA9916948U');

    const multiPayload = encodeMultiSkuBoxBarcode(sensitiveUserData.shipmentId, [
      { fnsku: sensitiveUserData.fnsku, qty: sensitiveUserData.qty }
    ]);
    expect(multiPayload).toContain('FNSKU:X005YCP1');

    const marginCalc = calculateUnitMargin(sensitiveUserData.cost, sensitiveUserData.price, sensitiveUserData.qty);
    expect(marginCalc.grossMarginPct).toBeGreaterThan(60);

    const sanitized = sanitizeCsvField(sensitiveUserData.title);
    expect(sanitized).toBe(sensitiveUserData.title);

    const cleanBom = stripBom('\uFEFF' + sensitiveUserData.sku);
    expect(cleanBom).toBe(sensitiveUserData.sku);

    // Verify 100% air-gap: Exactly zero network calls were made
    expect(capturedRequests.length).toBe(0);

    // Verify assertion helper confirms zero leak
    expect(() => assertNoNetworkLeak(sensitiveTokens, capturedRequests)).not.toThrow();
  });

  it('NEGATIVE: Verifier strictly catches and FAILS if any network egress carries user input', async () => {
    const userSecretToken = 'X009SECRETFNSKU';
    const userShipmentId = 'FBA-CONFIDENTIAL-999';

    // 1. Simulate an attempted leak via fetch
    await fetch(`https://telemetry.example.com/log?shipment=${userShipmentId}`, {
      method: 'POST',
      body: JSON.stringify({ item: userSecretToken, qty: 100 })
    });

    expect(capturedRequests.length).toBe(1);

    // Assert that the air-gap check detects the leak and fails closed
    expect(() => {
      assertNoNetworkLeak([userSecretToken, userShipmentId], capturedRequests);
    }).toThrowError(/\[AIRGAP SECURITY VIOLATION\]/);
  });

  it('NEGATIVE: Verifier catches leaks attempted via XMLHttpRequest and sendBeacon', () => {
    const userCost = '94.50';
    const userSku = 'SKU-LEAK-PROBE-007';

    // 2. Simulate leak via XHR
    const xhr = new (globalThis as any).XMLHttpRequest();
    xhr.open('POST', 'https://api.external-metrics.com/ingest');
    xhr.send(`cost=${userCost}&sku=${userSku}`);

    expect(() => {
      assertNoNetworkLeak([userCost, userSku], capturedRequests);
    }).toThrowError(/\[AIRGAP SECURITY VIOLATION\]/);

    // 3. Simulate leak via sendBeacon
    capturedRequests.length = 0;
    (globalThis as any).navigator.sendBeacon('https://tracker.analytics.io/collect', JSON.stringify({ sku: userSku }));

    expect(() => {
      assertNoNetworkLeak([userSku], capturedRequests);
    }).toThrowError(/\[AIRGAP SECURITY VIOLATION\]/);
  });
});
