import type { Doc } from "@/convex/_generated/dataModel"
import type { WardRoom } from "@/lib/clinic-settings"
import { STAGING_BED_ID } from "@/lib/patient-privacy"
import { buildWardRoomsWithBeds } from "@/lib/ward-layout"

type PatientRecord = Doc<"patients">

type BuildPatientBedOptionsArgs = {
  currentPatient: PatientRecord | null
  currentBedLabel: (bedId: string) => string
  formatBedLabel: (roomName: string, bedNumber: number, roomBedCount: number) => string
  patients?: PatientRecord[]
  stagingLabel: string
  wardLayout?: WardRoom[]
}

export function buildPatientBedOptions({
  currentPatient,
  currentBedLabel,
  formatBedLabel,
  patients,
  stagingLabel,
  wardLayout,
}: BuildPatientBedOptionsArgs) {
  const seenBedIds = new Set<string>([STAGING_BED_ID])
  const activeBedId =
    currentPatient?.bedId && currentPatient.bedId !== STAGING_BED_ID
      ? currentPatient.bedId
      : null
  const occupiedBeds = new Set(
    (patients ?? [])
      .filter(
        (record) =>
          record._id !== currentPatient?._id && record.bedId !== STAGING_BED_ID
      )
      .map((record) => record.bedId)
  )
  const options = [{ value: STAGING_BED_ID, label: stagingLabel }]

  for (const room of buildWardRoomsWithBeds(wardLayout ?? [])) {
    for (const bed of room.beds) {
      if ((occupiedBeds.has(bed.bedId) && bed.bedId !== activeBedId) || seenBedIds.has(bed.bedId)) {
        continue
      }

      seenBedIds.add(bed.bedId)
      options.push({
        value: bed.bedId,
        label: formatBedLabel(room.roomName, bed.bedNumber, room.beds.length),
      })
    }
  }

  if (activeBedId && !seenBedIds.has(activeBedId)) {
    options.push({ value: activeBedId, label: currentBedLabel(activeBedId) })
  }

  return options
}
