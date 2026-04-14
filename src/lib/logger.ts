/**
 * Structured logger — thin wrapper for JSON output to stderr.
 * Phase 2 TODO: replace with Sentry/APM integration.
 */

export function logError(
  context: string,
  error: unknown,
  meta?: Record<string, unknown>,
): void {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  const entry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    context,
    error: message,
    ...(stack && { stack }),
    ...meta,
  };

  console.error(JSON.stringify(entry));
}
