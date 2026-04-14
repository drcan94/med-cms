"use client"

import { useMemo, useState } from "react"
import { type FieldErrors, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import { Activity, Pill, Stethoscope, User, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { useLocalRoster } from "@/hooks/useLocalRoster"
import { usePatientSheetBedOptions } from "@/hooks/usePatientSheetBedOptions"
import type { AppLocale } from "@/i18n/routing"
import { parseConventionRules } from "@/lib/clinic-settings"
import { defaultClinicalRules, evaluateClinicalRules } from "@/lib/clinical-rules"
import { formatDateForInput, toClinicalIsoDate } from "@/lib/patient-form"
import { sanitizeIdentifierCodeInput } from "@/lib/patient-identity"
import { generatePatientInitials, STAGING_BED_ID } from "@/lib/patient-privacy"
import { evaluatePatientRules } from "@/lib/rule-engine"
import { patientFormSchema, type PatientFormData } from "@/lib/schemas/patient-form.schema"
import { ClinicalAlertsPanel, ClinicalAlertsSummary } from "@/components/molecules/clinical-alerts-panel"
import { PatientClinicalRequirementsAlert } from "@/components/molecules/patient-clinical-requirements-alert"
import {
  BasicInfoSection,
  MedicationsLabsSection,
  ThoracicInterventionsSection,
  VitalsAnamnesisSection,
} from "@/components/organisms/patient-form-sections"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type PatientRecord = Doc<"patients">
type PatientFormTab = "basic" | "clinical" | "thoracic" | "meds"

type FlattenedFormError = {
  message: string
  path: string
}

const FORM_ERROR_META_KEYS = new Set(["message", "type", "ref", "types"])

function collectFormErrors(node: unknown, basePath = ""): FlattenedFormError[] {
  if (!node || typeof node !== "object") {
    return []
  }

  const record = node as Record<string, unknown>
  const errors: FlattenedFormError[] = []

  if (basePath && typeof record.message === "string" && record.message.trim()) {
    errors.push({
      message: record.message.trim(),
      path: basePath,
    })
  }

  for (const [key, value] of Object.entries(record)) {
    if (FORM_ERROR_META_KEYS.has(key)) {
      continue
    }

    const nextPath = key.match(/^\d+$/)
      ? `${basePath}[${key}]`
      : basePath
        ? `${basePath}.${key}`
        : key

    errors.push(...collectFormErrors(value, nextPath))
  }

  return errors
}

function getTabForErrorPath(path: string): PatientFormTab {
  if (
    path.startsWith("vitals") ||
    path.startsWith("anamnesis") ||
    path.startsWith("aaGradient") ||
    path.startsWith("gender") ||
    path.startsWith("isPregnant")
  ) {
    return "clinical"
  }

  if (path.startsWith("thoracicInterventions")) {
    return "thoracic"
  }

  if (
    path.startsWith("criticalMedications") ||
    path.startsWith("oncologyHistory") ||
    path.startsWith("reports") ||
    path.startsWith("externalWard") ||
    path.startsWith("labCultures") ||
    path.startsWith("consultations") ||
    path.startsWith("antibiotics") ||
    path.startsWith("visitNotes")
  ) {
    return "meds"
  }

  return "basic"
}

function formatFieldPath(path: string): string {
  return path.replaceAll(/\[(\d+)\]/g, " #$1").replaceAll(".", " > ")
}

export type PatientDialogFormProps = {
  onCancel: () => void
  onOpenChange: (open: boolean) => void
  open: boolean
  organizationId?: string | null
  patient: PatientRecord | null
  userId?: string | null
}

function getDefaultFormValues(patient: PatientRecord | null, fullName: string): PatientFormData {
  return {
    fullName,
    identifierCode: patient?.identifierCode ?? "",
    bedId: patient?.bedId ?? STAGING_BED_ID,
    serviceName: patient?.serviceName ?? "",
    diagnosis: patient?.diagnosis ?? "",
    admissionDate: formatDateForInput(patient?.admissionDate) ?? "",
    surgeryDate: formatDateForInput(patient?.surgeryDate) ?? "",
    procedureName: patient?.procedureName ?? "",
    gender: patient?.gender,
    isPregnant: patient?.isPregnant,
    version: patient?.version,
    anamnesis: patient?.anamnesis,
    vitals: patient?.vitals,
    aaGradient: patient?.aaGradient,
    criticalMedications: patient?.criticalMedications,
    oncologyHistory: patient?.oncologyHistory,
    reports: patient?.reports,
    externalWard: patient?.externalWard,
    thoracicInterventions: patient?.thoracicInterventions ?? [],
    labCultures: patient?.labCultures ?? [],
    consultations: patient?.consultations ?? [],
    antibiotics: patient?.antibiotics ?? [],
    visitNotes: patient?.visitNotes ?? [],
  }
}

export function PatientDialogForm({
  onCancel,
  onOpenChange,
  open,
  organizationId,
  patient,
  userId,
}: Readonly<PatientDialogFormProps>) {
  const locale = useLocale() as AppLocale
  const t = useTranslations("PatientSheet")
  const tTabs = useTranslations("PatientFormTabs")
  const { getLocalPatientName, setPatientName } = useLocalRoster()
  const [loadingItem, setLoadingItem] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<PatientFormTab>("basic")
  const upsertPatient = useMutation(api.patients.upsertPatient)
  const toggleRequirement = useMutation(api.patients.toggleClinicalRequirement)
  const addTodo = useMutation(api.patients.addCustomTodo)
  const toggleTodo = useMutation(api.patients.toggleCustomTodo)
  const deleteTodo = useMutation(api.patients.deleteCustomTodo)
  const isEditingExisting = Boolean(patient)

  const initialFullName = patient
    ? getLocalPatientName({
        bedId: patient.bedId,
        identifierCode: patient.identifierCode,
        initials: patient.initials,
        patientId: patient._id,
      })
    : ""

  const form = useForm<PatientFormData>({
    delayError: 700,
    mode: "onSubmit",
    reValidateMode: "onBlur",
    resolver: zodResolver(patientFormSchema),
    defaultValues: getDefaultFormValues(patient, initialFullName),
  })

  const clinicSettings = useQuery(
    api.clinicSettings.getClinicSettings,
    open && organizationId ? { organizationId } : "skip"
  )
  const patients = useQuery(
    api.patients.getPatientsByOrganization,
    open && organizationId ? { organizationId } : "skip"
  ) as PatientRecord[] | undefined

  const bedOptions = usePatientSheetBedOptions({
    currentPatient: patient,
    patients,
    t,
    wardLayout: clinicSettings?.wardLayout,
  })

  const watchedFullName = form.watch("fullName")
  const watchedDiagnosis = form.watch("diagnosis")
  const watchedProcedure = form.watch("procedureName")

  const initialsPreview = useMemo(() => {
    if (watchedFullName?.trim()) {
      return generatePatientInitials(watchedFullName, locale)
    }
    return patient?.initials ?? ""
  }, [watchedFullName, patient?.initials, locale])

  const conventionRules = useMemo(
    () => parseConventionRules(clinicSettings?.conventions),
    [clinicSettings?.conventions]
  )

  const matchedClinicalItems = useMemo(
    () =>
      evaluatePatientRules(
        {
          diagnosis: watchedDiagnosis ?? "",
          procedureName: watchedProcedure?.trim() || undefined,
        },
        conventionRules
      ),
    [conventionRules, watchedDiagnosis, watchedProcedure]
  )

  const currentFormData = form.watch()

  const clinicalEvaluation = useMemo(
    () => evaluateClinicalRules(currentFormData, defaultClinicalRules),
    [currentFormData]
  )

  const hasClinicalAlerts =
    clinicalEvaluation.blocks.length > 0 ||
    clinicalEvaluation.warnings.length > 0 ||
    clinicalEvaluation.requirements.length > 0

  const hasRequirements =
    matchedClinicalItems.length > 0 ||
    (patient?.completedRequirements?.length ?? 0) > 0 ||
    (patient?.customTodos?.length ?? 0) > 0

  const onSubmit = async (data: PatientFormData) => {
    if (!organizationId || !userId) {
      toast.error(t("toasts.missingContext"))
      return
    }

    const normalizedData = data
    const finalEvaluation = evaluateClinicalRules(normalizedData, defaultClinicalRules)
    if (finalEvaluation.blocks.length > 0) {
      finalEvaluation.blocks.forEach((block) => {
        toast.error(block.message, {
          duration: 5000,
          icon: "🚫",
        })
      })
      return
    }

    const fullName = data.fullName?.trim() ?? ""
    const initials = fullName
      ? generatePatientInitials(fullName, locale)
      : patient?.initials ?? ""

    if (!fullName && !isEditingExisting) {
      toast.error(t("toasts.requiredFields"))
      return
    }

    setIsSaving(true)
    const submissionId = `patient-submit-${Date.now()}`
    const fallbackRecordedAt = new Date().toISOString()
    const normalizedVitals = normalizedData.vitals
      ? {
          ...normalizedData.vitals,
          recordedAt: normalizedData.vitals.recordedAt ?? fallbackRecordedAt,
        }
      : undefined
    const normalizedOncologyHistory = normalizedData.oncologyHistory
      ? {
          chemotherapy: normalizedData.oncologyHistory.chemotherapy
            ? {
                ...normalizedData.oncologyHistory.chemotherapy,
                received: normalizedData.oncologyHistory.chemotherapy.received ?? false,
              }
            : undefined,
          radiotherapy: normalizedData.oncologyHistory.radiotherapy
            ? {
                ...normalizedData.oncologyHistory.radiotherapy,
                received: normalizedData.oncologyHistory.radiotherapy.received ?? false,
              }
            : undefined,
        }
      : undefined

    console.info("[PatientForm] Submitting patient form", {
      bedId: data.bedId || STAGING_BED_ID,
      hasAaGradient: Boolean(data.aaGradient),
      hasAnamnesis: Boolean(data.anamnesis),
      hasVitals: Boolean(data.vitals),
      isEditingExisting,
      organizationId,
      patientId: patient?._id ?? null,
      submissionId,
      userId,
    })

    try {
      await upsertPatient({
        patientId: patient?._id,
        organizationId,
        userId,
        initials,
        identifierCode: sanitizeIdentifierCodeInput(normalizedData.identifierCode),
        bedId: normalizedData.bedId || STAGING_BED_ID,
        diagnosis: normalizedData.diagnosis,
        admissionDate: toClinicalIsoDate(normalizedData.admissionDate),
        surgeryDate: normalizedData.surgeryDate
          ? toClinicalIsoDate(normalizedData.surgeryDate)
          : undefined,
        procedureName: normalizedData.procedureName || undefined,
        serviceName: normalizedData.serviceName || undefined,
        version: isEditingExisting ? (patient?.version ?? 0) : undefined,
        gender: normalizedData.gender,
        isPregnant: normalizedData.isPregnant,
        anamnesis: normalizedData.anamnesis,
        vitals: normalizedVitals,
        aaGradient: normalizedData.aaGradient,
        criticalMedications: normalizedData.criticalMedications,
        oncologyHistory: normalizedOncologyHistory,
        reports: normalizedData.reports,
        externalWard: normalizedData.externalWard,
        thoracicInterventions: normalizedData.thoracicInterventions,
        labCultures: normalizedData.labCultures,
        consultations: normalizedData.consultations,
        antibiotics: normalizedData.antibiotics,
        visitNotes: normalizedData.visitNotes,
      })

      if (fullName) {
        setPatientName({
          fullName,
          identifierCode: data.identifierCode,
          initials,
        })
      }

      toast.success(t(isEditingExisting ? "toasts.updated" : "toasts.created"))
      onOpenChange(false)
    } catch (error) {
      console.error("[PatientForm] Submission failed", {
        activeTab,
        bedId: data.bedId || STAGING_BED_ID,
        error,
        isEditingExisting,
        organizationId,
        patientId: patient?._id ?? null,
        submissionId,
        userId,
      })

      if (error instanceof Error) {
        if (error.message.startsWith("CONFLICT:")) {
          toast.error(t("toasts.conflict"), {
            duration: 10000,
            description: t("toasts.conflictDescription"),
          })
          return
        }
        if (error.message === "TRIAL_LIMIT_REACHED") {
          toast.error(t("toasts.trialLimitReached"))
          return
        }

        toast.error(t("toasts.saveError"), {
          description: error.message,
        })
        return
      }
      toast.error(t("toasts.saveError"))
    } finally {
      setIsSaving(false)
    }
  }

  const onInvalidSubmit = (errors: FieldErrors<PatientFormData>) => {
    const flattenedErrors = collectFormErrors(errors)
    const firstError = flattenedErrors[0]

    console.error("[PatientForm] Validation blocked submit", {
      activeTab,
      errorCount: flattenedErrors.length,
      errors: flattenedErrors,
      formValues: form.getValues(),
    })

    if (!firstError) {
      toast.error(t("toasts.saveError"))
      return
    }

    const targetTab = getTabForErrorPath(firstError.path)
    setActiveTab(targetTab)

    toast.error("Form kaydedilemedi", {
      description: `${flattenedErrors.length} doğrulama hatası var. ${tTabs(targetTab)} sekmesindeki "${formatFieldPath(firstError.path)}" alanını kontrol edin: ${firstError.message}`,
      duration: 8000,
    })
  }

  const handleToggleRequirement = async (item: string, completed: boolean) => {
    if (!patient || !organizationId || !userId) return
    setLoadingItem(item)
    try {
      await toggleRequirement({ completed, item, organizationId, patientId: patient._id, userId })
      toast.success(completed ? t("clinicalRequirements.toasts.completed", { item }) : t("clinicalRequirements.toasts.uncompleted", { item }))
    } catch {
      toast.error(t("clinicalRequirements.toasts.error"))
    } finally {
      setLoadingItem(null)
    }
  }

  const handleAddTodo = async (text: string) => {
    if (!patient || !organizationId || !userId) return
    try {
      await addTodo({ organizationId, patientId: patient._id, text, userId })
      toast.success(t("clinicalRequirements.toasts.todoAdded"))
    } catch {
      toast.error(t("clinicalRequirements.toasts.error"))
    }
  }

  const handleToggleTodo = async (todoId: string, completed: boolean) => {
    if (!patient || !organizationId || !userId) return
    setLoadingItem(todoId)
    try {
      await toggleTodo({ completed, organizationId, patientId: patient._id, todoId, userId })
    } catch {
      toast.error(t("clinicalRequirements.toasts.error"))
    } finally {
      setLoadingItem(null)
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    if (!patient || !organizationId || !userId) return
    setLoadingItem(todoId)
    try {
      await deleteTodo({ organizationId, patientId: patient._id, todoId, userId })
      toast.success(t("clinicalRequirements.toasts.todoDeleted"))
    } catch {
      toast.error(t("clinicalRequirements.toasts.error"))
    } finally {
      setLoadingItem(null)
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onInvalidSubmit)} className="flex h-full max-h-[90vh] flex-col">
        <DialogHeader className="shrink-0 border-b px-6 py-4">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">
                  {t(isEditingExisting ? "badges.editing" : "badges.new")}
                </Badge>
                <Badge variant="outline">{t("badges.privacy")}</Badge>
              </div>
              <DialogTitle>{t(isEditingExisting ? "titles.editing" : "titles.new")}</DialogTitle>
              <DialogDescription className="mt-1 leading-6">
                {t("description")}
              </DialogDescription>
            </div>
            <Button variant="ghost" size="icon-sm" type="button" onClick={onCancel}>
              <X className="size-4" />
              <span className="sr-only">{t("actions.cancel")}</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
          <div className="flex-1 overflow-hidden">
            <Tabs
              value={activeTab}
              onValueChange={(value) => setActiveTab(value as PatientFormTab)}
              className="flex h-full flex-col"
            >
              {/* Clinical Alerts - Sticky header showing real-time rule evaluation */}
              {hasClinicalAlerts && (
                <div className="shrink-0 border-b bg-muted/30 px-6 py-3">
                  <ClinicalAlertsPanel evaluation={clinicalEvaluation} compact />
                </div>
              )}

              <div className="shrink-0 border-b px-6">
                <TabsList className="h-auto w-full justify-start gap-1 rounded-none bg-transparent p-0">
                  <TabsTrigger
                    value="basic"
                    className="gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <User className="size-3.5" />
                    {tTabs("basic")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="clinical"
                    className="gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Activity className="size-3.5" />
                    {tTabs("clinical")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="thoracic"
                    className="gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Stethoscope className="size-3.5" />
                    {tTabs("thoracic")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="meds"
                    className="gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Pill className="size-3.5" />
                    {tTabs("meds")}
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto p-6">
                <TabsContent value="basic" className="m-0">
                  <BasicInfoSection
                    control={form.control}
                    bedOptions={bedOptions}
                    initialsPreview={initialsPreview}
                  />
                </TabsContent>

                <TabsContent value="clinical" className="m-0">
                  <VitalsAnamnesisSection
                    control={form.control}
                    defaultPatmMmHg={clinicSettings?.defaultPatmMmHg}
                    setValue={form.setValue}
                    watch={form.watch}
                  />
                </TabsContent>

                <TabsContent value="thoracic" className="m-0">
                  <ThoracicInterventionsSection control={form.control} />
                </TabsContent>

                <TabsContent value="meds" className="m-0">
                  <MedicationsLabsSection
                    control={form.control}
                    setValue={form.setValue}
                    watch={form.watch}
                  />
                </TabsContent>
              </div>
            </Tabs>
          </div>

          {hasRequirements && (
            <div className="hidden w-80 shrink-0 overflow-y-auto border-l bg-muted/20 p-4 lg:block xl:w-96">
              <PatientClinicalRequirementsAlert
                completedRequirements={patient?.completedRequirements}
                customTodos={patient?.customTodos}
                items={matchedClinicalItems}
                loading={loadingItem}
                onAddTodo={isEditingExisting ? handleAddTodo : undefined}
                onDeleteTodo={isEditingExisting ? handleDeleteTodo : undefined}
                onToggle={isEditingExisting ? handleToggleRequirement : undefined}
                onToggleTodo={isEditingExisting ? handleToggleTodo : undefined}
              />
            </div>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t px-6 py-4">
          <div className="flex w-full items-center justify-between gap-4">
            <ClinicalAlertsSummary evaluation={clinicalEvaluation} />
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onCancel}>
                {t("actions.cancel")}
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
              >
                {isSaving
                  ? t("actions.saving")
                  : t(isEditingExisting ? "actions.saveChanges" : "actions.createPatient")}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </form>
  )
}
