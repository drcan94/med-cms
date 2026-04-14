import { v } from "convex/values"

import { internalMutation, mutation, query } from "./_generated/server"
import { requireAuth } from "./authz"

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      return null
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique()

    return user
  },
})

export const getAuthSyncStatus = query({
  args: {
    organizationId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      return { status: "unauthenticated" as const }
    }

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", identity.subject))
      .unique()

    if (!user) {
      return { status: "user_pending" as const }
    }

    if (!args.organizationId) {
      return { status: "ready" as const, user }
    }

    const membership = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_org_and_user", (q) =>
        q.eq("organizationId", args.organizationId!).eq("userId", identity.subject)
      )
      .unique()

    if (!membership) {
      return { status: "membership_pending" as const, user }
    }

    return { status: "ready" as const, user, membership }
  },
})

export const getUserByClerkId = query({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    await requireAuth(ctx)

    return ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()
  },
})

export const ensureAuthRecords = mutation({
  args: {
    organizationId: v.optional(v.string()),
    organizationName: v.optional(v.string()),
    organizationRole: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()

    if (!identity) {
      return { status: "unauthenticated" as const }
    }

    const email = identity.email?.trim()

    if (!email) {
      console.warn("[CONVEX DB] ⚠️ Cannot upsert user without email:", identity.subject)
      return { status: "missing_email" as const }
    }

    const clerkId = identity.subject
    const firstName = identity.givenName?.trim() || undefined
    const lastName = identity.familyName?.trim() || undefined
    const imageUrl = identity.pictureUrl?.trim() || undefined

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkId))
      .unique()

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email,
        firstName,
        lastName,
        imageUrl,
      })
    } else {
      await ctx.db.insert("users", {
        clerkId,
        email,
        firstName,
        lastName,
        imageUrl,
      })
    }

    if (args.organizationId) {
      const organizationId = args.organizationId.trim()

      const existingOrganization = await ctx.db
        .query("organizations")
        .withIndex("by_clerk_id", (q) => q.eq("clerkId", organizationId))
        .unique()

      if (!existingOrganization) {
        await ctx.db.insert("organizations", {
          clerkId: organizationId,
          name: args.organizationName?.trim() || "Untitled organization",
          subscriptionStatus: "trial",
        })
      }

      const existingMembership = await ctx.db
        .query("organizationMemberships")
        .withIndex("by_org_and_user", (q) =>
          q.eq("organizationId", organizationId).eq("userId", clerkId)
        )
        .unique()

      if (!existingMembership) {
        await ctx.db.insert("organizationMemberships", {
          organizationId,
          userId: clerkId,
          role: args.organizationRole?.trim() || "org:member",
        })
      }
    }

    return {
      status: "synced" as const,
      organizationSynced: Boolean(args.organizationId),
    }
  },
})

export const upsertUserFromClerkWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("[CONVEX DB] 📥 upsertUserFromClerkWebhook called")
    console.log("[CONVEX DB] 📥 Args:", JSON.stringify(args))

    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()

    if (existingUser) {
      console.log("[CONVEX DB] 🔄 User exists, updating:", existingUser._id)
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
      })

      console.log("[CONVEX DB] ✅ User UPDATED successfully:", existingUser._id)
      return { userId: existingUser._id, action: "updated" }
    }

    console.log("[CONVEX DB] ➕ User does not exist, creating new user...")
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
    })

    console.log("[CONVEX DB] ✅ User CREATED successfully:", userId)
    return { userId, action: "created" }
  },
})

export const deleteUserFromClerkWebhook = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    console.log("[CONVEX DB] 🗑️ deleteUserFromClerkWebhook called for:", args.clerkId)

    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()

    if (!user) {
      console.log("[CONVEX DB] ⚠️ User not found for deletion:", args.clerkId)
      return { action: "not_found" }
    }

    console.log("[CONVEX DB] 🔍 Found user to delete:", user._id)

    const memberships = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_user_id", (q) => q.eq("userId", args.clerkId))
      .collect()

    console.log("[CONVEX DB] 🔗 Found", memberships.length, "memberships to delete")

    for (const membership of memberships) {
      await ctx.db.delete(membership._id)
    }

    await ctx.db.delete(user._id)

    console.log("[CONVEX DB] ✅ User DELETED successfully:", args.clerkId)
    return { action: "deleted" }
  },
})
