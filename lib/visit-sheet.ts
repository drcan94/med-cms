import type { Doc } from "@/convex/_generated/dataModel"
import { calculateClinicalDays } from "@/hooks/useClinicalDates"
import type { WardRoom } from "@/lib/clinic-settings"
import { buildWardBedMetadata } from "@/lib/ward-layout"

type PatientRecord = Doc<"patients">

type BuildVisitSheetEntriesArgs = {
  getFullPatientName: (
    initials: string,
    bedId: string,
    patientId?: PatientRecord["_id"]
  ) => string
  patients: PatientRecord[]
  wardLayout: WardRoom[]
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

      return {
        bedDisplay: bedMetadata.get(patient.bedId)?.bedDisplay ?? patient.bedId,
        bedId: patient.bedId,
        daySummary: formatVisitDaySummary(
          clinicalDays.admittedDays,
          clinicalDays.postOpDays
        ),
        diagnosis: patient.diagnosis,
        fullName: getFullPatientName(patient.initials, patient.bedId, patient._id),
        id: patient._id,
        initials: patient.initials,
      }
    })
}
