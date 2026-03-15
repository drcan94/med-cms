"use client"

import type { KeyboardEvent } from "react"
import { useQuery } from "convex/react"

import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { calculateClinicalDays } from "@/hooks/useClinicalDates"
import { useLocalRoster } from "@/hooks/useLocalRoster"
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

function formatClinicalDaySummary(patient: PatientRecord): string {
  const clinicalDays = calculateClinicalDays(
    patient.admissionDate,
    patient.surgeryDate
  )

  return `y:${clinicalDays.admittedDays} / po:${
    clinicalDays.postOpDays ?? "-"
  }`
}

function PatientTableLoading() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Bed</TableHead>
          <TableHead>Patient Name</TableHead>
          <TableHead>Diagnosis</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Status</TableHead>
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
  const { getFullPatientName } = useLocalRoster()
  const patients = useQuery(
    api.patients.getPatientsByOrganization,
    organizationId ? { organizationId } : "skip"
  ) as PatientRecord[] | undefined

  if (!organizationId) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-10 text-sm text-muted-foreground">
        Select a clinic organization to load tenant-isolated patient data.
      </div>
    )
  }

  if (patients === undefined) {
    return <PatientTableLoading />
  }

  if (patients.length === 0) {
    return (
      <div className="rounded-xl border border-dashed px-6 py-10 text-sm text-muted-foreground">
        No patient records have been added for this organization yet.
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
          <TableHead>Bed</TableHead>
          <TableHead>Patient Name</TableHead>
          <TableHead>Diagnosis</TableHead>
          <TableHead>Days</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {patients.map((patient) => {
          const fullPatientName = getFullPatientName(
            patient.initials,
            patient.bedId,
            patient._id
          )
          const showsLocalRosterName = fullPatientName !== patient.initials

          return (
            <TableRow
              key={patient._id}
              role={interactive ? "button" : undefined}
              tabIndex={interactive ? 0 : undefined}
              onClick={interactive ? () => onSelectPatient(patient) : undefined}
              onKeyDown={interactive ? handleRowKeyDown(patient) : undefined}
              className={interactive ? "cursor-pointer" : undefined}
            >
              <TableCell className="font-medium">{patient.bedId}</TableCell>
              <TableCell className="whitespace-normal">
                <div className="flex flex-col gap-1">
                  <span className="font-medium">{fullPatientName}</span>
                  {showsLocalRosterName ? (
                    <span className="text-xs text-muted-foreground">
                      DB initials: {patient.initials}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      Local roster not synced for this bed
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="max-w-sm whitespace-normal text-muted-foreground">
                {patient.diagnosis}
              </TableCell>
              <TableCell>{formatClinicalDaySummary(patient)}</TableCell>
              <TableCell>
                <Badge variant="outline">Workflow rules pending</Badge>
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
