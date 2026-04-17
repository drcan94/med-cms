import { PATIENT_ERR_IDENTIFIER_CODE_INVALID } from "./patient-validation-codes"

export const IDENTIFIER_CODE_LENGTH = 6
const IDENTIFIER_CODE_PATTERN = /^[A-Z0-9]{6}$/
const IDENTIFIER_CODE_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"

export function normalizeIdentifierCode(value: string): string {
  return value.trim().toUpperCase()
}

export function sanitizeIdentifierCodeInput(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, IDENTIFIER_CODE_LENGTH)
}

export function isValidIdentifierCode(value: string): boolean {
  return IDENTIFIER_CODE_PATTERN.test(normalizeIdentifierCode(value))
}

export function requireIdentifierCode(value: string): string {
  const normalizedValue = normalizeIdentifierCode(value)

  if (!IDENTIFIER_CODE_PATTERN.test(normalizedValue)) {
    throw new Error(PATIENT_ERR_IDENTIFIER_CODE_INVALID)
  }

  return normalizedValue
}

/** Random 6-character code for draft patients when the client omits or sends an invalid code. */
export function generateDraftIdentifierCode(): string {
  let out = ""
  for (let i = 0; i < IDENTIFIER_CODE_LENGTH; i++) {
    out +=
      IDENTIFIER_CODE_ALPHABET[
        Math.floor(Math.random() * IDENTIFIER_CODE_ALPHABET.length)
      ]
  }
  return out
}

/** Use a valid 6-character code if present; otherwise allocate a draft code (live auto-save). */
export function resolveIdentifierCodeForInsert(value: string | undefined): string {
  if (value === undefined || value.trim() === "") {
    return generateDraftIdentifierCode()
  }
  const normalized = normalizeIdentifierCode(value)
  if (isValidIdentifierCode(normalized)) {
    return normalized
  }
  return generateDraftIdentifierCode()
}

/**
 * Staged patients all share the same placeholder bed, so browser-local full-name
 * lookups need a second discriminator beyond `bedId`. Pairing masked initials with
 * the 6-character identifier keeps the matching key de-identified but stable.
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
