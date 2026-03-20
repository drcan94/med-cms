"use client"

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { Building2, Menu } from "lucide-react"
import { useTranslations } from "next-intl"

import { LanguageSwitcher } from "@/components/molecules/language-switcher"
import { ThemeToggle } from "@/components/molecules/theme-toggle"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"

type HeaderProps = {
  onOpenSidebar?: () => void
}

const organizationSwitcherAppearance = {
  elements: {
    rootBox: "max-w-[120px] min-w-0 shrink md:max-w-48",
    organizationSwitcherTrigger:
      "h-8 max-w-full justify-between gap-1 rounded-xl border border-border/70 bg-background/80 px-2 shadow-sm transition-colors hover:bg-muted/60 sm:h-9 sm:px-3 md:max-w-none",
    organizationPreview: "min-w-0 flex-1 items-center gap-1.5 overflow-hidden sm:gap-2",
    organizationPreviewMainIdentifier:
      "min-w-0 max-w-full truncate text-xs font-medium sm:text-sm",
    organizationPreviewSecondaryIdentifier: "hidden",
    organizationSwitcherTriggerIcon: "text-muted-foreground",
  },
}

const userButtonAppearance = {
  elements: {
    userButtonAvatarBox: "size-8 sm:size-9",
  },
}

export function Header({ onOpenSidebar }: Readonly<HeaderProps>) {
  const t = useTranslations("Header")

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 print:hidden supports-backdrop-filter:bg-background/80 supports-backdrop-filter:backdrop-blur">
      <div className="flex h-14 w-full flex-nowrap items-center justify-between gap-2 overflow-hidden px-2 sm:px-4 md:h-16 lg:px-8">
        <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8 shrink-0 rounded-xl md:hidden"
            onClick={onOpenSidebar}
            aria-label={t("openSidebar")}
          >
            <Menu className="size-4" />
          </Button>
          <Link
            href="/patients"
            className="flex min-w-0 items-center gap-2 sm:gap-3"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-9 md:size-10">
              <Building2 className="size-4.5 sm:size-5" />
            </div>
            <div className="hidden min-w-0 md:block">
              <p className="truncate text-sm font-semibold tracking-tight sm:text-base">
                {t("title")}
              </p>
              <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
            </div>
          </Link>
        </div>

        <div className="flex min-w-0 flex-1 flex-nowrap items-center justify-end gap-1 overflow-hidden sm:gap-2 md:shrink-0">
          <div className="min-w-0 shrink">
            <OrganizationSwitcher appearance={organizationSwitcherAppearance} />
          </div>
          <div className="flex shrink-0 flex-row flex-nowrap items-center gap-1 sm:gap-2">
            <LanguageSwitcher />
            <ThemeToggle className="size-8 shrink-0 rounded-xl sm:size-9" />
            <UserButton appearance={userButtonAppearance} />
          </div>
        </div>
      </div>
    </header>
  )
}
