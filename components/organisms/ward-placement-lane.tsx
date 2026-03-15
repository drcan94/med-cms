"use client"

import { Droppable } from "@hello-pangea/dnd"

import type { Doc } from "@/convex/_generated/dataModel"
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
  draggingEnabled?: boolean
  droppableId: string
  getPatientName: (patient: PatientRecord) => string
  patients: PatientRecord[]
}

export function WardPlacementLane({
  draggingEnabled = true,
  droppableId,
  getPatientName,
  patients,
}: Readonly<WardPlacementLaneProps>) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle>Patients needing bed placement</CardTitle>
        <CardDescription>
          Drag from here when a patient does not already match a generated bed ID.
        </CardDescription>
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
                    draggingEnabled={draggingEnabled}
                    key={patient._id}
                    fullName={getPatientName(patient)}
                    index={index}
                    patient={patient}
                  />
                ))
              ) : (
                <div className="flex items-center rounded-lg px-3 text-sm text-muted-foreground">
                  All patients are currently placed into configured beds.
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
