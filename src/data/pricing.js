export const PACK_PRICES = Object.freeze({ 1: 34.95, 2: 55.90, 3: 74.90 });
export const MAX_QUANTITY = 10;

// Mas de 3 unidades = packs de 3 + el resto con su pack (4 = 3+1, 5 = 3+2, 6 = 3+3)
export function priceFor(quantity) {
  const q = Math.max(1, Math.min(MAX_QUANTITY, Math.floor(quantity)));
  const rest = q % 3;
  return Math.floor(q / 3) * PACK_PRICES[3] + (rest ? PACK_PRICES[rest] : 0);
}

export function formatPrice(value) {
  return value.toFixed(2).replace('.', ',') + ' €';
}
