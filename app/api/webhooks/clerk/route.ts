import { NextResponse } from "next/server"

import { internal } from "@/convex/_generated/api"
import { runConvexServerMutation } from "@/lib/convex-server"
import {
  getClerkOrganizationPayload,
  isClerkOrganizationWebhook,
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
            : "Unable to process the Clerk organization webhook.",
      },
      { status: 400 }
    )
  }

  if (!isClerkOrganizationWebhook(event)) {
    return NextResponse.json({ ignored: true, received: true })
  }

  try {
    await runConvexServerMutation(
      internal.organizations.upsertOrganizationFromClerkWebhook,
      getClerkOrganizationPayload(event)
    )

    return NextResponse.json({ received: true })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to sync the Clerk organization into Convex.",
      },
      { status: 500 }
    )
  }
}
