import { v } from "convex/values"

/**
 * Thoracic Surgery Clinical Data Validators
 * All validators are designed for optional use in the patients schema.
 */

export const smokingHistoryValidator = v.object({
  status: v.union(v.literal("active"), v.literal("former"), v.literal("never")),
  packYears: v.optional(v.number()),
})

export const anamnesisValidator = v.object({
  chiefComplaint: v.string(),
  historyOfPresentIllness: v.string(),
  knownDiseases: v.array(v.string()),
  pastSurgeries: v.array(v.string()),
  allergies: v.optional(v.array(v.string())),
  regularMedications: v.optional(v.array(v.string())),
  smoking: v.optional(smokingHistoryValidator),
})

export const oncologyHistoryValidator = v.object({
  chemotherapy: v.optional(
    v.object({
      received: v.boolean(),
      lastSessionAt: v.optional(v.string()),
      details: v.optional(v.string()),
    })
  ),
  radiotherapy: v.optional(
    v.object({
      received: v.boolean(),
      lastSessionAt: v.optional(v.string()),
      details: v.optional(v.string()),
    })
  ),
})

export const symptomsValidator = v.object({
  // Constitutional
  fever: v.optional(v.boolean()),
  weightLoss: v.optional(v.boolean()),
  nightSweats: v.optional(v.boolean()),
  fatigue: v.optional(v.boolean()),

  // Respiratory
  cough: v.optional(v.boolean()),
  sputum: v.optional(v.boolean()),
  hemoptysis: v.optional(v.boolean()),
  dyspneaExertion: v.optional(v.boolean()),
  dyspneaRest: v.optional(v.boolean()),
  orthopnea: v.optional(v.boolean()),
  wheezing: v.optional(v.boolean()),

  // Cardiac
  chestPain: v.optional(v.boolean()),
  palpitation: v.optional(v.boolean()),
  syncope: v.optional(v.boolean()),
  legEdema: v.optional(v.boolean()),

  // Gastrointestinal
  dysphagia: v.optional(v.boolean()),
  pyrosis: v.optional(v.boolean()),
  nauseaVomiting: v.optional(v.boolean()),
  abdominalPain: v.optional(v.boolean()),
  constipationDiarrhea: v.optional(v.boolean()),

  // Genitourinary
  hematuria: v.optional(v.boolean()),
  dysuria: v.optional(v.boolean()),
  frequentUrination: v.optional(v.boolean()),

  // Other
  hoarseness: v.optional(v.boolean()),
  jointPain: v.optional(v.boolean()),
  alteredConsciousness: v.optional(v.boolean()),
})

export const vitalsValidator = v.object({
  temperature: v.number(),
  bloodPressure: v.string(),
  pulse: v.number(),
  spO2: v.number(),
  symptoms: symptomsValidator,
  recordedAt: v.string(),
})

export const criticalMedicationValidator = v.object({
  anticoagulants: v.optional(
    v.array(
      v.object({
        name: v.string(),
        lastDoseAt: v.string(),
      })
    )
  ),
  antidiabetics: v.optional(
    v.array(
      v.object({
        type: v.union(v.literal("oral"), v.literal("insulin")),
        name: v.string(),
        lastDoseAt: v.string(),
      })
    )
  ),
})

export const reportsValidator = v.object({
  sft: v.optional(v.string()),
  pet: v.optional(v.string()),
  pathology: v.optional(v.string()),
  endoscopy: v.optional(v.string()),
  surgeryNotes: v.optional(v.string()),
})

export const externalWardValidator = v.object({
  wardName: v.string(),
  wardPhone: v.optional(v.string()),
})

const dailyDrainageEntryValidator = v.object({
  date: v.string(),
  amount: v.number(),
})

const interventionComplicationValidator = v.object({
  occurred: v.boolean(),
  description: v.optional(v.string()),
})

const pleurodesisProcedureValidator = v.object({
  performed: v.boolean(),
  description: v.optional(v.string()),
})

export const thoracicInterventionValidator = v.object({
  id: v.string(),
  type: v.union(v.literal("chest_tube"), v.literal("drain")),
  side: v.union(v.literal("right"), v.literal("left"), v.literal("bilateral")),
  indication: v.string(),
  size: v.string(),
  insertionDate: v.string(),
  removalDate: v.optional(v.string()),
  usedUltrasound: v.optional(v.boolean()),
  cytologySent: v.optional(v.boolean()),
  insertedByYear: v.optional(v.number()),
  dailyDrainage: v.array(dailyDrainageEntryValidator),
  complication: interventionComplicationValidator,
  pleurodesis: pleurodesisProcedureValidator,
})

const consultationRecommendationValidator = v.object({
  text: v.string(),
  completed: v.boolean(),
  completedAt: v.optional(v.string()),
})

export const labCultureValidator = v.object({
  id: v.string(),
  type: v.union(
    v.literal("blood_culture"),
    v.literal("urine_culture"),
    v.literal("sputum_culture"),
    v.literal("fluid_culture"),
    v.literal("fluid_biochemistry"),
    v.literal("cytology")
  ),
  status: v.union(
    v.literal("ordered"),
    v.literal("resulted"),
    v.literal("printed")
  ),
  orderedAt: v.string(),
  resultedAt: v.optional(v.string()),
  printedAt: v.optional(v.string()),
  result: v.optional(v.string()),
})

export const consultationValidator = v.object({
  id: v.string(),
  department: v.string(),
  reason: v.string(),
  status: v.union(v.literal("pending"), v.literal("seen")),
  requestedAt: v.string(),
  seenAt: v.optional(v.string()),
  recommendations: v.array(consultationRecommendationValidator),
  resultPrinted: v.optional(v.boolean()),
})

export const antibioticValidator = v.object({
  id: v.string(),
  name: v.string(),
  startedAt: v.string(),
  stoppedAt: v.optional(v.string()),
})

export const visitNoteValidator = v.object({
  id: v.string(),
  content: v.string(),
  createdAt: v.string(),
  createdBy: v.string(),
})
