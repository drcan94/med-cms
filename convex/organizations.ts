import { v } from "convex/values"

import {
  isSuperAdminAccount,
  normalizeSubscriptionStatus,
} from "../lib/commercial"
import { internalMutation, query } from "./_generated/server"

function requireText(value: string, fieldName: string): string {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`)
  }

  return normalizedValue
}

export const getOrganizationByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkId = requireText(args.clerkId, "Organization")
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_id", (queryBuilder) => queryBuilder.eq("clerkId", clerkId))
      .unique()

    if (!organization) {
      return null
    }

    return {
      clerkId: organization.clerkId,
      name: organization.name,
      subscriptionStatus: normalizeSubscriptionStatus(
        organization.subscriptionStatus
      ),
    }
  },
})

export const getAllOrganizations = query({
  args: {
    userEmail: v.optional(v.string()),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = requireText(args.userId, "User")

    if (!isSuperAdminAccount({ userEmail: args.userEmail, userId })) {
      throw new Error("Only the WardOS super admin can access organization billing data.")
    }

    const [organizations, patients] = await Promise.all([
      ctx.db.query("organizations").collect(),
      ctx.db.query("patients").collect(),
    ])

    const patientCountsByOrganization = patients.reduce<Map<string, number>>(
      (counts, patient) => {
        const currentCount = counts.get(patient.organizationId) ?? 0
        counts.set(patient.organizationId, currentCount + 1)
        return counts
      },
      new Map()
    )

    return organizations
      .map((organization) => ({
        clerkId: organization.clerkId,
        name: organization.name,
        patientCount: patientCountsByOrganization.get(organization.clerkId) ?? 0,
        subscriptionStatus: normalizeSubscriptionStatus(
          organization.subscriptionStatus
        ),
      }))
      .sort((leftOrganization, rightOrganization) =>
        leftOrganization.name.localeCompare(rightOrganization.name, undefined, {
          sensitivity: "base",
        })
      )
  },
})

export const upsertOrganizationFromClerkWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    name: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[CONVEX DB] 🏢 upsertOrganizationFromClerkWebhook called")
    console.log("[CONVEX DB] 🏢 Args:", JSON.stringify(args))

    const clerkId = requireText(args.clerkId, "Organization")
    const name = requireText(args.name, "Organization name")
    const existingOrganization = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_id", (queryBuilder) => queryBuilder.eq("clerkId", clerkId))
      .unique()

    if (existingOrganization) {
      console.log("[CONVEX DB] 🔄 Organization exists, updating:", existingOrganization._id)
      await ctx.db.patch(existingOrganization._id, {
        name,
      })

      console.log("[CONVEX DB] ✅ Organization UPDATED successfully")
      return {
        clerkId,
        name,
        subscriptionStatus: normalizeSubscriptionStatus(
          existingOrganization.subscriptionStatus
        ),
      }
    }

    console.log("[CONVEX DB] ➕ Organization does not exist, creating new...")
    await ctx.db.insert("organizations", {
      clerkId,
      name,
      subscriptionStatus: "trial",
    })

    console.log("[CONVEX DB] ✅ Organization CREATED successfully:", clerkId)
    return {
      clerkId,
      name,
      subscriptionStatus: "trial",
    }
  },
})

export const updateSubscriptionStatus = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkId = requireText(args.clerkId, "Organization")
    const organization = await ctx.db
      .query("organizations")
      .withIndex("by_clerk_id", (queryBuilder) => queryBuilder.eq("clerkId", clerkId))
      .unique()

    if (!organization) {
      throw new Error("Organization record not found.")
    }

    await ctx.db.patch(organization._id, {
      subscriptionStatus: "active",
    })

    return {
      clerkId,
      subscriptionStatus: "active",
    }
  },
})

export const addMembershipFromClerkWebhook = internalMutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
    role: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[CONVEX DB] 🤝 addMembershipFromClerkWebhook called")
    console.log("[CONVEX DB] 🤝 Args:", JSON.stringify(args))

    const organizationId = requireText(args.organizationId, "Organization")
    const userId = requireText(args.userId, "User")
    const role = requireText(args.role, "Role")

    const existingMembership = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", organizationId).eq("userId", userId)
      )
      .unique()

    if (existingMembership) {
      console.log("[CONVEX DB] 🔄 Membership exists, updating:", existingMembership._id)
      await ctx.db.patch(existingMembership._id, { role })

      console.log("[CONVEX DB] ✅ Membership UPDATED successfully")
      return {
        membershipId: existingMembership._id,
        action: "updated",
      }
    }

    console.log("[CONVEX DB] ➕ Membership does not exist, creating new...")
    const membershipId = await ctx.db.insert("organizationMemberships", {
      organizationId,
      userId,
      role,
    })

    console.log("[CONVEX DB] ✅ Membership CREATED successfully:", membershipId)
    return {
      membershipId,
      action: "created",
    }
  },
})

export const removeMembershipFromClerkWebhook = internalMutation({
  args: {
    organizationId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[CONVEX DB] ❌ removeMembershipFromClerkWebhook called")
    console.log("[CONVEX DB] ❌ Args:", JSON.stringify(args))

    const organizationId = requireText(args.organizationId, "Organization")
    const userId = requireText(args.userId, "User")

    const membership = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", organizationId).eq("userId", userId)
      )
      .unique()

    if (!membership) {
      console.log("[CONVEX DB] ⚠️ Membership not found for deletion")
      return { action: "not_found" }
    }

    console.log("[CONVEX DB] 🔍 Found membership to delete:", membership._id)
    await ctx.db.delete(membership._id)

    console.log("[CONVEX DB] ✅ Membership DELETED successfully")
    return { action: "deleted" }
  },
})
