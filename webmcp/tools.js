import { CATALOG } from '../structured-data/catalog.js'
import { resolve } from '../structured-data/resolve.js'
import { compose, patternsFor } from './compose.js'
import { buildError } from './errors.js'

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

export const TOOLS = [
  {
    name: 'find_products',
    description:
      'Find sewing patterns in the catalog by a measurement they are drafted to fit, whichever measurement the pattern records, or by how hard they are to sew. Returns data and changes nothing on the page.',
    // readOnlyHint says this changes nothing, so an agent can call it to
    // answer a question without weighing what it might disturb.
    annotations: { readOnlyHint: true },
    inputSchema: {
      type: 'object',
      properties: {
        size: {
          type: 'string',
          description:
            'A measurement in inches, for example "44". Matched against whichever range the pattern is drafted to, bust or waist.',
        },
        level: { type: 'string', description: 'For example "beginner" or "advanced".' },
      },
    },
    execute: async ({ size, level }) => ({
      // Same lookup the page's own composition uses, so a read and the page
      // drawn from it can never disagree about what the catalog holds.
      matches: size ? patternsFor({ size, level }) : CATALOG.filter((p) => !level || p.level === level.toLowerCase()),
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
    name: 'show_patterns',
    description:
      'Show the person the sewing patterns that fit them. Send who it is for, not what to draw: this page picks the components, writes the headings and renders them.',
    // No readOnlyHint: this one repaints the page the person is looking at.
    // Not consequentialHint either, since nothing is bought or sent. A tool
    // that spent money or submitted a form would set it, and the browser or
    // the agent can then ask the person before running it.
    annotations: { readOnlyHint: false },
    //
    // Two parameters, both facts about the person, and neither of them about
    // this page. That division is the whole point of the tool: a visiting
    // agent knows its person and should never be asked to know our catalog,
    // our component library or our tone of voice.
    //
    inputSchema: {
      type: 'object',
      properties: {
        bust: {
          type: 'number',
          description: 'Bust measurement to fit, in inches. For example 60.',
        },
        level: {
          type: 'string',
          description:
            'How much sewing the person has done. One of "beginner", "confident beginner" or "advanced".',
        },
      },
      required: ['bust', 'level'],
    },
    execute: async ({ bust, level }) => {
      const sections = compose({ bust, level })
      if (!sections.length) {
        // Retrying with the same numbers returns the same nothing, so this
        // failure offers somewhere else to go instead of a button to press.
        return buildError('VALIDATION_FAIL', `Nothing in the catalog is drafted to fit a bust of ${bust} inches at ${level} level.`, {
          alternatives: ['Call find_products with a size on its own to see the whole range.'],
          context: { bust, level },
        })
      }
      try {
        const resolved = resolve(sections)
        // The intent travels with the sections, so the page can show what it
        // was given beside what it made of it.
        window.dispatchEvent(
          new CustomEvent('kit:compose', { detail: { intent: { bust, level }, sections: resolved } }),
        )
        return { rendered: resolved.length, patterns: resolved[0].products.map((p) => p.id) }
      } catch (err) {
        // resolve() guards the site's own composition now, not the visitor's.
        // It still runs, because the thing it protects against is a bad
        // layout, and a layout is a bad layout whoever produced it.
        return buildError('VALIDATION_FAIL', String(err.message))
      }
    },
  },
]
