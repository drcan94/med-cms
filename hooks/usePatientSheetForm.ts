"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { useLocale, useTranslations } from "next-intl"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { useLocalRoster } from "@/hooks/useLocalRoster"
import type { AppLocale } from "@/i18n/routing"
import {
  getInitialPatientFormState,
  toClinicalIsoDate,
  type PatientFormState,
} from "@/lib/patient-form"
import {
  isValidIdentifierCode,
  normalizeIdentifierCode,
  sanitizeIdentifierCodeInput,
} from "@/lib/patient-identity"
import { resolvePatientSheetErrorMessage } from "@/lib/patient-mutation-errors"
import {
  generatePatientInitials,
  normalizePatientFullName,
  STAGING_BED_ID,
} from "@/lib/patient-privacy"

type PatientRecord = Doc<"patients">

type UsePatientSheetFormArgs = {
  onOpenChange: (open: boolean) => void
  organizationId?: string | null
  patient: PatientRecord | null
  userId?: string | null
}

export function usePatientSheetForm({
  onOpenChange,
  organizationId,
  patient,
  userId,
}: Readonly<UsePatientSheetFormArgs>) {
  const locale = useLocale() as AppLocale
  const t = useTranslations("PatientSheet")
  const { getLocalPatientName, setPatientName } = useLocalRoster()
  const [formState, setFormState] = useState<PatientFormState>(() =>
    getInitialPatientFormState(
      patient,
      patient
        ? getLocalPatientName({
            bedId: patient.bedId,
            identifierCode: patient.identifierCode,
            initials: patient.initials,
            patientId: patient._id,
          })
        : ""
    )
  )
  const [isSaving, setIsSaving] = useState(false)
  const upsertPatient = useMutation(api.patients.upsertPatient)
  const isEditing = Boolean(patient)

  const handleFieldChange =
    (field: keyof PatientFormState) =>
    (
      event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ): void => {
      const { value } = event.target
      const nextValue =
        field === "identifierCode" ? sanitizeIdentifierCodeInput(value) : value

      setFormState((currentState) => ({
        ...currentState,
        [field]: nextValue,
      }))
    }

  const handleValueChange =
    (field: keyof PatientFormState) =>
    (value: string): void => {
      setFormState((currentState) => ({
        ...currentState,
        [field]: value,
      }))
    }

  const handleSubmit = async (
    event: React.FormEvent<HTMLFormElement>
  ): Promise<void> => {
    event.preventDefault()

    if (!organizationId || !userId) {
      toast.error(t("toasts.missingContext"))
      return
    }

    const fullName = normalizePatientFullName(formState.fullName)
    const bedId = formState.bedId.trim() || STAGING_BED_ID
    const diagnosis = formState.diagnosis.trim()
    const admissionDate = formState.admissionDate.trim()
    const surgeryDate = formState.surgeryDate.trim()
    const procedureName = formState.procedureName.trim()
    const serviceName = formState.serviceName.trim()
    const identifierCode = normalizeIdentifierCode(formState.identifierCode)
    const initials =
      fullName.length > 0
        ? generatePatientInitials(fullName, locale)
        : patient?.initials.trim() ?? ""

    if (
      (!fullName && !isEditing) ||
      !initials ||
      !diagnosis ||
      !admissionDate ||
      !identifierCode
    ) {
      toast.error(t("toasts.requiredFields"))
      return
    }

    if (!isValidIdentifierCode(identifierCode)) {
      toast.error(t("toasts.invalidIdentifierCode"))
      return
    }

    setIsSaving(true)

    try {
      await upsertPatient({
        patientId: patient?._id,
        organizationId,
        userId,
        initials,
        identifierCode,
        bedId,
        diagnosis,
        admissionDate: toClinicalIsoDate(admissionDate),
        surgeryDate: surgeryDate ? toClinicalIsoDate(surgeryDate) : undefined,
        procedureName: procedureName || undefined,
        serviceName: serviceName || undefined,
        version: isEditing ? (patient?.version ?? 0) : undefined,
      })

      if (fullName) {
        setPatientName({
          fullName,
          identifierCode,
          initials,
        })
      }

      toast.success(t(isEditing ? "toasts.updated" : "toasts.created"))
      onOpenChange(false)
    } catch (error) {
      if (error instanceof Error && error.message.startsWith("CONFLICT:")) {
        toast.warning(t("toasts.conflict"))
        return
      }

      toast.error(resolvePatientSheetErrorMessage(error, t))
    } finally {
      setIsSaving(false)
    }
  }

  return {
    formState,
    handleFieldChange,
    handleValueChange,
    handleSubmit,
    isEditing,
    isSaving,
  }
}
