"use client"

import { useMemo } from "react"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { AlertTriangle, Printer, Stethoscope, Syringe } from "lucide-react"
import { useTranslations } from "next-intl"

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
  icon?: React.ReactNode
  label: string
  value: number
  variant?: "default" | "warning"
}

function VisitMetricCard({
  icon,
  label,
  value,
  variant = "default",
}: Readonly<VisitMetricCardProps>) {
  return (
    <div
      className={`rounded-xl border px-4 py-4 shadow-xs ${
        variant === "warning"
          ? "border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20"
          : "bg-background"
      }`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
          {label}
        </p>
      </div>
      <p className="mt-3 text-3xl font-semibold tracking-tight">{value}</p>
    </div>
  )
}

type VisitStateCardProps = {
  description: string
  title: string
}

function VisitStateCard({ description, title }: Readonly<VisitStateCardProps>) {
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
  const t = useTranslations("VisitPage")
  const { getFullPatientName } = useLocalRoster()
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

  const clinicalSummary = useMemo(() => {
    let activeTubes = 0
    let activeAntibiotics = 0
    let patientsWithAlerts = 0

    for (const entry of visitEntries) {
      activeTubes += entry.interventions.filter((i) => i.isActive).length
      activeAntibiotics += entry.antibiotics.filter((a) => a.isActive).length

      if (entry.vitals?.isFebrile || entry.vitals?.isHypoxic || entry.vitals?.isTachycardic) {
        patientsWithAlerts++
      }
    }

    return { activeTubes, activeAntibiotics, patientsWithAlerts }
  }, [visitEntries])

  if (!isLoaded) {
    return (
      <VisitStateCard title={t("state.title")} description={t("state.loadingOrganization")} />
    )
  }

  if (!orgId) {
    return (
      <VisitStateCard title={t("state.title")} description={t("state.selectOrganization")} />
    )
  }

  if (settings === undefined || patients === undefined) {
    return (
      <VisitStateCard title={t("state.title")} description={t("state.loadingVisitSheet")} />
    )
  }

  const usesWardLayoutOrder = settings.wardLayout.length > 0

  return (
    <div className="grid gap-6 pb-24 print:block print:gap-0 print:pb-0 sm:pb-0">
      <section className="grid gap-4 rounded-2xl border bg-background p-6 shadow-xs print:hidden lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{t("phaseBadge")}</Badge>
            <Badge variant="secondary">{t("featureBadge")}</Badge>
            <Badge variant="outline">
              {usesWardLayoutOrder ? t("orderApplied") : t("orderFallback")}
            </Badge>
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("title")}</h1>
            <p className="max-w-3xl text-base leading-7 text-muted-foreground">
              {t("description")}
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
          {t("print")}
        </Button>
      </section>

      <section className="grid gap-3 print:hidden sm:grid-cols-2 lg:grid-cols-5">
        <VisitMetricCard
          icon={<Stethoscope className="size-4 text-muted-foreground" />}
          label={t("metrics.patients")}
          value={visitEntries.length}
        />
        <VisitMetricCard label={t("metrics.configuredBeds")} value={totalBeds} />
        <VisitMetricCard
          icon={<Syringe className="size-4 text-emerald-600" />}
          label={t("metrics.activeTubes")}
          value={clinicalSummary.activeTubes}
        />
        <VisitMetricCard label={t("metrics.activeAntibiotics")} value={clinicalSummary.activeAntibiotics} />
        {clinicalSummary.patientsWithAlerts > 0 && (
          <VisitMetricCard
            icon={<AlertTriangle className="size-4 text-amber-600" />}
            label={t("metrics.vitalsAlerts")}
            value={clinicalSummary.patientsWithAlerts}
            variant="warning"
          />
        )}
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
            <CardTitle>{t("empty.title")}</CardTitle>
            <CardDescription>{t("empty.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{t("empty.note")}</p>
          </CardContent>
        </Card>
      )}

      <div className="fixed inset-x-4 bottom-4 z-30 print:hidden sm:hidden">
        <Button
          type="button"
          size="lg"
          className="w-full rounded-full shadow-lg"
          onClick={() => window.print()}
        >
          <Printer className="size-4" />
          {t("print")}
        </Button>
      </div>

      <PrintableVisitSheet patients={visitEntries} />
    </div>
  )
}
