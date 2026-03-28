import { v } from "convex/values"

import { internalMutation, query } from "./_generated/server"
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

export const upsertUserFromClerkWebhook = internalMutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    imageUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()

    if (existingUser) {
      await ctx.db.patch(existingUser._id, {
        email: args.email,
        firstName: args.firstName,
        lastName: args.lastName,
        imageUrl: args.imageUrl,
      })

      return { userId: existingUser._id, action: "updated" }
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      imageUrl: args.imageUrl,
    })

    return { userId, action: "created" }
  },
})

export const deleteUserFromClerkWebhook = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .unique()

    if (!user) {
      return { action: "not_found" }
    }

    const memberships = await ctx.db
      .query("organizationMemberships")
      .withIndex("by_user_id", (q) => q.eq("userId", args.clerkId))
      .collect()

    for (const membership of memberships) {
      await ctx.db.delete(membership._id)
    }

    await ctx.db.delete(user._id)

    return { action: "deleted" }
  },
})
