import { v } from "convex/values"

export const clinicConventionRuleValidator = v.object({
  id: v.string(),
  sourceField: v.union(v.literal("diagnosis"), v.literal("surgery")),
  operator: v.literal("contains"),
  matchValue: v.string(),
  checklistItem: v.string(),
})

export const clinicConventionsValidator = v.union(
  v.string(),
  v.array(clinicConventionRuleValidator)
)

export const wardRoomValidator = v.object({
  roomId: v.string(),
  roomName: v.string(),
  bedCapacity: v.number(),
  bedIds: v.optional(v.array(v.string())),
})

export const defaultPatmMmHgValidator = v.number()
