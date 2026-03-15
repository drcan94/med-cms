import type { ReactNode } from "react"

import { SettingsSectionNav } from "@/components/molecules/settings-section-nav"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type SettingsLayoutProps = {
  children: ReactNode
}

export default function SettingsLayout({
  children,
}: Readonly<SettingsLayoutProps>) {
  return (
    <div className="grid gap-6">
      <section className="rounded-2xl border bg-background p-6 shadow-xs">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Phase 7</Badge>
            <Badge variant="secondary">PLG, Billing &amp; Tenant Controls</Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Clinic settings
            </h1>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
              Configure tenant-specific conventions, ward structure, billing, and
              operational preferences for each clinic organization.
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card size="sm" className="h-fit lg:sticky lg:top-24">
          <CardHeader className="border-b">
            <CardTitle>Settings sections</CardTitle>
            <CardDescription>
              Switch between clinic setup workflows.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <SettingsSectionNav />
          </CardContent>
        </Card>

        <div className="min-w-0">{children}</div>
      </div>
    </div>
  )
}
