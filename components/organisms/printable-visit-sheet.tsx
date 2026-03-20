"use client"

import { useTranslations } from "next-intl"

import { formatCompactBedDisplay } from "@/lib/ward-layout"
import { STAGING_BED_ID } from "@/lib/patient-privacy"
import type { VisitSheetEntry } from "@/lib/visit-sheet"

type PrintableVisitSheetProps = {
  patients: VisitSheetEntry[]
}

export function PrintableVisitSheet({
  patients,
}: Readonly<PrintableVisitSheetProps>) {
  const t = useTranslations("PrintableVisitSheet")

  return (
    <>
      <div className="hidden items-end justify-between pb-4 text-black print:flex">
        <div>
          <h1 className="text-xl font-semibold">{t("title")}</h1>
          <p className="text-sm">{t("description")}</p>
        </div>
        <p className="text-sm">{t("patients", { count: patients.length })}</p>
      </div>

      <table className="hidden w-full border-collapse text-[11px] leading-4 text-black print:table">
        <thead>
          <tr>
            <th className="w-[13%] border border-black px-2 py-2 text-left font-semibold uppercase">
              {t("headers.bed")}
            </th>
            <th className="w-[24%] border border-black px-2 py-2 text-left font-semibold uppercase">
              {t("headers.fullName")}
            </th>
            <th className="w-[12%] border border-black px-2 py-2 text-left font-semibold uppercase">
              {t("headers.days")}
            </th>
            <th className="w-[23%] border border-black px-2 py-2 text-left font-semibold uppercase">
              {t("headers.diagnosis")}
            </th>
            <th className="w-[14%] border border-black px-2 py-2 text-left font-semibold uppercase">
              {t("headers.drainsFluids")}
            </th>
            <th className="w-[14%] border border-black px-2 py-2 text-left font-semibold uppercase">
              {t("headers.notes")}
            </th>
          </tr>
        </thead>

        <tbody>
          {patients.length > 0 ? (
            patients.map((patient) => {
              const localizedBedLabel =
                patient.bedId === STAGING_BED_ID
                  ? t("staging")
                  : typeof patient.bedNumber === "number"
                    ? formatCompactBedDisplay(
                        patient.roomName ?? "",
                        patient.bedNumber,
                        patient.roomBedCount ?? 0,
                        t("bedLabel", { number: patient.bedNumber })
                      )
                    : patient.bedDisplay

              return (
                <tr key={patient.id} className="align-top [page-break-inside:avoid]">
                  <td className="border border-black px-2 py-2 font-semibold">
                    {localizedBedLabel}
                  </td>
                  <td className="border border-black px-2 py-2">{patient.fullName}</td>
                  <td className="border border-black px-2 py-2">{patient.daySummary}</td>
                  <td className="border border-black px-2 py-2">{patient.diagnosis}</td>
                  <td className="h-14 border border-black px-2 py-2" />
                  <td className="h-14 border border-black px-2 py-2" />
                </tr>
              )
            })
          ) : (
            <tr>
              <td className="border border-black px-2 py-6 text-center" colSpan={6}>
                {t("empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}
