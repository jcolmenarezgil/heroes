import { NextResponse, type NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";
import { getToken } from "next-auth/jwt";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

// Rutas protegidas que requieren sesión activa
const PROTECTED_PATTERNS = [
  /^\/create$/,
  /^\/me$/,
  /^\/me\/edit$/,
  /^\/p\/[^/]+\/edit$/,
  /^\/notifications$/,
];

// Rutas exclusivas para administradores
const ADMIN_PATTERNS = [/^\/admin(\/.*)?$/];

function stripLocale(pathname: string): string {
  const match = pathname.match(/^\/(en|es)(?=\/|$)/);
  if (!match) return pathname;
  return pathname.slice(match[0].length) || "/";
}

export default async function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const stripped = stripLocale(pathname);

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // 1. Redirección de usuarios autenticados al intentar ir a /login
  if (token && stripped === "/login") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  const isProtected = PROTECTED_PATTERNS.some((re) => re.test(stripped));
  const isAdminRoute = ADMIN_PATTERNS.some((re) => re.test(stripped));

  // 2. Control de acceso a rutas protegidas o administrativas
  if (!token && (isProtected || isAdminRoute)) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);
    return NextResponse.redirect(loginUrl);
  }

  if (token && isAdminRoute && token.role !== "admin") {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // 3. Ejecutar el middleware de i18n
  const response = intlMiddleware(req);

  // 4. Inyectar detección de país para el directorio de emergencia
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