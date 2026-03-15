"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { useLocale } from "next-intl"
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
  const { patientRoster, setPatientName } = useLocalRoster()
  const [formState, setFormState] = useState<PatientFormState>(() =>
    getInitialPatientFormState(
      patient,
      patient ? patientRoster[patient._id] ?? "" : ""
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
      toast.error("Select an organization and sign in before saving patients.")
      return
    }

    const fullName = normalizePatientFullName(formState.fullName)
    const bedId = formState.bedId.trim() || STAGING_BED_ID
    const diagnosis = formState.diagnosis.trim()
    const admissionDate = formState.admissionDate.trim()
    const surgeryDate = formState.surgeryDate.trim()
    const serviceName = formState.serviceName.trim()
    const initials =
      fullName.length > 0
        ? generatePatientInitials(fullName, locale)
        : patient?.initials.trim() ?? ""

    if ((!fullName && !isEditing) || !initials || !diagnosis || !admissionDate) {
      toast.error("Full name, diagnosis, and admission date are required.")
      return
    }

    setIsSaving(true)

    try {
      const result = await upsertPatient({
        patientId: patient?._id,
        organizationId,
        userId,
        initials,
        bedId,
        diagnosis,
        admissionDate: toClinicalIsoDate(admissionDate),
        surgeryDate: surgeryDate ? toClinicalIsoDate(surgeryDate) : undefined,
        serviceName: serviceName || undefined,
      })

      if (fullName) {
        setPatientName(result.patientId, fullName)
      }

      toast.success(
        isEditing
          ? "Patient workflow record updated."
          : "Patient workflow record created."
      )
      onOpenChange(false)
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Unable to save the patient workflow record."

      toast.error(
        errorMessage === "TRIAL_LIMIT_REACHED"
          ? "The free-trial patient limit has been reached. Upgrade to Premium to add more patients."
          : errorMessage
      )
    } finally {
      setIsSaving(false)
    }
  }

  return {
    formState,
    handleFieldChange,
    handleSubmit,
    isEditing,
    isSaving,
  }
}
