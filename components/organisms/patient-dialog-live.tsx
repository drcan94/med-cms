"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useMutation, useQuery } from "convex/react"
import {
  Activity,
  Check,
  Loader2,
  Pill,
  Stethoscope,
  User,
  X,
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Doc, Id } from "@/convex/_generated/dataModel"
import { useDebouncedCallback } from "@/hooks/useDebouncedCallback"
import { useLocalRoster } from "@/hooks/useLocalRoster"
import { usePatientSheetBedOptions } from "@/hooks/usePatientSheetBedOptions"
import type { AppLocale } from "@/i18n/routing"
import { parseConventionRules } from "@/lib/clinic-settings"
import { defaultClinicalRules, evaluateClinicalRules } from "@/lib/clinical-rules"
import { formatDateForInput, toClinicalIsoDate } from "@/lib/patient-form"
import { mapPatientMutationErrorDescription } from "@/lib/patient-mutation-errors"
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
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type PatientRecord = Doc<"patients">
type PatientFormTab = "basic" | "clinical" | "thoracic" | "meds"

const AUTOSAVE_DEBOUNCE_MS = 1750

/** Convex validates full nested objects; omit `{}` so optional fields stay omitted. */
function isNonEmptyPlainObject(value: unknown): boolean {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value as Record<string, unknown>).length > 0
  )
}

function hasDirtyField(d: unknown): boolean {
  if (d === true) {
    return true
  }
  if (Array.isArray(d)) {
    return d.some(hasDirtyField)
  }
  if (d && typeof d === "object") {
    return Object.values(d as Record<string, unknown>).some(hasDirtyField)
  }
  return false
}

function buildFormPatchFromDirty(
  data: PatientFormData,
  dirtyFields: Record<string, unknown>
): {
  patch: Partial<PatientFormData>
  includeInitialsFromFullName: boolean
} {
  const patch: Partial<PatientFormData> = {}
  const keys: (keyof PatientFormData)[] = [
    "identifierCode",
    "bedId",
    "serviceName",
    "diagnosis",
    "admissionDate",
    "surgeryDate",
    "procedureName",
    "gender",
    "isPregnant",
    "anamnesis",
    "vitals",
    "aaGradient",
    "criticalMedications",
    "oncologyHistory",
    "reports",
    "externalWard",
    "thoracicInterventions",
    "labCultures",
    "consultations",
    "antibiotics",
    "visitNotes",
  ]
  for (const key of keys) {
    if (hasDirtyField(dirtyFields[key as string])) {
      ;(patch as Record<string, unknown>)[key as string] = data[key]
    }
  }
  return {
    patch,
    includeInitialsFromFullName: hasDirtyField(dirtyFields.fullName),
  }
}

function shouldSaveImmediately(fieldName?: string): boolean {
  if (!fieldName) {
    return false
  }
  if (fieldName.includes("symptoms")) {
    return true
  }
  if (
    fieldName === "gender" ||
    fieldName === "isPregnant" ||
    fieldName === "bedId"
  ) {
    return true
  }
  if (
    fieldName.startsWith("thoracicInterventions") ||
    fieldName.startsWith("labCultures") ||
    fieldName.startsWith("antibiotics") ||
    fieldName.startsWith("consultations") ||
    fieldName.startsWith("visitNotes")
  ) {
    return true
  }
  if (fieldName.startsWith("criticalMedications")) {
    return true
  }
  if (fieldName.startsWith("oncologyHistory") && fieldName.includes("received")) {
    return true
  }
  return false
}

function canPersistNewPatient(data: PatientFormData): boolean {
  const id = sanitizeIdentifierCodeInput(data.identifierCode ?? "")
  if (id.length === 6) {
    return true
  }
  const fullName = data.fullName?.trim() ?? ""
  const diagnosis = data.diagnosis?.trim() ?? ""
  const admission = data.admissionDate?.trim() ?? ""
  return (
    fullName.length > 0 ||
    diagnosis.length > 0 ||
    admission.length > 0
  )
}

