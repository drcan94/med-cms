import { hasLocale } from "next-intl"

import type { AppLocale } from "@/i18n/routing"
import { routing } from "@/i18n/routing"

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
}

const LOCALE_PREFIX_PATTERN = new RegExp(
  `^(?:/(?:${routing.locales.map(escapeRegExp).join("|")}))+(?=/|$)`
)

export function getLocaleFromPathname(pathname: string): AppLocale {
  const localeSegment = pathname.split("/")[1]

  return hasLocale(routing.locales, localeSegment)
    ? localeSegment
    : routing.defaultLocale
}

export function stripLocalePrefix(pathname: string): string {
  const unlocalizedPathname = pathname.replace(LOCALE_PREFIX_PATTERN, "")
  return unlocalizedPathname || "/"
}

export function getLocalizedPathname(pathname: string, locale?: string): string {
  if (!hasLocale(routing.locales, locale)) {
    return pathname
  }

  const cleanPathname = stripLocalePrefix(pathname)
  return cleanPathname === "/" ? `/${locale}` : `/${locale}${cleanPathname}`
}

export function getAuthPathnames(locale?: string) {
  return {
    organizationSelection: getLocalizedPathname("/organization-selection", locale),
    patients: getLocalizedPathname("/patients", locale),
    settings: getLocalizedPathname("/settings", locale),
    signIn: getLocalizedPathname("/sign-in", locale),
    signUp: getLocalizedPathname("/sign-up", locale),
    wardMap: getLocalizedPathname("/ward-map", locale),
  }
}
