"use client"

import type { LucideIcon } from "lucide-react"
import { CreditCard, LayoutGrid, ListChecks, Settings2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { buttonVariants } from "@/components/ui/button"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

type SettingsNavItem = {
  href: string
  icon: LucideIcon
  translationKey: string
}

const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    href: "/settings",
    icon: Settings2,
    translationKey: "general",
  },
  {
    href: "/settings/conventions",
    icon: ListChecks,
    translationKey: "conventions",
  },
  {
    href: "/settings/ward-map",
    icon: LayoutGrid,
    translationKey: "wardMap",
  },
  {
    href: "/settings/billing",
    icon: CreditCard,
    translationKey: "billing",
  },
]

function isSettingsNavItemActive(pathname: string, href: string): boolean {
  if (href === "/settings") {
    return pathname === href
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function SettingsSectionNav() {
  const pathname = usePathname()
  const t = useTranslations("SettingsNav")

  return (
    <nav className="grid gap-2" aria-label={t("ariaLabel")}>
      {SETTINGS_NAV_ITEMS.map(({ href, icon: Icon, translationKey }) => {
        const isActive = isSettingsNavItemActive(pathname, href)

        return (
          <Link
            key={href}
            href={href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              buttonVariants({ variant: isActive ? "secondary" : "ghost" }),
              "h-auto min-w-0 items-start justify-start gap-3 px-3 py-3 text-left"
            )}
          >
            <Icon className="mt-0.5 size-4 shrink-0 text-primary" />
            <span className="min-w-0 space-y-1">
              <span className="block text-sm font-medium">
                {t(`${translationKey}.label`)}
              </span>
              <span className="block text-xs leading-5 text-muted-foreground break-words text-wrap">
                {t(`${translationKey}.description`)}
              </span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
