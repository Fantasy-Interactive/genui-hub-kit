/**
 * The reveal gate.
 *
 * A page that re-composes itself has moments where it is neither what it was
 * nor what it is becoming. Two ways to get that wrong, and both read as a
 * broken site rather than a working one: clear to empty and show a spinner
 * over nothing, or reveal before the new content has painted and uncover a gap.
 *
 * The rule: hold until the first new section has arrived AND painted, then
 * reveal. Never onto blank, never onto stale content.
 *
 * Deliberately generic over section type. An earlier version of ours inspected
 * the hero's own shape to decide whether it had arrived, so when that shape
 * changed the gate silently stopped firing and every transition ran to the
 * ceiling. It does not need to know what arrived. Only that something did.
 *
 * No framework, no dependencies. Pass it functions.
 */

export const DEFAULT_TIMING = {
  pollMs: 50,
  /** Say "still working" once at this point, then keep waiting. */
  longWaitMs: 2500,
  /** Backstop, so a hung request still resolves into something actionable. */
  ceilingMs: 20000,
  /** A very fast render still gets a beat, so the change is legible. */
  minFloorMs: 300,
}

/**
 * Three outcomes, not two.
 *
 * 'superseded' is separate from 'failed' on purpose. A newer run has taken
 * over, which is a normal thing that happens when somebody asks a second
 * question before the first has answered. A caller that shows an error on
 * 'failed' would put an error message over the newer run that replaced this
 * one, which is precisely the broken-site look this gate exists to prevent.
 *
 * @returns {Promise<'revealed'|'failed'|'superseded'>}
 */
export async function revealWhenReady(deps, timing = DEFAULT_TIMING) {
  const start = deps.now()
  let cued = false

  while (!deps.hasFirstSection()) {
    // Fail fast rather than holding to the ceiling on a known failure.
    if (deps.hasStreamFailed()) return 'failed'
    if (!deps.isCurrent()) return 'superseded'

    const elapsed = deps.now() - start
    if (elapsed > timing.ceilingMs) return 'failed'
    if (elapsed > timing.longWaitMs && !cued) {
      // Once. Repeating it turns a slow moment into an anxious one.
      deps.onLongWait?.()
      cued = true
    }
    await deps.sleep(timing.pollMs)
  }

  if (!deps.isCurrent()) return 'superseded'

  deps.commitSwap()
  await deps.waitForPaint()

  // Both of the waits below are places a newer run can take over, so the check
  // is repeated rather than done once before the swap.
  if (!deps.isCurrent()) return 'superseded'

  const elapsed = deps.now() - start
  if (elapsed < timing.minFloorMs) await deps.sleep(timing.minFloorMs - elapsed)
  if (!deps.isCurrent()) return 'superseded'
  return 'revealed'
}
