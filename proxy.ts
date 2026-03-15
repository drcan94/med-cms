import { clerkMiddleware } from "@clerk/nextjs/server"
import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"

import { routing } from "@/i18n/routing"

const handleI18nRouting = createMiddleware(routing)
const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/patients",
  "/settings",
  "/visit",
  "/super-admin",
  "/ward-map",
]

function removeLocalePrefix(pathname: string): string {
  const segments = pathname.split("/")
  const locale = segments[1]

  if (!routing.locales.includes(locale as (typeof routing.locales)[number])) {
    return pathname
  }

  const unlocalizedPathname = pathname.slice(locale.length + 1)
  return unlocalizedPathname || "/"
}

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

export default clerkMiddleware(async (auth, request) => {
  const unlocalizedPathname = removeLocalePrefix(request.nextUrl.pathname)

  if (isProtectedPath(unlocalizedPathname)) {
    await auth.protect()
  }

  if (
    request.nextUrl.pathname.startsWith("/api") ||
    request.nextUrl.pathname.startsWith("/trpc")
  ) {
    return NextResponse.next()
  }

  return handleI18nRouting(request)
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
