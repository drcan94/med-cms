import { NextResponse } from "next/server"

import { internal } from "@/convex/_generated/api"
import { runConvexServerMutation } from "@/lib/convex-server"
import { verifyPremiumCheckout } from "@/lib/iyzico"

type IyzicoCallbackPayload = {
  conversationId?: string | null
  token?: string | null
}

function getTextValue(value: FormDataEntryValue | null): string | null {
  return typeof value === "string" ? value.trim() || null : null
}

async function readCallbackPayload(
  request: Request
): Promise<IyzicoCallbackPayload> {
  const contentType = request.headers.get("content-type") ?? ""

  if (contentType.includes("application/json")) {
    const body = (await request.json()) as IyzicoCallbackPayload
    return {
      conversationId: body.conversationId?.trim() || null,
      token: body.token?.trim() || null,
    }
  }

  const formData = await request.formData()

  return {
    conversationId: getTextValue(formData.get("conversationId")),
    token: getTextValue(formData.get("token")),
  }
}

function redirectToBilling(request: Request, success: boolean): NextResponse {
  const billingUrl = new URL("/settings/billing", request.url)
  billingUrl.searchParams.set("success", success ? "true" : "false")

  return NextResponse.redirect(billingUrl, { status: 303 })
}

export const runtime = "nodejs"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const requestUrl = new URL(request.url)
    const callbackPayload = await readCallbackPayload(request)

    if (!callbackPayload.token) {
      return redirectToBilling(request, false)
    }

    const verification = await verifyPremiumCheckout({
      conversationId: callbackPayload.conversationId,
      organizationId: requestUrl.searchParams.get("organizationId"),
      token: callbackPayload.token,
    })

    if (!verification.success || !verification.organizationId) {
      return redirectToBilling(request, false)
    }

    await runConvexServerMutation(internal.organizations.updateSubscriptionStatus, {
      clerkId: verification.organizationId,
    })

    return redirectToBilling(request, true)
  } catch {
    return redirectToBilling(request, false)
  }
}
