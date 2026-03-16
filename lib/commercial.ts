export const FREE_TRIAL_PATIENT_LIMIT = 50
export const SUPER_ADMIN_CLERK_ID = "user_mock_super_admin"
export const SUPER_ADMIN_EMAIL = "superadmin@wardos.dev"
export type SubscriptionStatusKey =
  | "active"
  | "canceled"
  | "inactive"
  | "past_due"
  | "trial"
  | "unpaid"

function normalizeValue(value?: string | null): string {
  return value?.trim().toLowerCase() ?? ""
}

function capitalizeWord(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1)
}

export function formatSubscriptionStatusLabel(
  subscriptionStatus?: string | null
): string {
  const normalizedStatus = getSubscriptionStatusKey(subscriptionStatus)

  return normalizedStatus
    .split("_")
    .map((word) => capitalizeWord(word))
    .join(" ")
}

export function getSubscriptionStatusKey(
  subscriptionStatus?: string | null
): SubscriptionStatusKey {
  const normalizedStatus = normalizeSubscriptionStatus(subscriptionStatus)

  switch (normalizedStatus) {
    case "active":
    case "canceled":
    case "inactive":
    case "past_due":
    case "trial":
    case "unpaid":
      return normalizedStatus
    default:
      return "inactive"
  }
}

export function isOrganizationLocked(
  patientCount: number,
  subscriptionStatus?: string | null
): boolean {
  return (
    patientCount >= FREE_TRIAL_PATIENT_LIMIT &&
    normalizeSubscriptionStatus(subscriptionStatus) !== "active"
  )
}

export function isSuperAdminAccount(args: {
  userEmail?: string | null
  userId?: string | null
}): boolean {
  const normalizedUserId = normalizeValue(args.userId)
  const normalizedUserEmail = normalizeValue(args.userEmail)

  return (
    normalizedUserId === normalizeValue(SUPER_ADMIN_CLERK_ID) ||
    normalizedUserEmail === normalizeValue(SUPER_ADMIN_EMAIL)
  )
}

export function normalizeSubscriptionStatus(
  subscriptionStatus?: string | null
): string {
  return normalizeValue(subscriptionStatus) || "trial"
}
