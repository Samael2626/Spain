export const PACK_PRICES = Object.freeze({ 1: 34.95, 2: 55.90, 3: 74.90 });

export function formatPrice(value) {
  return value.toFixed(2).replace('.', ',') + ' €';
}
