"use client"

import { Droppable } from "@hello-pangea/dnd"
import { useTranslations } from "next-intl"

import type { Doc } from "@/convex/_generated/dataModel"
import type { ConventionRule } from "@/lib/clinic-settings"
import { WardPatientCard } from "@/components/molecules/ward-patient-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"

type PatientRecord = Doc<"patients">

type WardPlacementLaneProps = {
  conventionRules?: readonly ConventionRule[]
  draggingEnabled?: boolean
  droppableId: string
  getPatientName: (patient: PatientRecord) => string
  onSelectPatient?: (patient: PatientRecord) => void
  patients: PatientRecord[]
}

export function WardPlacementLane({
  conventionRules,
  draggingEnabled = true,
  droppableId,
  getPatientName,
  onSelectPatient,
  patients,
}: Readonly<WardPlacementLaneProps>) {
  const t = useTranslations("WardMap")

  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>{t("placementTitle")}</CardTitle>
        <CardDescription>{t("placementDescription")}</CardDescription>
      </CardHeader>
      <CardContent>
        <Droppable droppableId={droppableId} isDropDisabled={!draggingEnabled}>
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={cn(
                "grid min-h-28 gap-3 rounded-xl border border-dashed p-3 md:grid-cols-2 xl:grid-cols-3",
                snapshot.isDraggingOver && "border-primary bg-primary/5"
              )}
            >
              {patients.length > 0 ? (
                patients.map((patient, index) => (
                  <WardPatientCard
                    conventionRules={conventionRules}
                    draggingEnabled={draggingEnabled}
                    key={patient._id}
                    fullName={getPatientName(patient)}
                    index={index}
                    onSelectPatient={onSelectPatient}
                    patient={patient}
                  />
                ))
              ) : (
                <div className="flex items-center rounded-lg px-3 text-sm text-muted-foreground">
                  {t("placementEmpty")}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </CardContent>
    </Card>
  )
}
