"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  ChevronDown,
  ChevronUp,
  Droplets,
  FlaskConical,
  ListTodo,
  Pill,
  Syringe,
  Thermometer,
} from "lucide-react"
import { useTranslations } from "next-intl"

import type { Id } from "@/convex/_generated/dataModel"
import { formatCompactBedDisplay } from "@/lib/ward-layout"
import { LocalRosterInfo } from "@/components/molecules/local-roster-info"
import { VisitTodoList } from "@/components/molecules/visit-todo-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { STAGING_BED_ID } from "@/lib/patient-privacy"
import type { VisitSheetEntry } from "@/lib/visit-sheet"

type VisitRoundsCardProps = {
  entry: VisitSheetEntry
}

function thoracicSideLabel(
  side: string,
  t: (key: string) => string
): string {
  switch (side) {
    case "right":
      return t("sides.right")
    case "left":
      return t("sides.left")
    case "bilateral":
      return t("sides.bilateral")
    default:
      return side
  }
}

function thoracicTypeLabel(
  type: string,
  t: (key: string) => string
): string {
  switch (type) {
    case "chest_tube":
      return t("thoracicTypes.chest_tube")
    case "drain":
      return t("thoracicTypes.drain")
    default:
      return type
  }
}

function pendingCultureLabel(
  type: string,
  t: (key: string) => string
): string {
  switch (type) {
    case "blood_culture":
      return t("cultureTypes.blood_culture")
    case "urine_culture":
      return t("cultureTypes.urine_culture")
    case "sputum_culture":
      return t("cultureTypes.sputum_culture")
    case "fluid_culture":
      return t("cultureTypes.fluid_culture")
    case "fluid_biochemistry":
      return t("cultureTypes.fluid_biochemistry")
    case "cytology":
      return t("cultureTypes.cytology")
    default:
      return type
  }
}

export function VisitRoundsCard({ entry }: Readonly<VisitRoundsCardProps>) {
  const t = useTranslations("VisitRoundsCard")
  const [showTodos, setShowTodos] = useState(false)
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

  const activeInterventions = entry.interventions.filter((i) => i.isActive)
  const activeAntibiotics = entry.antibiotics.filter((a) => a.isActive)
  const hasVitalsAlert =
    entry.vitals?.isFebrile || entry.vitals?.isHypoxic || entry.vitals?.isTachycardic

  const pendingTodoCount = useMemo(() => {
    const customPending = (entry.customTodos ?? []).filter((t) => !t.completed).length
    return customPending
  }, [entry.customTodos])

  return (
    <article className="rounded-2xl border bg-background shadow-xs print:hidden">
      <div className="p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1 space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("patient")}
              </p>
              <div className="flex items-start gap-2">
                <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                  {entry.initials}
                </h2>
                {!showsLocalRosterName ? (
                  <LocalRosterInfo className="mt-1" message={t("localRosterNotSynced")} />
                ) : null}
              </div>
              {showsLocalRosterName ? (
                <p className="text-base font-medium text-foreground">{entry.fullName}</p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="px-2 py-0.5 text-xs">
                {t("bed")}: {localizedBedLabel}
              </Badge>
              <Badge variant="secondary" className="px-2 py-0.5 text-xs">
                {t("days")}: {entry.daySummary}
              </Badge>
              {entry.procedureName && (
                <Badge variant="outline" className="px-2 py-0.5 text-xs">
                  {t("procedureBadge", { procedure: entry.procedureName })}
                </Badge>
              )}
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                {t("diagnosis")}
              </p>
              <p className="text-base leading-6 text-foreground">{entry.diagnosis}</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 lg:w-80 lg:shrink-0">
            {entry.vitals && (
              <div
                className={`rounded-lg border p-3 ${hasVitalsAlert ? "border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20" : "bg-muted/30"}`}
              >
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Activity className="size-3.5" />
                  {t("vitals")}
                </div>
                <div className="grid grid-cols-4 gap-2 text-sm">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      <Thermometer className="mr-0.5 inline size-3" />
                      {t("vitalsAbbrev.temperature")}
                    </span>
                    <p
                      className={`font-medium ${entry.vitals.isFebrile ? "text-red-600" : ""}`}
                    >
                      {entry.vitals.temperature}°
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("vitalsAbbrev.bloodPressure")}
                    </span>
                    <p className="font-medium">{entry.vitals.bloodPressure}</p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("vitalsAbbrev.pulse")}
                    </span>
                    <p
                      className={`font-medium ${entry.vitals.isTachycardic ? "text-orange-600" : ""}`}
                    >
                      {entry.vitals.pulse}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("vitalsAbbrev.spO2")}
                    </span>
                    <p
                      className={`font-medium ${entry.vitals.isHypoxic ? "text-red-600" : ""}`}
                    >
                      {entry.vitals.spO2}%
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeInterventions.length > 0 && (
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900 dark:bg-emerald-950/20">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                  <Syringe className="size-3.5 text-emerald-600" />
                  {t("tubesDrains")}
                </div>
                <div className="space-y-1.5">
                  {activeInterventions.map((intervention) => (
                    <div key={intervention.id} className="flex items-center justify-between">
                      <span className="text-sm">
                        {thoracicSideLabel(intervention.side, t)}{" "}
                        {thoracicTypeLabel(intervention.type, t)}{" "}
                        {intervention.size}
                      </span>
                      <div className="flex items-center gap-2">
                        {intervention.latestDrainage !== undefined && (
                          <span className="flex items-center gap-0.5 text-xs text-muted-foreground">
                            <Droplets className="size-3" />
                            {t("drainageVolume", {
                              value: intervention.latestDrainage,
                            })}
                          </span>
                        )}
                        <Badge variant="outline" className="text-xs">
                          {t("dayBadge", { day: intervention.dayCount })}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {(activeAntibiotics.length > 0 || entry.pendingCultures.length > 0) && (
              <div className="rounded-lg border bg-muted/30 p-3">
                {activeAntibiotics.length > 0 && (
                  <div className="mb-2">
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Pill className="size-3.5 text-amber-600" />
                      {t("antibiotics")}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {activeAntibiotics.map((abx) => (
                        <Badge
                          key={abx.id}
                          variant="secondary"
                          className="bg-amber-100 text-xs text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
                        >
                          {abx.name}{" "}
                          {t("dayBadge", { day: abx.dayCount })}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {entry.pendingCultures.length > 0 && (
                  <div>
                    <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <FlaskConical className="size-3.5 text-cyan-600" />
                      {t("pendingCultures")}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {entry.pendingCultures.map((culture) => (
                        <Badge key={culture.id} variant="outline" className="text-xs">
                          {pendingCultureLabel(culture.type, t)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <Collapsible open={showTodos} onOpenChange={setShowTodos}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="flex w-full items-center justify-between rounded-none border-t px-5 py-3 hover:bg-muted/30"
          >
            <span className="flex items-center gap-2 text-sm font-medium">
              <ListTodo className="size-4" />
              {t("todosTitle")}
              {pendingTodoCount > 0 && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
                  {pendingTodoCount}
                </span>
              )}
            </span>
            {showTodos ? (
              <ChevronUp className="size-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="size-4 text-muted-foreground" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="border-t bg-muted/10 px-5 py-4">
            <VisitTodoList
              patientId={entry.id as Id<"patients">}
              customTodos={entry.customTodos}
              completedRequirements={entry.completedRequirements}
              requirements={[]}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </article>
  )
}
