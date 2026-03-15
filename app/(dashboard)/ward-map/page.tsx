"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { WardMapHero } from "@/components/organisms/ward-map-hero"
import { WardPlacementLane } from "@/components/organisms/ward-placement-lane"
import { WardRoom } from "@/components/organisms/ward-room"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useLocalRoster } from "@/hooks/useLocalRoster"
import { usePLGLimits } from "@/hooks/usePLGLimits"
import { buildWardRoomsWithBeds } from "@/lib/ward-layout"

type PatientRecord = Doc<"patients">

const STAGING_DROPPABLE_ID = "ward-staging"

export default function WardMapPage() {
  const { getFullPatientName } = useLocalRoster()
  const { isLoaded, orgId, userId } = useAuth()
  const { isLocked } = usePLGLimits()
  const settings = useQuery(
    api.clinicSettings.getClinicSettings,
    orgId ? { organizationId: orgId } : "skip"
  )
  const patients = useQuery(
    api.patients.getPatientsByOrganization,
    orgId ? { organizationId: orgId } : "skip"
  ) as PatientRecord[] | undefined
  const updatePatientBed = useMutation(api.patients.updatePatientBed)
  const [optimisticBedIds, setOptimisticBedIds] = useState<Record<string, string>>({})

  const rooms = useMemo(
    () => buildWardRoomsWithBeds(settings?.wardLayout ?? []),
    [settings?.wardLayout]
  )
  const displayPatients = useMemo(
    () =>
      (patients ?? []).map((patient) => ({
        ...patient,
        bedId: optimisticBedIds[patient._id] ?? patient.bedId,
      })),
    [optimisticBedIds, patients]
  )
  const bedIds = useMemo(
    () => new Set(rooms.flatMap((room) => room.beds.map((bed) => bed.bedId))),
    [rooms]
  )
  const totalBeds = bedIds.size
  const { patientsByBed, stagingPatients } = useMemo(() => {
    const nextPatientsByBed = new Map<string, PatientRecord>()
    const nextStagingPatients: PatientRecord[] = []

    for (const patient of displayPatients) {
      if (bedIds.has(patient.bedId) && !nextPatientsByBed.has(patient.bedId)) {
        nextPatientsByBed.set(patient.bedId, patient)
        continue
      }

      nextStagingPatients.push(patient)
    }

    return {
      patientsByBed: nextPatientsByBed,
      stagingPatients: nextStagingPatients,
    }
  }, [bedIds, displayPatients])

  const movePatientToBed = async (
    patientId: string,
    destinationBedId: string
  ): Promise<void> => {
    if (isLocked) {
      return
    }

    if (!orgId || !userId) {
      toast.error("Select an organization and sign in before moving patients.")
      return
    }

    const patient = displayPatients.find((record) => record._id === patientId)

    if (!patient || patient.bedId === destinationBedId) {
      return
    }

    if (
      displayPatients.some(
        (record) =>
          record._id !== patient._id &&
          record.bedId === destinationBedId &&
          bedIds.has(record.bedId)
      )
    ) {
      toast.error("That bed is already occupied.")
      return
    }

    const previousBedId = patient.bedId

    setOptimisticBedIds((currentBedIds) => ({
      ...currentBedIds,
      [patient._id]: destinationBedId,
    }))

    try {
      await updatePatientBed({
        newBedId: destinationBedId,
        organizationId: orgId,
        patientId: patient._id,
        userId,
      })

      toast.success(`${patient.initials} moved to ${destinationBedId}.`)
    } catch (error) {
      setOptimisticBedIds((currentBedIds) => ({
        ...currentBedIds,
        [patient._id]: previousBedId,
      }))
      toast.error(
        error instanceof Error ? error.message : "Unable to move the patient."
      )
    }
  }

  const handleDragEnd = (result: DropResult): void => {
    if (isLocked) {
      return
    }

    const destination = result.destination

    if (!destination || destination.droppableId === result.source.droppableId) {
      return
    }

    if (destination.droppableId === STAGING_DROPPABLE_ID) {
      return
    }

    void movePatientToBed(result.draggableId, destination.droppableId)
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ward map</CardTitle>
          <CardDescription>Loading organization context...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!orgId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ward map</CardTitle>
          <CardDescription>
            Select a clinic organization to load the interactive ward layout.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (settings === undefined || patients === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ward map</CardTitle>
          <CardDescription>Loading rooms and patient placements...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (rooms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No ward layout configured</CardTitle>
          <CardDescription>
            Build the room list first so the map can generate droppable bed slots.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/settings/ward-map"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Open ward layout editor
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6">
      <WardMapHero
        patientCount={displayPatients.length}
        roomCount={rooms.length}
        totalBeds={totalBeds}
      />

      <DragDropContext onDragEnd={handleDragEnd}>
        <WardPlacementLane
          draggingEnabled={!isLocked}
          droppableId={STAGING_DROPPABLE_ID}
          getPatientName={(patient) =>
            getFullPatientName(patient.initials, patient.bedId)
          }
          patients={stagingPatients}
        />

        <section className="grid gap-4 xl:grid-cols-2">
          {rooms.map((room) => (
            <WardRoom
              draggingEnabled={!isLocked}
              key={room.roomId}
              getPatientName={(patient) =>
                getFullPatientName(patient.initials, patient.bedId)
              }
              patientsByBed={patientsByBed}
              room={room}
            />
          ))}
        </section>
      </DragDropContext>
    </div>
  )
}
