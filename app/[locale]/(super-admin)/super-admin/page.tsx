"use client"

import { useUser } from "@clerk/nextjs"
import { useQuery } from "convex/react"

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
  formatSubscriptionStatusLabel,
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
  description,
  title,
}: Readonly<{ description: string; title: string }>) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-16">
      <Card className="w-full">
        <CardHeader>
          <Badge variant="outline" className="w-fit">
            Provider admin
          </Badge>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

export default function SuperAdminPage() {
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
        title="SaaS provider admin panel"
        description="Loading platform oversight data..."
      />
    )
  }

  if (!canAccess) {
    return (
      <SuperAdminStateCard
        title="Restricted provider workspace"
        description="This route is reserved for the WardOS super admin account."
      />
    )
  }

  if (organizations === undefined) {
    return (
      <SuperAdminStateCard
        title="SaaS provider admin panel"
        description="Loading organization billing and patient metrics..."
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
            <Badge variant="outline">Super Admin</Badge>
            <Badge variant="secondary">Commercial oversight</Badge>
          </div>
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">
                WardOS tenant dashboard
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                Review clinic usage, subscription health, and PLG conversion signals
                across the entire commercial footprint.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl border px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Clinics
                </p>
                <p className="mt-2 text-2xl font-semibold">{organizations.length}</p>
              </div>
              <div className="rounded-xl border px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Active
                </p>
                <p className="mt-2 text-2xl font-semibold">{activeOrganizations}</p>
              </div>
              <div className="rounded-xl border px-4 py-3">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">
                  Patients
                </p>
                <p className="mt-2 text-2xl font-semibold">{totalPatients}</p>
              </div>
            </div>
          </div>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Tenant clinics</CardTitle>
            <CardDescription>
              All organizations, commercial status, and live patient counts from
              the product-led growth layer.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>
                {organizations.length > 0
                  ? "Commercial overview across all tenant clinics."
                  : "No organizations have been provisioned yet."}
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Clinic</TableHead>
                  <TableHead>Clerk Org ID</TableHead>
                  <TableHead>Patients</TableHead>
                  <TableHead>Subscription</TableHead>
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
                        {formatSubscriptionStatusLabel(
                          organization.subscriptionStatus
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
