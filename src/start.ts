import { createStart, createCsrfMiddleware, createMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachAuth } from "./lib/auth.middleware";

const errorMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error("Request failed."); // Never log credentials or signed URLs from provider errors.
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' blob:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "media-src 'self' blob: https://*.supabase.co",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co ws: wss:",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self' https://*.lovable.app https://*.lovable.dev https://lovable.dev https://*.lovableproject.com",
].join("; ");

/** Hardening headers on every response. */
const securityHeaders = createMiddleware().server(async ({ next }) => {
  const { setResponseHeader } = await import("@tanstack/react-start/server");
  setResponseHeader("Content-Security-Policy", CSP);
  setResponseHeader("X-Content-Type-Options", "nosniff");
  setResponseHeader("Referrer-Policy", "no-referrer");
  setResponseHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
  setResponseHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  setResponseHeader("Cross-Origin-Opener-Policy", "same-origin");
  setResponseHeader("Cache-Control", "private, no-store");
  const result = await next();
  const h = (result as { response?: Response }).response?.headers;
  if (h) {
    h.set("Content-Security-Policy", CSP);
    h.set("X-Content-Type-Options", "nosniff");
    h.set("Referrer-Policy", "no-referrer");
    h.set("Cache-Control", "private, no-store");
    h.set("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
    h.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
    h.set("Cross-Origin-Opener-Policy", "same-origin");
  }
  return result;
});

// Start installs this automatically when src/start.ts is absent; defining the
// file opts out, so re-add it explicitly to keep server functions protected
// from cross-site requests.
const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  requestMiddleware: [securityHeaders, errorMiddleware, csrfMiddleware],
  functionMiddleware: [attachAuth],
}));
