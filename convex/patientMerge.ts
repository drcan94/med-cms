import type { Doc } from "./_generated/dataModel"

type PatientDoc = Doc<"patients">

function isMergeableObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

/**
 * Deep-merge plain objects; arrays and non-objects are replaced by the patch value.
 */
export function deepMergePlain<T extends Record<string, unknown>>(
  base: T | undefined,
  patch: Partial<T> | undefined
): T | undefined {
  if (patch === undefined) {
    return base
  }
  if (base === undefined) {
    return { ...patch } as T
  }
  const out = { ...base } as T
  for (const key of Object.keys(patch) as (keyof T)[]) {
    const patchValue = patch[key]
    if (patchValue === undefined) {
      continue
    }
    const baseValue = base[key]
    if (
      isMergeableObject(patchValue) &&
      isMergeableObject(baseValue as unknown)
    ) {
      out[key] = deepMergePlain(
        baseValue as Record<string, unknown>,
        patchValue as Record<string, unknown>
      ) as T[keyof T]
    } else {
      out[key] = patchValue as T[keyof T]
    }
  }
  return out
}

export type PatientUpsertPatch = {
  initials?: string
  identifierCode?: string
  bedId?: string
  diagnosis?: string
  admissionDate?: string
  surgeryDate?: string
  procedureName?: string
  serviceName?: string
  gender?: PatientDoc["gender"]
  isPregnant?: boolean
  anamnesis?: PatientDoc["anamnesis"]
  vitals?: PatientDoc["vitals"]
  aaGradient?: PatientDoc["aaGradient"]
  criticalMedications?: PatientDoc["criticalMedications"]
  oncologyHistory?: PatientDoc["oncologyHistory"]
  reports?: PatientDoc["reports"]
  externalWard?: PatientDoc["externalWard"]
  thoracicInterventions?: PatientDoc["thoracicInterventions"]
  labCultures?: PatientDoc["labCultures"]
  consultations?: PatientDoc["consultations"]
  antibiotics?: PatientDoc["antibiotics"]
  visitNotes?: PatientDoc["visitNotes"]
}

/**
 * Applies a partial client payload onto the current DB document using deep merge
 * for nested clinical objects and replacement for arrays.
 */
export function mergePatientFromPatch(
  existing: PatientDoc,
  patch: PatientUpsertPatch
): PatientDoc {
  const next: PatientDoc = { ...existing }

  const scalarKeys: (keyof PatientUpsertPatch)[] = [
    "initials",
    "identifierCode",
    "bedId",
    "diagnosis",
    "admissionDate",
    "surgeryDate",
    "procedureName",
    "serviceName",
    "gender",
    "isPregnant",
  ]
  for (const key of scalarKeys) {
    if (patch[key] !== undefined) {
      ;(next as Record<string, unknown>)[key as string] = patch[key]
    }
  }

  const deepMergeKeys: (keyof PatientUpsertPatch)[] = [
    "anamnesis",
    "vitals",
    "aaGradient",
    "criticalMedications",
    "oncologyHistory",
    "reports",
    "externalWard",
  ]
  for (const key of deepMergeKeys) {
    if (patch[key] !== undefined) {
      const merged = deepMergePlain(
        (existing[key] ?? undefined) as Record<string, unknown> | undefined,
        patch[key] as Record<string, unknown>
      )
      ;(next as Record<string, unknown>)[key as string] = merged
    }
  }

  const arrayReplaceKeys: (keyof PatientUpsertPatch)[] = [
    "thoracicInterventions",
    "labCultures",
    "consultations",
    "antibiotics",
    "visitNotes",
  ]
  for (const key of arrayReplaceKeys) {
    if (patch[key] !== undefined) {
      ;(next as Record<string, unknown>)[key as string] = patch[key]
    }
  }

  return next
}
