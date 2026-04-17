import { LayoutGrid } from "lucide-react"
import { useTranslations } from "next-intl"

import { LocalSyncModal } from "@/components/organisms/local-sync-modal"
import { Badge } from "@/components/ui/badge"

type WardMapHeroProps = {
  patientCount: number
  roomCount: number
  totalBeds: number
}

export function WardMapHero({
  patientCount,
  roomCount,
  totalBeds,
}: Readonly<WardMapHeroProps>) {
  const t = useTranslations("WardMap")

  return (
    <section className="grid gap-4 rounded-2xl border bg-background p-6 shadow-xs lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">{t("heroPhase")}</Badge>
          <Badge variant="secondary" className="gap-1">
            <LayoutGrid className="size-3" />
            {t("heroBadge")}
          </Badge>
          <LocalSyncModal
            triggerClassName="shrink-0"
            triggerLabel={t("localSyncButton")}
            triggerSize="sm"
            triggerVariant="outline"
          />
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t("heroTitle")}</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            {t("heroDescription")}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("rooms")}
          </p>
          <p className="mt-2 text-2xl font-semibold">{roomCount}</p>
        </div>
        <div className="rounded-xl border px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("beds")}
          </p>
          <p className="mt-2 text-2xl font-semibold">{totalBeds}</p>
        </div>
        <div className="rounded-xl border px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            {t("patients")}
          </p>
          <p className="mt-2 text-2xl font-semibold">{patientCount}</p>
        </div>
      </div>
    </section>
  )
}
