/**
 * Advanced Clinical Rule Engine - Type Definitions
 *
 * This module defines the types for a flexible, composable rule system
 * that can evaluate complex conditions against patient data.
 */

export type ContainsCondition = {
  type: "contains"
  field: string
  value: string
}

export type EqualsCondition = {
  type: "equals"
  field: string
  value: string | number | boolean
}

export type ComparisonCondition = {
  type: "greaterThan" | "lessThan"
  field: string
  value: number
}

export type TimeSinceCondition = {
  type: "timeSince"
  field: string
  hours: number
  operator: "lt" | "gt"
}

export type ExistsCondition = {
  type: "exists"
  field: string
}

export type ArrayLengthCondition = {
  type: "arrayLength"
  field: string
  operator: "gt" | "lt" | "eq"
  value: number
}

export type ArraySomeCondition = {
  type: "arraySome"
  field: string
  itemCondition: {
    itemField: string
    operator: "equals" | "contains"
    value: string | number | boolean
  }
}

export type RuleCondition =
  | ContainsCondition
  | EqualsCondition
  | ComparisonCondition
  | TimeSinceCondition
  | ExistsCondition
  | ArrayLengthCondition
  | ArraySomeCondition

export type AndCondition = {
  operator: "AND"
  conditions: (RuleCondition | CompositeCondition)[]
}

export type OrCondition = {
  operator: "OR"
  conditions: (RuleCondition | CompositeCondition)[]
}

export type NotCondition = {
  operator: "NOT"
  condition: RuleCondition | CompositeCondition
}

export type CompositeCondition = AndCondition | OrCondition | NotCondition

export type RuleActionType = "require" | "warn" | "block"

export type RuleAction = {
  type: RuleActionType
  id: string
  message: string
}

export type ClinicalRule = {
  id: string
  name: string
  enabled: boolean
  description?: string
  condition: RuleCondition | CompositeCondition
  action: RuleAction
}

export type RuleEvaluationResult = {
  requirements: Array<{ id: string; message: string; ruleId: string }>
  warnings: Array<{ id: string; message: string; ruleId: string }>
  blocks: Array<{ id: string; message: string; ruleId: string }>
}

export type RuleMatch = {
  ruleId: string
  actionId: string
  message: string
}
