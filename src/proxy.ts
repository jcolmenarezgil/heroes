import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing";
import {
  isAdminPath,
  isProtectedPath,
  stripLocale,
} from "@/lib/route-guards";

const intlMiddleware = createMiddleware(routing);

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const stripped = stripLocale(pathname);

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Redirect signed-in users away from /login.
  if (token && stripped === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const isProtected = isProtectedPath(stripped);
  const isAdminRoute = isAdminPath(stripped);

  // Redirect anonymous users to /login for protected or admin routes.
  if (!token && (isProtected || isAdminRoute)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAdminRoute && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Run the intl middleware.
  const response = intlMiddleware(req);

  // Set a country cookie for the emergency directory.
  const country =
    req.headers.get("x-vercel-ip-country") ||
    req.headers.get("cf-ipcountry") ||
    "VE";

  if (!req.cookies.has("user-country")) {
    response.cookies.set("user-country", country, {
      path: "/",
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};