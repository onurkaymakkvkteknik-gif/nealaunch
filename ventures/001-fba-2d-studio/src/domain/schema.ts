import { z } from 'zod';

export const BoxItemSchema = z.object({
  box: z.number().int().positive().max(1000),
  shipmentId: z.string().min(5).max(30).regex(/^[A-Za-z0-9_-]+$/, "Invalid shipment ID format"),
  fnsku: z.string().min(8).max(20).regex(/^[A-Za-z0-9]+$/, "Invalid FNSKU format"),
  sku: z.string().min(1).max(80),
  title: z.string().min(1).max(500),
  qty: z.number().int().positive().max(50000),
  cost: z.number().nonnegative().max(100000),
  price: z.number().positive().max(100000),
  margin: z.string(),
  expirationDate: z.string().optional()
});

export const BoxSkuItemSchema = z.object({
  fnsku: z.string().min(8).max(20),
  qty: z.number().int().positive(),
  exp: z.string().optional()
});

export const MultiSkuBarcodeSchema = z.object({
  shipmentId: z.string(),
  items: z.array(BoxSkuItemSchema).min(1)
});

export const BarcodePayloadSchema = z.object({
  shipmentId: z.string(),
  fnsku: z.string(),
  qty: z.number().int().positive(),
  exp: z.string().optional()
});

export type ValidatedBoxItem = z.infer<typeof BoxItemSchema>;
export type ValidatedBoxSkuItem = z.infer<typeof BoxSkuItemSchema>;
export type ValidatedMultiSkuBarcode = z.infer<typeof MultiSkuBarcodeSchema>;
export type ValidatedBarcodePayload = z.infer<typeof BarcodePayloadSchema>;
