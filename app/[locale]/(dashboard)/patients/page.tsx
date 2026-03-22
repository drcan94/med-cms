"use client"

import { useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { Plus, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import type { Doc } from "@/convex/_generated/dataModel"
import { PatientDialog } from "@/components/organisms/patient-dialog"
import { PatientTable } from "@/components/organisms/patient-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { usePLGLimits } from "@/hooks/usePLGLimits"

type PatientRecord = Doc<"patients">

export default function PatientsPage() {
  const t = useTranslations("PatientsPage")
  const { isLoaded, orgId, userId } = useAuth()
  const { isLocked, patientCount, patientLimit } = usePLGLimits()
  const [selectedPatient, setSelectedPatient] = useState<PatientRecord | null>(null)
  const [sheetOpen, setSheetOpen] = useState(false)

  const handleCreatePatient = (): void => {
    if (isLocked) {
      return
    }

    setSelectedPatient(null)
    setSheetOpen(true)
  }

  const handleSelectPatient = (patient: PatientRecord): void => {
    if (isLocked) {
      return
    }

    setSelectedPatient(patient)
    setSheetOpen(true)
  }

  return (
    <>
      <div className="grid gap-6">
        <section className="flex flex-col gap-4 rounded-2xl border bg-background p-6 shadow-xs lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t("phaseBadge")}</Badge>
              <Badge variant="secondary" className="gap-1">
                <ShieldCheck className="size-3" />
                {t("privacyBadge")}
              </Badge>
              {isLocked ? (
                <Badge variant="destructive">{t("readOnlyBadge")}</Badge>
              ) : null}
            </div>
            <div className="space-y-2">
              <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
              <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
                {t("description")}
              </p>
              {isLocked ? (
                <p className="text-sm leading-6 text-muted-foreground">
                  {t("lockedDescription", { patientCount, patientLimit })}
                </p>
              ) : null}
            </div>
          </div>

          <Button
            onClick={handleCreatePatient}
            disabled={isLocked || !isLoaded || !orgId || !userId}
          >
            <Plus className="size-4" />
            {t("createPatient")}
          </Button>
        </section>

        <Card>
          <CardHeader>
            <CardTitle>{t("censusTitle")}</CardTitle>
            <CardDescription>{t("censusDescription")}</CardDescription>
          </CardHeader>
          <CardContent>
            <PatientTable
              interactive={!isLocked}
              organizationId={orgId}
              onSelectPatient={handleSelectPatient}
            />
          </CardContent>
        </Card>
      </div>

      <PatientDialog
        key={`dialog-${selectedPatient?._id ?? "new"}-${sheetOpen}`}
        open={isLocked ? false : sheetOpen}
        onOpenChange={(nextOpen) => {
          setSheetOpen(nextOpen)

          if (!nextOpen) {
            setSelectedPatient(null)
          }
        }}
        organizationId={orgId}
        patient={selectedPatient}
        userId={userId}
      />
    </>
  )
}
