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
 * @returns {Promise<'revealed'|'failed'>}
 */
export async function revealWhenReady(deps, timing = DEFAULT_TIMING) {
  const start = deps.now()
  let cued = false

  while (!deps.hasFirstSection()) {
    // Fail fast rather than holding to the ceiling on a known failure, and
    // drop a run that has been superseded by a newer one.
    if (deps.hasStreamFailed() || !deps.isCurrent()) return 'failed'

    const elapsed = deps.now() - start
    if (elapsed > timing.ceilingMs) return 'failed'
    if (elapsed > timing.longWaitMs && !cued) {
      // Once. Repeating it turns a slow moment into an anxious one.
      deps.onLongWait?.()
      cued = true
    }
    await deps.sleep(timing.pollMs)
  }

  if (!deps.isCurrent()) return 'failed'

  deps.commitSwap()
  await deps.waitForPaint()

  const elapsed = deps.now() - start
  if (elapsed < timing.minFloorMs) await deps.sleep(timing.minFloorMs - elapsed)
  return 'revealed'
}
