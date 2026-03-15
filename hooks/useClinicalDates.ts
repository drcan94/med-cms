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
 * Clinical day counters should follow the workstation's local calendar rather
 * than UTC midnight. Parsing ISO strings and comparing them against the local
 * start of today prevents off-by-one shifts when stored timestamps include a
 * timezone offset but clinicians still reason in local calendar days.
 */
export function calculateClinicalDays(
  admissionDate: string,
  surgeryDate?: string
): ClinicalDays {
  const today = startOfToday()
  const parsedAdmissionDate = parseClinicalDate(admissionDate)
  const admittedDays = parsedAdmissionDate
    ? Math.max(differenceInCalendarDays(today, parsedAdmissionDate), 0)
    : 0

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
