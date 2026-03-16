import { buildPatientIdentityKey } from "@/lib/patient-identity"

export type LocalRoster = Record<string, string>
type CsvRow = Record<string, string | undefined>

const BED_HEADER_KEYS = ["bednumber", "bed", "bedid"] as const
const IDENTIFIER_HEADER_KEYS = [
  "identifiercode",
  "identifier",
  "last4",
  "lastfour",
  "mrnlast4",
] as const
const INITIALS_HEADER_KEYS = ["patientinitials", "initials"] as const
const PATIENT_HEADER_KEYS = ["patientname", "fullname", "name"] as const

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "")
}

function matchesHeader(field: string, candidates: readonly string[]): boolean {
  return candidates.includes(normalizeHeader(field))
}

function readCsvCell(row: CsvRow, candidates: readonly string[]): string | undefined {
  const matchingEntry = Object.entries(row).find(([key]) =>
    matchesHeader(key, candidates)
  )

  if (!matchingEntry || typeof matchingEntry[1] !== "string") {
    return undefined
  }

  const normalizedValue = matchingEntry[1].trim()
  return normalizedValue.length > 0 ? normalizedValue : undefined
}

export function buildRosterFromCsv(rows: CsvRow[], fields: string[]): LocalRoster {
  const hasBedHeader = fields.some((field) => matchesHeader(field, BED_HEADER_KEYS))
  const hasIdentifierHeader = fields.some((field) =>
    matchesHeader(field, IDENTIFIER_HEADER_KEYS)
  )
  const hasInitialsHeader = fields.some((field) =>
    matchesHeader(field, INITIALS_HEADER_KEYS)
  )
  const hasPatientHeader = fields.some((field) =>
    matchesHeader(field, PATIENT_HEADER_KEYS)
  )

  if (!hasPatientHeader || (!hasBedHeader && !(hasInitialsHeader && hasIdentifierHeader))) {
    throw new Error(
      'CSV must include "Patient Name" plus either "Bed Number" or both "Initials" and "Identifier Code" columns.'
    )
  }

  const roster = rows.reduce<LocalRoster>((mapping, row) => {
    const bedId = readCsvCell(row, BED_HEADER_KEYS)
    const identifierCode = readCsvCell(row, IDENTIFIER_HEADER_KEYS)
    const initials = readCsvCell(row, INITIALS_HEADER_KEYS)
    const fullName = readCsvCell(row, PATIENT_HEADER_KEYS)
    const patientIdentityKey =
      initials && identifierCode
        ? buildPatientIdentityKey(initials, identifierCode)
        : null

    if (bedId && fullName) {
      mapping[bedId] = fullName
    }

    if (patientIdentityKey && fullName) {
      mapping[patientIdentityKey] = fullName
    }

    return mapping
  }, {})

  if (Object.keys(roster).length === 0) {
    throw new Error("No valid patient rows were found in the uploaded CSV.")
  }

  return roster
}
