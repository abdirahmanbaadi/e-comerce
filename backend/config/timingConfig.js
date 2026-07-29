/**
 * Central timing rules for refunds, review prompts, and background jobs.
 * Tuned for demo/testing — increase values for production if needed.
 */
const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;

/** Paid order cancelled → EVC refund processed after this delay (was 24h → 1h → 5min for testing). */
const REFUND_PROCESSING_DELAY_MS = 5 * MINUTE_MS;

/** Human-readable refund wait time for API messages and notifications. */
function formatRefundProcessingDelay() {
  if (REFUND_PROCESSING_DELAY_MS >= HOUR_MS) {
    const hours = Math.round(REFUND_PROCESSING_DELAY_MS / HOUR_MS);
    return `${hours} hour${hours === 1 ? '' : 's'}`;
  }
  const minutes = Math.round(REFUND_PROCESSING_DELAY_MS / MINUTE_MS);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
}

/** How often the refund scheduler checks for due refunds. */
const REFUND_JOB_INTERVAL_MS = 2 * MINUTE_MS;

/** First delivery/product rating prompt after order is marked delivered. */
const REVIEW_FIRST_PROMPT_DELAY_MS = 2 * MINUTE_MS;

/** Re-show rating prompt if customer skipped or did not finish. */
const REVIEW_REMINDER_DELAY_MS = 3 * MINUTE_MS;

module.exports = {
  MINUTE_MS,
  HOUR_MS,
  REFUND_PROCESSING_DELAY_MS,
  REFUND_JOB_INTERVAL_MS,
  REVIEW_FIRST_PROMPT_DELAY_MS,
  REVIEW_REMINDER_DELAY_MS,
  formatRefundProcessingDelay,
};
