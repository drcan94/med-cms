export type LocalRoster = Record<string, string>
type CsvRow = Record<string, string | undefined>

const BED_HEADER_KEYS = ["bednumber", "bed", "bedid"] as const
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
  const hasPatientHeader = fields.some((field) =>
    matchesHeader(field, PATIENT_HEADER_KEYS)
  )

  if (!hasBedHeader || !hasPatientHeader) {
    throw new Error('CSV must include "Bed Number" and "Patient Name" columns.')
  }

  const roster = rows.reduce<LocalRoster>((mapping, row) => {
    const bedId = readCsvCell(row, BED_HEADER_KEYS)
    const fullName = readCsvCell(row, PATIENT_HEADER_KEYS)

    if (bedId && fullName) {
      mapping[bedId] = fullName
    }

    return mapping
  }, {})

  if (Object.keys(roster).length === 0) {
    throw new Error("No valid patient rows were found in the uploaded CSV.")
  }

  return roster
}
