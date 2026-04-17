import type { Doc } from "./_generated/dataModel"
import {
  requireIdentifierCode,
  resolveIdentifierCodeForInsert,
} from "../lib/patient-identity"
import { STAGING_BED_ID } from "../lib/patient-privacy"

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
  | "procedureName"
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
  procedureName?: string
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
  const procedureName = args.procedureName?.trim()
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
    procedureName: procedureName || undefined,
    serviceName: serviceName || undefined,
  }
}

/** Writable core fields for a newly inserted patient; allows drafts and minimal payloads. */
export function sanitizeNewPatientFields(args: {
  organizationId: string
  initials?: string
  identifierCode?: string
  bedId?: string
  diagnosis?: string
  admissionDate?: string
  surgeryDate?: string
  procedureName?: string
  serviceName?: string
}): WritablePatientFields {
  const surgeryDate = args.surgeryDate?.trim()
  const procedureName = args.procedureName?.trim()
  const serviceName = args.serviceName?.trim()

  const initials =
    args.initials !== undefined && args.initials.trim() !== ""
      ? requireText(args.initials, "Patient initials")
      : "—"

  const bedId =
    args.bedId !== undefined && args.bedId.trim() !== ""
      ? requireText(args.bedId, "Bed")
      : STAGING_BED_ID

  const diagnosis =
    args.diagnosis !== undefined && args.diagnosis.trim() !== ""
      ? requireText(args.diagnosis, "Diagnosis")
      : "Pending"

  const admissionDate =
    args.admissionDate !== undefined && args.admissionDate.trim() !== ""
      ? requireText(args.admissionDate, "Admission date")
      : new Date().toISOString().slice(0, 10)

  return {
    organizationId: requireText(args.organizationId, "Organization"),
    initials,
    identifierCode: resolveIdentifierCodeForInsert(args.identifierCode),
    bedId,
    diagnosis,
    admissionDate,
    surgeryDate: surgeryDate || undefined,
    procedureName: procedureName || undefined,
    serviceName: serviceName || undefined,
  }
}
