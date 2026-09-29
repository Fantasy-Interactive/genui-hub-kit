import { CATALOG } from '../structured-data/catalog.js'
import { resolve } from '../structured-data/resolve.js'

/**
 * Three tools over the sample catalog.
 *
 * A tool is a name, a schema and a handler. That's the whole idea, and it's
 * why the same registry can later serve an agent the visitor brought without
 * becoming a second system.
 */

export const TOOLS = [
  {
    name: 'find_plants',
    description: 'Find plants in the catalog by how much light they get or how easy they are.',
    inputSchema: {
      type: 'object',
      properties: {
        light: { type: 'string', description: 'For example "low" or "bright indirect".' },
        care: { type: 'string', description: 'For example "easy" or "very easy".' },
      },
    },
    execute: async ({ light, care }) => ({
      matches: CATALOG.filter(
        (p) =>
          (!light || p.light.includes(light.toLowerCase())) &&
          (!care || p.care.includes(care.toLowerCase())),
      ),
    }),
  },
  {
    name: 'get_plant',
    description: 'Get one plant by its catalog id.',
    inputSchema: {
      type: 'object',
      properties: { id: { type: 'string', description: 'Catalog id, for example p-1042.' } },
      required: ['id'],
    },
    execute: async ({ id }) => CATALOG.find((p) => p.id === id) ?? { error: 'no such plant' },
  },
  {
    name: 'compose_page',
    description:
      'Render a page from a layout the agent supplies. References are resolved against the catalog, and invalid layouts are refused.',
    inputSchema: {
      type: 'object',
      properties: {
        sections: {
          type: 'array',
          description:
            'Sections with a type, an optional heading, and productIds. No prices and no URLs: those come from the catalog.',
          items: { type: 'object' },
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
