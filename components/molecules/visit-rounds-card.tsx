"use client"

import { useTranslations } from "next-intl"

import { formatCompactBedDisplay } from "@/lib/ward-layout"
import { Badge } from "@/components/ui/badge"
import { STAGING_BED_ID } from "@/lib/patient-privacy"
import type { VisitSheetEntry } from "@/lib/visit-sheet"

type VisitRoundsCardProps = {
  entry: VisitSheetEntry
}

export function VisitRoundsCard({
  entry,
}: Readonly<VisitRoundsCardProps>) {
  const t = useTranslations("VisitRoundsCard")
  const showsLocalRosterName = entry.fullName !== entry.initials
  const localizedBedLabel =
    entry.bedId === STAGING_BED_ID
      ? t("staging")
      : typeof entry.bedNumber === "number"
        ? formatCompactBedDisplay(
            entry.roomName ?? "",
            entry.bedNumber,
            entry.roomBedCount ?? 0,
            t("bedLabel", { number: entry.bedNumber })
          )
        : entry.bedDisplay

  return (
    <article className="rounded-2xl border bg-background p-5 shadow-xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {t("patient")}
            </p>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {entry.initials}
            </h2>
            <p className="text-base font-medium text-foreground sm:text-lg">
              {showsLocalRosterName ? entry.fullName : t("localRosterNotSynced")}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="px-3 py-1 text-sm">
              {t("bed")}: {localizedBedLabel}
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 text-sm">
              {t("days")}: {entry.daySummary}
            </Badge>
          </div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          {t("diagnosis")}
        </p>
        <p className="text-lg leading-7 text-foreground">{entry.diagnosis}</p>
      </div>
    </article>
  )
}
