import type { MutationCtx, QueryCtx } from "./_generated/server"

export type AuthorizedContext = {
  userId: string
  userClerkId: string
  organizationId: string
  role: string
}

export class AuthorizationError extends Error {
  constructor(
    message: string,
    public code: "UNAUTHORIZED" | "FORBIDDEN"
  ) {
    super(message)
    this.name = "AuthorizationError"
  }
}

export async function requireAuth(
  ctx: QueryCtx | MutationCtx
): Promise<{ userId: string; userClerkId: string }> {
  const identity = await ctx.auth.getUserIdentity()

  if (!identity) {
    throw new AuthorizationError(
      "Authentication required. Please sign in to continue.",
      "UNAUTHORIZED"
    )
  }

  const clerkUserId = identity.subject

  const user = await ctx.db
    .query("users")
    .withIndex("by_clerk_id", (q) => q.eq("clerkId", clerkUserId))
    .unique()

  if (!user) {
    throw new AuthorizationError(
      "User profile not found. Please contact support.",
      "UNAUTHORIZED"
    )
  }

  return {
    userId: user._id,
    userClerkId: user.clerkId,
  }
}

export async function requireOrgMembership(
  ctx: QueryCtx | MutationCtx,
  organizationId: string
): Promise<AuthorizedContext> {
  if (!organizationId || organizationId.trim() === "") {
    throw new AuthorizationError(
      "Organization ID is required.",
      "FORBIDDEN"
    )
  }

  const { userId, userClerkId } = await requireAuth(ctx)

  const membership = await ctx.db
    .query("organizationMemberships")
    .withIndex("by_org_and_user", (q) =>
      q.eq("organizationId", organizationId).eq("userId", userClerkId)
    )
    .unique()

  if (!membership) {
    throw new AuthorizationError(
      "FORBIDDEN: You do not have access to this organization's data.",
      "FORBIDDEN"
    )
  }

  return {
    userId,
    userClerkId,
    organizationId,
    role: membership.role,
  }
}

export async function requireOrgAdmin(
  ctx: QueryCtx | MutationCtx,
  organizationId: string
): Promise<AuthorizedContext> {
  const authContext = await requireOrgMembership(ctx, organizationId)

  if (authContext.role !== "org:admin") {
    throw new AuthorizationError(
      "FORBIDDEN: This action requires organization administrator privileges.",
      "FORBIDDEN"
    )
  }

  return authContext
}
