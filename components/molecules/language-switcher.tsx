"use client"

import * as React from "react"

import { Globe } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { usePathname, useRouter } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { routing } from "@/i18n/routing"

const LOCALE_SHORT_LABELS: Record<AppLocale, string> = {
  en: "EN",
  tr: "TR",
}

function getInternalPathname(pathname: string): string {
  const matchedLocale = routing.locales.find(
    (candidateLocale) =>
      pathname === `/${candidateLocale}` ||
      pathname.startsWith(`/${candidateLocale}/`)
  )

  if (!matchedLocale) {
    return pathname
  }

  const pathnameWithoutLocale = pathname.slice(matchedLocale.length + 1)
  return pathnameWithoutLocale.length > 0 ? pathnameWithoutLocale : "/"
}

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher")
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const router = useRouter()
  const [isPending, startTransition] = React.useTransition()

  const internalPathname = getInternalPathname(pathname)

  const handleLocaleChange = (nextLocaleValue: string) => {
    if (!routing.locales.includes(nextLocaleValue as AppLocale)) {
      return
    }

    const nextLocale = nextLocaleValue as AppLocale

    if (nextLocale === locale) {
      return
    }

    startTransition(() => {
      router.replace(internalPathname, { locale: nextLocale })
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="h-9 rounded-full border border-border/70 bg-background/70 px-2.5 text-xs font-semibold uppercase shadow-sm transition-colors hover:bg-muted/60"
          aria-label={`${t("label")}: ${t(locale)}`}
          disabled={isPending}
        >
          <Globe className="size-4 text-muted-foreground" />
          <span>{LOCALE_SHORT_LABELS[locale]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t("label")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={locale} onValueChange={handleLocaleChange}>
          {routing.locales.map((candidateLocale) => (
            <DropdownMenuRadioItem
              key={candidateLocale}
              value={candidateLocale}
              className="gap-3 py-2"
            >
              <span className="w-8 text-xs font-semibold uppercase text-muted-foreground">
                {LOCALE_SHORT_LABELS[candidateLocale]}
              </span>
              <span>{t(candidateLocale)}</span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
