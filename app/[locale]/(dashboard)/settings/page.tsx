import { getTranslations } from "next-intl/server"

import { LocalSyncModal } from "@/components/organisms/local-sync-modal"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default async function GeneralSettingsPage() {
  const t = await getTranslations("SettingsPage")

  return (
    <div className="grid min-w-0 gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{t("generalBadge")}</Badge>
            <Badge variant="secondary">{t("workspaceBadge")}</Badge>
          </div>
          <CardTitle>{t("operationsTitle")}</CardTitle>
          <CardDescription className="wrap-break-word text-wrap">
            {t("operationsDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p className="wrap-break-word text-wrap">{t("operationsBody")}</p>
          <div className="rounded-xl border border-dashed px-4 py-3 wrap-break-word text-wrap">
            {t("operationsNote")}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("localSyncTitle")}</CardTitle>
          <CardDescription className="wrap-break-word text-wrap">
            {t("localSyncDescription")}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-4 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl wrap-break-word text-wrap">
            {t("localSyncBody")}
          </p>
          <LocalSyncModal />
        </CardContent>
      </Card>
    </div>
  )
}
