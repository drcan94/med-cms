export const STAGING_BED_ID = "STAGING"
export type PatientPrivacyLocale = "en" | "tr"

function normalizeWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, " ")
}

/**
 * Full names remain strictly browser-local. When Convex needs a patient label,
 * we collapse each name token to a masked first letter so the backend never
 * receives directly identifying text.
 */
export function generatePatientInitials(
  fullName: string,
  locale: PatientPrivacyLocale
): string {
  const normalizedFullName = normalizeWhitespace(fullName)

  return normalizedFullName
    .split(" ")
    .filter(Boolean)
    .map((token) => `${token.charAt(0).toLocaleUpperCase(locale)}***`)
    .join(" ")
}

export function normalizePatientFullName(fullName: string): string {
  return normalizeWhitespace(fullName)
}

export function formatPatientToastName(
  localFullName: string,
  fallbackInitials: string
): string {
  const normalizedFullName = normalizePatientFullName(localFullName)

  if (!normalizedFullName || normalizedFullName === fallbackInitials) {
    return fallbackInitials.trim()
  }

  const nameParts = normalizedFullName.split(" ")
  const firstName = nameParts[0]
  const familyName = nameParts.at(-1)

  if (!familyName || familyName === firstName) {
    return firstName
  }

  return `${firstName} ${familyName.charAt(0).toLocaleUpperCase()}.`
}
