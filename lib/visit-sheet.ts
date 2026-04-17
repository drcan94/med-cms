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

export type ThoracicInterventionSummary = {
  id: string
  type: "chest_tube" | "drain"
  side: "right" | "left" | "bilateral"
  size: string
  dayCount: number
  latestDrainage?: number
  isActive: boolean
}

export type AntibioticSummary = {
  id: string
  name: string
  dayCount: number
  isActive: boolean
}

export type LabCultureSummary = {
  id: string
  type: string
  status: "ordered" | "resulted" | "printed"
}

export type VitalsSummary = {
  temperature?: number
  bloodPressure?: string
  pulse?: number
  spO2?: number
  isHypoxic: boolean
  isFebrile: boolean
  isTachycardic: boolean
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
  procedureName?: string
  vitals?: VitalsSummary
  interventions: ThoracicInterventionSummary[]
  antibiotics: AntibioticSummary[]
  pendingCultures: LabCultureSummary[]
  completedRequirements?: { item: string; completedAt: string }[]
  customTodos?: { id: string; text: string; completed: boolean; createdAt: string; completedAt?: string }[]
  identifierCode: string
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

function calculateDaysSince(isoDateString: string): number {
  const date = new Date(isoDateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

function buildVitalsSummary(
  vitals: PatientRecord["vitals"]
): VitalsSummary | undefined {
  if (!vitals) return undefined

  const spO2 = vitals.spO2
  const temperature = vitals.temperature
  const pulse = vitals.pulse

  return {
    temperature,
    bloodPressure: vitals.bloodPressure,
    pulse,
    spO2,
    isHypoxic: spO2 !== undefined && spO2 < 92,
    isFebrile: temperature !== undefined && temperature >= 38,
    isTachycardic: pulse !== undefined && pulse > 100,
  }
}

function buildInterventionSummaries(
  interventions?: PatientRecord["thoracicInterventions"]
): ThoracicInterventionSummary[] {
  if (!interventions) return []

  return interventions.map((intervention) => {
    const isActive = !intervention.removalDate
    const dayCount = calculateDaysSince(intervention.insertionDate) + 1
    const latestDrainage =
      intervention.dailyDrainage.length > 0
        ? intervention.dailyDrainage[intervention.dailyDrainage.length - 1].amount
        : undefined

    return {
      id: intervention.id,
      type: intervention.type,
      side: intervention.side,
      size: intervention.size,
      dayCount,
      latestDrainage,
      isActive,
    }
  })
}

function buildAntibioticSummaries(
  antibiotics?: PatientRecord["antibiotics"]
): AntibioticSummary[] {
  if (!antibiotics) return []

  return antibiotics.map((abx) => ({
    id: abx.id,
    name: abx.name,
    dayCount: calculateDaysSince(abx.startedAt) + 1,
    isActive: !abx.stoppedAt,
  }))
}

function buildPendingCultureSummaries(
  cultures?: PatientRecord["labCultures"]
): LabCultureSummary[] {
  if (!cultures) return []

  return cultures
    .filter((c) => c.status === "ordered")
    .map((culture) => ({
      id: culture.id,
      type: culture.type,
      status: culture.status,
    }))
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
        procedureName: patient.procedureName,
        vitals: buildVitalsSummary(patient.vitals),
        interventions: buildInterventionSummaries(patient.thoracicInterventions),
        antibiotics: buildAntibioticSummaries(patient.antibiotics),
        pendingCultures: buildPendingCultureSummaries(patient.labCultures),
        completedRequirements: patient.completedRequirements,
        customTodos: patient.customTodos,
        identifierCode: patient.identifierCode,
      }
    })
}
