import {
  differenceInCalendarDays,
  isValid,
  parseISO,
  startOfDay,
  startOfToday,
} from "date-fns"

export type ClinicalDays = {
  admittedDays: number
  postOpDays: number | null
}

function parseClinicalDate(value: string): Date | null {
  const parsedDate = parseISO(value)
  return isValid(parsedDate) ? startOfDay(parsedDate) : null
}

/**
 * Clinical day counters follow local calendar conventions:
 * - Admission day = Day 1 (not 0) — patient's first day in the ward
 * - Post-op day = Day 0 on surgery day — standard surgical notation (PO 0, PO 1, etc.)
 */
export function calculateClinicalDays(
  admissionDate: string,
  surgeryDate?: string
): ClinicalDays {
  const today = startOfToday()
  const parsedAdmissionDate = parseClinicalDate(admissionDate)
  const admittedDays = parsedAdmissionDate
    ? Math.max(differenceInCalendarDays(today, parsedAdmissionDate) + 1, 1)
    : 1

  if (!surgeryDate) {
    return {
      admittedDays,
      postOpDays: null,
    }
  }

  const parsedSurgeryDate = parseClinicalDate(surgeryDate)

  if (!parsedSurgeryDate) {
    return {
      admittedDays,
      postOpDays: null,
    }
  }

  const surgeryDifference = differenceInCalendarDays(today, parsedSurgeryDate)

  return {
    admittedDays,
    postOpDays: surgeryDifference >= 0 ? surgeryDifference : null,
  }
}
