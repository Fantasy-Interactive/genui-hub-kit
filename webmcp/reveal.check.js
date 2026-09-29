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
import { buildError, presentError, CODES } from './errors.js'

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

// A superseded run must not swap its now-stale buffer in, and must be
// distinguishable from a real failure so the caller does not show an error
// over the newer run that replaced it.
{
  const h = harness({ hasFirstSection: () => true, isCurrent: () => false })
  assert.equal(await revealWhenReady(h.deps), 'superseded')
  assert.equal(h.calls.swap, 0, 'a superseded run never commits')
}

// Superseded while still polling, before any content arrived.
{
  let checks = 0
  const h = harness({ isCurrent: () => checks++ < 2 })
  assert.equal(await revealWhenReady(h.deps), 'superseded')
  assert.equal(h.calls.swap, 0)
}

// Superseded during the paint wait, after the swap was committed.
{
  let current = true
  const h = harness({
    hasFirstSection: () => true,
    isCurrent: () => current,
    waitForPaint: async () => { current = false },
  })
  assert.equal(await revealWhenReady(h.deps), 'superseded', 'checked again after the paint')
}

// A fast arrival still gets the minimum beat, so the change stays legible.
{
  const h = harness({ hasFirstSection: () => true })
  assert.equal(await revealWhenReady(h.deps), 'revealed')
  assert.ok(h.clock() >= 300, `held for the floor, waited ${h.clock()}ms`)
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
  assert.equal(buildError(CODES.TIMEOUT, 'slow').error.retryable, true)
  assert.equal(buildError(CODES.MODEL_FAIL, 'hiccup').error.retryable, true)
  assert.equal(buildError(CODES.VALIDATION_FAIL, 'schema').error.retryable, false)
  assert.equal(buildError(CODES.TOOL_DEGRADED, 'partial').error.retryable, false)

  // An unknown code must not become silently non-retryable. A typo here is a
  // failure that can never be retried and nobody would notice.
  assert.throws(() => buildError('TIMEOUT ', 'trailing space'), /unknown error code/)
  assert.throws(() => buildError('NOPE', 'invented'), /unknown error code/)

  // An explicit override wins over the code's default.
  assert.equal(
    buildError(CODES.VALIDATION_FAIL, 'worth one more go', { retryable: true }).error.retryable,
    true,
  )

  // The dead end: non-retryable with nothing offered instead. Allowed by the
  // code, and the check documents that it leaves the person with no move.
  const deadEnd = presentError(buildError(CODES.TOOL_DEGRADED, 'Partial results.'))
  assert.equal(deadEnd.retry, false)
  assert.deepEqual(deadEnd.otherwise, [], 'pass alternatives, or this is a dead end')

  // A failure worth retrying offers a retry and no alternatives.
  const transient = presentError(buildError('TIMEOUT', 'That took too long.'))
  assert.equal(transient.retry, true)
  assert.deepEqual(transient.otherwise, [])

  // One that is not offers somewhere else to go instead.
  const permanent = presentError(
    buildError(CODES.VALIDATION_FAIL, "I couldn't build that view.", {
      alternatives: ['browse_catalog'],
    }),
  )
  assert.equal(permanent.retry, false, 'never offer a retry that will fail the same way')
  assert.deepEqual(permanent.otherwise, ['browse_catalog'])
}

console.log('reveal.check.js: all assertions passed')
