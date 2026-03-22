"use client"

import { useTranslations } from "next-intl"

import { formatCompactBedDisplay } from "@/lib/ward-layout"
import { STAGING_BED_ID } from "@/lib/patient-privacy"
import type { VisitSheetEntry } from "@/lib/visit-sheet"

type PrintableVisitSheetProps = {
  patients: VisitSheetEntry[]
}

const SIDE_LABELS: Record<string, string> = {
  right: "Sğ",
  left: "Sl",
  bilateral: "Bil",
}

const CULTURE_TYPE_LABELS: Record<string, string> = {
  blood_culture: "Kan K.",
  urine_culture: "İdrar K.",
  sputum_culture: "Balgam K.",
  fluid_culture: "Sıvı K.",
  fluid_biochemistry: "Sıvı BK",
  cytology: "Sitoloji",
}

function formatInterventionSummary(
  interventions: VisitSheetEntry["interventions"]
): string {
  const active = interventions.filter((i) => i.isActive)
  if (active.length === 0) return ""

  return active
    .map((i) => {
      const side = SIDE_LABELS[i.side] ?? i.side
      const type = i.type === "chest_tube" ? "Tüp" : "Dren"
      const drainage = i.latestDrainage !== undefined ? ` ${i.latestDrainage}cc` : ""
      return `${side} ${type} ${i.size} (G${i.dayCount})${drainage}`
    })
    .join("\n")
}

function formatAntibioticSummary(
  antibiotics: VisitSheetEntry["antibiotics"]
): string {
  const active = antibiotics.filter((a) => a.isActive)
  if (active.length === 0) return ""

  return active.map((a) => `${a.name} G${a.dayCount}`).join(", ")
}

function formatPendingCulturesSummary(
  cultures: VisitSheetEntry["pendingCultures"]
): string {
  if (cultures.length === 0) return ""

  return cultures.map((c) => CULTURE_TYPE_LABELS[c.type] ?? c.type).join(", ")
}

function formatVitalsSummary(vitals: VisitSheetEntry["vitals"]): string {
  if (!vitals) return ""

  const alerts: string[] = []
  if (vitals.isFebrile) alerts.push(`T:${vitals.temperature}°`)
  if (vitals.isHypoxic) alerts.push(`SpO2:${vitals.spO2}%`)
  if (vitals.isTachycardic) alerts.push(`P:${vitals.pulse}`)

  if (alerts.length > 0) {
    return alerts.join(" ")
  }

  return `${vitals.bloodPressure} P:${vitals.pulse} SpO2:${vitals.spO2}%`
}

function formatTodosSummary(
  customTodos: VisitSheetEntry["customTodos"]
): string {
  const todos = customTodos ?? []
  const pending = todos.filter((t) => !t.completed)

  if (pending.length === 0) return ""

  return pending.map((t) => `• ${t.text}`).join("\n")
}

export function PrintableVisitSheet({
  patients,
}: Readonly<PrintableVisitSheetProps>) {
  const t = useTranslations("PrintableVisitSheet")
  const today = new Date().toLocaleDateString("tr-TR", {
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

              const interventionText = formatInterventionSummary(patient.interventions)
              const antibioticText = formatAntibioticSummary(patient.antibiotics)
              const cultureText = formatPendingCulturesSummary(patient.pendingCultures)
              const vitalsText = formatVitalsSummary(patient.vitals)
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
                        Op: {patient.procedureName}
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
