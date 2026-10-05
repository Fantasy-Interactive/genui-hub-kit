/**
 * Run: node webmcp/compose.check.js
 *
 * Step 3 replays a recorded model turn. Step 4 composes the same page from
 * two numbers, with no model. The teaching rests entirely on those two being
 * the same page, and nothing enforced it: the recorded turn lives in
 * model-output.json and the composition lives in compose.js, so an edit to
 * either one quietly breaks the claim the site makes about both.
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { compose, patternsFor } from './compose.js'

const recorded = JSON.parse(
  readFileSync(new URL('../structured-data/model-output.json', import.meta.url), 'utf8'),
)

assert.deepEqual(
  compose({ bust: 60, level: 'beginner' }),
  recorded.sections,
  'compose() no longer produces the recorded turn. Step 3 and step 4 claim to answer the same ' +
    'question with the same page, so fix whichever one moved.',
)

// Exact on level, or a first-time sewist is shown a pattern the catalog says
// they are not ready for.
assert.ok(
  !patternsFor({ size: 60, measure: 'bust', level: 'beginner' }).some((p) => p.id === 'p-1042'),
  'p-1042 is "confident beginner" and must not match a search for "beginner"',
)

// Narrowed by measurement only where a measurement was named. A plain search
// still reaches the waist-drafted trousers.
assert.ok(
  patternsFor({ size: 40 }).some((p) => p.id === 'p-2450'),
  'find_products lost the waist-drafted patterns',
)
assert.deepEqual(
  patternsFor({ size: 61, measure: 'bust' }).map((p) => p.id),
  ['p-1042', 'p-3101'],
  'the size 61 example documented in step 4f has changed',
)

console.log('compose.check.js: step 4 composes step 3’s page, and the lookups still hold')
