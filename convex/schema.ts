import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import {
  clinicConventionsValidator,
  wardRoomValidator,
} from "./clinicSettingsValidators"

/**
 * Convex adds `_id` and `_creationTime` to every document automatically.
 * Patient full names never enter this schema; only masked initials and a 4-character
 * identifier code are persisted for local disambiguation.
 */
export default defineSchema({
  organizations: defineTable({
    clerkId: v.string(),
    name: v.string(),
    subscriptionStatus: v.string(),
  }).index("by_clerk_id", ["clerkId"]),

  clinicSettings: defineTable({
    organizationId: v.string(),
    wardLayout: v.array(wardRoomValidator),
    conventions: clinicConventionsValidator,
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
