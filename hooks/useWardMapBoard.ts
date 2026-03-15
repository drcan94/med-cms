"use client"

import { useMemo } from "react"

import type { Doc } from "@/convex/_generated/dataModel"
import type { WardRoom } from "@/lib/clinic-settings"
import { buildWardBedMetadata, buildWardRoomsWithBeds } from "@/lib/ward-layout"

type PatientRecord = Doc<"patients">

type UseWardMapBoardArgs = {
  optimisticBedIds: Record<string, string>
  patients: PatientRecord[] | undefined
  wardLayout: WardRoom[]
}

export function useWardMapBoard({
  optimisticBedIds,
  patients,
  wardLayout,
}: Readonly<UseWardMapBoardArgs>) {
  const rooms = useMemo(() => buildWardRoomsWithBeds(wardLayout), [wardLayout])
  const bedMetadata = useMemo(() => buildWardBedMetadata(wardLayout), [wardLayout])
  const displayPatients = useMemo(
    () =>
      (patients ?? []).map((patient) => ({
        ...patient,
        bedId: optimisticBedIds[patient._id] ?? patient.bedId,
      })),
    [optimisticBedIds, patients]
  )
  const bedIds = useMemo(() => new Set(bedMetadata.keys()), [bedMetadata])
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

  return {
    bedIds,
    bedMetadata,
    displayPatients,
    patientsByBed,
    rooms,
    stagingPatients,
    totalBeds,
  }
}
