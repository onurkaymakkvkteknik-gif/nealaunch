import { 
  type ValidatedBarcodePayload, 
  type ValidatedMultiSkuBarcode,
  type ValidatedBoxSkuItem,
  BarcodePayloadSchema,
  MultiSkuBarcodeSchema 
} from '../domain/schema';

/**
 * Deterministic Amazon FBA 2D Box Content Barcode Engine
 * Single-SKU Format: AMZN,PO:<ShipmentId>,FNSKU:<FNSKU>,QTY:<Qty>[,EXP:<YYMMDD>]
 * Multi-SKU Format:  AMZN,PO:<ShipmentId>,FNSKU:<FNSKU1>,QTY:<Qty1>,FNSKU:<FNSKU2>,QTY:<Qty2>...
 */

export function encode2DBarcode(payload: ValidatedBarcodePayload): string {
  let res = `AMZN,PO:${payload.shipmentId},FNSKU:${payload.fnsku},QTY:${payload.qty}`;
  if (payload.exp) {
    res += `,EXP:${payload.exp}`;
  }
  return res;
}

export function encodeMultiSkuBoxBarcode(shipmentId: string, items: ValidatedBoxSkuItem[]): string {
  let res = `AMZN,PO:${shipmentId}`;
  for (const it of items) {
    res += `,FNSKU:${it.fnsku},QTY:${it.qty}`;
    if (it.exp) {
      res += `,EXP:${it.exp}`;
    }
  }
  return res;
}

export function decode2DBarcode(barcodeString: string): ValidatedBarcodePayload {
  if (!barcodeString.startsWith("AMZN,PO:")) {
    throw new Error("Invalid Amazon 2D barcode header. Must start with 'AMZN,PO:'");
  }

  const parts = barcodeString.split(",");
  let shipmentId = "";
  let fnsku = "";
  let qty = 0;
  let exp: string | undefined = undefined;

  for (const p of parts) {
    const [key, ...vals] = p.split(":");
    const val = vals.join(":");
    if (key === "PO") shipmentId = val;
    else if (key === "FNSKU") fnsku = val;
    else if (key === "QTY") qty = parseInt(val, 10);
    else if (key === "EXP") exp = val;
  }

  return BarcodePayloadSchema.parse({
    shipmentId,
    fnsku,
    qty,
    exp
  });
}

export function decodeMultiSkuBoxBarcode(barcodeString: string): ValidatedMultiSkuBarcode {
  if (!barcodeString.startsWith("AMZN,PO:")) {
    throw new Error("Invalid Amazon 2D barcode header. Must start with 'AMZN,PO:'");
  }

  const parts = barcodeString.split(",");
  let shipmentId = "";
  const items: ValidatedBoxSkuItem[] = [];
  let currentFnsku = "";
  let currentQty = 0;
  let currentExp: string | undefined = undefined;

  for (const p of parts) {
    const [key, ...vals] = p.split(":");
    const val = vals.join(":");
    if (key === "PO") {
      shipmentId = val;
    } else if (key === "FNSKU") {
      if (currentFnsku && currentQty > 0) {
        items.push({ fnsku: currentFnsku, qty: currentQty, exp: currentExp });
        currentExp = undefined;
      }
      currentFnsku = val;
    } else if (key === "QTY") {
      currentQty = parseInt(val, 10);
    } else if (key === "EXP") {
      currentExp = val;
    }
  }

  if (currentFnsku && currentQty > 0) {
    items.push({ fnsku: currentFnsku, qty: currentQty, exp: currentExp });
  }

  return MultiSkuBarcodeSchema.parse({
    shipmentId,
    items
  });
}

export function validateBarcodeSyntax(barcodeString: string): boolean {
  try {
    const decoded = decodeMultiSkuBoxBarcode(barcodeString);
    return Boolean(decoded.shipmentId && decoded.items.length > 0);
  } catch {
    return false;
  }
}
