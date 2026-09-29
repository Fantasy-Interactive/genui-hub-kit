import { byId, COMPONENTS, FORBIDDEN_PAIRS } from './catalog.js'

/**
 * Two layers, and the whole quick start.
 *
 * Layer 1 is what the model emits: which component, a heading, and references
 * to things that already exist. Layer 2 is your own code turning those
 * references into real records. The model chooses and arranges. It never
 * supplies a fact.
 *
 * That split is what stops a confident model inventing a price.
 */

export class InvalidSection extends Error {}

/**
 * Validate against the catalog, not just the shape.
 *
 * A JSON Schema check would pass a section naming a component you don't have,
 * or a product id that was never in your database. Shape is necessary and it
 * isn't sufficient.
 */
export function validate(sections) {
  const used = sections.map((s) => s.type)

  for (const section of sections) {
    if (!COMPONENTS.includes(section.type)) {
      throw new InvalidSection(`unknown component: ${section.type}`)
    }
    for (const id of section.productIds ?? []) {
      if (!byId(id)) throw new InvalidSection(`no such product: ${id}`)
    }
  }

  for (const [a, b] of FORBIDDEN_PAIRS) {
    if (used.includes(a) && used.includes(b)) {
      throw new InvalidSection(`${a} and ${b} must not ship together`)
    }
  }

  return sections
}

/** Layer 2. References become records here and nowhere else. */
export function resolve(sections) {
  return validate(sections).map((section) =>
    section.productIds
      ? { ...section, products: section.productIds.map(byId) }
      : section,
  )
}
