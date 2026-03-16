import type { Doc } from "./_generated/dataModel"
import { requireIdentifierCode } from "../lib/patient-identity"

type PatientRecord = Doc<"patients">

export type WritablePatientFields = Pick<
  PatientRecord,
  | "organizationId"
  | "initials"
  | "identifierCode"
  | "bedId"
  | "diagnosis"
  | "admissionDate"
  | "surgeryDate"
  | "serviceName"
>

type SanitizePatientFieldsArgs = {
  organizationId: string
  initials: string
  identifierCode: string
  bedId: string
  diagnosis: string
  admissionDate: string
  surgeryDate?: string
  serviceName?: string
}

export function requireText(value: string, fieldName: string): string {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`)
  }

  return normalizedValue
}

export function sanitizePatientFields(
  args: SanitizePatientFieldsArgs
): WritablePatientFields {
  const surgeryDate = args.surgeryDate?.trim()
  const serviceName = args.serviceName?.trim()

  return {
    organizationId: requireText(args.organizationId, "Organization"),
    initials: requireText(args.initials, "Patient initials"),
    identifierCode: requireIdentifierCode(
      args.identifierCode,
      "Patient identifier code"
    ),
    bedId: requireText(args.bedId, "Bed"),
    diagnosis: requireText(args.diagnosis, "Diagnosis"),
    admissionDate: requireText(args.admissionDate, "Admission date"),
    surgeryDate: surgeryDate || undefined,
    serviceName: serviceName || undefined,
  }
}
