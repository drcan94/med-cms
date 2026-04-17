import {
  buildPatientIdentityKey,
  sanitizeIdentifierCodeInput,
} from "@/lib/patient-identity"
import { generatePatientInitials, type PatientPrivacyLocale } from "@/lib/patient-privacy"

export type LocalRoster = Record<string, string>
type CsvRow = Record<string, string | undefined>

export const CSV_ERROR_MISSING_COLUMNS = "CSV_MISSING_COLUMNS"
export const CSV_ERROR_NO_VALID_ROWS = "CSV_ERROR_NO_VALID_ROWS"

/** ASCII-normalize Turkish (and similar) headers so "İşlem No" matches `islemno`. */
export function normalizeCsvHeaderKey(value: string): string {
  return value
    .toLocaleLowerCase("tr-TR")
    .trim()
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ş/g, "s")
    .replace(/ı/g, "i")
    .replace(/i̇/g, "i")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]/g, "")
}

type ResolveColumnOptions = {
  /** Short tokens matched only by equality so `patient` does not grab `patientid`. */
  exactOnlyFor?: readonly string[]
}

/**
 * Pick the first column in `fields` whose normalized header matches the most specific
 * candidate first (longer / hospital-specific keys before generic ones like `name`).
 */
function resolveColumnKey(
  fields: string[],
  candidatesOrdered: readonly string[],
  options: ResolveColumnOptions = {}
): string | undefined {
  const exactOnly = new Set(options.exactOnlyFor ?? [])

  for (const candidate of candidatesOrdered) {
    if (exactOnly.has(candidate)) {
      const hit = fields.find((field) => normalizeCsvHeaderKey(field) === candidate)
      if (hit) {
        return hit
      }
      continue
    }

    const exactHit = fields.find((field) => normalizeCsvHeaderKey(field) === candidate)
    if (exactHit) {
      return exactHit
    }

    const fuzzyHit = fields.find((field) => {
      const n = normalizeCsvHeaderKey(field)
      return n.endsWith(candidate) || n.startsWith(candidate)
    })
    if (fuzzyHit) {
      return fuzzyHit
    }
  }
  return undefined
}

function readCsvCellByColumnKey(
  row: CsvRow,
  columnKey: string | undefined
): string | undefined {
  if (!columnKey) {
    return undefined
  }
  const raw = row[columnKey]
  if (typeof raw !== "string") {
    return undefined
  }
  const normalizedValue = raw.trim()
  return normalizedValue.length > 0 ? normalizedValue : undefined
}

/** Name / surname columns — most specific first to avoid grabbing the wrong field. */
const PATIENT_HEADER_CANDIDATES = [
  "hastaadi",
  "hastaname",
  "adsoyad",
  "adisoyadi",
  "patientname",
  "fullname",
  "name",
  "hasta",
  "patientname",
  "patient",
] as const

/** İşlem no / protocol — specific tokens before generic `id`. */
const IDENTIFIER_HEADER_CANDIDATES = [
  "islemno",
  "islem",
  "protokol",
  "protocol",
  "visitid",
  "transactionid",
  "ziyaretid",
  "dosyano",
  "mrn",
  "identifiercode",
  "identifier",
  "last6",
  "last4",
  "lastfour",
  "patientid",
  "hastaid",
  "id",
] as const

const BED_HEADER_CANDIDATES = ["bednumber", "bedno", "yatak", "bedid", "bed", "yatakno"] as const

const INITIALS_HEADER_CANDIDATES = ["patientinitials", "initials", "basharf"] as const

export type CsvRosterBuildResult = {
  bedRoster: LocalRoster
  patientRoster: LocalRoster
}

export function buildRosterFromCsv(
  rows: CsvRow[],
  fields: string[],
  locale: PatientPrivacyLocale
): CsvRosterBuildResult {
  const nameKey = resolveColumnKey(fields, PATIENT_HEADER_CANDIDATES, {
    exactOnlyFor: ["patient"],
  })
  const idKey = resolveColumnKey(fields, IDENTIFIER_HEADER_CANDIDATES)
  const bedKey = resolveColumnKey(fields, BED_HEADER_CANDIDATES)
  const initialsKey = resolveColumnKey(fields, INITIALS_HEADER_CANDIDATES)

  const hasName = Boolean(nameKey)
  const hasBed = Boolean(bedKey)
  const hasId = Boolean(idKey)
  const hasInitials = Boolean(initialsKey)

  const canBedMode = hasName && hasBed
  const canLegacyIdentityMode = hasName && hasId && hasInitials
  const canIslemMode = hasName && hasId && !hasInitials

  if (!canBedMode && !canLegacyIdentityMode && !canIslemMode) {
    throw new Error(CSV_ERROR_MISSING_COLUMNS)
  }

  const bedRoster: LocalRoster = {}
  const patientRoster: LocalRoster = {}

  for (const row of rows) {
    const fullName = nameKey ? readCsvCellByColumnKey(row, nameKey) : undefined
    if (!fullName) {
      continue
    }

    const bedId = bedKey ? readCsvCellByColumnKey(row, bedKey) : undefined
    if (canBedMode && bedId) {
      bedRoster[bedId.trim()] = fullName
    }

    const rawIdentifier = idKey ? readCsvCellByColumnKey(row, idKey) : undefined
    const identifierCode = rawIdentifier ? sanitizeIdentifierCodeInput(rawIdentifier) : ""

    if (identifierCode.length === 6) {
      if (canLegacyIdentityMode) {
        const initialsFromCsv = initialsKey
          ? readCsvCellByColumnKey(row, initialsKey)
          : undefined
        if (initialsFromCsv) {
          const identityKey = buildPatientIdentityKey(initialsFromCsv, identifierCode)
          if (identityKey) {
            patientRoster[identityKey] = fullName
          }
        }
      } else if (canIslemMode) {
        const initials = generatePatientInitials(fullName, locale)
        const identityKey = buildPatientIdentityKey(initials, identifierCode)
        if (identityKey) {
          patientRoster[identityKey] = fullName
        }
      }
    }
  }

  if (Object.keys(bedRoster).length === 0 && Object.keys(patientRoster).length === 0) {
    throw new Error(CSV_ERROR_NO_VALID_ROWS)
  }

  return { bedRoster, patientRoster }
}
