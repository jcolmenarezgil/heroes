const isDev = process.env.NODE_ENV === "development";

// Security hardening headers applied to every response via next.config
// headers(). Kept as a plain object so next.config.ts can import it without
// pulling in any runtime/server code.
//
// CSP notes:
// - 'unsafe-inline' for script/style is required by Next.js (flight data /
//   inline scripts) and Tailwind. We compensate with object-src 'none',
//   base-uri 'self', form-action 'self', frame-ancestors 'none', and a strict
//   connect-src to block data exfiltration via fetch/XHR.
// - 'unsafe-eval' is only enabled in dev: React 19 (Turbopack) needs eval()
//   for dev debugging features. Production keeps script-src eval-free.
// - img-src https: covers OSM tiles, Google/GitHub avatars and the cdnjs
//   Leaflet marker icons, which load as <img>.
// - connect-src 'self' is safe because every client-side fetch is same-origin
//   (verified); Overpass / GitHub calls happen server-side.
// - upgrade-insecure-requests is gated off in dev where http://localhost is
//   used.
export const SECURITY_HEADERS: Record<string, string> = {
    "Content-Security-Policy": [
        "default-src 'self'",
        `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
        "style-src 'self' 'unsafe-inline'",
        "img-src 'self' data: blob: https:",
        "font-src 'self' data:",
        "connect-src 'self'",
        "frame-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "frame-ancestors 'none'",
        ...(isDev ? [] : ["upgrade-insecure-requests"]),
    ].join("; "),
    "X-Frame-Options": "DENY",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Permissions-Policy":
        "geolocation=(self), camera=(), microphone=(), display-capture=(), fullscreen=(self), interest-cohort=(), browsing-topics=()",
    "Cross-Origin-Opener-Policy": "same-origin",
};
