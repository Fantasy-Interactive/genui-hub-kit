/**
 * Run: node structured-data/resolve.check.js
 *
 * Checks the two things that actually protect you: an unknown component and an
 * invented product id are both refused, and a forbidden pair is refused even
 * though every section in it is individually fine.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { InvalidSection, resolve } from './resolve.js'

const recorded = JSON.parse(
  readFileSync(new URL('./model-output.json', import.meta.url), 'utf8'),
)

// The happy path: references become records.
const out = resolve(recorded.sections)
assert.equal(out[0].products.length, 2)
assert.equal(out[0].products[0].name, 'Boxy knit tee')
assert.equal(out[0].products[0].price, 9, 'the price comes from the catalog, not the model')
assert.equal(
  out[0].products[0].sizes,
  'bust 28 to 64 in',
  'and so does the size range, which is the fact a shopper is actually here for',
)
assert.equal(out[1].products, undefined, 'a section without references is left alone')

// A component you do not have.
assert.throws(
  () => resolve([{ type: 'ThreeDCarousel', productIds: [] }]),
  InvalidSection,
  'an unknown component is refused',
)

// A product the model made up. This is the expensive one to miss.
assert.throws(
  () => resolve([{ type: 'ProductGrid', productIds: ['p-9999'] }]),
  InvalidSection,
  'an invented product id is refused',
)

// Both sections are valid on their own. Together they are not.
assert.throws(
  () => resolve([{ type: 'Comparison' }, { type: 'ProductDetail', productIds: ['p-1042'] }]),
  InvalidSection,
  'a forbidden combination is refused',
)

console.log('resolve.check.js: all assertions passed')
