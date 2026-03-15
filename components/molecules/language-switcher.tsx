"use client"

import { useLocale, useTranslations } from "next-intl"

import { Button } from "@/components/ui/button"
import { usePathname, useRouter } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"
import { routing } from "@/i18n/routing"
import { cn } from "@/lib/utils"

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher")
  const locale = useLocale() as AppLocale
  const pathname = usePathname()
  const router = useRouter()

  const handleLocaleChange = (nextLocale: AppLocale) => {
    if (nextLocale === locale) {
      return
    }

    router.replace(pathname, { locale: nextLocale })
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className="flex items-center rounded-lg border p-1"
    >
      {routing.locales.map((candidateLocale) => (
        <Button
          key={candidateLocale}
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => handleLocaleChange(candidateLocale)}
          className={cn(
            "h-8 px-2 text-xs font-semibold uppercase",
            candidateLocale === locale && "bg-muted text-foreground"
          )}
          aria-pressed={candidateLocale === locale}
        >
          {t(candidateLocale)}
        </Button>
      ))}
    </div>
  )
}
