"use client"

import { useState } from "react"

import type { Doc } from "@/convex/_generated/dataModel"
import { PatientDialogForm } from "@/components/organisms/patient-dialog-form"
import { PatientDialogView } from "@/components/organisms/patient-dialog-view"
import { Dialog, DialogContent } from "@/components/ui/dialog"

type PatientRecord = Doc<"patients">

export type PatientDialogProps = {
  onOpenChange: (open: boolean) => void
  open: boolean
  organizationId?: string | null
  patient: PatientRecord | null
  userId?: string | null
}

/**
 * Centered modal for patient details with View/Edit modes.
 * NEW patients open directly in Edit Mode.
 * EXISTING patients open in View Mode by default.
 * State is reset via key prop when patient changes.
 */
export function PatientDialog({
  onOpenChange,
  open,
  organizationId,
  patient,
  userId,
}: Readonly<PatientDialogProps>) {
  const isNewPatient = !patient
  const [isEditMode, setIsEditMode] = useState(isNewPatient)

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setIsEditMode(false)
    }
    onOpenChange(nextOpen)
  }

  const handleEnterEditMode = () => {
    setIsEditMode(true)
  }

  const handleCancelEdit = () => {
    if (isNewPatient) {
      onOpenChange(false)
    } else {
      setIsEditMode(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="flex max-h-[90vh] w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]"
        showCloseButton={false}
      >
        {isEditMode ? (
          <PatientDialogForm
            key={`form-${patient?._id ?? "new"}`}
            onCancel={handleCancelEdit}
            onOpenChange={handleOpenChange}
            open={open}
            organizationId={organizationId}
            patient={patient}
            userId={userId}
          />
        ) : (
          <PatientDialogView
            key={`view-${patient?._id}`}
            onClose={() => onOpenChange(false)}
            onEdit={handleEnterEditMode}
            open={open}
            organizationId={organizationId}
            patient={patient}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
