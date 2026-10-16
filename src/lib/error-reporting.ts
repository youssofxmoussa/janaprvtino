/**
 * Minimal, vendor-neutral runtime error reporting.
 * Boundary-caught errors never reach window.onerror in production
 * React, so surface them here in one consistent shape.
 */
export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;

  // Loaders and server fns commonly throw a raw Response; String(it) is the
  // opaque "[object Response]", so pull out the status and URL instead.
  const message =
    error instanceof Response
      ? `Response ${error.status}${error.url ? ` at ${error.url}` : ""}`
      : error instanceof Error
        ? error.message
        : String(error);

  const stack = error instanceof Error ? error.stack : undefined;

  console.error("[error]", message, {
    route: window.location.pathname,
    ...(stack !== undefined && { stack }),
    ...context,
  });
}
