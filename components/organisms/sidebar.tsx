"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { LucideIcon } from "lucide-react"
import { Building2, LayoutGrid, Printer, Settings, UsersRound } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

type SidebarProps = {
  className?: string
  onNavigate?: () => void
}

type NavigationItem = {
  description: string
  href: string
  icon: LucideIcon
  label: string
}

const NAV_ITEMS: NavigationItem[] = [
  {
    href: "/patients",
    label: "Patients",
    description: "Clinic census and patient workflow queue.",
    icon: UsersRound,
  },
  {
    href: "/ward-map",
    label: "Ward Map",
    description: "Interactive room layout and patient bed placement board.",
    icon: LayoutGrid,
  },
  {
    href: "/visit",
    label: "Visit & Print",
    description: "Mobile rounds cards and A4 visit-sheet printing.",
    icon: Printer,
  },
  {
    href: "/settings",
    label: "Settings",
    description: "Tenant preferences, conventions, and clinic setup.",
    icon: Settings,
  },
]

function isNavigationItemActive(pathname: string, href: string): boolean {
  if (href === "/settings") {
    return pathname === href || pathname.startsWith("/settings/conventions")
  }

  return pathname === href || pathname.startsWith(`${href}/`)
}

export function Sidebar({ className, onNavigate }: Readonly<SidebarProps>) {
  const pathname = usePathname()

  return (
    <aside className={cn("flex h-full flex-col bg-background print:hidden", className)}>
      <div className="border-b px-6 py-5">
        <Link
          href="/patients"
          onClick={onNavigate}
          className="flex items-center gap-3"
        >
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold tracking-tight">Med CMS</span>
              <Badge variant="outline">B2B</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Clinical tenant workspace
            </p>
          </div>
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-2 px-3 py-4">
        {NAV_ITEMS.map(({ description, href, icon: Icon, label }) => {
          const isActive = isNavigationItemActive(pathname, href)

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              className={cn(
                "rounded-xl border border-transparent px-3 py-3 transition-colors",
                isActive
                  ? "border-border/70 bg-muted/70 shadow-xs"
                  : "hover:bg-muted/50"
              )}
            >
              <div className="mb-1 flex items-center gap-2 text-sm font-medium">
                <Icon className="size-4 text-primary" />
                {label}
              </div>
              <p className="text-xs leading-5 text-muted-foreground">
                {description}
              </p>
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
