"use client"

import { useLocale } from "next-intl"

import type { Doc } from "@/convex/_generated/dataModel"
import { usePatientSheetForm } from "@/hooks/usePatientSheetForm"
import type { AppLocale } from "@/i18n/routing"
import { generatePatientInitials } from "@/lib/patient-privacy"
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
  const locale = useLocale() as AppLocale
  const { formState, handleFieldChange, handleSubmit, isEditing, isSaving } =
    usePatientSheetForm({
      onOpenChange,
      organizationId,
      patient,
      userId,
    })
  const initialsPreview =
    formState.fullName.trim().length > 0
      ? generatePatientInitials(formState.fullName, locale)
      : patient?.initials ?? ""

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
          Full patient names never enter Convex. This form derives masked
          initials locally and keeps the bedside name only in browser storage.
        </SheetDescription>
      </SheetHeader>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full Name</Label>
            <Input
              id="fullName"
              value={formState.fullName}
              onChange={handleFieldChange("fullName")}
              placeholder="Ali Aksoy"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initials">Initials preview</Label>
            <Input
              id="initials"
              value={initialsPreview}
              placeholder="A*** Y***"
              readOnly
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="bedId">Bed (optional)</Label>
            <Input
              id="bedId"
              value={formState.bedId}
              onChange={handleFieldChange("bedId")}
              placeholder="Room 101 - Bed 1"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serviceName">Service / Ward</Label>
            <Input
              id="serviceName"
              value={formState.serviceName}
              onChange={handleFieldChange("serviceName")}
              placeholder="Gogus Cerrahi"
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
          Full names stay in browser storage only. If no bed is selected, this
          patient is staged for later placement on the ward board.
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
