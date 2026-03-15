import { v } from "convex/values"

import { internalMutation } from "./_generated/server"

export const recordAuditLog = internalMutation({
  args: {
    action: v.string(),
    organizationId: v.string(),
    timestamp: v.number(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert("auditLogs", {
      action: args.action,
      organizationId: args.organizationId,
      timestamp: args.timestamp,
      userId: args.userId,
    })
  },
})
