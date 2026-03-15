import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

import {
  clinicConventionsValidator,
  wardRoomValidator,
} from "./clinicSettingsValidators"

/**
 * Convex adds `_id` and `_creationTime` to every document automatically.
 * Patient full names never enter this schema; only `initials` are persisted.
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
    bedId: v.string(),
    admissionDate: v.string(),
    surgeryDate: v.optional(v.string()),
    diagnosis: v.string(),
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
