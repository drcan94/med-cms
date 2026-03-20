import type { Doc } from "@/convex/_generated/dataModel"
import { calculateClinicalDays } from "@/hooks/useClinicalDates"
import type { WardRoom } from "@/lib/clinic-settings"
import { buildWardBedMetadata } from "@/lib/ward-layout"

type PatientRecord = Doc<"patients">
type PatientNameLookup = {
  bedId: string
  identifierCode: string
  initials: string
  patientId?: PatientRecord["_id"]
}

type BuildVisitSheetEntriesArgs = {
  getFullPatientName: (lookup: PatientNameLookup) => string
  patients: PatientRecord[]
  wardLayout: WardRoom[]
}

export type VisitSheetEntry = {
  bedDisplay: string
  bedId: string
  bedNumber?: number
  daySummary: string
  diagnosis: string
  fullName: string
  id: PatientRecord["_id"]
  initials: string
  roomBedCount?: number
  roomName?: string
}

function compareBedIds(leftBedId: string, rightBedId: string): number {
  return leftBedId.localeCompare(rightBedId, undefined, {
    numeric: true,
    sensitivity: "base",
  })
}

function comparePatients(
  leftPatient: PatientRecord,
  rightPatient: PatientRecord,
  bedMetadata: ReturnType<typeof buildWardBedMetadata>
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
      const bed = bedMetadata.get(patient.bedId)

      return {
        bedDisplay: bed?.bedDisplay ?? patient.bedId,
        bedId: patient.bedId,
        bedNumber: bed?.bedNumber,
        daySummary: formatVisitDaySummary(
          clinicalDays.admittedDays,
          clinicalDays.postOpDays
        ),
        diagnosis: patient.diagnosis,
        fullName: getFullPatientName({
          bedId: patient.bedId,
          identifierCode: patient.identifierCode,
          initials: patient.initials,
          patientId: patient._id,
        }),
        id: patient._id,
        initials: patient.initials,
        roomBedCount: bed?.roomBedCount,
        roomName: bed?.roomName,
      }
    })
}
