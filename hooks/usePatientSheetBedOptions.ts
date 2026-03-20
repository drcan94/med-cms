"use client"

import { useMemo } from "react"
import type { useTranslations } from "next-intl"

import type { Doc } from "@/convex/_generated/dataModel"
import type { WardRoom } from "@/lib/clinic-settings"
import { buildPatientBedOptions } from "@/lib/patient-bed-options"
import { buildWardBedMetadata, formatCompactBedDisplay } from "@/lib/ward-layout"

type PatientRecord = Doc<"patients">
type PatientSheetT = ReturnType<typeof useTranslations<"PatientSheet">>

export function usePatientSheetBedOptions({
  currentPatient,
  patients,
  t,
  wardLayout,
}: Readonly<{
  currentPatient: PatientRecord | null
  patients: PatientRecord[] | undefined
  t: PatientSheetT
  wardLayout: WardRoom[] | undefined
}>) {
  const bedMetadata = useMemo(
    () => buildWardBedMetadata(wardLayout ?? []),
    [wardLayout]
  )

  return useMemo(
    () =>
      buildPatientBedOptions({
        currentPatient,
        currentBedLabel: (bedId) => {
          const bed = bedMetadata.get(bedId)

          if (!bed) {
            return t("fields.bedId.options.currentBed")
          }

          return formatCompactBedDisplay(
            bed.roomName,
            bed.bedNumber,
            bed.roomBedCount,
            t("fields.bedId.options.bedLabel", { number: bed.bedNumber })
          )
        },
        formatBedLabel: (roomName, bedNumber, roomBedCount) => {
          return formatCompactBedDisplay(
            roomName,
            bedNumber,
            roomBedCount,
            t("fields.bedId.options.bedLabel", { number: bedNumber })
          )
        },
        patients,
        stagingLabel: t("fields.bedId.options.staging"),
        wardLayout,
      }),
    [bedMetadata, currentPatient, patients, t, wardLayout]
  )
}
