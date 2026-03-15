import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

import { initializePremiumCheckout } from "@/lib/iyzico"

type CheckoutRequestBody = {
  organizationId?: string
}

function requireText(
  value: string | undefined,
  fieldName: string
): string {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`)
  }

  return normalizedValue
}

function getRequestIp(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip")?.trim() ||
    "127.0.0.1"
  )
}

export const runtime = "nodejs"

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const { orgId, userId } = await auth()

    if (!userId || !orgId) {
      return NextResponse.json(
        { error: "You must be signed in to start billing checkout." },
        { status: 401 }
      )
    }

    const body = (await request.json()) as CheckoutRequestBody
    const organizationId = requireText(body.organizationId, "organizationId")

    if (organizationId !== orgId) {
      return NextResponse.json(
        { error: "You can only initialize checkout for your active organization." },
        { status: 403 }
      )
    }

    const callbackUrl = new URL("/api/iyzico/callback", request.url)
    callbackUrl.searchParams.set("organizationId", organizationId)

    const result = await initializePremiumCheckout({
      buyerIp: getRequestIp(request),
      callbackUrl: callbackUrl.toString(),
      organizationId,
    })

    if (result.status.toLowerCase() !== "success") {
      return NextResponse.json(
        { error: "Iyzico checkout could not be initialized." },
        { status: 502 }
      )
    }

    return NextResponse.json({
      checkoutFormContent: result.checkoutFormContent,
      token: result.token,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to initialize the Iyzico checkout flow.",
      },
      { status: 500 }
    )
  }
}
