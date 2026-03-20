"use client"

import { Draggable } from "@hello-pangea/dnd"
import { ClipboardList } from "lucide-react"
import { useTranslations } from "next-intl"

import type { Doc } from "@/convex/_generated/dataModel"
import { calculateClinicalDays } from "@/hooks/useClinicalDates"
import type { ConventionRule } from "@/lib/clinic-settings"
import { evaluatePatientRules } from "@/lib/rule-engine"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"

type PatientRecord = Doc<"patients">

type WardPatientCardProps = {
  conventionRules?: readonly ConventionRule[]
  draggingEnabled?: boolean
  fullName: string
  index: number
  onSelectPatient?: (patient: PatientRecord) => void
  patient: PatientRecord
}

function getClinicalDayValues(patient: PatientRecord) {
  const clinicalDays = calculateClinicalDays(
    patient.admissionDate,
    patient.surgeryDate
  )

  return {
    admittedDays: clinicalDays.admittedDays,
    postOpDays: clinicalDays.postOpDays ?? "-",
  }
}

export function WardPatientCard({
  conventionRules,
  draggingEnabled = true,
  fullName,
  index,
  onSelectPatient,
  patient,
}: Readonly<WardPatientCardProps>) {
  const t = useTranslations("WardMap")
  const showsLocalName = fullName !== patient.initials
  const clinicalDays = getClinicalDayValues(patient)
  const hasClinicalRequirements =
    conventionRules &&
    conventionRules.length > 0 &&
    evaluatePatientRules(
      {
        diagnosis: patient.diagnosis,
        procedureName: patient.procedureName ?? undefined,
      },
      conventionRules
    ).length > 0

  return (
    <Draggable
      draggableId={patient._id}
      index={index}
      isDragDisabled={!draggingEnabled}
    >
      {(provided, snapshot) => (
        <article
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          role={onSelectPatient ? "button" : undefined}
          tabIndex={onSelectPatient ? 0 : undefined}
          onClick={() => {
            if (!snapshot.isDragging) {
              onSelectPatient?.(patient)
            }
          }}
          onKeyDown={(event) => {
            if (
              onSelectPatient &&
              !snapshot.isDragging &&
              (event.key === "Enter" || event.key === " ")
            ) {
              event.preventDefault()
              onSelectPatient(patient)
            }
          }}
          className={cn(
            "grid gap-3 overflow-hidden rounded-xl border bg-background p-3 shadow-xs",
            draggingEnabled
              ? "cursor-grab active:cursor-grabbing"
              : "cursor-default opacity-90",
            snapshot.isDragging && "border-primary shadow-md ring-1 ring-primary/20"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-1">
              <p className="flex flex-wrap items-center gap-2 text-sm font-semibold tracking-tight">
                <span className="truncate">{patient.initials}</span>
                {hasClinicalRequirements ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="inline-flex size-6 shrink-0 cursor-help items-center justify-center rounded-full border border-amber-500/50 bg-amber-100 text-amber-700 dark:border-amber-500/40 dark:bg-amber-950/60 dark:text-amber-400">
                        <ClipboardList className="size-3.5" />
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-xs">
                      <p className="text-xs font-medium">{t("clinicalRequirementsIndicator")}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : null}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {showsLocalName ? fullName : t("localNameUnavailable")}
              </p>
            </div>
            <Badge variant="outline" className="shrink-0 whitespace-nowrap">
              {t("daySummary", {
                admittedDays: clinicalDays.admittedDays,
                postOpDays: clinicalDays.postOpDays,
              })}
            </Badge>
          </div>

          {patient.serviceName ? (
            <div className="min-w-0 space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t("service")}
              </p>
              <p className="truncate text-sm leading-5 text-foreground">{patient.serviceName}</p>
            </div>
          ) : null}

          <div className="min-w-0 space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t("diagnosis")}
            </p>
            <p className="line-clamp-2 text-sm leading-5 text-foreground">{patient.diagnosis}</p>
          </div>
        </article>
      )}
    </Draggable>
  )
}
