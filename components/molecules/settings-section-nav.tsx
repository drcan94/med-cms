"use client"

import type { LucideIcon } from "lucide-react"
import { CreditCard, LayoutGrid, ListChecks, Settings2 } from "lucide-react"

import { buttonVariants } from "@/components/ui/button"
import { Link, usePathname } from "@/i18n/navigation"
import { cn } from "@/lib/utils"

type SettingsNavItem = {
  description: string
  href: string
  icon: LucideIcon
  label: string
}

const SETTINGS_NAV_ITEMS: SettingsNavItem[] = [
  {
    description: "Clinic overview and admin utilities.",
    href: "/settings",
    icon: Settings2,
    label: "General",
  },
  {
    description: "If/Then workflow requirements for clinicians.",
    href: "/settings/conventions",
    icon: ListChecks,
    label: "Conventions",
  },
  {
    description: "Room counts and bed-capacity summaries.",
    href: "/settings/ward-map",
    icon: LayoutGrid,
    label: "Ward Map",
  },
  {
    description: "Subscription status, limits, and upgrade actions.",
    href: "/settings/billing",
    icon: CreditCard,
    label: "Billing",
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

  return (
    <nav className="grid gap-2" aria-label="Settings sections">
      {SETTINGS_NAV_ITEMS.map(({ description, href, icon: Icon, label }) => {
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
              <span className="block text-sm font-medium">{label}</span>
              <span className="block text-xs leading-5 text-muted-foreground break-words text-wrap">
                {description}
              </span>
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
