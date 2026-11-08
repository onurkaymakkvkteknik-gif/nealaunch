export interface BoxItem {
  box: number;
  shipmentId: string;
  fnsku: string;
  sku: string;
  title: string;
  qty: number;
  cost: number;
  price: number;
  margin: string;
  expirationDate?: string;
}

export interface BarcodePayloadResult {
  rawString: string;
  shipmentId: string;
  fnsku: string;
  qty: number;
  format: 'PDF417' | 'Data Matrix';
  isValid: boolean;
}

export interface UnitMarginAnalysis {
  cost: number;
  price: number;
  grossMarginPct: number;
  fbaFeeSaved: number;
  isCompliant: boolean;
}

