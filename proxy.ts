import { clerkMiddleware } from "@clerk/nextjs/server"
import createMiddleware from "next-intl/middleware"
import { type NextRequest, NextResponse } from "next/server"

import { routing } from "@/i18n/routing"
import {
  getAuthPathnames,
  getLocaleFromPathname,
  getLocalizedPathname,
  stripLocalePrefix,
} from "@/lib/auth-paths"

const handleI18nRouting = createMiddleware(routing)

const PROTECTED_PATH_PREFIXES = [
  "/dashboard",
  "/patients",
  "/settings",
  "/visit",
  "/super-admin",
  "/ward-map",
]

const ORG_EXEMPT_PATHS = ["/organization-selection", "/super-admin"]

const AUTH_PATHS = ["/sign-in", "/sign-up", "/organization-selection"]

function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATH_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function isOrgExemptPath(pathname: string): boolean {
  return ORG_EXEMPT_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function isAuthPath(pathname: string): boolean {
  return AUTH_PATHS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  )
}

function getResolvedUrl(request: NextRequest, response: NextResponse): URL {
  const rewrittenUrl =
    response.headers.get("location") ??
    response.headers.get("x-middleware-rewrite") ??
    request.url

  return new URL(rewrittenUrl, request.url)
}

export default clerkMiddleware(async (auth, request) => {
  const pathname = request.nextUrl.pathname

  if (pathname.startsWith("/api/webhooks")) {
    return NextResponse.next()
  }

  if (pathname.startsWith("/api") || pathname.startsWith("/trpc")) {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return NextResponse.next()
  }

  const i18nResponse = handleI18nRouting(request)
  const resolvedUrl = getResolvedUrl(request, i18nResponse)
  const locale = getLocaleFromPathname(resolvedUrl.pathname)
  const unlocalizedPathname = stripLocalePrefix(resolvedUrl.pathname)
  const { userId, orgId } = await auth()

  if (isAuthPath(unlocalizedPathname)) {
    if (userId && orgId) {
      const patientsUrl = new URL(getAuthPathnames(locale).patients, request.url)
      return NextResponse.redirect(patientsUrl)
    }

    return i18nResponse
  }

  if (!isProtectedPath(unlocalizedPathname)) {
    return i18nResponse
  }

  if (!userId) {
    const signInUrl = new URL(getAuthPathnames(locale).signIn, request.url)
    signInUrl.searchParams.set("redirect_url", resolvedUrl.toString())

    return NextResponse.redirect(signInUrl)
  }

  if (!orgId && !isOrgExemptPath(unlocalizedPathname)) {
    const orgSelectionUrl = new URL(
      getLocalizedPathname("/organization-selection", locale),
      request.url
    )
    orgSelectionUrl.searchParams.set("redirect_url", resolvedUrl.toString())

    return NextResponse.redirect(orgSelectionUrl)
  }

  return i18nResponse
})

export const config = {
  matcher: [
    "/((?!_next|_vercel|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
}
