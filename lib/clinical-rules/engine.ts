/**
 * Advanced Clinical Rule Engine - Evaluation Logic
 *
 * A pure, stateless TypeScript utility that evaluates patient data
 * against an array of complex JSON rules. Handles deeply nested
 * optional properties safely without throwing undefined errors.
 */

import type {
  ClinicalRule,
  CompositeCondition,
  RuleCondition,
  RuleEvaluationResult,
} from "./types"

/**
 * Safely resolves a nested field path from an object.
 * Returns undefined if any part of the path doesn't exist.
 *
 * @example
 * resolveField({ vitals: { temperature: 38.5 } }, "vitals.temperature") // 38.5
 * resolveField({ vitals: undefined }, "vitals.temperature") // undefined
 * resolveField({}, "vitals.temperature") // undefined
 */
export function resolveField(obj: unknown, path: string): unknown {
  if (obj === null || obj === undefined) {
    return undefined
  }

  const segments = path.split(".")
  let current: unknown = obj

  for (const segment of segments) {
    if (current === null || current === undefined) {
      return undefined
    }

    if (typeof current !== "object") {
      return undefined
    }

    const arrayMatch = segment.match(/^(\w+)\[(\d+)\]$/)
    if (arrayMatch) {
      const [, arrayName, indexStr] = arrayMatch
      const arr = (current as Record<string, unknown>)[arrayName]
      if (!Array.isArray(arr)) {
        return undefined
      }
      const index = parseInt(indexStr, 10)
      current = arr[index]
    } else {
      current = (current as Record<string, unknown>)[segment]
    }
  }

  return current
}

/**
 * Evaluates a single primitive condition against patient data.
 */
function evaluatePrimitiveCondition(patient: unknown, condition: RuleCondition): boolean {
  const fieldValue = resolveField(patient, condition.field)

  switch (condition.type) {
    case "contains": {
      if (typeof fieldValue !== "string") {
        return false
      }
      return fieldValue.toLowerCase().includes(condition.value.toLowerCase())
    }

    case "equals": {
      return fieldValue === condition.value
    }

    case "greaterThan": {
      if (typeof fieldValue !== "number") {
        return false
      }
      return fieldValue > condition.value
    }

    case "lessThan": {
      if (typeof fieldValue !== "number") {
        return false
      }
      return fieldValue < condition.value
    }

    case "timeSince": {
      if (typeof fieldValue !== "string") {
        return false
      }
      const fieldDate = new Date(fieldValue)
      if (isNaN(fieldDate.getTime())) {
        return false
      }
      const now = new Date()
      const diffMs = now.getTime() - fieldDate.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)

      if (condition.operator === "lt") {
        return diffHours < condition.hours
      } else {
        return diffHours > condition.hours
      }
    }

    case "exists": {
      return fieldValue !== undefined && fieldValue !== null
    }

    case "arrayLength": {
      if (!Array.isArray(fieldValue)) {
        return false
      }
      const len = fieldValue.length
      switch (condition.operator) {
        case "gt":
          return len > condition.value
        case "lt":
          return len < condition.value
        case "eq":
          return len === condition.value
        default:
          return false
      }
    }

    default: {
      const _exhaustiveCheck: never = condition
      return false
    }
  }
}

/**
 * Type guard to check if a condition is a CompositeCondition.
 */
function isCompositeCondition(
  condition: RuleCondition | CompositeCondition
): condition is CompositeCondition {
  return "operator" in condition
}

/**
 * Recursively evaluates a condition (primitive or composite) against patient data.
 */
function evaluateCondition(
  patient: unknown,
  condition: RuleCondition | CompositeCondition
): boolean {
  if (!isCompositeCondition(condition)) {
    return evaluatePrimitiveCondition(patient, condition)
  }

  switch (condition.operator) {
    case "AND": {
      return condition.conditions.every((c) => evaluateCondition(patient, c))
    }

    case "OR": {
      return condition.conditions.some((c) => evaluateCondition(patient, c))
    }

    case "NOT": {
      return !evaluateCondition(patient, condition.condition)
    }

    default: {
      const _exhaustiveCheck: never = condition
      return false
    }
  }
}

/**
 * Main entry point: evaluates a patient against an array of clinical rules.
 *
 * @param patient - The patient object to evaluate
 * @param rules - Array of clinical rules to check
 * @returns Object containing arrays of requirements, warnings, and blocks
 */
export function evaluateClinicalRules(
  patient: unknown,
  rules: ClinicalRule[]
): RuleEvaluationResult {
  const result: RuleEvaluationResult = {
    requirements: [],
    warnings: [],
    blocks: [],
  }

  for (const rule of rules) {
    if (!rule.enabled) {
      continue
    }

    const matches = evaluateCondition(patient, rule.condition)

    if (matches) {
      const entry = {
        id: rule.action.id,
        message: rule.action.message,
        ruleId: rule.id,
      }

      switch (rule.action.type) {
        case "require":
          result.requirements.push(entry)
          break
        case "warn":
          result.warnings.push(entry)
          break
        case "block":
          result.blocks.push(entry)
          break
      }
    }
  }

  return result
}

/**
 * Validates a patient and returns true if there are no blocking rules.
 */
export function isPatientValid(patient: unknown, rules: ClinicalRule[]): boolean {
  const result = evaluateClinicalRules(patient, rules)
  return result.blocks.length === 0
}

/**
 * Returns only the blocking messages for a patient.
 */
export function getBlockingMessages(patient: unknown, rules: ClinicalRule[]): string[] {
  const result = evaluateClinicalRules(patient, rules)
  return result.blocks.map((b) => b.message)
}
