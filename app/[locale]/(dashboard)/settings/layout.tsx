import type { ReactNode } from "react"
import { getTranslations } from "next-intl/server"

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

export default async function SettingsLayout({
  children,
}: Readonly<SettingsLayoutProps>) {
  const t = await getTranslations("SettingsLayout")

  return (
    <div className="grid min-w-0 gap-6">
      <section className="rounded-2xl border bg-background p-6 shadow-xs">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{t("phaseBadge")}</Badge>
            <Badge variant="secondary">{t("phaseStatus")}</Badge>
          </div>

          <div className="min-w-0 space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
            <p className="max-w-3xl wrap-break-word text-sm leading-6 text-muted-foreground text-wrap">
              {t("description")}
            </p>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <Card size="sm" className="h-fit lg:sticky lg:top-24">
          <CardHeader className="border-b">
            <CardTitle>{t("navTitle")}</CardTitle>
            <CardDescription>{t("navDescription")}</CardDescription>
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
