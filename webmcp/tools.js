import { CATALOG } from '../structured-data/catalog.js'
import { resolve } from '../structured-data/resolve.js'

/**
 * Three tools over the sample catalog.
 *
 * A tool is a name, a schema and a handler. That's the whole idea, and it's
 * why the same registry can later serve an agent the visitor brought without
 * becoming a second system.
 *
 * The names say product, not sewing pattern, because the rest of this sample
 * does: the ids are productIds and resolve.js refuses an unknown one with
 * "no such product". One thing should have one word inside one codebase.
 *
 * The specifics live in each description instead, which is the half an agent
 * reads when it is choosing between tools. Name yours after whatever your own
 * catalog holds.
 *
 * Reading the catalog and redrawing the page are separate tools on purpose. An
 * agent asked "do they carry patterns for large-busted women?" needs an
 * answer, not a new page, and should be able to get one without taking over
 * the screen the person is reading. It can also check three sizes before it
 * decides anything. A find that rendered as a side effect would redraw the
 * page for every one of those.
 */

/**
 * Is a measurement inside a drafted range?
 *
 * The range is prose in the catalog, like "bust 30 to 62 in", so this reads
 * the two numbers out of it. A real catalog would store them as numbers and
 * this function would not exist.
 */
function fits(range, size) {
  const [low, high] = range.match(/\d+/g).map(Number)
  const n = Number(size)
  return Number.isFinite(n) && n >= low && n <= high
}

export const TOOLS = [
  {
    name: 'find_products',
    description:
      'Find sewing patterns in the catalog by the size range they are drafted for, or by how hard they are to sew.',
    // readOnlyHint says this changes nothing, so an agent can call it to
    // answer a question without weighing what it might disturb.
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        size: { type: 'string', description: 'A measurement in inches, for example "44".' },
        level: { type: 'string', description: 'For example "beginner" or "advanced".' },
      },
    },
    execute: async ({ size, level }) => ({
      matches: CATALOG.filter(
        (p) => (!size || fits(p.sizes, size)) && (!level || p.level.includes(level.toLowerCase())),
      ),
    }),
  },
  {
    name: 'get_product',
    description: 'Get one sewing pattern by its catalog id.',
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Catalog id, for example p-1042.' } },
      required: ['id'],
    },
    execute: async ({ id }) => CATALOG.find((p) => p.id === id) ?? { error: 'no such product' },
  },
  {
    name: 'compose_page',
    description:
      'Render a page from a layout the agent supplies. References are resolved against the catalog, and invalid layouts are refused.',
    // No readOnlyHint: this one repaints the page the person is looking at.
    // Not consequentialHint either, since nothing is bought or sent. A tool
    // that spent money or submitted a form would set it, and the browser or
    // the agent can then ask the person before running it.
    annotations: { readOnlyHint: false },
    inputSchema: {
      type: 'object',
      properties: {
        sections: {
          type: 'array',
          description:
            'Sections with a type, an optional heading, and productIds. No prices and no URLs: those come from the catalog.',
          // The item's fields are spelled out rather than left as a bare
          // object. A caller that cannot see the shape has to guess it, and
          // that includes the DevTools pane, which builds its form from this
          // schema and can offer nothing to fill in for an untyped object.
          items: {
            type: 'object',
            properties: {
              type: {
                type: 'string',
                description: 'ProductGrid, ProductDetail, Comparison or SizeGuide.',
              },
              heading: { type: 'string', description: 'A short heading for the section.' },
              productIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Catalog ids, for example p-1042.',
              },
              body: { type: 'string', description: 'Short text, for a section with no products.' },
            },
            required: ['type'],
          },
        },
      },
      required: ['sections'],
    },
    execute: async ({ sections }) => {
      try {
        const resolved = resolve(sections)
        window.dispatchEvent(new CustomEvent('kit:compose', { detail: resolved }))
        return { rendered: resolved.length }
      } catch (err) {
        // The agent gets told why, in the shape it can act on.
        return { error: String(err.message) }
      }
    },
  },
]
