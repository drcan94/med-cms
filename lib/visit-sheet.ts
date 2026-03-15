import type { Doc } from "@/convex/_generated/dataModel"
import { calculateClinicalDays } from "@/hooks/useClinicalDates"
import type { WardRoom } from "@/lib/clinic-settings"
import { buildWardRoomsWithBeds } from "@/lib/ward-layout"

type PatientRecord = Doc<"patients">

type BuildVisitSheetEntriesArgs = {
  getFullPatientName: (initials: string, bedId: string) => string
  patients: PatientRecord[]
  wardLayout: WardRoom[]
}

type BedMetadata = {
  bedDisplay: string
  order: number
}

export type VisitSheetEntry = {
  bedDisplay: string
  bedId: string
  daySummary: string
  diagnosis: string
  fullName: string
  id: PatientRecord["_id"]
  initials: string
}

function compareBedIds(leftBedId: string, rightBedId: string): number {
  return leftBedId.localeCompare(rightBedId, undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

function formatBedDisplay(roomName: string, bedLabel: string): string {
  const normalizedRoomName = roomName.trim()
  return normalizedRoomName ? `${normalizedRoomName} ${bedLabel}` : bedLabel
}

function buildWardBedMetadata(wardLayout: WardRoom[]): Map<string, BedMetadata> {
  const bedMetadata = new Map<string, BedMetadata>()
  let order = 0

  for (const room of buildWardRoomsWithBeds(wardLayout)) {
    for (const bed of room.beds) {
      if (bedMetadata.has(bed.bedId)) {
        continue
      }

      bedMetadata.set(bed.bedId, {
        bedDisplay: formatBedDisplay(room.roomName, bed.bedLabel),
        order,
      })
      order += 1
    }
  }

  return bedMetadata
}

function comparePatients(
  leftPatient: PatientRecord,
  rightPatient: PatientRecord,
  bedMetadata: Map<string, BedMetadata>
): number {
  const leftOrder = bedMetadata.get(leftPatient.bedId)?.order ?? Number.POSITIVE_INFINITY
  const rightOrder =
    bedMetadata.get(rightPatient.bedId)?.order ?? Number.POSITIVE_INFINITY

  if (leftOrder !== rightOrder) {
    return leftOrder - rightOrder
  }

  return compareBedIds(leftPatient.bedId, rightPatient.bedId)
}

export function formatVisitDaySummary(
  admittedDays: number,
  postOpDays: number | null
): string {
  return `y:${admittedDays}/po:${postOpDays ?? "-"}`
}

export function buildVisitSheetEntries({
  getFullPatientName,
  patients,
  wardLayout,
}: BuildVisitSheetEntriesArgs): VisitSheetEntry[] {
  const bedMetadata = buildWardBedMetadata(wardLayout)

  return [...patients]
    .sort((leftPatient, rightPatient) =>
      comparePatients(leftPatient, rightPatient, bedMetadata)
    )
    .map((patient) => {
      const clinicalDays = calculateClinicalDays(
        patient.admissionDate,
        patient.surgeryDate
      )

      return {
        bedDisplay: bedMetadata.get(patient.bedId)?.bedDisplay ?? patient.bedId,
        bedId: patient.bedId,
        daySummary: formatVisitDaySummary(
          clinicalDays.admittedDays,
          clinicalDays.postOpDays
        ),
        diagnosis: patient.diagnosis,
        fullName: getFullPatientName(patient.initials, patient.bedId),
        id: patient._id,
        initials: patient.initials,
      }
    })
}
