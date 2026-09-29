/**
 * Run: node on-device/composition.check.js
 *
 * The page's logic, checked without a browser. The schema is the part that
 * matters: if its enums drift from the catalog, the decoder stops constraining
 * the thing the page claims it constrains, and nothing would say so.
 */
import assert from 'node:assert/strict'
import { CATALOG, COMPONENTS } from '../structured-data/catalog.js'
import { buildPrompt, buildSchema, median, VISITOR } from './composition.js'

const schema = buildSchema()
const items = schema.properties.sections.items

// The two enums are the whole point of constrained decoding here.
assert.deepEqual(items.properties.type.enum, COMPONENTS, 'component enum tracks the catalog module')
assert.deepEqual(
  items.properties.productIds.items.enum,
  CATALOG.map((p) => p.id),
  'product id enum tracks the catalog',
)

// An empty page is not a valid composition, and a schema without minItems
// would happily call one valid.
assert.equal(schema.properties.sections.minItems, 1)

// Every catalog item has to appear, or the model is choosing from a list it
// cannot see.
const prompt = buildPrompt()
for (const product of CATALOG) {
  assert.ok(prompt.includes(product.id), `prompt names ${product.id}`)
  assert.ok(prompt.includes(product.name), `prompt names ${product.name}`)
}
assert.ok(prompt.includes(VISITOR), 'prompt carries the visitor context')

// Median of three, including when the runs arrive out of order.
assert.equal(median([100, 200, 300]), 200)
assert.equal(median([300, 100, 200]), 200, 'sorts before taking the middle')
assert.equal(median([5]), 5)
// And it must not reorder the caller's array, which is displayed run by run.
const times = [300, 100, 200]
median(times)
assert.deepEqual(times, [300, 100, 200], 'median does not mutate its input')

console.log('composition.check.js: all assertions passed')
