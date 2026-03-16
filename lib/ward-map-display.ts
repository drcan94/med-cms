import type { WardBedMetadata } from "@/lib/ward-layout"
import { STAGING_BED_ID } from "@/lib/patient-privacy"

type WardMapTranslator = (key: string, values?: Record<string, string | number>) => string

export function getWardMapBedDisplayLabel(
  bedId: string,
  bedMetadata: Map<string, WardBedMetadata>,
  t: WardMapTranslator
): string {
  if (bedId === STAGING_BED_ID) {
    return t("staging")
  }

  const bed = bedMetadata.get(bedId)
  if (!bed) {
    return bedId
  }

  const bedLabel = t("bedLabel", { number: bed.bedNumber })
  return bed.roomName.trim() ? `${bed.roomName} - ${bedLabel}` : bedLabel
}

export function resolveWardMapErrorMessage(
  error: unknown,
  t: WardMapTranslator
): string {
  if (!(error instanceof Error)) {
    return t("toasts.moveError")
  }

  switch (error.message) {
    case "That bed is already assigned to another patient.":
      return t("toasts.occupied")
    case "Patient record not found.":
      return t("toasts.notFound")
    case "You cannot move a patient outside your organization.":
      return t("toasts.crossOrganization")
    default:
      return error.message
  }
}
