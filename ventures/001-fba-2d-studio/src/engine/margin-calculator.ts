import type { UnitMarginAnalysis } from '../domain/types';

export function calculateUnitMargin(cost: number, price: number, qty: number = 1): UnitMarginAnalysis {
  if (price <= 0) {
    return {
      cost,
      price,
      grossMarginPct: 0,
      fbaFeeSaved: qty * 0.15,
      isCompliant: false
    };
  }

  const grossMargin = ((price - cost) / price) * 100;
  const roundedMargin = Math.round(grossMargin * 10) / 10;
  const fbaFeeSaved = Math.round(qty * 0.15 * 100) / 100;

  return {
    cost,
    price,
    grossMarginPct: roundedMargin,
    fbaFeeSaved,
    isCompliant: roundedMargin > 15.0
  };
}
