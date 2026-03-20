"use client"

import { useMemo } from "react"
import { useQuery } from "convex/react"
import { useLocale, useTranslations } from "next-intl"

import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { usePatientSheetBedOptions } from "@/hooks/usePatientSheetBedOptions"
import { usePatientSheetForm } from "@/hooks/usePatientSheetForm"
import type { AppLocale } from "@/i18n/routing"
import { parseConventionRules } from "@/lib/clinic-settings"
import { toClinicalIsoDate } from "@/lib/patient-form"
import { STAGING_BED_ID, generatePatientInitials } from "@/lib/patient-privacy"
import { evaluatePatientRules } from "@/lib/rule-engine"
import { PatientClinicalRequirementsAlert } from "@/components/molecules/patient-clinical-requirements-alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

type PatientRecord = Doc<"patients">
export type PatientSheetFormProps = {
  onOpenChange: (open: boolean) => void
  open: boolean
  organizationId?: string | null
  patient: PatientRecord | null
  userId?: string | null
}

export function PatientSheetForm({
  onOpenChange,
  open,
  organizationId,
  patient,
  userId,
}: Readonly<PatientSheetFormProps>) {
  const locale = useLocale() as AppLocale
  const t = useTranslations("PatientSheet")
  const clinicSettings = useQuery(
    api.clinicSettings.getClinicSettings,
    open && organizationId ? { organizationId } : "skip"
  )
  const patients = useQuery(
    api.patients.getPatientsByOrganization,
    open && organizationId ? { organizationId } : "skip"
  ) as PatientRecord[] | undefined
  const {
    formState,
    handleFieldChange,
    handleValueChange,
    handleSubmit,
    isEditing,
    isSaving,
  } = usePatientSheetForm({
    onOpenChange,
    organizationId,
    patient,
    userId,
  })
  const conventionRules = useMemo(
    () => parseConventionRules(clinicSettings?.conventions),
    [clinicSettings?.conventions]
  )
  const matchedClinicalItems = useMemo(
    () =>
      evaluatePatientRules(
        {
          diagnosis: formState.diagnosis,
          surgeryDate: formState.surgeryDate.trim()
            ? toClinicalIsoDate(formState.surgeryDate.trim())
            : undefined,
        },
        conventionRules
      ),
    [conventionRules, formState.diagnosis, formState.surgeryDate]
  )
  const initialsPreview =
    formState.fullName.trim().length > 0
      ? generatePatientInitials(formState.fullName, locale)
      : patient?.initials ?? ""
  const bedOptions = usePatientSheetBedOptions({
    currentPatient: patient,
    patients,
    t,
    wardLayout: clinicSettings?.wardLayout,
  })

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <SheetHeader className="border-b">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{t(isEditing ? "badges.editing" : "badges.new")}</Badge>
          <Badge variant="secondary">{t("badges.privacy")}</Badge>
        </div>
        <SheetTitle>{t(isEditing ? "titles.editing" : "titles.new")}</SheetTitle>
        <SheetDescription className="leading-6">{t("description")}</SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">{t("fields.fullName.label")}</Label>
            <Input
              id="fullName"
              value={formState.fullName}
              onChange={handleFieldChange("fullName")}
              placeholder={t("fields.fullName.placeholder")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="initials">{t("fields.initials.label")}</Label>
            <Input
              id="initials"
              value={initialsPreview}
              placeholder={t("fields.initials.placeholder")}
              readOnly
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="identifierCode">{t("fields.identifierCode.label")}</Label>
            <Input
              id="identifierCode"
              value={formState.identifierCode}
              onChange={handleFieldChange("identifierCode")}
              placeholder={t("fields.identifierCode.placeholder")}
              autoCapitalize="characters"
              autoComplete="off"
              maxLength={4}
              required
            />
            <p className="text-xs leading-5 text-muted-foreground">
              {t("fields.identifierCode.description")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="bedId">{t("fields.bedId.label")}</Label>
            <Select
              value={formState.bedId || STAGING_BED_ID}
              onValueChange={handleValueChange("bedId")}
            >
              <SelectTrigger id="bedId">
                <SelectValue placeholder={t("fields.bedId.placeholder")} />
              </SelectTrigger>
              <SelectContent>
                {bedOptions.map((bed) => (
                  <SelectItem key={bed.value} value={bed.value}>
                    {bed.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs leading-5 text-muted-foreground">
              {t("fields.bedId.description")}
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="serviceName">{t("fields.serviceName.label")}</Label>
            <Input
              id="serviceName"
              value={formState.serviceName}
              onChange={handleFieldChange("serviceName")}
              placeholder={t("fields.serviceName.placeholder")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="diagnosis">{t("fields.diagnosis.label")}</Label>
          <Textarea
            id="diagnosis"
            value={formState.diagnosis}
            onChange={handleFieldChange("diagnosis")}
            placeholder={t("fields.diagnosis.placeholder")}
          />
        </div>

        <PatientClinicalRequirementsAlert items={matchedClinicalItems} />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="admissionDate">{t("fields.admissionDate.label")}</Label>
            <Input
              id="admissionDate"
              type="date"
              value={formState.admissionDate}
              onChange={handleFieldChange("admissionDate")}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="surgeryDate">{t("fields.surgeryDate.label")}</Label>
            <Input
              id="surgeryDate"
              type="date"
              value={formState.surgeryDate}
              onChange={handleFieldChange("surgeryDate")}
            />
          </div>
        </div>

        <div className="rounded-xl border border-dashed px-4 py-3 text-xs leading-6 text-muted-foreground">
          {t("privacyNote")}
        </div>
      </div>

      <SheetFooter className="border-t">
        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
          {t("actions.cancel")}
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? t("actions.saving")
            : t(isEditing ? "actions.saveChanges" : "actions.createPatient")}
        </Button>
      </SheetFooter>
    </form>
  )
}
