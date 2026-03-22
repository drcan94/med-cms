/**
 * Advanced Clinical Rule Engine
 *
 * A composable, type-safe rule engine for evaluating patient data
 * against complex clinical conditions.
 *
 * @example
 * import { evaluateClinicalRules, defaultClinicalRules } from "@/lib/clinical-rules"
 *
 * const result = evaluateClinicalRules(patient, defaultClinicalRules)
 * if (result.blocks.length > 0) {
 *   // Cannot save - show blocking errors
 * }
 */

export * from "./types"
export * from "./engine"
export { defaultClinicalRules, getEnabledRules, getRulesByType } from "./default-rules"
