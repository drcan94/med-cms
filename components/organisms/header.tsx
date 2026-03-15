"use client"

import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { Menu } from "lucide-react"

import { ThemeToggle } from "@/components/molecules/theme-toggle"
import { Button } from "@/components/ui/button"

type HeaderProps = {
  onOpenSidebar?: () => void
}

export function Header({ onOpenSidebar }: Readonly<HeaderProps>) {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 print:hidden supports-backdrop-filter:bg-background/80 supports-backdrop-filter:backdrop-blur">
      <div className="flex h-16 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="md:hidden"
            onClick={onOpenSidebar}
            aria-label="Open sidebar navigation"
          >
            <Menu className="size-4" />
          </Button>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold tracking-tight">
              Clinical Workspace
            </p>
            <p className="text-xs text-muted-foreground">
              Tenant-aware dashboard foundation
            </p>
          </div>
        </div>

        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <div className="min-w-0 max-w-48">
            <OrganizationSwitcher />
          </div>
          <ThemeToggle />
          <UserButton />
        </div>
      </div>
    </header>
  )
}
