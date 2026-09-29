/**
 * Typed failure, and a retry worth offering.
 *
 * "Something went wrong" tells a person nothing and tells a visiting agent
 * less. Worse, offering "try again" for a failure that will fail identically
 * every time trains people to distrust the button.
 *
 * So the envelope carries a code, a message either a person or an agent can
 * read, whether retrying is worth it, and what else might serve the same
 * intent. Retryability is derived from the code rather than decided at each
 * call site, because whether a thing can be retried is a property of the
 * failure, not a judgement.
 */

export const CODES = {
  TIMEOUT: 'TIMEOUT',
  VALIDATION_FAIL: 'VALIDATION_FAIL',
  MODEL_FAIL: 'MODEL_FAIL',
  CATALOG_UNAVAILABLE: 'CATALOG_UNAVAILABLE',
  TOOL_DEGRADED: 'TOOL_DEGRADED',
  INTERNAL: 'INTERNAL',
}

/**
 * Transient by default: a network blip, a model hiccup, a source briefly down.
 *
 * VALIDATION_FAIL and TOOL_DEGRADED are deliberately absent. If the model
 * produced output that failed your schema, asking it again usually produces
 * output that fails your schema.
 */
const TRANSIENT = new Set([
  CODES.TIMEOUT,
  CODES.MODEL_FAIL,
  CODES.CATALOG_UNAVAILABLE,
  CODES.INTERNAL,
])

export function buildError(code, message, options = {}) {
  const error = {
    code,
    message,
    retryable: options.retryable ?? TRANSIENT.has(code),
  }
  if (options.alternatives) error.alternatives = options.alternatives
  if (options.context) error.context = options.context
  return { error }
}

/**
 * What to put on screen.
 *
 * The separation matters: `retry` is a fact about the failure, and `say` is
 * copy a content strategist owns. Keeping them apart means the wording can
 * change without anyone re-deciding which failures are worth retrying.
 */
export function presentError(envelope) {
  const { code, message, retryable, alternatives = [] } = envelope.error
  return {
    say: message,
    retry: retryable,
    // Only offered when retrying won't work, so the person always has a move.
    otherwise: retryable ? [] : alternatives,
    code,
  }
}
