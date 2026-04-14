import { z } from "zod"

/**
 * Zod schemas mirroring Convex clinical validators.
 * These enable client-side validation before mutation calls.
 */

export const symptomsSchema = z.object({
  // Constitutional
  fever: z.boolean().optional(),
  weightLoss: z.boolean().optional(),
  nightSweats: z.boolean().optional(),
  fatigue: z.boolean().optional(),

  // Respiratory
  cough: z.boolean().optional(),
  sputum: z.boolean().optional(),
  hemoptysis: z.boolean().optional(),
  dyspneaExertion: z.boolean().optional(),
  dyspneaRest: z.boolean().optional(),
  orthopnea: z.boolean().optional(),
  wheezing: z.boolean().optional(),

  // Cardiac
  chestPain: z.boolean().optional(),
  palpitation: z.boolean().optional(),
  syncope: z.boolean().optional(),
  legEdema: z.boolean().optional(),

  // Gastrointestinal
  dysphagia: z.boolean().optional(),
  pyrosis: z.boolean().optional(),
  nauseaVomiting: z.boolean().optional(),
  abdominalPain: z.boolean().optional(),
  constipationDiarrhea: z.boolean().optional(),

  // Genitourinary
  hematuria: z.boolean().optional(),
  dysuria: z.boolean().optional(),
  frequentUrination: z.boolean().optional(),

  // Other
  hoarseness: z.boolean().optional(),
  jointPain: z.boolean().optional(),
  alteredConsciousness: z.boolean().optional(),
})

export const vitalsSchema = z.object({
  temperature: z.number().min(30).max(45),
  bloodPressure: z.string(),
  pulse: z.number().min(20).max(300),
  spO2: z.number().min(0).max(100),
  symptoms: symptomsSchema,
  recordedAt: z.string().optional(),
})

export const aaGradientResultSchema = z.object({
  estimatedFiO2: z.number(),
  pAO2: z.number(),
  gradient: z.number(),
  expectedGradient: z.number(),
  isElevated: z.boolean(),
  etiology: z.enum(["intrinsic", "extrinsic"]),
  clinicalInterpretation: z.string(),
})

export const aaGradientSchema = z.object({
  age: z.number().min(0).max(120),
  paO2: z.number().min(0),
  paCO2: z.number().min(0),
  fio2: z.number().min(0.21).max(1).optional(),
  o2Liters: z.number().min(0).max(25).optional(),
  patm: z.number().min(300).max(900).optional(),
  waterVaporPressure: z.number().min(0).max(100).optional(),
  result: aaGradientResultSchema.optional(),
})

export const smokingHistorySchema = z.object({
  status: z.enum(["active", "former", "never"]),
  packYears: z.number().min(0).optional(),
})

export const anamnesisSchema = z.object({
  chiefComplaint: z.string().min(1, "Chief complaint is required"),
  historyOfPresentIllness: z.string(),
  knownDiseases: z.array(z.string()),
  pastSurgeries: z.array(z.string()),
  allergies: z.array(z.string()).optional(),
  regularMedications: z.array(z.string()).optional(),
  smoking: smokingHistorySchema.optional(),
})

export const oncologyTreatmentSchema = z.object({
  received: z.boolean().optional(),
  lastSessionAt: z.string().optional(),
  details: z.string().optional(),
})

export const oncologyHistorySchema = z.object({
  chemotherapy: oncologyTreatmentSchema.optional(),
  radiotherapy: oncologyTreatmentSchema.optional(),
})

export const anticoagulantEntrySchema = z.object({
  name: z.string().min(1, "Medication name is required"),
  lastDoseAt: z.string(),
})

export const antidiabeticEntrySchema = z.object({
  type: z.enum(["oral", "insulin"]),
  name: z.string().min(1, "Medication name is required"),
  lastDoseAt: z.string(),
})

export const criticalMedicationSchema = z.object({
  anticoagulants: z.array(anticoagulantEntrySchema).optional(),
  antidiabetics: z.array(antidiabeticEntrySchema).optional(),
})

export const dailyDrainageEntrySchema = z.object({
  date: z.string(),
  amount: z.number().min(0),
})

export const interventionComplicationSchema = z.object({
  occurred: z.boolean(),
  description: z.string().optional(),
})

export const pleurodesisProcedureSchema = z.object({
  performed: z.boolean(),
  description: z.string().optional(),
})