function getDefaultFormValues(
  patient: PatientRecord | null,
  fullName: string
): PatientFormData {
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

export type PatientDialogLiveProps = {
  onOpenChange: (open: boolean) => void
  open: boolean
  organizationId?: string | null
  patient: PatientRecord | null
  userId?: string | null
}

export function PatientDialogLive({
  onOpenChange,
  open,
  organizationId,
  patient,
  userId,
}: Readonly<PatientDialogLiveProps>) {
  const locale = useLocale() as AppLocale
  const t = useTranslations("PatientSheet")
  const tTabs = useTranslations("PatientFormTabs")
  const { getLocalPatientName, setPatientName } = useLocalRoster()
  const [loadingItem, setLoadingItem] = useState<string | null>(null)
  const [createdPatientId, setCreatedPatientId] = useState<Id<"patients"> | null>(
    null
  )
  const [syncState, setSyncState] = useState<"idle" | "saving" | "saved">(
    "idle"
  )
  const [activeTab, setActiveTab] = useState<PatientFormTab>("basic")

  const isApplyingRemoteRef = useRef(false)
  const suppressAutosaveRef = useRef(false)
  /** Avoid firing upsert on mount when RHF watch emits the initial snapshot. */
  const autosaveReadyRef = useRef(false)
  const savedIndicatorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  )
  const persistGenerationRef = useRef(0)

  const upsertPatient = useMutation(api.patients.upsertPatient)
  const toggleRequirement = useMutation(api.patients.toggleClinicalRequirement)
  const addTodo = useMutation(api.patients.addCustomTodo)
  const toggleTodo = useMutation(api.patients.toggleCustomTodo)
  const deleteTodo = useMutation(api.patients.deleteCustomTodo)

  const effectivePatientId = patient?._id ?? createdPatientId
  const isEditingExisting = Boolean(effectivePatientId)

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

  const livePatient = useQuery(
    api.patients.getPatientByOrganization,
    open && organizationId && effectivePatientId
      ? { organizationId, patientId: effectivePatientId }
      : "skip"
  ) as PatientRecord | null | undefined

  const clinicSettings = useQuery(
    api.clinicSettings.getClinicSettings,
    open && organizationId ? { organizationId } : "skip"
  )
  const patients = useQuery(
    api.patients.getPatientsByOrganization,
    open && organizationId ? { organizationId } : "skip"
  ) as PatientRecord[] | undefined

  const bedOptions = usePatientSheetBedOptions({
    currentPatient: livePatient ?? patient,
    patients,
    t,
    wardLayout: clinicSettings?.wardLayout,
  })

  const watchedFullName = form.watch("fullName")
  const watchedIdentifierCode = form.watch("identifierCode")
  const watchedDiagnosis = form.watch("diagnosis")
  const watchedProcedure = form.watch("procedureName")

  const initialsPreview = useMemo(() => {
    if (watchedFullName?.trim()) {
      return generatePatientInitials(watchedFullName, locale)
    }
    return (livePatient ?? patient)?.initials ?? ""
  }, [watchedFullName, livePatient, patient, locale])

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
    ((livePatient ?? patient)?.completedRequirements?.length ?? 0) > 0 ||
    ((livePatient ?? patient)?.customTodos?.length ?? 0) > 0

  const rosterPatient = livePatient ?? patient

  const applyPatientToForm = useCallback(
    (record: PatientRecord) => {
      const currentId = sanitizeIdentifierCodeInput(
        form.getValues("identifierCode") ?? ""
      )
      const preserveTypedName =
        Boolean(form.formState.dirtyFields.fullName) &&
        record.identifierCode === currentId
      const fullName = preserveTypedName
        ? (form.getValues("fullName") ?? "")
        : getLocalPatientName({
            bedId: record.bedId,
            identifierCode: record.identifierCode,
            initials: record.initials,
            patientId: record._id,
          })
      suppressAutosaveRef.current = true
      isApplyingRemoteRef.current = true
      form.reset(getDefaultFormValues(record, fullName))
      setTimeout(() => {
        isApplyingRemoteRef.current = false
        suppressAutosaveRef.current = false
      }, 0)
    },
    [form, getLocalPatientName]
  )

  const setPatientNameRef = useRef(setPatientName)
  setPatientNameRef.current = setPatientName
  const getLocalPatientNameRef = useRef(getLocalPatientName)
  getLocalPatientNameRef.current = getLocalPatientName

  useEffect(() => {
    if (!open) {
      return
    }
    const name = watchedFullName?.trim() ?? ""
    const id = sanitizeIdentifierCodeInput(watchedIdentifierCode ?? "")
    if (!name || id.length !== 6) {
      return
    }
    const initials = generatePatientInitials(name, locale)
    const bedId =
      (livePatient ?? patient)?.bedId ?? STAGING_BED_ID
    const stored = getLocalPatientNameRef.current({
      bedId,
      identifierCode: id,
      initials,
      patientId: (livePatient ?? patient)?._id,
    })
    if (stored.trim() === name) {
      return
    }
    setPatientNameRef.current({
      fullName: name,
      identifierCode: id,
      initials,
    })
  }, [open, watchedFullName, watchedIdentifierCode, locale, livePatient, patient])

  useEffect(() => {
    if (!open || !patient?._id) {
      setCreatedPatientId(null)
    }
  }, [open, patient?._id])

  useEffect(() => {
    if (!open || !livePatient || isApplyingRemoteRef.current) {
      return
    }
    const formVersion = form.getValues("version") ?? 0
    const liveVersion = livePatient.version ?? 0
    if (liveVersion !== formVersion) {
      applyPatientToForm(livePatient)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when server snapshot changes
  }, [open, livePatient, applyPatientToForm])

  const showSavedIndicator = useCallback(() => {
    if (savedIndicatorTimerRef.current) {
      clearTimeout(savedIndicatorTimerRef.current)
    }
    setSyncState("saved")
    savedIndicatorTimerRef.current = setTimeout(() => {
      setSyncState("idle")
      savedIndicatorTimerRef.current = null
    }, 2000)
  }, [])

  useEffect(
    () => () => {
      if (savedIndicatorTimerRef.current) {
        clearTimeout(savedIndicatorTimerRef.current)
      }
    },
    []
  )

  const persist = useCallback(async () => {
    if (
      !organizationId ||
      !userId ||
      !autosaveReadyRef.current ||
      isApplyingRemoteRef.current ||
      suppressAutosaveRef.current
    ) {
      return
    }

    const data = form.getValues()
    const dirtyFields = form.formState.dirtyFields
    const gen = ++persistGenerationRef.current

    if (isEditingExisting && Object.keys(dirtyFields).length === 0) {
      return
    }

    if (!effectivePatientId && !canPersistNewPatient(data)) {
      return
    }

    const normalizedData = data
    const fullName = data.fullName?.trim() ?? ""
    const initialsFromName = fullName
      ? generatePatientInitials(fullName, locale)
      : (livePatient ?? patient)?.initials ?? ""

    const fallbackRecordedAt = new Date().toISOString()

    const buildNormalizedPayload = () => {
      const normalizedVitals = normalizedData.vitals
        ? {
            ...normalizedData.vitals,
            recordedAt:
              normalizedData.vitals.recordedAt ?? fallbackRecordedAt,
          }
        : undefined
      const normalizedOncologyHistory = normalizedData.oncologyHistory
        ? {
            chemotherapy: normalizedData.oncologyHistory.chemotherapy
              ? {
                  ...normalizedData.oncologyHistory.chemotherapy,
                  received:
                    normalizedData.oncologyHistory.chemotherapy.received ??
                    false,
                }
              : undefined,
            radiotherapy: normalizedData.oncologyHistory.radiotherapy
              ? {
                  ...normalizedData.oncologyHistory.radiotherapy,
                  received:
                    normalizedData.oncologyHistory.radiotherapy.received ??
                    false,
                }
              : undefined,
          }
        : undefined
      return {
        normalizedOncologyHistory,
        normalizedVitals,
      }
    }

    if (effectivePatientId) {
      const { patch, includeInitialsFromFullName } = buildFormPatchFromDirty(
        data,
        dirtyFields as Record<string, unknown>
      )
      const hasPayload =
        Object.keys(patch).length > 0 || includeInitialsFromFullName
      if (!hasPayload) {
        return
      }

      const { normalizedOncologyHistory, normalizedVitals } =
        buildNormalizedPayload()

      const mutationArgs = {
        patientId: effectivePatientId,
        organizationId,
        userId,
        ...(includeInitialsFromFullName ? { initials: initialsFromName } : {}),
        ...(patch.identifierCode !== undefined
          ? {
              identifierCode: sanitizeIdentifierCodeInput(
                patch.identifierCode ?? ""
              ),
            }
          : {}),
        ...(patch.bedId !== undefined
          ? { bedId: patch.bedId || STAGING_BED_ID }
          : {}),
        ...(patch.serviceName !== undefined
          ? { serviceName: patch.serviceName || undefined }
          : {}),
        ...(patch.diagnosis !== undefined ? { diagnosis: patch.diagnosis } : {}),
        ...(patch.admissionDate !== undefined
          ? { admissionDate: toClinicalIsoDate(patch.admissionDate) }
          : {}),
        ...(patch.surgeryDate !== undefined
          ? {
              surgeryDate: patch.surgeryDate
                ? toClinicalIsoDate(patch.surgeryDate)
                : undefined,
            }
          : {}),
        ...(patch.procedureName !== undefined
          ? { procedureName: patch.procedureName || undefined }
          : {}),
        ...(patch.gender !== undefined ? { gender: patch.gender } : {}),
        ...(patch.isPregnant !== undefined
          ? { isPregnant: patch.isPregnant }
          : {}),
        ...(patch.anamnesis !== undefined && isNonEmptyPlainObject(patch.anamnesis)
          ? { anamnesis: patch.anamnesis }
          : {}),
        ...(patch.vitals !== undefined && isNonEmptyPlainObject(patch.vitals)
          ? { vitals: normalizedVitals }
          : {}),
        ...(patch.aaGradient !== undefined &&
        isNonEmptyPlainObject(patch.aaGradient)
          ? { aaGradient: patch.aaGradient }
          : {}),
        ...(patch.criticalMedications !== undefined &&
        isNonEmptyPlainObject(patch.criticalMedications)
          ? { criticalMedications: patch.criticalMedications }
          : {}),
        ...(patch.oncologyHistory !== undefined &&
        isNonEmptyPlainObject(patch.oncologyHistory)
          ? { oncologyHistory: normalizedOncologyHistory }
          : {}),
        ...(patch.reports !== undefined && isNonEmptyPlainObject(patch.reports)
          ? { reports: patch.reports }
          : {}),
        ...(patch.externalWard !== undefined &&
        isNonEmptyPlainObject(patch.externalWard)
          ? { externalWard: patch.externalWard }
          : {}),
        ...(patch.thoracicInterventions !== undefined
          ? { thoracicInterventions: patch.thoracicInterventions }
          : {}),
        ...(patch.labCultures !== undefined
          ? { labCultures: patch.labCultures }
          : {}),
        ...(patch.consultations !== undefined
          ? { consultations: patch.consultations }
          : {}),
        ...(patch.antibiotics !== undefined
          ? { antibiotics: patch.antibiotics }
          : {}),
        ...(patch.visitNotes !== undefined
          ? { visitNotes: patch.visitNotes }
          : {}),
      }

      setSyncState("saving")

      try {
        const result = await upsertPatient(mutationArgs)

        if (gen !== persistGenerationRef.current) {
          return
        }

        const nextValues = { ...form.getValues(), version: result.version }
        form.reset(nextValues)

        if (fullName) {
          setPatientName({
            fullName,
            identifierCode: sanitizeIdentifierCodeInput(
              data.identifierCode ?? ""
            ),
            initials: initialsFromName,
          })
        }

        showSavedIndicator()
      } catch (error) {
        if (gen !== persistGenerationRef.current) {
          return
        }

        setSyncState("idle")

        if (error instanceof Error) {
          const mapped = mapPatientMutationErrorDescription(error, t)
          if (mapped) {
            toast.error(mapped)
            return
          }
        }
        toast.error(t("toasts.saveError"))
      }
      return
    }

    const { normalizedOncologyHistory, normalizedVitals } =
      buildNormalizedPayload()
    const resolvedIdentifier = sanitizeIdentifierCodeInput(
      normalizedData.identifierCode ?? ""
    )
    const insertArgs = {
      organizationId,
      userId,
      initials: initialsFromName,
      ...(resolvedIdentifier.length === 6
        ? { identifierCode: resolvedIdentifier }
        : {}),
      bedId: normalizedData.bedId || STAGING_BED_ID,
      diagnosis: normalizedData.diagnosis?.trim() || undefined,
      admissionDate: normalizedData.admissionDate?.trim()
        ? toClinicalIsoDate(normalizedData.admissionDate)
        : undefined,
      surgeryDate: normalizedData.surgeryDate
        ? toClinicalIsoDate(normalizedData.surgeryDate)
        : undefined,
      procedureName: normalizedData.procedureName || undefined,
      serviceName: normalizedData.serviceName || undefined,
      gender: normalizedData.gender,
      isPregnant: normalizedData.isPregnant,
      thoracicInterventions: normalizedData.thoracicInterventions,
      labCultures: normalizedData.labCultures,
      consultations: normalizedData.consultations,
      antibiotics: normalizedData.antibiotics,
      visitNotes: normalizedData.visitNotes,
      ...(isNonEmptyPlainObject(normalizedData.anamnesis)
        ? { anamnesis: normalizedData.anamnesis }
        : {}),
      ...(isNonEmptyPlainObject(normalizedData.vitals) && normalizedVitals
        ? { vitals: normalizedVitals }
        : {}),
      ...(isNonEmptyPlainObject(normalizedData.aaGradient)
        ? { aaGradient: normalizedData.aaGradient }
        : {}),
      ...(isNonEmptyPlainObject(normalizedData.criticalMedications)
        ? { criticalMedications: normalizedData.criticalMedications }
        : {}),
      ...(isNonEmptyPlainObject(normalizedData.oncologyHistory) &&
      normalizedOncologyHistory
        ? { oncologyHistory: normalizedOncologyHistory }
        : {}),
      ...(isNonEmptyPlainObject(normalizedData.reports)
        ? { reports: normalizedData.reports }
        : {}),
      ...(isNonEmptyPlainObject(normalizedData.externalWard)
        ? { externalWard: normalizedData.externalWard }
        : {}),
    }

    setSyncState("saving")

    try {
      const result = await upsertPatient(insertArgs)

      if (gen !== persistGenerationRef.current) {
        return
      }

      if (result.patientId) {
        setCreatedPatientId(result.patientId)
      }

      const nextValues = { ...form.getValues(), version: result.version }
      form.reset(nextValues)

      if (fullName) {
        setPatientName({
          fullName,
          identifierCode: sanitizeIdentifierCodeInput(
            data.identifierCode ?? ""
          ),
          initials: initialsFromName,
        })
      }

      showSavedIndicator()
    } catch (error) {
      if (gen !== persistGenerationRef.current) {
        return
      }

      setSyncState("idle")

      if (error instanceof Error) {
        const mapped = mapPatientMutationErrorDescription(error, t)
        if (mapped) {
          toast.error(mapped)
          return
        }
      }
      toast.error(t("toasts.saveError"))
    }
  }, [
    organizationId,
    userId,
    effectivePatientId,
    isEditingExisting,
    livePatient,
    patient,
    form,
    locale,
    upsertPatient,
    setPatientName,
    showSavedIndicator,
    t,
  ])

  const { run: debouncedPersist, cancel: cancelDebounced } = useDebouncedCallback(
    persist,
    AUTOSAVE_DEBOUNCE_MS
  )

  useEffect(() => {
    if (!open) {
      cancelDebounced()
      autosaveReadyRef.current = false
      return
    }
    autosaveReadyRef.current = false
    const readyId = window.setTimeout(() => {
      autosaveReadyRef.current = true
    }, 400)
    return () => {
      window.clearTimeout(readyId)
    }
  }, [open, cancelDebounced])

  useEffect(() => {
    const subscription = form.watch((_, info) => {
      if (
        !open ||
        !autosaveReadyRef.current ||
        isApplyingRemoteRef.current ||
        suppressAutosaveRef.current
      ) {
        return
      }
      const name = info?.name
      if (shouldSaveImmediately(name)) {
        cancelDebounced()
        queueMicrotask(() => {
          void persist()
        })
      } else {
        debouncedPersist()
      }
    })
    return () => subscription.unsubscribe()
  }, [form, debouncedPersist, cancelDebounced, persist, open])

  const handleToggleRequirement = async (item: string, completed: boolean) => {
    if (!effectivePatientId || !organizationId || !userId) {
      return
    }
    setLoadingItem(item)
    try {
      await toggleRequirement({
        completed,
        item,
        organizationId,
        patientId: effectivePatientId,
        userId,
      })
      toast.success(
        completed
          ? t("clinicalRequirements.toasts.completed", { item })
          : t("clinicalRequirements.toasts.uncompleted", { item })
      )
    } catch {
      toast.error(t("clinicalRequirements.toasts.error"))
    } finally {
      setLoadingItem(null)
    }
  }

  const handleAddTodo = async (text: string) => {
    if (!effectivePatientId || !organizationId || !userId) {
      return
    }
    try {
      await addTodo({
        organizationId,
        patientId: effectivePatientId,
        text,
        userId,
      })
      toast.success(t("clinicalRequirements.toasts.todoAdded"))
    } catch {
      toast.error(t("clinicalRequirements.toasts.error"))
    }
  }

  const handleToggleTodo = async (todoId: string, completed: boolean) => {
    if (!effectivePatientId || !organizationId || !userId) {
      return
    }
    setLoadingItem(todoId)
    try {
      await toggleTodo({
        completed,
        organizationId,
        patientId: effectivePatientId,
        todoId,
        userId,
      })
    } catch {
      toast.error(t("clinicalRequirements.toasts.error"))
    } finally {
      setLoadingItem(null)
    }
  }

  const handleDeleteTodo = async (todoId: string) => {
    if (!effectivePatientId || !organizationId || !userId) {
      return
    }
    setLoadingItem(todoId)
    try {
      await deleteTodo({
        organizationId,
        patientId: effectivePatientId,
        todoId,
        userId,
      })
      toast.success(t("clinicalRequirements.toasts.todoDeleted"))
    } catch {
      toast.error(t("clinicalRequirements.toasts.error"))
    } finally {
      setLoadingItem(null)
    }
  }

  const handleClose = () => {
    cancelDebounced()
    onOpenChange(false)
  }

  return (
    <form
      className="flex min-h-0 flex-1 flex-col overflow-hidden"
      onSubmit={(e) => {
        e.preventDefault()
      }}
    >
      <DialogHeader className="shrink-0 border-b px-4 py-3 sm:px-5 sm:py-3.5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">
                {t(isEditingExisting ? "badges.live" : "badges.new")}
              </Badge>
              <Badge variant="outline">{t("badges.privacy")}</Badge>
            </div>
            <DialogTitle>
              {t(isEditingExisting ? "titles.live" : "titles.new")}
            </DialogTitle>
            <DialogDescription className="mt-1 leading-6">
              {t("description")}
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <div
              className="flex size-7 items-center justify-center"
              aria-live="polite"
              title={
                syncState === "saving"
                  ? t("syncStatus.saving")
                  : syncState === "saved"
                    ? t("syncStatus.saved")
                    : t("syncStatus.idle")
              }
            >
              {syncState === "saving" ? (
                <Loader2
                  className="size-3.5 animate-spin text-muted-foreground/35"
                  aria-hidden
                />
              ) : syncState === "saved" ? (
                <Check
                  className="size-3.5 text-emerald-600/45 dark:text-emerald-400/45"
                  aria-hidden
                />
              ) : null}
              <span className="sr-only">
                {syncState === "saving"
                  ? t("syncStatus.saving")
                  : syncState === "saved"
                    ? t("syncStatus.saved")
                    : t("syncStatus.idle")}
              </span>
            </div>
            <Button variant="ghost" size="icon-sm" type="button" onClick={handleClose}>
              <X className="size-4" />
              <span className="sr-only">{t("actions.close")}</span>
            </Button>
          </div>
        </div>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <Tabs
            value={activeTab}
            onValueChange={(value) => setActiveTab(value as PatientFormTab)}
            className="flex min-h-0 flex-1 flex-col"
          >
            {hasClinicalAlerts && (
              <div className="shrink-0 border-b bg-muted/30 px-4 py-2.5 sm:px-5">
                <ClinicalAlertsPanel evaluation={clinicalEvaluation} compact />
              </div>
            )}

            <div className="shrink-0 border-b px-0">
              <div className="scrollbar-hide touch-pan-x overflow-x-auto overflow-y-hidden [-webkit-overflow-scrolling:touch]">
                <TabsList className="inline-flex h-auto w-max justify-start gap-0.5 rounded-none bg-transparent px-4 py-0 sm:gap-1 sm:px-5">
                  <TabsTrigger
                    value="basic"
                    className="flex-none shrink-0 gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-xs whitespace-nowrap data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <User className="size-3.5 shrink-0" />
                    {tTabs("basic")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="clinical"
                    className="flex-none shrink-0 gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-xs whitespace-nowrap data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Activity className="size-3.5 shrink-0" />
                    {tTabs("clinical")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="thoracic"
                    className="flex-none shrink-0 gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-xs whitespace-nowrap data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Stethoscope className="size-3.5 shrink-0" />
                    {tTabs("thoracic")}
                  </TabsTrigger>
                  <TabsTrigger
                    value="meds"
                    className="flex-none shrink-0 gap-1.5 rounded-none border-b-2 border-transparent px-3 py-2.5 text-xs whitespace-nowrap data-[state=active]:border-primary data-[state=active]:bg-transparent"
                  >
                    <Pill className="size-3.5 shrink-0" />
                    {tTabs("meds")}
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
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
          <div className="hidden w-80 shrink-0 overflow-y-auto overscroll-contain border-l bg-muted/20 p-3 lg:block xl:w-96">
            <PatientClinicalRequirementsAlert
              completedRequirements={rosterPatient?.completedRequirements}
              customTodos={rosterPatient?.customTodos}
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

      <div className="shrink-0 border-t px-4 py-3 sm:px-5 sm:py-3.5">
        <ClinicalAlertsSummary evaluation={clinicalEvaluation} />
      </div>
    </form>
  )
}
