import { hasLocale } from "next-intl"

import type { AppLocale } from "@/i18n/routing"
import { routing } from "@/i18n/routing"

export function getLocaleFromPathname(pathname: string): AppLocale {
  const localeSegment = pathname.split("/")[1]

  return hasLocale(routing.locales, localeSegment)
    ? localeSegment
    : routing.defaultLocale
}

export function getLocalizedPathname(pathname: string, locale?: string): string {
  return hasLocale(routing.locales, locale) ? `/${locale}${pathname}` : pathname
}

export function getAuthPathnames(locale?: string) {
  return {
    patients: getLocalizedPathname("/patients", locale),
    settings: getLocalizedPathname("/settings", locale),
    signIn: getLocalizedPathname("/sign-in", locale),
    signUp: getLocalizedPathname("/sign-up", locale),
    wardMap: getLocalizedPathname("/ward-map", locale),
  }
}
