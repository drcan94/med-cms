"use client"

import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { usePatientSheetBedOptions } from "@/hooks/usePatientSheetBedOptions"
import { usePatientSheetForm } from "@/hooks/usePatientSheetForm"
import type { AppLocale } from "@/i18n/routing"
import { parseConventionRules } from "@/lib/clinic-settings"
import { STAGING_BED_ID, generatePatientInitials } from "@/lib/patient-privacy"
import { evaluatePatientRules } from "@/lib/rule-engine"
import { PatientClinicalRequirementsAlert } from "@/components/molecules/patient-clinical-requirements-alert"
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
  const [loadingItem, setLoadingItem] = useState<string | null>(null)
  const toggleRequirement = useMutation(api.patients.toggleClinicalRequirement)
  const addTodo = useMutation(api.patients.addCustomTodo)
  const toggleTodo = useMutation(api.patients.toggleCustomTodo)
  const deleteTodo = useMutation(api.patients.deleteCustomTodo)
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
          procedureName: formState.procedureName.trim() || undefined,
        },
        conventionRules
      ),
    [conventionRules, formState.diagnosis, formState.procedureName]
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

  const handleToggleRequirement = async (item: string, completed: boolean) => {
    if (!patient || !organizationId || !userId) {
      toast.error(t("toasts.missingContext"))
      return
    }

    setLoadingItem(item)

    try {
      await toggleRequirement({
        completed,
        item,
        organizationId,
        patientId: patient._id,
        userId,
      })
      toast.success(
        completed
          ? t("clinicalRequirements.toasts.completed", { item })
          : t("clinicalRequirements.toasts.uncompleted", { item })
      )
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("clinicalRequirements.toasts.error")
      )
    } finally {
      setLoadingItem(null)
    }
  }

  const handleAddTodo = async (text: string) => {
    if (!patient || !organizationId || !userId) {
      toast.error(t("toasts.missingContext"))
      return
    }

    try {
      await addTodo({
        organizationId,
        patientId: patient._id,
        text,
        userId,
      })
      toast.success(t("clinicalRequirements.toasts.todoAdded"))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("clinicalRequirements.toasts.error")
      )
    }
  }

  const handleToggleTodo = async (todoId: string, completed: boolean) => {
    if (!patient || !organizationId || !userId) {
      toast.error(t("toasts.missingContext"))
      return
    }

    setLoadingItem(todoId)

    try {
      await toggleTodo({
        completed,
        organizationId,
        patientId: patient._id,
        todoId,
        userId,
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("clinicalRequirements.toasts.error")
      )
    } finally {
      setLoadingItem(null)
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    if (!patient || !organizationId || !userId) {
      toast.error(t("toasts.missingContext"))
      return
    }

    setLoadingItem(todoId)

    try {
      await deleteTodo({
        organizationId,
        patientId: patient._id,
        todoId,
        userId,
      })
      toast.success(t("clinicalRequirements.toasts.todoDeleted"))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("clinicalRequirements.toasts.error")
      )
    } finally {
      setLoadingItem(null)
    }
  }

  const hasRequirements = matchedClinicalItems.length > 0 || 
    (patient?.completedRequirements?.length ?? 0) > 0 ||
    (patient?.customTodos?.length ?? 0) > 0 ||
    isEditing

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <SheetHeader className="shrink-0 border-b">
        <SheetTitle>{t(isEditing ? "titles.editing" : "titles.new")}</SheetTitle>
        <SheetDescription className="leading-6">{t("description")}</SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex-1 space-y-4 overflow-y-auto p-4 lg:border-r">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="fullName" className="text-xs">{t("fields.fullName.label")}</Label>
              <Input
                id="fullName"
                value={formState.fullName}
                onChange={handleFieldChange("fullName")}
                placeholder={t("fields.fullName.placeholder")}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="initials" className="text-xs">{t("fields.initials.label")}</Label>
              <Input
                id="initials"
                value={initialsPreview}
                placeholder={t("fields.initials.placeholder")}
                className="h-9 bg-muted/50"
                readOnly
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="identifierCode" className="text-xs">{t("fields.identifierCode.label")}</Label>
              <Input
                id="identifierCode"
                value={formState.identifierCode}
                onChange={handleFieldChange("identifierCode")}
                placeholder={t("fields.identifierCode.placeholder")}
                autoCapitalize="characters"
                autoComplete="off"
                className="h-9"
                maxLength={4}
                required
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="bedId" className="text-xs">{t("fields.bedId.label")}</Label>
              <Select
                value={formState.bedId || STAGING_BED_ID}
                onValueChange={handleValueChange("bedId")}
              >
                <SelectTrigger id="bedId" className="h-9">
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
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="serviceName" className="text-xs">{t("fields.serviceName.label")}</Label>
              <Input
                id="serviceName"
                value={formState.serviceName}
                onChange={handleFieldChange("serviceName")}
                placeholder={t("fields.serviceName.placeholder")}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="procedureName" className="text-xs">{t("fields.procedureName.label")}</Label>
              <Input
                id="procedureName"
                value={formState.procedureName}
                onChange={handleFieldChange("procedureName")}
                placeholder={t("fields.procedureName.placeholder")}
                className="h-9"
              />
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="admissionDate" className="text-xs">{t("fields.admissionDate.label")}</Label>
              <Input
                id="admissionDate"
                type="date"
                value={formState.admissionDate}
                onChange={handleFieldChange("admissionDate")}
                className="h-9"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="surgeryDate" className="text-xs">{t("fields.surgeryDate.label")}</Label>
              <Input
                id="surgeryDate"
                type="date"
                value={formState.surgeryDate}
                onChange={handleFieldChange("surgeryDate")}
                className="h-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="diagnosis" className="text-xs">{t("fields.diagnosis.label")}</Label>
            <Textarea
              id="diagnosis"
              value={formState.diagnosis}
              onChange={handleFieldChange("diagnosis")}
              placeholder={t("fields.diagnosis.placeholder")}
              className="min-h-[80px] resize-none lg:min-h-[100px]"
            />
          </div>

          <div className="lg:hidden">
            <PatientClinicalRequirementsAlert
              completedRequirements={patient?.completedRequirements}
              customTodos={patient?.customTodos}
              items={matchedClinicalItems}
              loading={loadingItem}
              onAddTodo={isEditing ? handleAddTodo : undefined}
              onDeleteTodo={isEditing ? handleDeleteTodo : undefined}
              onToggle={isEditing ? handleToggleRequirement : undefined}
              onToggleTodo={isEditing ? handleToggleTodo : undefined}
            />
          </div>

          <div className="rounded-lg border border-dashed bg-muted/30 px-3 py-2 text-xs leading-5 text-muted-foreground">
            {t("privacyNote")}
          </div>
        </div>

        {hasRequirements ? (
          <div className="hidden w-80 shrink-0 overflow-y-auto bg-muted/20 p-4 lg:block xl:w-96">
            <PatientClinicalRequirementsAlert
              completedRequirements={patient?.completedRequirements}
              customTodos={patient?.customTodos}
              items={matchedClinicalItems}
              loading={loadingItem}
              onAddTodo={isEditing ? handleAddTodo : undefined}
              onDeleteTodo={isEditing ? handleDeleteTodo : undefined}
              onToggle={isEditing ? handleToggleRequirement : undefined}
              onToggleTodo={isEditing ? handleToggleTodo : undefined}
            />
          </div>
        ) : null}
      </div>

      <SheetFooter className="shrink-0 border-t">
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
