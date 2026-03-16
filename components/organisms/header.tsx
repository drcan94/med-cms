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
    rootBox: "shrink-0",
    organizationSwitcherTrigger:
      "h-8 rounded-full border border-border/70 bg-background/80 px-2 shadow-sm transition-colors hover:bg-muted/60 sm:h-9 sm:px-3",
    organizationPreview: "items-center gap-2",
    organizationPreviewMainIdentifier:
      "hidden max-w-32 truncate text-sm lg:block",
    organizationPreviewSecondaryIdentifier: "hidden",
    organizationSwitcherTriggerIcon: "hidden lg:block text-muted-foreground",
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
      <div className="flex h-16 w-full items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="shrink-0 md:hidden"
            onClick={onOpenSidebar}
            aria-label={t("openSidebar")}
          >
            <Menu className="size-4" />
          </Button>
          <Link href="/patients" className="flex min-w-0 items-center gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
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

        <div className="flex min-w-0 shrink-0 items-center justify-end gap-1.5 sm:gap-2">
          <OrganizationSwitcher appearance={organizationSwitcherAppearance} />
          <LanguageSwitcher />
          <ThemeToggle className="size-8 sm:size-9" />
          <UserButton appearance={userButtonAppearance} />
        </div>
      </div>
    </header>
  )
}
