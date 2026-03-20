"use client"

import { ClipboardCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

type PatientClinicalRequirementsAlertProps = {
  items: string[]
}

export function PatientClinicalRequirementsAlert({
  items,
}: Readonly<PatientClinicalRequirementsAlertProps>) {
  const t = useTranslations("PatientSheet")

  if (items.length === 0) {
    return null
  }

  return (
    <Alert
      variant="default"
      className="border-amber-500/50 bg-amber-50 text-amber-950 dark:border-amber-500/40 dark:bg-amber-950/40 dark:text-amber-50"
    >
      <ClipboardCheck className="size-5 text-amber-600 dark:text-amber-400" />
      <AlertTitle className="font-semibold text-amber-900 dark:text-amber-100">
        {t("clinicalRequirements.banner", { items: "" }).replace(": ", "")}
      </AlertTitle>
      <AlertDescription className="text-sm leading-6 text-amber-800 dark:text-amber-200">
        {items.join(" • ")}
      </AlertDescription>
    </Alert>
  )
}
