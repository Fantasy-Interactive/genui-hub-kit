/**
 * Stand-in for whatever your site already queries.
 *
 * Size-inclusive sewing patterns, because the point is the shape rather than
 * the vertical, and because a size range is a fact a model must never invent.
 * Swap this for your own catalog and nothing else in this folder has to
 * change.
 *
 * `sizes` is the range the pattern is drafted for, not graded up to. That
 * distinction is the whole reason a shopper is reading, and it is exactly the
 * kind of claim that has to come out of a database.
 */
export const CATALOG = [
  { id: 'p-1042', name: 'Wrap dress', sizes: 'bust 30 to 62 in', level: 'confident beginner', price: 16 },
  { id: 'p-1187', name: 'Camp collar shirt', sizes: 'bust 32 to 60 in', level: 'beginner', price: 14 },
  { id: 'p-2203', name: 'Tailored blazer', sizes: 'bust 30 to 58 in', level: 'advanced', price: 22 },
  { id: 'p-2450', name: 'Wide-leg trousers', sizes: 'waist 24 to 56 in', level: 'beginner', price: 15 },
  { id: 'p-3101', name: 'Boxy knit tee', sizes: 'bust 28 to 64 in', level: 'beginner', price: 9 },
]

/** The components a model may choose from. This list is the whole vocabulary. */
export const COMPONENTS = ['ProductGrid', 'ProductDetail', 'Comparison', 'SizeGuide']

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
