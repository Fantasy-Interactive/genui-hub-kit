import { CATALOG } from '../structured-data/catalog.js'

/**
 * The site's own composition step, with the model taken out of it.
 *
 * This is the half a visiting agent must not do. The agent knows the person:
 * their measurements, how much sewing they have done, what they came for. It
 * does not know this catalog, this component library, or what this brand
 * sounds like. So it sends intent, and everything from "which components"
 * to "what the heading says" happens here, on the site's side of the line.
 *
 * In a real build this function calls a model. Here it is a lookup and two
 * fixed strings, which is enough to show the shape and runs with no key, no
 * network and no inference. Where a model would have chosen, there is a rule
 * you can read.
 *
 * The wording below is the same wording as structured-data/model-output.json
 * in step 3, deliberately. Same question, same answer, so the only thing that
 * changed between the two steps is who supplied the intent. They are separate
 * copies because they are different artifacts: step 3 is a turn a model
 * produced, and this is the site composing without one.
 */

/** What a model would have written. Fixed here, so the sample has no model. */
const WORDING = {
  grid: 'Drafted for your size, not graded up',
  guide: 'Measuring, roughly',
  guideBody:
    'Measure over whatever you will wear under the finished garment, and keep the tape level.',
}

/**
 * Patterns drafted to fit a bust measurement, at a stated level.
 *
 * Exact on level, not a substring: "beginner" must not match "confident
 * beginner", or a first-time sewist is shown a pattern the catalog says they
 * are not ready for. Prefix-checked on the measurement, because "waist 24 to
 * 56 in" is a different number from the one being asked about.
 */
export function patternsFor({ bust, level }) {
  const n = Number(bust)
  return CATALOG.filter((p) => {
    if (!p.sizes.startsWith('bust')) return false
    const [low, high] = p.sizes.match(/\d+/g).map(Number)
    return n >= low && n <= high && (!level || p.level === String(level).toLowerCase())
  })
}

/**
 * Intent in, sections out. The whole of this sample's generative UI.
 *
 * Three decisions a model makes in a real build, made by rules here:
 * which components to use, what order to put the products in, and what the
 * headings say. Returns an empty array when nothing fits, because an empty
 * page is a failure for the caller to report rather than a page to draw.
 */
export function compose({ bust, level }) {
  const matches = patternsFor({ bust, level })
  if (!matches.length) return []

  // Widest drafted range first. A rule, not a preference: the pattern with
  // the most room either side of the measurement is the safest first choice
  // when the person has not told us anything else about their shape.
  const byRoom = [...matches].sort((a, b) => width(b.sizes) - width(a.sizes))

  return [
    { type: 'ProductGrid', heading: WORDING.grid, productIds: byRoom.map((p) => p.id) },
    // A size guide follows a size-led request, because the number the person
    // gave is only as good as how they measured.
    { type: 'SizeGuide', heading: WORDING.guide, body: WORDING.guideBody },
  ]
}

function width(sizes) {
  const [low, high] = sizes.match(/\d+/g).map(Number)
  return high - low
}
