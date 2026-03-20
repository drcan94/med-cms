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
    rootBox: "w-full shrink-0 md:w-auto",
    organizationSwitcherTrigger:
      "h-9 w-full justify-between rounded-xl border border-border/70 bg-background/80 px-3 shadow-sm transition-colors hover:bg-muted/60 md:w-auto",
    organizationPreview: "min-w-0 items-center gap-2",
    organizationPreviewMainIdentifier: "max-w-40 truncate text-sm font-medium",
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
      <div className="flex w-full flex-col gap-3 px-3 py-3 sm:px-6 md:h-16 md:flex-row md:items-center md:justify-between md:gap-4 md:py-0 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
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
          <Link href="/patients" className="flex min-w-0 items-center gap-2.5 sm:gap-3">
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:size-10">
              <Building2 className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold tracking-tight sm:text-base">
                {t("title")}
              </p>
              <p className="hidden text-xs text-muted-foreground md:block">
                {t("subtitle")}
              </p>
            </div>
          </Link>
        </div>

        <div className="flex min-w-0 items-center gap-2 md:shrink-0 md:justify-end">
          <div className="min-w-0 flex-1 md:flex-none">
            <OrganizationSwitcher appearance={organizationSwitcherAppearance} />
          </div>
          <LanguageSwitcher />
          <ThemeToggle className="size-8 shrink-0 rounded-xl sm:size-9" />
          <UserButton appearance={userButtonAppearance} />
        </div>
      </div>
    </header>
  )
}
