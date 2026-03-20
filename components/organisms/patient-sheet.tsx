"use client"

import type { Doc } from "@/convex/_generated/dataModel"
import { PatientSheetForm } from "@/components/organisms/patient-sheet-form"
import { Sheet, SheetContent } from "@/components/ui/sheet"

type PatientRecord = Doc<"patients">
type PatientSheetProps = {
  onOpenChange: (open: boolean) => void
  open: boolean
  organizationId?: string | null
  patient: PatientRecord | null
  userId?: string | null
}

export function PatientSheet(props: Readonly<PatientSheetProps>) {
  const { onOpenChange, open, organizationId, patient, userId } = props

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
