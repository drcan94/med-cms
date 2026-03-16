"use client"

import { Droppable } from "@hello-pangea/dnd"
import { useTranslations } from "next-intl"

import type { Doc } from "@/convex/_generated/dataModel"
import { WardPatientCard } from "@/components/molecules/ward-patient-card"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { WardRoomWithBeds } from "@/lib/ward-layout"

type PatientRecord = Doc<"patients">

type WardRoomProps = {
  draggingEnabled?: boolean
  getPatientName: (patient: PatientRecord) => string
  onSelectPatient?: (patient: PatientRecord) => void
  patientsByBed: Map<string, PatientRecord>
  room: WardRoomWithBeds
}

export function WardRoom({
  draggingEnabled = true,
  getPatientName,
  onSelectPatient,
  patientsByBed,
  room,
}: Readonly<WardRoomProps>) {
  const t = useTranslations("WardMap")
  const occupiedBeds = room.beds.filter((bed) => patientsByBed.has(bed.bedId)).length

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <CardTitle>{room.roomName}</CardTitle>
            <CardDescription className="wrap-break-word text-wrap">
              {t("roomOccupancy", {
                occupiedBeds,
                totalBeds: room.beds.length,
              })}
            </CardDescription>
          </div>
          <Badge variant="secondary">{t("roomBeds", { count: room.beds.length })}</Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-3 pt-6 sm:grid-cols-2">
        {room.beds.map((bed) => {
          const patient = patientsByBed.get(bed.bedId)

          return (
            <Droppable
              key={bed.bedId}
              droppableId={bed.bedId}
              isDropDisabled={!draggingEnabled}
            >
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={cn(
                    "min-h-36 rounded-xl border border-dashed p-3 transition-colors",
                    snapshot.isDraggingOver
                      ? "border-primary bg-primary/5"
                      : "bg-muted/15",
                    patient && "border-border bg-background"
                  )}
                >
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {t("bedLabel", { number: bed.bedNumber })}
                      </p>
                    </div>
                    <Badge variant={patient ? "default" : "outline"}>
                      {patient ? t("bedOccupied") : t("bedEmpty")}
                    </Badge>
                  </div>

                  {patient ? (
                    <WardPatientCard
                      draggingEnabled={draggingEnabled}
                      fullName={getPatientName(patient)}
                      index={0}
                      onSelectPatient={onSelectPatient}
                      patient={patient}
                    />
                  ) : (
                    <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed px-3 text-center text-sm text-muted-foreground">
                      {t("emptyBed")}
                    </div>
                  )}

                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          )
        })}
      </CardContent>
    </Card>
  )
}
