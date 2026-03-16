"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { useTranslations } from "next-intl"

import { api } from "@/convex/_generated/api"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  getSubscriptionStatusKey,
  isSuperAdminAccount,
} from "@/lib/commercial"

function getSubscriptionBadgeVariant(subscriptionStatus: string) {
  if (subscriptionStatus === "active") {
    return "default"
  }

  if (subscriptionStatus === "trial") {
    return "secondary"
  }

  return "outline"
}

function SuperAdminStateCard({
  badgeLabel,
  description,
  title,
}: Readonly<{ badgeLabel: string; description: string; title: string }>) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <Badge variant="outline" className="w-fit">
            {badgeLabel}
          </Badge>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

export default function SuperAdminPage() {
  const t = useTranslations("SuperAdminPage")
  const { isLoaded, user } = useUser()
  const userId = user?.id
  const userEmail = user?.primaryEmailAddress?.emailAddress
  const canAccess = isSuperAdminAccount({ userEmail, userId })
  const organizations = useQuery(
    api.organizations.getAllOrganizations,
    isLoaded && canAccess && userId ? { userEmail, userId } : "skip"
  )

  if (!isLoaded) {
    return (
      <SuperAdminStateCard
        badgeLabel={t("state.badge")}
        title={t("state.loadingTitle")}
        description={t("state.loadingDescription")}
      />
    )
  }

  if (!canAccess) {
    return (
      <SuperAdminStateCard
        badgeLabel={t("state.badge")}
        title={t("state.restrictedTitle")}
        description={t("state.restrictedDescription")}
      />
    )
  }

  if (organizations === undefined) {
    return (
      <SuperAdminStateCard
        badgeLabel={t("state.badge")}
        title={t("state.loadingTitle")}
        description={t("state.loadingMetrics")}
      />
    )
  }

  const activeOrganizations = organizations.filter(
    (organization) => organization.subscriptionStatus === "active"
  ).length
  const totalPatients = organizations.reduce(
    (sum, organization) => sum + organization.patientCount,
    0
  )

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl px-6 py-16">
      <div className="grid w-full gap-6">
        <section className="rounded-2xl border bg-background p-6 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{t("badges.title")}</Badge>
            <Badge variant="secondary">{t("badges.subtitle")}</Badge>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {t("description")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("metrics.clinics")}
                </p>
                <p className="mt-2 text-2xl font-semibold">{organizations.length}</p>
              </div>
              <div className="rounded-xl border px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("metrics.active")}
                </p>
                <p className="mt-2 text-2xl font-semibold">{activeOrganizations}</p>
              </div>
              <div className="rounded-xl border px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  {t("metrics.patients")}
                </p>
                <p className="mt-2 text-2xl font-semibold">{totalPatients}</p>
              </div>
            </div>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t("table.title")}</CardTitle>
            <CardDescription>{t("table.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                {organizations.length > 0
                  ? t("table.caption")
                  : t("table.emptyCaption")}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("table.headers.clinic")}</TableHead>
                  <TableHead>{t("table.headers.clerkOrgId")}</TableHead>
                  <TableHead>{t("table.headers.patients")}</TableHead>
                  <TableHead>{t("table.headers.subscription")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {organizations.map((organization) => (
                  <TableRow key={organization.clerkId}>
                    <TableCell className="font-medium">{organization.name}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {organization.clerkId}
                    </TableCell>
                    <TableCell>{organization.patientCount}</TableCell>
                    <TableCell>
                      <Badge
                        variant={getSubscriptionBadgeVariant(
                          organization.subscriptionStatus
                        )}
                      >
                        {t(
                          `statuses.${getSubscriptionStatusKey(
                            organization.subscriptionStatus
                          )}`
                        )}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
