import type { ConventionRule } from "@/lib/clinic-settings"

/**
 * Subset of persisted patient fields used for convention matching.
 * Surgery rules use the stored ISO `surgeryDate` string (procedure keywords belong in diagnosis until a dedicated surgery-notes field exists).
 */
export type RuleEvaluationPatient = {
  diagnosis: string
  surgeryDate?: string | null
}

function fieldHaystack(
  sourceField: ConventionRule["sourceField"],
  patient: RuleEvaluationPatient
): string {
  if (sourceField === "diagnosis") {
    return patient.diagnosis ?? ""
  }

  return patient.surgeryDate ?? ""
}

function containsIgnoreCase(haystack: string, needle: string): boolean {
  const normalizedNeedle = needle.trim().toLowerCase()

  if (!normalizedNeedle) {
    return false
  }

  return haystack.toLowerCase().includes(normalizedNeedle)
}

/**
 * Evaluates clinic If/Then rules against live patient text. Returns unique
 * `checklistItem` labels for every rule whose `contains` condition matches.
 */
export function evaluatePatientRules(
  patient: RuleEvaluationPatient,
  conventions: readonly ConventionRule[]
): string[] {
  const matched: string[] = []
  const seen = new Set<string>()

  for (const rule of conventions) {
    if (rule.operator !== "contains") {
      continue
    }

    const haystack = fieldHaystack(rule.sourceField, patient)

    if (!containsIgnoreCase(haystack, rule.matchValue)) {
      continue
    }

    const item = rule.checklistItem.trim()

    if (!item || seen.has(item)) {
      continue
    }

    seen.add(item)
    matched.push(item)
  }

  return matched
}
