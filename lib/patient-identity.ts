export const IDENTIFIER_CODE_LENGTH = 4
const IDENTIFIER_CODE_PATTERN = /^[A-Z0-9]{4}$/

export function normalizeIdentifierCode(value: string): string {
  return value.trim().toUpperCase()
}

export function sanitizeIdentifierCodeInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, IDENTIFIER_CODE_LENGTH)
}

export function isValidIdentifierCode(value: string): boolean {
  return IDENTIFIER_CODE_PATTERN.test(normalizeIdentifierCode(value))
}

export function requireIdentifierCode(
  value: string,
  fieldName = "Identifier code"
): string {
  const normalizedValue = normalizeIdentifierCode(value)

  if (!IDENTIFIER_CODE_PATTERN.test(normalizedValue)) {
    throw new Error(`${fieldName} must be exactly 4 letters or digits.`)
  }

  return normalizedValue
}

/**
 * Staged patients all share the same placeholder bed, so browser-local full-name
 * lookups need a second discriminator beyond `bedId`. Pairing masked initials with
 * the 4-character identifier keeps the matching key de-identified but stable.
 */
export function buildPatientIdentityKey(
  initials: string,
  identifierCode: string
): string | null {
  const normalizedInitials = initials.trim()

  if (!normalizedInitials) {
    return null
  }

  const normalizedIdentifierCode = normalizeIdentifierCode(identifierCode)
  return IDENTIFIER_CODE_PATTERN.test(normalizedIdentifierCode)
    ? `${normalizedInitials}::${normalizedIdentifierCode}`
    : null
}
