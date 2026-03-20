"use client"

import { Globe, Loader2Icon } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useSearchParams } from "next/navigation"
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

export function LanguageSwitcher({
  className,
}: Readonly<LanguageSwitcherProps>) {
  const t = useTranslations("LanguageSwitcher")
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const nextLocale = getNextLocale(locale)

  const handleLocaleChange = () => {
    if (isPending || nextLocale === locale) {
      return
    }

    startTransition(() => {
      router.replace(
        {
          pathname,
          query: Object.fromEntries(searchParams.entries()),
        },
        { locale: nextLocale }
      )
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
        "h-8 rounded-xl border border-border/70 bg-background/70 px-2 text-xs font-semibold uppercase shadow-sm transition-colors hover:bg-muted/60 sm:h-9 sm:px-2.5",
        className
      )}
      aria-busy={isPending}
      aria-label={`${t("label")}: ${t(locale)}. ${t(nextLocale)}`}
    >
      {isPending ? (
        <Loader2Icon className="hidden size-4 animate-spin text-muted-foreground sm:block" />
      ) : (
        <Globe className="hidden size-4 text-muted-foreground sm:block" />
      )}
      <span className="min-w-[2ch] text-center">{LOCALE_SHORT_LABELS[locale]}</span>
    </Button>
  )
}
