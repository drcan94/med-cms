import {
  PATIENT_ERR_BED_REQUIRED,
  PATIENT_ERR_IDENTIFIER_CODE_INVALID,
  PATIENT_ERR_ORGANIZATION_REQUIRED,
} from "@/lib/patient-validation-codes"

/**
 * Maps Convex patient mutation errors to PatientSheet copy. Returns null when the
 * message should fall back to a generic save error (avoid surfacing raw English).
 */
export function mapPatientMutationErrorDescription(
  error: Error,
  t: (key: string) => string
): string | null {
  switch (error.message) {
    case "TRIAL_LIMIT_REACHED":
      return t("toasts.trialLimitReached")
    case PATIENT_ERR_ORGANIZATION_REQUIRED:
      return t("toasts.organizationRequired")
    case PATIENT_ERR_BED_REQUIRED:
      return t("toasts.bedRequired")
    case PATIENT_ERR_IDENTIFIER_CODE_INVALID:
      return t("toasts.invalidIdentifierCode")
    case "That bed is already assigned to another patient.":
      return t("toasts.bedOccupied")
    case "Patient record not found.":
      return t("toasts.notFound")
    case "You cannot update a patient outside your organization.":
      return t("toasts.crossOrganization")
    default:
      return null
  }
}

export function resolvePatientSheetErrorMessage(
  error: unknown,
  t: (key: string) => string
): string {
  if (!(error instanceof Error)) {
    return t("toasts.saveError")
  }
  const mapped = mapPatientMutationErrorDescription(error, t)
  return mapped ?? t("toasts.saveError")
}
