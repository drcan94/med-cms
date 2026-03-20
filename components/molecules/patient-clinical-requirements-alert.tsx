"use client"

import { useTranslations } from "next-intl"

import { Alert, AlertDescription } from "@/components/ui/alert"

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
      className="border-amber-500/40 bg-amber-50 text-amber-950 dark:border-amber-500/30 dark:bg-amber-950/35 dark:text-amber-50"
    >
      <AlertDescription className="text-sm font-medium leading-6 text-inherit">
        {t("clinicalRequirements.banner", { items: items.join(", ") })}
      </AlertDescription>
    </Alert>
  )
}
