"use client"

import { useLocale, useTranslations } from "next-intl"

import { formatCompactBedDisplay } from "@/lib/ward-layout"
import { STAGING_BED_ID } from "@/lib/patient-privacy"
import type { VisitSheetEntry } from "@/lib/visit-sheet"
import type { AppLocale } from "@/i18n/routing"

type PrintableVisitSheetProps = {
  patients: VisitSheetEntry[]
}

type PrintT = ReturnType<typeof useTranslations<"PrintableVisitSheet">>

function printSideLabel(side: string, t: PrintT): string {
  switch (side) {
    case "right":
      return t("printSides.right")
    case "left":
      return t("printSides.left")
    case "bilateral":
      return t("printSides.bilateral")
    default:
      return side
  }
}

function printThoracicTypeLabel(type: string, t: PrintT): string {
  switch (type) {
    case "chest_tube":
      return t("printThoracicTypes.chest_tube")
    case "drain":
      return t("printThoracicTypes.drain")
    default:
      return type
  }
}

function printCultureLabel(type: string, t: PrintT): string {
  switch (type) {
    case "blood_culture":
      return t("cultureTypes.blood_culture")
    case "urine_culture":
      return t("cultureTypes.urine_culture")
    case "sputum_culture":
      return t("cultureTypes.sputum_culture")
    case "fluid_culture":
      return t("cultureTypes.fluid_culture")
    case "fluid_biochemistry":
      return t("cultureTypes.fluid_biochemistry")
    case "cytology":
      return t("cultureTypes.cytology")
    default:
      return type
  }
}

function formatInterventionSummary(
  interventions: VisitSheetEntry["interventions"],
  t: PrintT
): string {
  const active = interventions.filter((i) => i.isActive)
  if (active.length === 0) return ""

  return active
    .map((i) => {
      const side = printSideLabel(i.side, t)
      const type = printThoracicTypeLabel(i.type, t)
      const dayBadge = t("dayBadge", { day: i.dayCount })
      const drainage =
        i.latestDrainage !== undefined
          ? t("drainagePart", { value: i.latestDrainage })
          : ""
      return t("interventionSummary", {
        side,
        type,
        size: i.size,
        dayBadge,
        drainage,
      })
    })
    .join("\n")
}

function formatAntibioticSummary(
  antibiotics: VisitSheetEntry["antibiotics"],
  t: PrintT
): string {
  const active = antibiotics.filter((a) => a.isActive)
  if (active.length === 0) return ""

  return active
    .map((a) =>
      t("antibioticSummary", {
        name: a.name,
        dayBadge: t("dayBadge", { day: a.dayCount }),
      })
    )
    .join(", ")
}

function formatPendingCulturesSummary(
  cultures: VisitSheetEntry["pendingCultures"],
  t: PrintT
): string {
  if (cultures.length === 0) return ""

  return cultures.map((c) => printCultureLabel(c.type, t)).join(", ")
}

function formatVitalsSummary(
  vitals: VisitSheetEntry["vitals"],
  t: PrintT
): string {
  if (!vitals) return ""

  const alerts: string[] = []
  if (vitals.isFebrile) {
    alerts.push(
      t("vitals.alertFebrile", { temperature: vitals.temperature ?? 0 })
    )
  }
  if (vitals.isHypoxic) {
    alerts.push(t("vitals.alertHypoxic", { spO2: vitals.spO2 ?? 0 }))
  }
  if (vitals.isTachycardic) {
    alerts.push(t("vitals.alertTachycardic", { pulse: vitals.pulse ?? 0 }))
  }

  if (alerts.length > 0) {
    return alerts.join(" ")
  }

  return t("vitals.line", {
    bloodPressure: vitals.bloodPressure ?? "—",
    pulse: vitals.pulse ?? "—",
    spO2: vitals.spO2 ?? "—",
  })
}

function formatTodosSummary(
  customTodos: VisitSheetEntry["customTodos"]
): string {
  const todos = customTodos ?? []
  const pending = todos.filter((todo) => !todo.completed)

  if (pending.length === 0) return ""

  return pending.map((todo) => `• ${todo.text}`).join("\n")
}

