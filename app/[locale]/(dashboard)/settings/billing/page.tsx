"use client"

import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { CreditCard, Crown, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

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
import { usePLGLimits } from "@/hooks/usePLGLimits"
import {
  getSubscriptionStatusKey,
  normalizeSubscriptionStatus,
} from "@/lib/commercial"

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
  const t = useTranslations("BillingPage")
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
        title={t("state.title")}
        description={t("state.loadingOrganization")}
      />
    )
  }

  if (!orgId) {
    return (
      <BillingStateCard
        title={t("state.title")}
        description={t("state.selectOrganization")}
      />
    )
  }

  if (organization === undefined) {
    return (
      <BillingStateCard
        title={t("state.title")}
        description={t("state.loadingUsage")}
      />
    )
  }

  const resolvedSubscriptionStatus = normalizeSubscriptionStatus(subscriptionStatus)
  const subscriptionStatusLabel = t(
    `statuses.${getSubscriptionStatusKey(resolvedSubscriptionStatus)}`
  )
  const isPremium = resolvedSubscriptionStatus === "active"

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{t("badges.title")}</Badge>
            <Badge variant={isPremium ? "default" : "secondary"}>
              {subscriptionStatusLabel}
            </Badge>
            {isLocked ? <Badge variant="destructive">{t("badges.upgradeRequired")}</Badge> : null}
          </div>
          <CardTitle>
            {t("subscriptionTitle", {
              organizationName: organizationName ?? t("currentClinic"),
            })}
          </CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("cards.currentStatus.label")}
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {subscriptionStatusLabel}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isPremium
                ? t("cards.currentStatus.active")
                : t("cards.currentStatus.trial")}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("cards.patientUsage.label")}
            </p>
            <p className="mt-3 text-2xl font-semibold tracking-tight">
              {patientCount} / {patientLimit}
            </p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {isLocked
                ? t("cards.patientUsage.locked")
                : t("cards.patientUsage.unlocked")}
            </p>
          </div>

          <div className="rounded-xl border p-4">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
              {t("cards.premiumIncludes.label")}
            </p>
            <div className="mt-3 space-y-3 text-sm leading-6 text-muted-foreground">
              <p className="flex items-start gap-2">
                <Crown className="mt-1 size-4 shrink-0 text-primary" />
                {t("cards.premiumIncludes.items.unlimitedPatients")}
              </p>
              <p className="flex items-start gap-2">
                <CreditCard className="mt-1 size-4 shrink-0 text-primary" />
                {t("cards.premiumIncludes.items.iyzico")}
              </p>
              <p className="flex items-start gap-2">
                <ShieldCheck className="mt-1 size-4 shrink-0 text-primary" />
                {t("cards.premiumIncludes.items.privacy")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <BillingUpgradeCard isPremium={isPremium} organizationId={orgId} />
    </div>
  )
}
