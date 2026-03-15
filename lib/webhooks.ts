import type {
  WebhookEvent,
} from "@clerk/nextjs/server"
import { Webhook } from "svix"

type ClerkOrganizationSyncEvent = Extract<
  WebhookEvent,
  { type: "organization.created" | "organization.updated" }
>

const ORGANIZATION_WEBHOOK_TYPES = new Set<
  "organization.created" | "organization.updated"
>(["organization.created", "organization.updated"])

function requireText(
  value: string | null | undefined,
  fieldName: string
): string {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`)
  }

  return normalizedValue
}

export function isClerkOrganizationWebhook(
  event: WebhookEvent
): event is ClerkOrganizationSyncEvent {
  return ORGANIZATION_WEBHOOK_TYPES.has(
    event.type as "organization.created" | "organization.updated"
  )
}

export function getClerkOrganizationPayload(event: ClerkOrganizationSyncEvent): {
  clerkId: string
  name: string
} {
  return {
    clerkId: requireText(event.data.id, "Organization id"),
    name: requireText(event.data.name, "Organization name"),
  }
}

export async function verifyClerkWebhook(request: Request): Promise<WebhookEvent> {
  const payload = await request.text()
  const secret = requireText(
    process.env.CLERK_WEBHOOK_SECRET,
    "CLERK_WEBHOOK_SECRET"
  )
  const webhook = new Webhook(secret)

  return webhook.verify(payload, {
    "svix-id": requireText(request.headers.get("svix-id"), "svix-id"),
    "svix-signature": requireText(
      request.headers.get("svix-signature"),
      "svix-signature"
    ),
    "svix-timestamp": requireText(
      request.headers.get("svix-timestamp"),
      "svix-timestamp"
    ),
  }) as WebhookEvent
}
