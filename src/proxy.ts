import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Routes that require an authenticated session.
const PROTECTED_PATTERNS = [
  /^\/create$/,
  /^\/me$/,
  /^\/me\/edit$/,
  /^\/p\/[^/]+\/edit$/,
];

// Routes restricted to admins.
const ADMIN_PATTERNS = [/^\/admin(\/.*)?$/];

function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|es)(?=\/|$)/);
  if (!match) return pathname;
  return pathname.slice(match[0].length) || "/";
}

export default async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const stripped = stripLocale(pathname);

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Authenticated users visiting /login are bounced to the home page.
  if (token && stripped === "/login") {
    const home = new URL("/", req.url);
    return NextResponse.redirect(home);
  }

  const isProtected = PROTECTED_PATTERNS.some((re) => re.test(stripped));
  const isAdminRoute = ADMIN_PATTERNS.some((re) => re.test(stripped));

  if (!token && (isProtected || isAdminRoute)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAdminRoute && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  // Match all pathnames except for
  // - those starting with /api, /trpc, /_next or /_vercel
  // - those containing a dot (e.g. favicon.ico)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};