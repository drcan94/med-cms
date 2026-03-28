import { NextResponse } from "next/server"

import { internal } from "@/convex/_generated/api"
import { runConvexServerMutation } from "@/lib/convex-server"
import {
  getClerkMembershipCreatedPayload,
  getClerkMembershipDeletedPayload,
  getClerkOrganizationPayload,
  getClerkUserDeletedPayload,
  getClerkUserPayload,
  isClerkMembershipCreatedWebhook,
  isClerkMembershipDeletedWebhook,
  isClerkOrganizationWebhook,
  isClerkUserDeletedWebhook,
  isClerkUserSyncWebhook,
  verifyClerkWebhook,
} from "@/lib/webhooks"

export const runtime = "nodejs"

export async function POST(request: Request): Promise<NextResponse> {
  let event: Awaited<ReturnType<typeof verifyClerkWebhook>>

  try {
    event = await verifyClerkWebhook(request)
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to verify Clerk webhook signature.",
      },
      { status: 400 }
    )
  }

  try {
    if (isClerkUserSyncWebhook(event)) {
      await runConvexServerMutation(
        internal.users.upsertUserFromClerkWebhook,
        getClerkUserPayload(event)
      )

      return NextResponse.json({ received: true, type: event.type })
    }

    if (isClerkUserDeletedWebhook(event)) {
      await runConvexServerMutation(
        internal.users.deleteUserFromClerkWebhook,
        getClerkUserDeletedPayload(event)
      )

      return NextResponse.json({ received: true, type: event.type })
    }

    if (isClerkOrganizationWebhook(event)) {
      await runConvexServerMutation(
        internal.organizations.upsertOrganizationFromClerkWebhook,
        getClerkOrganizationPayload(event)
      )

      return NextResponse.json({ received: true, type: event.type })
    }

    if (isClerkMembershipCreatedWebhook(event)) {
      await runConvexServerMutation(
        internal.organizations.addMembershipFromClerkWebhook,
        getClerkMembershipCreatedPayload(event)
      )

      return NextResponse.json({ received: true, type: event.type })
    }

    if (isClerkMembershipDeletedWebhook(event)) {
      await runConvexServerMutation(
        internal.organizations.removeMembershipFromClerkWebhook,
        getClerkMembershipDeletedPayload(event)
      )

      return NextResponse.json({ received: true, type: event.type })
    }

    return NextResponse.json({ ignored: true, received: true, type: event.type })
  } catch (error) {
    console.error(`Webhook processing error for ${event.type}:`, error)

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process the Clerk webhook.",
        type: event.type,
      },
      { status: 500 }
    )
  }
}
