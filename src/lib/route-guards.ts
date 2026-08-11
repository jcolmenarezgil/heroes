// Pure route-access decisions used by the Next.js middleware, extracted here
// so they can be unit-tested. Keep in sync with src/proxy.ts.

export const PROTECTED_PATTERNS = [
  /^\/create$/,
  /^\/directory$/,
  /^\/map$/,
  /^\/me$/,
  /^\/me\/edit$/,
  /^\/p\/[^/]+\/edit$/,
  /^\/notifications$/,
];

export const ADMIN_PATTERNS = [/^\/admin(\/.*)?$/];

// Strip a leading /en or /es locale prefix, returning the bare path.
export function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|es)(?=\/|$)/);
  if (!match) return pathname;
  return pathname.slice(match[0].length) || "/";
}

export function isProtectedPath(stripped: string): boolean {
  return PROTECTED_PATTERNS.some((re) => re.test(stripped));
}

export function isAdminPath(stripped: string): boolean {
  return ADMIN_PATTERNS.some((re) => re.test(stripped));
}