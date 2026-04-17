import type { Doc } from "./_generated/dataModel"
import {
  requireIdentifierCode,
  resolveIdentifierCodeForInsert,
} from "../lib/patient-identity"
import {
  PATIENT_ERR_BED_REQUIRED,
  PATIENT_ERR_ORGANIZATION_REQUIRED,
} from "../lib/patient-validation-codes"
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

function normalizeStoredText(value: string | undefined): string {
  return (value ?? "").trim()
}

export function requireOrganizationId(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(PATIENT_ERR_ORGANIZATION_REQUIRED)
  }
  return trimmed
}

export function requireBedId(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) {
    throw new Error(PATIENT_ERR_BED_REQUIRED)
  }
  return trimmed
}

export function sanitizePatientFields(
  args: SanitizePatientFieldsArgs
): WritablePatientFields {
  const surgeryDate = args.surgeryDate?.trim()
  const procedureName = args.procedureName?.trim()
  const serviceName = args.serviceName?.trim()

  const organizationId = normalizeStoredText(args.organizationId)
  if (!organizationId) {
    throw new Error(PATIENT_ERR_ORGANIZATION_REQUIRED)
  }

  const bedId = normalizeStoredText(args.bedId)
  if (!bedId) {
    throw new Error(PATIENT_ERR_BED_REQUIRED)
  }

  return {
    organizationId,
    initials: normalizeStoredText(args.initials),
    identifierCode: requireIdentifierCode(args.identifierCode),
    bedId,
    diagnosis: normalizeStoredText(args.diagnosis),
    admissionDate: normalizeStoredText(args.admissionDate),
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

  const organizationId = normalizeStoredText(args.organizationId)
  if (!organizationId) {
    throw new Error(PATIENT_ERR_ORGANIZATION_REQUIRED)
  }

  const rawBed = normalizeStoredText(args.bedId)
  const bedId = rawBed || STAGING_BED_ID

  return {
    organizationId,
    initials: normalizeStoredText(args.initials),
    identifierCode: resolveIdentifierCodeForInsert(args.identifierCode),
    bedId,
    diagnosis: normalizeStoredText(args.diagnosis),
    admissionDate: normalizeStoredText(args.admissionDate),
    surgeryDate: surgeryDate || undefined,
    procedureName: procedureName || undefined,
    serviceName: serviceName || undefined,
  }
}
