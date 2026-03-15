"use client"

import { useMemo } from "react"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { Printer } from "lucide-react"

import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { VisitRoundsCard } from "@/components/molecules/visit-rounds-card"
import { PrintableVisitSheet } from "@/components/organisms/printable-visit-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useLocalRoster } from "@/hooks/useLocalRoster"
import { getTotalBedCapacity } from "@/lib/clinic-settings"
import { buildVisitSheetEntries } from "@/lib/visit-sheet"

type PatientRecord = Doc<"patients">

type VisitMetricCardProps = {
  label: string
  value: number
}

function VisitMetricCard({ label, value }: Readonly<VisitMetricCardProps>) {
  return (
    <div className="rounded-xl border bg-background px-4 py-4 shadow-xs">
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}

type VisitStateCardProps = {
  description: string
  title: string
}

function VisitStateCard({
  description,
  title,
}: Readonly<VisitStateCardProps>) {
  return (
    <Card className="print:hidden">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  )
}

export default function VisitModePage() {
  const { entryCount, getFullPatientName } = useLocalRoster()
  const { isLoaded, orgId } = useAuth()
  const settings = useQuery(
    api.clinicSettings.getClinicSettings,
    orgId ? { organizationId: orgId } : "skip"
  )
  const patients = useQuery(
    api.patients.getPatientsByOrganization,
    orgId ? { organizationId: orgId } : "skip"
  ) as PatientRecord[] | undefined

  const visitEntries = useMemo(
    () =>
      buildVisitSheetEntries({
        getFullPatientName,
        patients: patients ?? [],
        wardLayout: settings?.wardLayout ?? [],
      }),
    [getFullPatientName, patients, settings?.wardLayout]
  )
  const totalBeds = useMemo(
    () => getTotalBedCapacity(settings?.wardLayout ?? []),
    [settings?.wardLayout]
  )

  if (!isLoaded) {
    return (
      <VisitStateCard
        title="Visit Mode"
        description="Loading organization context for mobile rounds..."
      />
    )
  }

  if (!orgId) {
    return (
      <VisitStateCard
        title="Visit Mode"
        description="Select a clinic organization to load the current rounding list."
      />
    )
  }

  if (settings === undefined || patients === undefined) {
    return (
      <VisitStateCard
        title="Visit Mode"
        description="Loading patients and clinic settings for visit-sheet generation..."
      />
    )
  }

  const usesWardLayoutOrder = settings.wardLayout.length > 0

  return (
    <div className="grid gap-6 pb-24 print:block print:pb-0 sm:pb-0">
      <section className="grid gap-4 rounded-2xl border bg-background p-6 shadow-xs print:hidden lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">Phase 6</Badge>
            <Badge variant="secondary">Visit Mode & Print</Badge>
            <Badge variant="outline">
              {usesWardLayoutOrder ? "Ward layout order applied" : "Natural bed order fallback"}
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Mobile clinical rounds
            </h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              Large on-screen cards keep bedside review readable, while print mode
              swaps to a dense black-and-white A4 visit sheet.
            </p>
          </div>
        </div>

        <Button
          type="button"
          size="lg"
          className="hidden sm:inline-flex"
          onClick={() => window.print()}
        >
          <Printer className="size-4" />
          Print Visit Sheet
        </Button>
      </section>

      <section className="grid gap-3 print:hidden sm:grid-cols-3">
        <VisitMetricCard label="Patients" value={visitEntries.length} />
        <VisitMetricCard label="Configured Beds" value={totalBeds} />
        <VisitMetricCard label="Local Roster Names" value={entryCount} />
      </section>

      {visitEntries.length > 0 ? (
        <section className="grid gap-4 print:hidden">
          {visitEntries.map((entry) => (
            <VisitRoundsCard key={entry.id} entry={entry} />
          ))}
        </section>
      ) : (
        <Card className="print:hidden">
          <CardHeader>
            <CardTitle>No patients on the current rounding list</CardTitle>
            <CardDescription>
              Add patient records in the census first, then print the visit sheet
              when the list is ready for rounds.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              If a ward layout has not been configured yet, the list will fall back
              to natural bed sorting.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="fixed inset-x-4 bottom-4 z-30 sm:hidden print:hidden">
        <Button
          type="button"
          size="lg"
          className="w-full rounded-full shadow-lg"
          onClick={() => window.print()}
        >
          <Printer className="size-4" />
          Print Visit Sheet
        </Button>
      </div>

      <PrintableVisitSheet patients={visitEntries} />
    </div>
  )
}