export const thoracicInterventionSchema = z.object({
  id: z.string(),
  type: z.enum(["chest_tube", "drain"]),
  side: z.enum(["right", "left", "bilateral"]),
  indication: z.string().min(1, "Indication is required"),
  size: z.string().min(1, "Size is required (e.g., 28F)"),
  insertionDate: z.string().min(1, "Insertion date is required"),
  removalDate: z.string().optional(),
  usedUltrasound: z.boolean().optional(),
  cytologySent: z.boolean().optional(),
  insertedByYear: z.number().optional(),
  dailyDrainage: z.array(dailyDrainageEntrySchema),
  complication: interventionComplicationSchema,
  pleurodesis: pleurodesisProcedureSchema,
})

export const labCultureSchema = z.object({
  id: z.string(),
  type: z.enum([
    "blood_culture",
    "urine_culture",
    "sputum_culture",
    "fluid_culture",
    "fluid_biochemistry",
    "cytology",
  ]),
  status: z.enum(["ordered", "resulted", "printed"]),
  orderedAt: z.string(),
  resultedAt: z.string().optional(),
  printedAt: z.string().optional(),
  result: z.string().optional(),
})

export const consultationRecommendationSchema = z.object({
  text: z.string(),
  completed: z.boolean(),
  completedAt: z.string().optional(),
})

export const consultationSchema = z.object({
  id: z.string(),
  department: z.string().min(1, "Department is required"),
  reason: z.string().min(1, "Reason is required"),
  status: z.enum(["pending", "seen"]),
  requestedAt: z.string(),
  seenAt: z.string().optional(),
  recommendations: z.array(consultationRecommendationSchema),
  resultPrinted: z.boolean().optional(),
})

export const antibioticSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Antibiotic name is required"),
  startedAt: z.string(),
  stoppedAt: z.string().optional(),
})

export const reportsSchema = z.object({
  sft: z.string().optional(),
  pet: z.string().optional(),
  pathology: z.string().optional(),
  endoscopy: z.string().optional(),
  surgeryNotes: z.string().optional(),
})

export const externalWardSchema = z.object({
  wardName: z.string().min(1, "Ward name is required"),
  wardPhone: z.string().optional(),
})

export const visitNoteSchema = z.object({
  id: z.string(),
  content: z.string().min(1, "Note content is required"),
  createdAt: z.string(),
  createdBy: z.string(),
})

/**
 * Main patient form schema combining all clinical sections.
 * Basic fields remain required; clinical fields are optional.
 */
export const patientFormSchema = z.object({
  fullName: z.string(),
  identifierCode: z.string(),
  bedId: z.string(),
  serviceName: z.string().optional(),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  admissionDate: z.string().min(1, "Admission date is required"),
  surgeryDate: z.string().optional(),
  procedureName: z.string().optional(),
  gender: z.enum(["male", "female"]).optional(),
  isPregnant: z.boolean().optional(),
  version: z.number().optional(),
  anamnesis: anamnesisSchema.optional(),
  vitals: vitalsSchema.optional(),
  aaGradient: aaGradientSchema.optional(),
  criticalMedications: criticalMedicationSchema.optional(),
  oncologyHistory: oncologyHistorySchema.optional(),
  reports: reportsSchema.optional(),
  externalWard: externalWardSchema.optional(),
  thoracicInterventions: z.array(thoracicInterventionSchema).optional(),
  labCultures: z.array(labCultureSchema).optional(),
  consultations: z.array(consultationSchema).optional(),
  antibiotics: z.array(antibioticSchema).optional(),
  visitNotes: z.array(visitNoteSchema).optional(),
})

export type PatientFormData = z.infer<typeof patientFormSchema>
export type ThoracicIntervention = z.infer<typeof thoracicInterventionSchema>
export type Vitals = z.infer<typeof vitalsSchema>
export type AaGradient = z.infer<typeof aaGradientSchema>
export type AaGradientResult = z.infer<typeof aaGradientResultSchema>
export type Anamnesis = z.infer<typeof anamnesisSchema>
export type SmokingHistory = z.infer<typeof smokingHistorySchema>
export type CriticalMedication = z.infer<typeof criticalMedicationSchema>
export type AnticoagulantEntry = z.infer<typeof anticoagulantEntrySchema>
export type AntidiabeticEntry = z.infer<typeof antidiabeticEntrySchema>
export type OncologyHistory = z.infer<typeof oncologyHistorySchema>
export type OncologyTreatment = z.infer<typeof oncologyTreatmentSchema>
export type LabCulture = z.infer<typeof labCultureSchema>
export type Consultation = z.infer<typeof consultationSchema>
export type Antibiotic = z.infer<typeof antibioticSchema>
