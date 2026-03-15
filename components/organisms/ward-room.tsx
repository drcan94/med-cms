"use client"

import { Droppable } from "@hello-pangea/dnd"

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
  patientsByBed: Map<string, PatientRecord>
  room: WardRoomWithBeds
}

export function WardRoom({
  draggingEnabled = true,
  getPatientName,
  patientsByBed,
  room,
}: Readonly<WardRoomProps>) {
  const occupiedBeds = room.beds.filter((bed) => patientsByBed.has(bed.bedId)).length

  return (
    <Card className="h-full">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{room.roomName}</CardTitle>
            <CardDescription>
              {occupiedBeds} / {room.beds.length} beds occupied
            </CardDescription>
          </div>
          <Badge variant="secondary">{room.beds.length} beds</Badge>
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
                    <div>
                      <p className="text-sm font-medium">{bed.bedLabel}</p>
                      <p className="text-xs text-muted-foreground">{bed.bedId}</p>
                    </div>
                    <Badge variant={patient ? "default" : "outline"}>
                      {patient ? "Occupied" : "Empty"}
                    </Badge>
                  </div>

                  {patient ? (
                    <WardPatientCard
                      draggingEnabled={draggingEnabled}
                      fullName={getPatientName(patient)}
                      index={0}
                      patient={patient}
                    />
                  ) : (
                    <div className="flex min-h-20 items-center justify-center rounded-lg border border-dashed px-3 text-center text-sm text-muted-foreground">
                      Empty Bed
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
