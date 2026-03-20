"use client"

import { useMemo, type KeyboardEvent } from "react"
import { useQuery } from "convex/react"
import { useTranslations } from "next-intl"

import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { calculateClinicalDays } from "@/hooks/useClinicalDates"
import { useLocalRoster } from "@/hooks/useLocalRoster"
import { STAGING_BED_ID } from "@/lib/patient-privacy"
import { buildWardBedMetadata } from "@/lib/ward-layout"
import { getWardMapBedDisplayLabel } from "@/lib/ward-map-display"
import { LocalRosterInfo } from "@/components/molecules/local-roster-info"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

type PatientRecord = Doc<"patients">

type PatientTableProps = {
  interactive?: boolean
  onSelectPatient: (patient: PatientRecord) => void
  organizationId?: string | null
}

function formatClinicalDaySummary(
  patient: PatientRecord,
  t: (key: string, values?: Record<string, number | string>) => string
): string {
  const clinicalDays = calculateClinicalDays(
    patient.admissionDate,
    patient.surgeryDate
  )

  return t("daySummary", {
    admittedDays: clinicalDays.admittedDays,
    postOpDays: clinicalDays.postOpDays ?? "-",
  })
}

function PatientTableLoading({
  t,
}: Readonly<{
  t: (key: string) => string
}>) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("headers.bed")}</TableHead>
          <TableHead>{t("headers.patientName")}</TableHead>
          <TableHead>{t("headers.diagnosis")}</TableHead>
          <TableHead>{t("headers.days")}</TableHead>
          <TableHead>{t("headers.status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }, (_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="h-4 w-12" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-32" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-48" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-4 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-28 rounded-full" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

export function PatientTable({
  interactive = true,
  onSelectPatient,
  organizationId,
}: Readonly<PatientTableProps>) {
  const t = useTranslations("PatientTable")
  const wardMapT = useTranslations("WardMap")
  const { getFullPatientName } = useLocalRoster()
  const clinicSettings = useQuery(
    api.clinicSettings.getClinicSettings,
    organizationId ? { organizationId } : "skip"
  )
  const patients = useQuery(
    api.patients.getPatientsByOrganization,
    organizationId ? { organizationId } : "skip"
  ) as PatientRecord[] | undefined
  const bedMetadata = useMemo(
    () => buildWardBedMetadata(clinicSettings?.wardLayout ?? []),
    [clinicSettings?.wardLayout]
  )

  if (!organizationId) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-10 text-sm text-muted-foreground">
        {t("selectOrganization")}
      </div>
    )
  }

  if (patients === undefined) {
    return <PatientTableLoading t={t} />
  }

  if (patients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-10 text-sm text-muted-foreground">
        {t("empty")}
      </div>
    )
  }

  const handleRowKeyDown =
    (patient: PatientRecord) => (event: KeyboardEvent<HTMLTableRowElement>) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        onSelectPatient(patient)
      }
    }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{t("headers.bed")}</TableHead>
          <TableHead>{t("headers.patientName")}</TableHead>
          <TableHead>{t("headers.diagnosis")}</TableHead>
          <TableHead>{t("headers.days")}</TableHead>
          <TableHead>{t("headers.status")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => {
          const fullPatientName = getFullPatientName({
            bedId: patient.bedId,
            identifierCode: patient.identifierCode,
            initials: patient.initials,
            patientId: patient._id,
          })
          const showsLocalRosterName = fullPatientName !== patient.initials
          const bedDisplayLabel =
            patient.bedId === STAGING_BED_ID
              ? t("staging")
              : getWardMapBedDisplayLabel(patient.bedId, bedMetadata, wardMapT)

          return (
            <TableRow
              key={patient._id}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={interactive ? () => onSelectPatient(patient) : undefined}
              onKeyDown={interactive ? handleRowKeyDown(patient) : undefined}
              className={interactive ? "cursor-pointer" : undefined}
            >
              <TableCell className="font-medium">
                {bedDisplayLabel}
              </TableCell>
              <TableCell className="whitespace-normal">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-start gap-1">
                    <span className="min-w-0 flex-1 font-medium leading-5">
                      {fullPatientName}
                    </span>
                    {!showsLocalRosterName ? (
                      <LocalRosterInfo
                        className="-mr-1 -mt-0.5"
                        message={t("localRosterNotSynced")}
                      />
                    ) : null}
                  </div>
                  {showsLocalRosterName ? (
                    <span className="text-xs text-muted-foreground">
                      {t("dbInitials", { initials: patient.initials })}
                    </span>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
                {patient.diagnosis}
              </TableCell>
              <TableCell>{formatClinicalDaySummary(patient, t)}</TableCell>
              <TableCell>
                <Badge variant="outline">{t("workflowRulesPending")}</Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
