import { v } from "convex/values"

import {
  clinicConventionsValidator,
  wardRoomValidator,
} from "./clinicSettingsValidators"
import { mutation, query } from "./_generated/server"

type ConventionRule = {
  checklistItem: string
  id: string
  matchValue: string
  operator: "contains"
  sourceField: "diagnosis" | "surgery"
}

type WardRoom = {
  bedCapacity: number
  bedIds?: string[]
  roomId: string
  roomName: string
}

function requireText(value: string, fieldName: string): string {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`)
  }

  return normalizedValue
}

function sanitizeConventions(
  conventions: ConventionRule[] | string
): ConventionRule[] | string {
  if (typeof conventions === "string") {
    return conventions.trim()
  }

  return conventions.map((rule) => ({
    checklistItem: requireText(rule.checklistItem, "Checklist item"),
    id: requireText(rule.id, "Rule id"),
    matchValue: requireText(rule.matchValue, "Condition text"),
    operator: rule.operator,
    sourceField: rule.sourceField,
  }))
}

function sanitizeWardLayout(wardLayout: WardRoom[]): WardRoom[] {
  return wardLayout.map((room) => ({
    bedCapacity: Math.max(0, Math.trunc(room.bedCapacity)),
    ...(room.bedIds
      ? {
          bedIds: room.bedIds
            .map((bedId) => bedId.trim())
            .filter((bedId) => bedId.length > 0),
        }
      : {}),
    roomId: requireText(room.roomId, "Room id"),
    roomName: requireText(room.roomName, "Room name"),
  }))
}

export const getClinicSettings = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const organizationId = requireText(args.organizationId, "Organization")
    const settings = await ctx.db
      .query("clinicSettings")
      .withIndex("by_organization_id", (queryBuilder) =>
        queryBuilder.eq("organizationId", organizationId)
      )
      .unique()

    return {
      conventions: settings?.conventions ?? [],
      organizationId,
      wardLayout: settings?.wardLayout ?? [],
    }
  },
})

export const upsertClinicSettings = mutation({
  args: {
    organizationId: v.string(),
    conventions: clinicConventionsValidator,
    wardLayout: v.array(wardRoomValidator),
  },
  handler: async (ctx, args) => {
    const organizationId = requireText(args.organizationId, "Organization")
    const conventions = sanitizeConventions(args.conventions)
    const wardLayout = sanitizeWardLayout(args.wardLayout)
    const existingSettings = await ctx.db
      .query("clinicSettings")
      .withIndex("by_organization_id", (queryBuilder) =>
        queryBuilder.eq("organizationId", organizationId)
      )
      .unique()

    if (existingSettings) {
      await ctx.db.patch(existingSettings._id, {
        conventions,
        wardLayout,
      })

      return existingSettings._id
    }

    return ctx.db.insert("clinicSettings", {
      conventions,
      organizationId,
      wardLayout,
    })
  },
})
