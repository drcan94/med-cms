import { format, formatISO, isValid, parseISO } from "date-fns"

import type { Doc } from "@/convex/_generated/dataModel"
import { STAGING_BED_ID } from "@/lib/patient-privacy"

type PatientRecord = Doc<"patients">

export type PatientFormState = {
  admissionDate: string
  bedId: string
  diagnosis: string
  fullName: string
  initials: string
  serviceName: string
  surgeryDate: string
}

export function formatDateForInput(value?: string): string {
  if (!value) {
    return ""
  }

  const parsedDate = parseISO(value)
  return isValid(parsedDate) ? format(parsedDate, "yyyy-MM-dd") : ""
}

export function toClinicalIsoDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number)
  return formatISO(new Date(year, month - 1, day, 0, 0, 0))
}

export function getInitialPatientFormState(
  patient: PatientRecord | null,
  fullName = ""
): PatientFormState {
  return {
    admissionDate: formatDateForInput(patient?.admissionDate),
    bedId: patient?.bedId === STAGING_BED_ID ? "" : (patient?.bedId ?? ""),
    diagnosis: patient?.diagnosis ?? "",
    fullName,
    initials: patient?.initials ?? "",
    serviceName: patient?.serviceName ?? "",
    surgeryDate: formatDateForInput(patient?.surgeryDate),
  }
}
