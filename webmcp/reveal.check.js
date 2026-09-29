/**
 * Run: node webmcp/reveal.check.js
 *
 * The gate's whole job is to never uncover a gap and never hold forever, so
 * that is what these check: it waits for the first section, it fails fast on a
 * known failure instead of running to the ceiling, it drops a superseded run,
 * and it cues a long wait exactly once.
 */
import assert from 'node:assert/strict'
import { revealWhenReady } from './reveal.js'
import { buildError, presentError } from './errors.js'

/** A fake clock, so the checks run instantly and deterministically. */
function harness(overrides = {}) {
  let t = 0
  const calls = { swap: 0, paint: 0, longWait: 0 }
  const deps = {
    now: () => t,
    sleep: async (ms) => { t += ms },
    hasFirstSection: () => false,
    hasStreamFailed: () => false,
    isCurrent: () => true,
    commitSwap: () => { calls.swap++ },
    waitForPaint: async () => { calls.paint++ },
    onLongWait: () => { calls.longWait++ },
    ...overrides,
  }
  return { deps, calls, clock: () => t }
}

// Content arrives after a few polls: swap in, wait for paint, then reveal.
// Counted rather than timed, so the fake clock stays in charge and the check
// is deterministic.
{
  let polls = 0
  const h = harness({ hasFirstSection: () => polls++ >= 3 })
  assert.equal(await revealWhenReady(h.deps), 'revealed')
  assert.equal(h.calls.swap, 1, 'swapped in exactly once')
  assert.equal(h.calls.paint, 1, 'waited for paint before revealing')
  assert.equal(h.calls.longWait, 0, 'a fast arrival never cues a long wait')
}

// A known stream failure fails fast rather than holding to the ceiling.
{
  const h = harness({ hasStreamFailed: () => true })
  assert.equal(await revealWhenReady(h.deps), 'failed')
  assert.equal(h.calls.swap, 0, 'never swaps on failure')
  assert.ok(h.clock() < 1000, 'failed fast, did not run to the ceiling')
}

// A superseded run must not swap its now-stale buffer in.
{
  const h = harness({ hasFirstSection: () => true, isCurrent: () => false })
  assert.equal(await revealWhenReady(h.deps), 'failed')
  assert.equal(h.calls.swap, 0, 'a superseded run never commits')
}

// Nothing ever arrives: the ceiling resolves it, and the long wait is cued once.
{
  const h = harness()
  assert.equal(await revealWhenReady(h.deps), 'failed')
  assert.equal(h.calls.longWait, 1, 'cued the long wait exactly once, not per poll')
  assert.equal(h.calls.swap, 0)
}

// Retryability is a property of the failure, not a per-call-site guess.
{
  assert.equal(buildError('TIMEOUT', 'slow').error.retryable, true)
  assert.equal(buildError('MODEL_FAIL', 'hiccup').error.retryable, true)
  assert.equal(buildError('VALIDATION_FAIL', 'schema').error.retryable, false)
  assert.equal(buildError('TOOL_DEGRADED', 'partial').error.retryable, false)

  // A failure worth retrying offers a retry and no alternatives.
  const transient = presentError(buildError('TIMEOUT', 'That took too long.'))
  assert.equal(transient.retry, true)
  assert.deepEqual(transient.otherwise, [])

  // One that is not offers somewhere else to go instead.
  const permanent = presentError(
    buildError('VALIDATION_FAIL', "I couldn't build that view.", {
      alternatives: ['browse_catalog'],
    }),
  )
  assert.equal(permanent.retry, false, 'never offer a retry that will fail the same way')
  assert.deepEqual(permanent.otherwise, ['browse_catalog'])
}

console.log('reveal.check.js: all assertions passed')
