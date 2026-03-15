"use client"

import { Draggable } from "@hello-pangea/dnd"

import type { Doc } from "@/convex/_generated/dataModel"
import { calculateClinicalDays } from "@/hooks/useClinicalDates"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

type PatientRecord = Doc<"patients">

type WardPatientCardProps = {
  draggingEnabled?: boolean
  fullName: string
  index: number
  patient: PatientRecord
}

function formatClinicalDaySummary(patient: PatientRecord): string {
  const clinicalDays = calculateClinicalDays(
    patient.admissionDate,
    patient.surgeryDate
  )

  return `Y${clinicalDays.admittedDays} / PO${clinicalDays.postOpDays ?? "-"}`
}

export function WardPatientCard({
  draggingEnabled = true,
  fullName,
  index,
  patient,
}: Readonly<WardPatientCardProps>) {
  const showsLocalName = fullName !== patient.initials

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
          className={cn(
            "grid gap-3 rounded-xl border bg-background p-3 shadow-xs",
            draggingEnabled
              ? "cursor-grab active:cursor-grabbing"
              : "cursor-default opacity-90",
            snapshot.isDragging && "border-primary shadow-md ring-1 ring-primary/20"
          )}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-semibold tracking-tight">
                {patient.initials}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {showsLocalName ? fullName : "Local roster name not available"}
              </p>
            </div>
            <Badge variant="outline">{formatClinicalDaySummary(patient)}</Badge>
          </div>

          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Diagnosis
            </p>
            <p className="text-sm leading-5 text-foreground">{patient.diagnosis}</p>
          </div>
        </article>
      )}
    </Draggable>
  )
}
