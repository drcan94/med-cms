"use client"

import { Globe, Loader2Icon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import {
  type ReadonlyURLSearchParams,
  useParams,
  useSearchParams,
} from "next/navigation"
import { useTransition } from "react"

import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "@/i18n/navigation"
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

type SearchQuery = Record<string, string | Array<string>>

function getQueryFromSearchParams(
  searchParams: ReadonlyURLSearchParams
): SearchQuery | undefined {
  const query: SearchQuery = {}

  for (const [key, value] of searchParams.entries()) {
    const existingValue = query[key]

    if (existingValue === undefined) {
      query[key] = value
      continue
    }

    if (Array.isArray(existingValue)) {
      existingValue.push(value)
      continue
    }

    query[key] = [existingValue, value]
  }

  return Object.keys(query).length > 0 ? query : undefined
}

export function LanguageSwitcher({
  className,
}: Readonly<LanguageSwitcherProps>) {
  const t = useTranslations("LanguageSwitcher")
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const nextLocale = getNextLocale(locale)

  const handleLocaleChange = () => {
    if (isPending || nextLocale === locale) {
      return
    }

    const query = getQueryFromSearchParams(searchParams)

    startTransition(() => {
      if (pathname.includes("[")) {
        if (query === undefined) {
          router.replace(
            // @ts-expect-error -- The current route params always match the current pathname.
            { pathname, params },
            { locale: nextLocale }
          )
          return
        }

        router.replace(
          // @ts-expect-error -- The current route params always match the current pathname.
          { pathname, params, query },
          { locale: nextLocale }
        )
        return
      }

      router.replace(query === undefined ? pathname : { pathname, query }, {
        locale: nextLocale,
      })
    })
  }

  return (
    <Button
      type="button"
      size="sm"
      variant="ghost"
      disabled={isPending}
      onClick={handleLocaleChange}
      className={cn(
        "h-8 rounded-full border border-border/70 bg-background/70 px-2 text-xs font-semibold uppercase shadow-sm transition-colors hover:bg-muted/60 sm:h-9 sm:px-2.5",
        className
      )}
      aria-busy={isPending}
      aria-label={`${t("label")}: ${t(locale)}. ${t(nextLocale)}`}
    >
      {isPending ? (
        <Loader2Icon className="size-4 animate-spin text-muted-foreground" />
      ) : (
        <Globe className="size-4 text-muted-foreground" />
      )}
      <span>{LOCALE_SHORT_LABELS[locale]}</span>
    </Button>
  )
}
