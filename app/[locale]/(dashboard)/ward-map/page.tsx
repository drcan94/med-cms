"use client"

import { useMemo, useState } from "react"
import { DragDropContext, type DropResult } from "@hello-pangea/dnd"
import { useAuth } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { PatientSheet } from "@/components/organisms/patient-sheet"
import { WardMapHero } from "@/components/organisms/ward-map-hero"
import { WardPlacementLane } from "@/components/organisms/ward-placement-lane"
import { WardRoom } from "@/components/organisms/ward-room"
import { WardMapStateCard } from "@/components/organisms/ward-map-state-card"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import { useLocalRoster } from "@/hooks/useLocalRoster"
import { usePLGLimits } from "@/hooks/usePLGLimits"
import { useWardMapBoard } from "@/hooks/useWardMapBoard"
import { formatPatientToastName } from "@/lib/patient-privacy"
import { parseConventionRules } from "@/lib/clinic-settings"
import {
  getWardMapBedDisplayLabel,
  resolveWardMapErrorMessage,
} from "@/lib/ward-map-display"

type PatientRecord = Doc<"patients">

const STAGING_DROPPABLE_ID = "ward-staging"

export default function WardMapPage() {
  const t = useTranslations("WardMap")
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
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)
  const {
    bedIds,
    bedMetadata,
    displayPatients,
    patientsByBed,
    rooms,
    stagingPatients,
    totalBeds,
  } = useWardMapBoard({
    optimisticBedIds,
    patients,
    wardLayout: settings?.wardLayout ?? [],
  })

  const conventionRules = useMemo(
    () => parseConventionRules(settings?.conventions),
    [settings?.conventions]
  )

  const getPatientName = (patient: PatientRecord) =>
    getFullPatientName({
      bedId: patient.bedId,
      identifierCode: patient.identifierCode,
      initials: patient.initials,
      patientId: patient._id,
    })

  const handleSelectPatient = (patient: PatientRecord): void => {
    if (isLocked) {
      return
    }

    setSelectedPatient(patient)
    setSheetOpen(true)
  }

  const movePatientToBed = async (
    patientId: string,
    destinationBedId: string
  ): Promise<void> => {
    if (isLocked) {
      return
    }

    if (!orgId || !userId) {
      toast.error(t("toasts.missingContext"))
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
      toast.error(t("toasts.occupied"))
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

      toast.success(
        t("toasts.moveSuccess", {
          patientName: formatPatientToastName(
            getPatientName(patient),
            patient.initials
          ),
          destination: getWardMapBedDisplayLabel(destinationBedId, bedMetadata, t),
        })
      )
    } catch (error) {
      setOptimisticBedIds((currentBedIds) => ({
        ...currentBedIds,
        [patient._id]: previousBedId,
      }))
      toast.error(resolveWardMapErrorMessage(error, t))
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
    return <WardMapStateCard title={t("title")} description={t("loadingOrganization")} />
  }

  if (!orgId) {
    return <WardMapStateCard title={t("title")} description={t("selectOrganization")} />
  }

  if (settings === undefined || patients === undefined) {
    return <WardMapStateCard title={t("title")} description={t("loadingPlacements")} />
  }

  if (rooms.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("noLayoutTitle")}</CardTitle>
          <CardDescription>{t("noLayoutDescription")}</CardDescription>
        </CardHeader>
        <CardContent>
          <Link
            href="/settings/ward-map"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            {t("openWardLayoutEditor")}
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <div className="grid gap-6">
        <WardMapHero
          patientCount={displayPatients.length}
          roomCount={rooms.length}
          totalBeds={totalBeds}
        />

        <DragDropContext onDragEnd={handleDragEnd}>
          <WardPlacementLane
            conventionRules={conventionRules}
            draggingEnabled={!isLocked}
            droppableId={STAGING_DROPPABLE_ID}
            getPatientName={getPatientName}
            onSelectPatient={handleSelectPatient}
            patients={stagingPatients}
          />

          <section className="grid gap-4 xl:grid-cols-2">
            {rooms.map((room) => (
              <WardRoom
                conventionRules={conventionRules}
                draggingEnabled={!isLocked}
                key={room.roomId}
                getPatientName={getPatientName}
                onSelectPatient={handleSelectPatient}
                patientsByBed={patientsByBed}
                room={room}
              />
            ))}
          </section>
        </DragDropContext>
      </div>

      <PatientSheet
        open={!isLocked && sheetOpen}
        onOpenChange={(nextOpen) => {
          setSheetOpen(nextOpen)

          if (!nextOpen) {
            setSelectedPatient(null)
          }
        }}
        organizationId={orgId}
        patient={selectedPatient}
        userId={userId}
      />
    </>
  )
}
