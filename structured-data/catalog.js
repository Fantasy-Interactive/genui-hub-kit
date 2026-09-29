/**
 * Stand-in for whatever your site already queries.
 *
 * Plants, because the point is the shape rather than the vertical. Swap this
 * for your own catalog and nothing else in this folder has to change.
 */
export const CATALOG = [
  { id: 'p-1042', name: 'Monstera deliciosa', light: 'bright indirect', care: 'easy', price: 34 },
  { id: 'p-1187', name: 'Snake plant', light: 'low to bright', care: 'very easy', price: 22 },
  { id: 'p-2203', name: 'Fiddle leaf fig', light: 'bright indirect', care: 'fussy', price: 68 },
  { id: 'p-2450', name: 'ZZ plant', light: 'low', care: 'very easy', price: 28 },
  { id: 'p-3101', name: 'String of hearts', light: 'bright indirect', care: 'easy', price: 18 },
]

/** The components a model may choose from. This list is the whole vocabulary. */
export const COMPONENTS = ['ProductGrid', 'ProductDetail', 'Comparison', 'CareGuide']

/**
 * Combinations that must never ship together, whatever the model decides.
 *
 * This is the thing a prompt can't be trusted with. It's a rule, so it lives
 * in code where it either holds or throws.
 */
export const FORBIDDEN_PAIRS = [
  // A comparison next to a single product contradicts itself on the same screen.
  ['Comparison', 'ProductDetail'],
]

export const byId = (id) => CATALOG.find((p) => p.id === id)
