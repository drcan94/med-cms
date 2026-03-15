"use client"

import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { CreditCard, Crown, ShieldCheck } from "lucide-react"

import { api } from "@/convex/_generated/api"
import { BillingUpgradeCard } from "@/components/organisms/billing-upgrade-card"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  formatSubscriptionStatusLabel,
  normalizeSubscriptionStatus,
} from "@/lib/commercial"
import { usePLGLimits } from "@/hooks/usePLGLimits"

function BillingStateCard({
  description,
  title,
}: Readonly<{ description: string; title: string }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

export default function BillingSettingsPage() {
  const { isLoaded, orgId } = useAuth()
  const organization = useQuery(
    api.organizations.getOrganizationByClerkId,
    orgId ? { clerkId: orgId } : "skip"
  )
  const { isLocked, organizationName, patientCount, patientLimit, subscriptionStatus } =
    usePLGLimits()

  if (!isLoaded) {
    return (
      <BillingStateCard
        title="Billing"
        description="Loading organization billing profile..."
      />
    )
  }

  if (!orgId) {
    return (
      <BillingStateCard
        title="Billing"
        description="Select a clinic organization to manage subscription settings."
      />
    )
  }

  if (organization === undefined) {
    return (
      <BillingStateCard
        title="Billing"
        description="Loading subscription status and patient usage..."
      />
    )
  }

  const resolvedSubscriptionStatus = normalizeSubscriptionStatus(subscriptionStatus)
  const isPremium = resolvedSubscriptionStatus === "active"

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Billing</Badge>
            <Badge variant={isPremium ? "default" : "secondary"}>
              {formatSubscriptionStatusLabel(resolvedSubscriptionStatus)}
            </Badge>
            {isLocked ? <Badge variant="destructive">Upgrade required</Badge> : null}
          </div>
          <CardTitle>{organizationName ?? "Current clinic"} subscription</CardTitle>
          <CardDescription>
            Manage the commercial layer for WardOS, including PLG limits and the
            future Premium billing flow.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Current status
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {formatSubscriptionStatusLabel(resolvedSubscriptionStatus)}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isPremium
                ? "Premium billing is active for this clinic organization."
                : "This clinic is still on the free commercial tier."}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Patient usage
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {patientCount} / {patientLimit}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isLocked
                ? "The soft lock is active. Existing data stays visible, but patient-writing actions are paused."
                : "The clinic can continue admitting patients until the free limit is reached."}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              Premium includes
            </p>
            <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
              <p className="flex items-start gap-2">
                <Crown className="mt-1 size-4 shrink-0 text-primary" />
                Unlimited active patient workflows beyond the free PLG threshold.
              </p>
              <p className="flex items-start gap-2">
                <CreditCard className="mt-1 size-4 shrink-0 text-primary" />
                Iyzico checkout scaffolding with callback-based Premium activation.
              </p>
              <p className="flex items-start gap-2">
                <ShieldCheck className="mt-1 size-4 shrink-0 text-primary" />
                Zero-liability privacy model preserved with local full-name storage.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <BillingUpgradeCard isPremium={isPremium} organizationId={orgId} />
    </div>
  )
}
