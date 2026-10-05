/**
 * Run: node structured-data/resolve.check.js
 *
 * Checks the recorded turn still resolves, then the three refusals that
 * actually protect you: a component you don't have, a product id that was
 * never in the catalog, and a pair that is fine section by section and must
 * never ship together.
 *
 * It reads model-output.json rather than a fixture, which is the point: the
 * file the page renders is the file under test. That also means the quick
 * start's "make it fail on purpose" edit will stop this script, so the happy
 * path says so instead of throwing a stack trace at somebody who did what
 * they were told.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { InvalidSection, resolve } from './resolve.js'

const recorded = JSON.parse(
  readFileSync(new URL('./model-output.json', import.meta.url), 'utf8'),
)

// The happy path: references become records.
let out
try {
  out = resolve(recorded.sections)
} catch (err) {
  // Only a refusal means the reader edited the data. Anything else is a real
  // fault in this code, and sending them to model-output.json for it wastes
  // their time on the wrong file.
  if (!(err instanceof InvalidSection)) throw err
  console.error(
    `resolve.check.js: model-output.json does not resolve (${err.message}).\n` +
      'If you edited it to make the quick start fail on purpose, put it back ' +
      'first: git checkout structured-data/model-output.json',
  )
  process.exit(1)
}
assert.equal(out[0].products.length, 3)
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