export function PrintableVisitSheet({
  patients,
}: Readonly<PrintableVisitSheetProps>) {
  const t = useTranslations("PrintableVisitSheet")
  const locale = useLocale() as AppLocale
  const localeTag = locale === "tr" ? "tr-TR" : "en-US"
  const today = new Date().toLocaleDateString(localeTag, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })

  return (
    <>
      <div className="hidden items-end justify-between pb-3 text-black print:flex print:w-full">
        <div>
          <h1 className="text-lg font-bold">{t("title")}</h1>
          <p className="text-[10px]">{t("description")}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-medium">{today}</p>
          <p className="text-[10px]">{t("patients", { count: patients.length })}</p>
        </div>
      </div>

      <table className="hidden w-full border-collapse text-[10px] leading-tight text-black print:table print:break-inside-auto">
        <thead>
          <tr className="bg-gray-100 print:bg-gray-100">
            <th className="w-[10%] border border-black px-1.5 py-1.5 text-left text-[9px] font-bold uppercase">
              {t("headers.bed")}
            </th>
            <th className="w-[15%] border border-black px-1.5 py-1.5 text-left text-[9px] font-bold uppercase">
              {t("headers.fullName")}
            </th>
            <th className="w-[18%] border border-black px-1.5 py-1.5 text-left text-[9px] font-bold uppercase">
              {t("headers.diagnosis")}
            </th>
            <th className="w-[14%] border border-black px-1.5 py-1.5 text-left text-[9px] font-bold uppercase">
              {t("headers.clinicalStatus")}
            </th>
            <th className="w-[16%] border border-black px-1.5 py-1.5 text-left text-[9px] font-bold uppercase">
              {t("headers.tubesDrains")}
            </th>
            <th className="w-[13%] border border-black px-1.5 py-1.5 text-left text-[9px] font-bold uppercase">
              {t("headers.medsLab")}
            </th>
            <th className="w-[14%] border border-black px-1.5 py-1.5 text-left text-[9px] font-bold uppercase">
              {t("headers.todoNotes")}
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

              const interventionText = formatInterventionSummary(
                patient.interventions,
                t
              )
              const antibioticText = formatAntibioticSummary(
                patient.antibiotics,
                t
              )
              const cultureText = formatPendingCulturesSummary(
                patient.pendingCultures,
                t
              )
              const vitalsText = formatVitalsSummary(patient.vitals, t)
              const todosText = formatTodosSummary(patient.customTodos)

              const medsLabContent = [antibioticText, cultureText].filter(Boolean).join("\n")

              return (
                <tr
                  key={patient.id}
                  className="align-top print:break-inside-avoid"
                >
                  <td className="border border-black px-1.5 py-1.5">
                    <div className="font-bold">{localizedBedLabel}</div>
                    <div className="text-[9px] text-gray-600">{patient.daySummary}</div>
                  </td>
                  <td className="border border-black px-1.5 py-1.5">
                    <div className="font-medium">{patient.fullName || patient.initials}</div>
                    <div className="text-[9px] text-gray-500">{patient.identifierCode}</div>
                  </td>
                  <td className="border border-black px-1.5 py-1.5">
                    <div>{patient.diagnosis}</div>
                    {patient.procedureName && (
                      <div className="mt-0.5 text-[9px] font-medium text-gray-700">
                        {t("procedureBadge", { procedure: patient.procedureName })}
                      </div>
                    )}
                  </td>
                  <td className="border border-black px-1.5 py-1.5">
                    {vitalsText ? (
                      <div
                        className={
                          patient.vitals?.isFebrile ||
                          patient.vitals?.isHypoxic ||
                          patient.vitals?.isTachycardic
                            ? "font-bold"
                            : ""
                        }
                      >
                        {vitalsText}
                      </div>
                    ) : (
                      <div className="text-gray-400">—</div>
                    )}
                  </td>
                  <td className="border border-black px-1.5 py-1.5">
                    {interventionText ? (
                      <div className="whitespace-pre-line">{interventionText}</div>
                    ) : (
                      <div className="text-gray-400">—</div>
                    )}
                  </td>
                  <td className="border border-black px-1.5 py-1.5">
                    {medsLabContent ? (
                      <div className="whitespace-pre-line">{medsLabContent}</div>
                    ) : (
                      <div className="text-gray-400">—</div>
                    )}
                  </td>
                  <td className="min-h-[40px] border border-black px-1.5 py-1.5">
                    {todosText ? (
                      <div className="whitespace-pre-line text-[9px]">{todosText}</div>
                    ) : null}
                  </td>
                </tr>
              )
            })
          ) : (
            <tr>
              <td className="border border-black px-2 py-6 text-center" colSpan={7}>
                {t("empty")}
              </td>
            </tr>
          )}
        </tbody>
      </table>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 8mm;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print\\:break-inside-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .print\\:break-inside-auto {
            break-inside: auto;
          }
        }
      `}</style>
    </>
  )
}
