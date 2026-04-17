"use client"

import type { Doc } from "@/convex/_generated/dataModel"
import { PatientDialogLive } from "@/components/organisms/patient-dialog-live"
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
 * Centered modal for patient details with live Convex sync and autosave.
 * State is reset via key prop when patient changes.
 */
export function PatientDialog({
  onOpenChange,
  open,
  organizationId,
  patient,
  userId,
}: Readonly<PatientDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="flex max-h-[85vh] min-h-0 w-full flex-col gap-0 overflow-hidden p-0 sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]"
        showCloseButton={false}
      >
        <PatientDialogLive
          key={`live-${patient?._id ?? "new"}`}
          onOpenChange={onOpenChange}
          open={open}
          organizationId={organizationId}
          patient={patient}
          userId={userId}
        />
      </DialogContent>
    </Dialog>
  )
}
