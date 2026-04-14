import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import {
  clinicConventionsValidator,
  defaultPatmMmHgValidator,
  wardRoomValidator,
} from "./clinicSettingsValidators"
import {
  aaGradientValidator,
  anamnesisValidator,
  antibioticValidator,
  consultationValidator,
  criticalMedicationValidator,
  externalWardValidator,
  labCultureValidator,
  oncologyHistoryValidator,
  reportsValidator,
  thoracicInterventionValidator,
  visitNoteValidator,
  vitalsValidator,
} from "./clinicalValidators"

/**
 * Convex adds `_id` and `_creationTime` to every document automatically.
 * Patient full names never enter this schema; only masked initials and a 6-character
 * identifier code are persisted for local disambiguation.
 */
export default defineSchema({
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"]),

  organizations: defineTable({
    clerkId: v.string(),
    name: v.string(),
    subscriptionStatus: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  organizationMemberships: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    role: v.string(),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_user_id", ["userId"])
    .index("by_org_and_user", ["organizationId", "userId"]),

  clinicSettings: defineTable({
    organizationId: v.string(),
    wardLayout: v.array(wardRoomValidator),
    conventions: clinicConventionsValidator,
    defaultPatmMmHg: v.optional(defaultPatmMmHgValidator),
  }).index("by_organization_id", ["organizationId"]),

  patients: defineTable({
    organizationId: v.string(),
    initials: v.string(),
    identifierCode: v.string(),
    bedId: v.string(),
    admissionDate: v.string(),
    surgeryDate: v.optional(v.string()),
    procedureName: v.optional(v.string()),
    diagnosis: v.string(),
    serviceName: v.optional(v.string()),
    /** Optimistic-lock counter for concurrent edit detection (see Phase 10.3). */
    version: v.optional(v.number()),
    /** Patient lifecycle status for discharge management. Undefined = "active" for backward compatibility. */
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("discharged"),
        v.literal("transferred"),
        v.literal("deceased"),
        v.literal("on_leave")
      )
    ),
    /** Completed clinical requirements with completion timestamps. */
    completedRequirements: v.optional(
      v.array(
        v.object({
          item: v.string(),
          completedAt: v.string(),
        })
      )
    ),
    /** Custom todos added manually for this patient. */
    customTodos: v.optional(
      v.array(
        v.object({
          id: v.string(),
          text: v.string(),
          completed: v.boolean(),
          createdAt: v.string(),
          completedAt: v.optional(v.string()),
        })
      )
    ),
    /** Patient demographic: biological sex. */
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    /** Pregnancy status for female patients. */
    isPregnant: v.optional(v.boolean()),
    /** Clinical anamnesis (history, complaints, allergies). */
    anamnesis: v.optional(anamnesisValidator),
    /** Latest vital signs. */
    vitals: v.optional(vitalsValidator),
    /** A-a gradient module values and computed interpretation. */
    aaGradient: v.optional(aaGradientValidator),
    /** Critical medications requiring close monitoring. */
    criticalMedications: v.optional(criticalMedicationValidator),
    /** Oncology history (chemotherapy, radiotherapy). */
    oncologyHistory: v.optional(oncologyHistoryValidator),
    /** Clinical reports (SFT, PET, pathology, etc.). */
    reports: v.optional(reportsValidator),
    /** External ward transfer information. */
    externalWard: v.optional(externalWardValidator),
    /** Thoracic interventions (chest tubes, drains). */
    thoracicInterventions: v.optional(v.array(thoracicInterventionValidator)),
    /** Lab cultures and biochemistry. */
    labCultures: v.optional(v.array(labCultureValidator)),
    /** Specialty consultations. */
    consultations: v.optional(v.array(consultationValidator)),
    /** Active and past antibiotics. */
    antibiotics: v.optional(v.array(antibioticValidator)),
    /** Daily visit notes. */
    visitNotes: v.optional(v.array(visitNoteValidator)),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_organization_bed_id", ["organizationId", "bedId"]),

  auditLogs: defineTable({
    organizationId: v.string(),
    userId: v.string(),
    action: v.string(),
    timestamp: v.number(),
  })
    .index("by_organization_id", ["organizationId"])
    .index("by_organization_timestamp", ["organizationId", "timestamp"])
    .index("by_user_id", ["userId"]),
})
