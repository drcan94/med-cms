"use client"

import { useState } from "react"
import { useMutation } from "convex/react"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import {
  getInitialPatientFormState,
  toClinicalIsoDate,
  type PatientFormState,
} from "@/lib/patient-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"

type PatientRecord = Doc<"patients">

type PatientSheetProps = {
  onOpenChange: (open: boolean) => void
  open: boolean
  organizationId?: string | null
  patient: PatientRecord | null
  userId?: string | null
}

type PatientSheetFormProps = PatientSheetProps

function PatientSheetForm({
  onOpenChange,
  organizationId,
  patient,
  userId,
}: Readonly<PatientSheetFormProps>) {
  const [formState, setFormState] = useState<PatientFormState>(() =>
    getInitialPatientFormState(patient)
  )
  const [isSaving, setIsSaving] = useState(false)
  const isEditing = Boolean(patient)
  const upsertPatient = useMutation(api.patients.upsertPatient)

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

    const initials = formState.initials.trim()
    const bedId = formState.bedId.trim()
    const diagnosis = formState.diagnosis.trim()
    const admissionDate = formState.admissionDate.trim()
    const surgeryDate = formState.surgeryDate.trim()

    if (!initials || !bedId || !diagnosis || !admissionDate) {
      toast.error("Bed, initials, diagnosis, and admission date are required.")
      return
    }

    setIsSaving(true)

    try {
      await upsertPatient({
        patientId: patient?._id,
        organizationId,
        userId,
        initials,
        bedId,
        diagnosis,
        admissionDate: toClinicalIsoDate(admissionDate),
        surgeryDate: surgeryDate ? toClinicalIsoDate(surgeryDate) : undefined,
      })

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

  return (
    <form onSubmit={handleSubmit} className="flex h-full flex-col">
      <SheetHeader className="border-b">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{isEditing ? "Edit patient" : "New patient"}</Badge>
          <Badge variant="secondary">Initials only in Convex</Badge>
        </div>
        <SheetTitle>
          {isEditing ? "Update patient workflow" : "Create patient workflow"}
        </SheetTitle>
        <SheetDescription className="leading-6">
          Full patient names never enter Convex. Use initials here, then merge
          bedside names locally through the roster sync workflow.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bedId">Bed</Label>
            <Input
              id="bedId"
              value={formState.bedId}
              onChange={handleFieldChange("bedId")}
              placeholder="Room 2 / Bed 5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initials">Patient initials</Label>
            <Input
              id="initials"
              value={formState.initials}
              onChange={handleFieldChange("initials")}
              placeholder="A*** Y***"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="diagnosis">Diagnosis</Label>
          <Textarea
            id="diagnosis"
            value={formState.diagnosis}
            onChange={handleFieldChange("diagnosis")}
            placeholder="Post-op observation, fracture stabilization, etc."
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="admissionDate">Admission date</Label>
            <Input
              id="admissionDate"
              type="date"
              value={formState.admissionDate}
              onChange={handleFieldChange("admissionDate")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="surgeryDate">Surgery date</Label>
            <Input
              id="surgeryDate"
              type="date"
              value={formState.surgeryDate}
              onChange={handleFieldChange("surgeryDate")}
            />
          </div>
        </div>

        <div className="rounded-xl border border-dashed px-4 py-3 text-xs leading-6 text-muted-foreground">
          Local roster sync can overlay the full bedside name later using
          browser storage, but this form intentionally persists only initials.
        </div>
      </div>

      <SheetFooter className="border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSaving}>
          {isSaving
            ? "Saving..."
            : isEditing
              ? "Save changes"
              : "Create patient"}
        </Button>
      </SheetFooter>
    </form>
  )
}

export function PatientSheet({
  onOpenChange,
  open,
  organizationId,
  patient,
  userId,
}: Readonly<PatientSheetProps>) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full p-0 sm:max-w-xl">
        <PatientSheetForm
          key={`${patient?._id ?? "new"}:${open ? "open" : "closed"}`}
          onOpenChange={onOpenChange}
          open={open}
          organizationId={organizationId}
          patient={patient}
          userId={userId}
        />
      </SheetContent>
    </Sheet>
  )
}
