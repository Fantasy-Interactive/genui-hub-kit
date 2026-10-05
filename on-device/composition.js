import { CATALOG, COMPONENTS } from '../structured-data/catalog.js'

/**
 * The parts of the on-device benchmark worth testing, out of the HTML.
 *
 * Everything here is pure: given a catalog, produce a schema, a prompt, and a
 * median. That makes it checkable under plain node like the rest of the kit.
 */

/**
 * Constrained decoding, as tight as a schema can be made.
 *
 * Both the component names and the product ids are enums drawn from the
 * catalog, so the decoder cannot emit either one wrong. That is a stronger
 * guarantee than any of the server-side models gave us: every one of those was
 * asked nicely in a prompt and validated afterwards, and the failure we saw
 * most often was an invented component name.
 *
 * What a schema still cannot express is a rule that spans sections, such as
 * "these two components must never appear together". Per-item constraints have
 * no way to see the other items. That is why resolve() still runs afterwards,
 * and it is the honest reason rather than the one about product ids.
 */
export function buildSchema(catalog = CATALOG, components = COMPONENTS) {
  return {
    type: 'object',
    required: ['sections'],
    properties: {
      sections: {
        type: 'array',
        minItems: 1, // An empty page is not a valid composition.
        items: {
          type: 'object',
          required: ['type'],
          properties: {
            type: { type: 'string', enum: [...components] },
            heading: { type: 'string' },
            productIds: {
              type: 'array',
              items: { type: 'string', enum: catalog.map((p) => p.id) },
            },
          },
        },
      },
    },
  }
}

export const VISITOR =
  'Someone who sews their own clothes, measures a 48 in bust, and is tired of grading patterns up two sizes before they can start.'

export function buildPrompt(visitor = VISITOR, catalog = CATALOG) {
  return [
    'Compose a short page for this visitor from the catalog below.',
    'Use only the given component types and only these product ids.',
    '',
    `Visitor: ${visitor}`,
    '',
    'Catalog:',
    ...catalog.map((p) => `- ${p.id} ${p.name}, drafted for ${p.sizes}, level: ${p.level}`),
  ].join('\n')
}

/** Median of an odd-length set. Sorts a copy: callers keep their run order. */
export function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  return sorted[Math.floor(sorted.length / 2)]
}
