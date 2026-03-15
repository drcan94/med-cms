export type ConventionSourceField = "diagnosis" | "surgery"

export type ConventionRule = {
  checklistItem: string
  id: string
  matchValue: string
  operator: "contains"
  sourceField: ConventionSourceField
}

export type ConventionsFormValues = {
  rules: ConventionRule[]
}

export type WardRoom = {
  bedCapacity: number
  bedIds?: string[]
  roomId: string
  roomName: string
}

export type ClinicSettingsRecord = {
  conventions: ConventionRule[] | string
  organizationId: string
  wardLayout: WardRoom[]
}

export const CONVENTION_SOURCE_OPTIONS: Array<{
  description: string
  label: string
  value: ConventionSourceField
}> = [
  {
    description: "Match against the diagnosis text.",
    label: "Diagnosis",
    value: "diagnosis",
  },
  {
    description: "Match against surgery notes or labels.",
    label: "Surgery",
    value: "surgery",
  },
]

function createRuleId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID()
  }

  return `rule-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeConventionRule(rule: ConventionRule): ConventionRule {
  return {
    checklistItem: rule.checklistItem.trim(),
    id: rule.id.trim(),
    matchValue: rule.matchValue.trim(),
    operator: "contains",
    sourceField: rule.sourceField,
  }
}

function isConventionRule(value: unknown): value is ConventionRule {
  if (typeof value !== "object" || value === null) {
    return false
  }

  const candidate = value as Record<string, unknown>

  return (
    typeof candidate.id === "string" &&
    (candidate.sourceField === "diagnosis" || candidate.sourceField === "surgery") &&
    candidate.operator === "contains" &&
    typeof candidate.matchValue === "string" &&
    typeof candidate.checklistItem === "string"
  )
}

export function createEmptyConventionRule(): ConventionRule {
  return {
    checklistItem: "",
    id: createRuleId(),
    matchValue: "",
    operator: "contains",
    sourceField: "diagnosis",
  }
}

export function parseConventionRules(
  conventions: ClinicSettingsRecord["conventions"] | undefined
): ConventionRule[] {
  if (Array.isArray(conventions)) {
    return conventions.map(normalizeConventionRule)
  }

  if (!conventions) {
    return []
  }

  try {
    const parsedValue: unknown = JSON.parse(conventions)

    if (!Array.isArray(parsedValue)) {
      return []
    }

    return parsedValue
      .filter(isConventionRule)
      .map((rule) => normalizeConventionRule(rule))
  } catch {
    return []
  }
}

export function serializeConventionRules(rules: ConventionRule[]): ConventionRule[] {
  return rules.map(normalizeConventionRule)
}

export function getTotalBedCapacity(wardLayout: WardRoom[]): number {
  return wardLayout.reduce((total, room) => total + room.bedCapacity, 0)
}
