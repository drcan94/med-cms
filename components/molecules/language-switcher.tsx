"use client"

import { Globe } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useSearchParams } from "next/navigation"

import { Button } from "@/components/ui/button"
import { stripLocalePrefix } from "@/lib/auth-paths"
import type { AppLocale } from "@/i18n/routing"
import { routing } from "@/i18n/routing"
import { cn } from "@/lib/utils"

const LOCALE_SHORT_LABELS: Record<AppLocale, string> = {
  en: "EN",
  tr: "TR",
}

type LanguageSwitcherProps = {
  className?: string
}

function getNextLocale(locale: AppLocale): AppLocale {
  const localeIndex = routing.locales.indexOf(locale)
  return routing.locales[(localeIndex + 1) % routing.locales.length] as AppLocale
}

function buildLocalizedUrl(rawPathname: string, targetLocale: AppLocale, searchParams: URLSearchParams): string {
  const cleanPathname = stripLocalePrefix(rawPathname)
  const localizedPath = cleanPathname === "/"
    ? `/${targetLocale}`
    : `/${targetLocale}${cleanPathname}`
  const queryString = searchParams.toString()
  return queryString ? `${localizedPath}?${queryString}` : localizedPath
}

export function LanguageSwitcher({
  className,
}: Readonly<LanguageSwitcherProps>) {
  const t = useTranslations("LanguageSwitcher")
  const locale = useLocale() as AppLocale
  const rawPathname = usePathname()
  const searchParams = useSearchParams()
  const nextLocale = getNextLocale(locale)
  const nextUrl = buildLocalizedUrl(rawPathname, nextLocale, searchParams)

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      asChild
      className={cn(
        "h-8 rounded-xl border border-border/70 bg-background/70 px-2 text-xs font-semibold uppercase shadow-sm transition-colors hover:bg-muted/60 sm:h-9 sm:px-2.5",
        className
      )}
      aria-label={`${t("label")}: ${t(locale)}. ${t(nextLocale)}`}
    >
      <a href={nextUrl}>
        <Globe className="hidden size-4 text-muted-foreground sm:block" />
        <span className="min-w-[2ch] text-center">{LOCALE_SHORT_LABELS[locale]}</span>
      </a>
    </Button>
  )
}
