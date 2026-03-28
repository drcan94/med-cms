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
  console.log("[WEBHOOK] 🟢 ====== CLERK WEBHOOK RECEIVED ======")
  console.log("[WEBHOOK] 🟢 Timestamp:", new Date().toISOString())

  // Step 1: Validate critical environment variables upfront
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL
  const convexAdminKey = process.env.CONVEX_DEPLOYMENT_ADMIN_KEY
  const webhookSecret = process.env.CLERK_WEBHOOK_SECRET

  console.log("[WEBHOOK] 🔍 Environment check:")
  console.log("[WEBHOOK]    - NEXT_PUBLIC_CONVEX_URL:", convexUrl ? "✅ SET" : "❌ MISSING")
  console.log("[WEBHOOK]    - CONVEX_DEPLOYMENT_ADMIN_KEY:", convexAdminKey ? "✅ SET" : "❌ MISSING")
  console.log("[WEBHOOK]    - CLERK_WEBHOOK_SECRET:", webhookSecret ? "✅ SET" : "❌ MISSING")

  if (!convexUrl) {
    console.error("[WEBHOOK] 🔴 FATAL: NEXT_PUBLIC_CONVEX_URL is not set!")
    return NextResponse.json(
      { error: "Server misconfiguration: Missing NEXT_PUBLIC_CONVEX_URL" },
      { status: 500 }
    )
  }

  if (!convexAdminKey) {
    console.error("[WEBHOOK] 🔴 FATAL: CONVEX_DEPLOYMENT_ADMIN_KEY is not set!")
    return NextResponse.json(
      { error: "Server misconfiguration: Missing CONVEX_DEPLOYMENT_ADMIN_KEY" },
      { status: 500 }
    )
  }

  if (!webhookSecret) {
    console.error("[WEBHOOK] 🔴 FATAL: CLERK_WEBHOOK_SECRET is not set!")
    return NextResponse.json(
      { error: "Server misconfiguration: Missing CLERK_WEBHOOK_SECRET" },
      { status: 500 }
    )
  }

  // Step 2: Verify the Svix signature
  let event: Awaited<ReturnType<typeof verifyClerkWebhook>>

  try {
    console.log("[WEBHOOK] 🔐 Verifying Svix signature...")
    event = await verifyClerkWebhook(request)
    console.log("[WEBHOOK] ✅ Svix signature verified successfully")
  } catch (error) {
    console.error("[WEBHOOK] 🔴 Svix verification FAILED:", error)
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

  const eventType = event.type
  console.log(`[WEBHOOK] 🔵 Event type: ${eventType}`)
  console.log(`[WEBHOOK] 🔵 Event ID: ${event.data.id}`)

  try {
    // ===== USER SYNC (user.created / user.updated) =====
    if (isClerkUserSyncWebhook(event)) {
      console.log("[WEBHOOK] 👤 Processing USER SYNC event...")
      
      const payload = getClerkUserPayload(event)
      console.log("[WEBHOOK] 📦 User payload extracted:")
      console.log("[WEBHOOK]    - clerkId:", payload.clerkId)
      console.log("[WEBHOOK]    - email:", payload.email)
      console.log("[WEBHOOK]    - firstName:", payload.firstName)
      console.log("[WEBHOOK]    - lastName:", payload.lastName)

      console.log("[WEBHOOK] 🚀 Calling Convex mutation: users.upsertUserFromClerkWebhook...")
      
      try {
        const result = await runConvexServerMutation(
          internal.users.upsertUserFromClerkWebhook,
          payload
        )
        console.log("[WEBHOOK] ✅ Convex mutation SUCCESS! Result:", JSON.stringify(result))
        return NextResponse.json({ received: true, type: eventType, result })
      } catch (mutationError) {
        console.error("[WEBHOOK] ❌ Convex mutation FAILED for user sync!")
        console.error("[WEBHOOK] ❌ Error:", mutationError)
        console.error("[WEBHOOK] ❌ Payload was:", JSON.stringify(payload))
        return NextResponse.json(
          {
            error: mutationError instanceof Error ? mutationError.message : "Convex mutation failed",
            type: eventType,
          },
          { status: 500 }
        )
      }
    }

    // ===== USER DELETED =====
    if (isClerkUserDeletedWebhook(event)) {
      console.log("[WEBHOOK] 🗑️ Processing USER DELETED event...")
      
      const payload = getClerkUserDeletedPayload(event)
      console.log("[WEBHOOK] 📦 Delete payload - clerkId:", payload.clerkId)

      console.log("[WEBHOOK] 🚀 Calling Convex mutation: users.deleteUserFromClerkWebhook...")
      
      try {
        const result = await runConvexServerMutation(
          internal.users.deleteUserFromClerkWebhook,
          payload
        )
        console.log("[WEBHOOK] ✅ Convex mutation SUCCESS! Result:", JSON.stringify(result))
        return NextResponse.json({ received: true, type: eventType, result })
      } catch (mutationError) {
        console.error("[WEBHOOK] ❌ Convex mutation FAILED for user delete!")
        console.error("[WEBHOOK] ❌ Error:", mutationError)
        return NextResponse.json(
          {
            error: mutationError instanceof Error ? mutationError.message : "Convex mutation failed",
            type: eventType,
          },
          { status: 500 }
        )
      }
    }

    // ===== ORGANIZATION SYNC =====
    if (isClerkOrganizationWebhook(event)) {
      console.log("[WEBHOOK] 🏢 Processing ORGANIZATION SYNC event...")
      
      const payload = getClerkOrganizationPayload(event)
      console.log("[WEBHOOK] 📦 Org payload:")
      console.log("[WEBHOOK]    - clerkId:", payload.clerkId)
      console.log("[WEBHOOK]    - name:", payload.name)

      console.log("[WEBHOOK] 🚀 Calling Convex mutation: organizations.upsertOrganizationFromClerkWebhook...")
      
      try {
        const result = await runConvexServerMutation(
          internal.organizations.upsertOrganizationFromClerkWebhook,
          payload
        )
        console.log("[WEBHOOK] ✅ Convex mutation SUCCESS! Result:", JSON.stringify(result))
        return NextResponse.json({ received: true, type: eventType, result })
      } catch (mutationError) {
        console.error("[WEBHOOK] ❌ Convex mutation FAILED for org sync!")
        console.error("[WEBHOOK] ❌ Error:", mutationError)
        return NextResponse.json(
          {
            error: mutationError instanceof Error ? mutationError.message : "Convex mutation failed",
            type: eventType,
          },
          { status: 500 }
        )
      }
    }

    // ===== MEMBERSHIP CREATED =====
    if (isClerkMembershipCreatedWebhook(event)) {
      console.log("[WEBHOOK] 🤝 Processing MEMBERSHIP CREATED event...")
      
      const payload = getClerkMembershipCreatedPayload(event)
      console.log("[WEBHOOK] 📦 Membership payload:")
      console.log("[WEBHOOK]    - organizationId:", payload.organizationId)
      console.log("[WEBHOOK]    - userId:", payload.userId)
      console.log("[WEBHOOK]    - role:", payload.role)

      console.log("[WEBHOOK] 🚀 Calling Convex mutation: organizations.addMembershipFromClerkWebhook...")
      
      try {
        const result = await runConvexServerMutation(
          internal.organizations.addMembershipFromClerkWebhook,
          payload
        )
        console.log("[WEBHOOK] ✅ Convex mutation SUCCESS! Result:", JSON.stringify(result))
        return NextResponse.json({ received: true, type: eventType, result })
      } catch (mutationError) {
        console.error("[WEBHOOK] ❌ Convex mutation FAILED for membership create!")
        console.error("[WEBHOOK] ❌ Error:", mutationError)
        return NextResponse.json(
          {
            error: mutationError instanceof Error ? mutationError.message : "Convex mutation failed",
            type: eventType,
          },
          { status: 500 }
        )
      }
    }

    // ===== MEMBERSHIP DELETED =====
    if (isClerkMembershipDeletedWebhook(event)) {
      console.log("[WEBHOOK] ❌ Processing MEMBERSHIP DELETED event...")
      
      const payload = getClerkMembershipDeletedPayload(event)
      console.log("[WEBHOOK] 📦 Membership delete payload:")
      console.log("[WEBHOOK]    - organizationId:", payload.organizationId)
      console.log("[WEBHOOK]    - userId:", payload.userId)

      console.log("[WEBHOOK] 🚀 Calling Convex mutation: organizations.removeMembershipFromClerkWebhook...")
      
      try {
        const result = await runConvexServerMutation(
          internal.organizations.removeMembershipFromClerkWebhook,
          payload
        )
        console.log("[WEBHOOK] ✅ Convex mutation SUCCESS! Result:", JSON.stringify(result))
        return NextResponse.json({ received: true, type: eventType, result })
      } catch (mutationError) {
        console.error("[WEBHOOK] ❌ Convex mutation FAILED for membership delete!")
        console.error("[WEBHOOK] ❌ Error:", mutationError)
        return NextResponse.json(
          {
            error: mutationError instanceof Error ? mutationError.message : "Convex mutation failed",
            type: eventType,
          },
          { status: 500 }
        )
      }
    }

    // ===== UNHANDLED EVENT TYPE =====
    console.log(`[WEBHOOK] ⚪ Event type "${eventType}" is not handled, ignoring.`)
    return NextResponse.json({ ignored: true, received: true, type: eventType })

  } catch (error) {
    console.error(`[WEBHOOK] 🔴 UNEXPECTED ERROR processing ${eventType}:`)
    console.error("[WEBHOOK] 🔴 Error object:", error)
    console.error("[WEBHOOK] 🔴 Error stack:", error instanceof Error ? error.stack : "N/A")

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to process the Clerk webhook.",
        type: eventType,
      },
      { status: 500 }
    )
  }
}
