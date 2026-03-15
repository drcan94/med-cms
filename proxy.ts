import { clerkMiddleware } from "@clerk/nextjs/server"
import createMiddleware from "next-intl/middleware"
import { NextResponse } from "next/server"

import { routing } from "@/i18n/routing"
import { getAuthPathnames, getLocaleFromPathname } from "@/lib/auth-paths"

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
  const pathname = request.nextUrl.pathname
  const locale = getLocaleFromPathname(pathname)
  const unlocalizedPathname = removeLocalePrefix(request.nextUrl.pathname)

  if (isProtectedPath(unlocalizedPathname)) {
    const { userId } = await auth()

    if (!userId) {
      const signInUrl = new URL(getAuthPathnames(locale).signIn, request.url)
      signInUrl.searchParams.set("redirect_url", request.url)

      return NextResponse.redirect(signInUrl)
    }
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/trpc")) {
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
