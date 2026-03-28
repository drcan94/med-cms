import type {
  OrganizationMembershipWebhookEvent,
  WebhookEvent,
} from "@clerk/nextjs/server"
import { Webhook } from "svix"

type ClerkOrganizationSyncEvent = Extract<
  WebhookEvent,
  { type: "organization.created" | "organization.updated" }
>

type ClerkUserSyncEvent = Extract<
  WebhookEvent,
  { type: "user.created" | "user.updated" }
>

type ClerkUserDeletedEvent = Extract<WebhookEvent, { type: "user.deleted" }>

const ORGANIZATION_WEBHOOK_TYPES = new Set([
  "organization.created",
  "organization.updated",
])

const USER_SYNC_WEBHOOK_TYPES = new Set(["user.created", "user.updated"])


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
  return ORGANIZATION_WEBHOOK_TYPES.has(event.type)
}

export function isClerkUserSyncWebhook(
  event: WebhookEvent
): event is ClerkUserSyncEvent {
  return USER_SYNC_WEBHOOK_TYPES.has(event.type)
}

export function isClerkUserDeletedWebhook(
  event: WebhookEvent
): event is ClerkUserDeletedEvent {
  return event.type === "user.deleted"
}

export function isClerkMembershipCreatedWebhook(
  event: WebhookEvent
): event is OrganizationMembershipWebhookEvent {
  return event.type === "organizationMembership.created"
}

export function isClerkMembershipDeletedWebhook(
  event: WebhookEvent
): event is OrganizationMembershipWebhookEvent {
  return event.type === "organizationMembership.deleted"
}

export function getClerkOrganizationPayload(
  event: ClerkOrganizationSyncEvent
): {
  clerkId: string
  name: string
} {
  return {
    clerkId: requireText(event.data.id, "Organization id"),
    name: requireText(event.data.name, "Organization name"),
  }
}

export function getClerkUserPayload(event: ClerkUserSyncEvent): {
  clerkId: string
  email: string
  firstName: string | undefined
  lastName: string | undefined
  imageUrl: string | undefined
} {
  const primaryEmail = event.data.email_addresses?.find(
    (email) => email.id === event.data.primary_email_address_id
  )

  return {
    clerkId: requireText(event.data.id, "User id"),
    email: requireText(primaryEmail?.email_address, "User email"),
    firstName: event.data.first_name ?? undefined,
    lastName: event.data.last_name ?? undefined,
    imageUrl: event.data.image_url ?? undefined,
  }
}

export function getClerkUserDeletedPayload(event: ClerkUserDeletedEvent): {
  clerkId: string
} {
  return {
    clerkId: requireText(event.data.id, "User id"),
  }
}

export function getClerkMembershipCreatedPayload(
  event: OrganizationMembershipWebhookEvent
): {
  organizationId: string
  userId: string
  role: string
} {
  return {
    organizationId: requireText(
      event.data.organization.id,
      "Organization id"
    ),
    userId: requireText(event.data.public_user_data.user_id, "User id"),
    role: requireText(event.data.role, "Role"),
  }
}

export function getClerkMembershipDeletedPayload(
  event: OrganizationMembershipWebhookEvent
): {
  organizationId: string
  userId: string
} {
  return {
    organizationId: requireText(
      event.data.organization.id,
      "Organization id"
    ),
    userId: requireText(event.data.public_user_data.user_id, "User id"),
  }
}

export async function verifyClerkWebhook(
  request: Request
): Promise<WebhookEvent> {
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
