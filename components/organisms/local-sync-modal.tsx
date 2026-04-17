"use client"

import { useCallback, useMemo, useState } from "react"
import { CheckCircle2, FileSpreadsheet, ShieldCheck, Trash2, UploadCloud } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Papa from "papaparse"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useLocalRoster } from "@/hooks/useLocalRoster"
import {
  buildRosterFromCsv,
  CSV_ERROR_MISSING_COLUMNS,
  CSV_ERROR_NO_VALID_ROWS,
} from "@/lib/local-roster-csv"
import type { PatientPrivacyLocale } from "@/lib/patient-privacy"
import { cn } from "@/lib/utils"
import type { VariantProps } from "class-variance-authority"

type StatusTone = "default" | "error" | "success"
type LocalSyncModalProps = {
  triggerLabel?: string
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"]
  triggerSize?: VariantProps<typeof buttonVariants>["size"]
  triggerClassName?: string
}

function getLocalSyncErrorMessage(
  error: unknown,
  t: (key: string, values?: Record<string, string | number>) => string
): string {
  if (!(error instanceof Error)) {
    return t("errors.syncFailed")
  }

  switch (error.message) {
    case "CSV_PARSE_FAILED":
      return t("errors.parseFailed")
    case CSV_ERROR_MISSING_COLUMNS:
      return t("errors.missingColumns")
    case CSV_ERROR_NO_VALID_ROWS:
      return t("errors.noValidRows")
    default:
      return error.message
  }
}

export function LocalSyncModal({
  triggerLabel,
  triggerVariant = "default",
  triggerSize = "default",
  triggerClassName,
}: Readonly<LocalSyncModalProps>) {
  const t = useTranslations("LocalSyncModal")
  const locale = useLocale()
  const privacyLocale: PatientPrivacyLocale = locale === "tr" ? "tr" : "en"
  const defaultStatusMessage = t("status.default")
  const resolvedTriggerLabel = triggerLabel ?? t("trigger")
  const [isOpen, setIsOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [lastImportedFile, setLastImportedFile] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState(defaultStatusMessage)
  const [statusTone, setStatusTone] = useState<StatusTone>("default")
  const {
    bedEntryCount,
    bulkUpdateBedRoster,
    bulkUpdateRoster,
    clearRoster,
    entryCount,
    patientEntryCount,
  } = useLocalRoster()

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]
      if (!file) return

      setIsImporting(true)
      setStatusTone("default")
      setStatusMessage(t("status.processing", { fileName: file.name }))

      try {
        const fileText = await file.text()
        const parseResult = Papa.parse<Record<string, string | undefined>>(fileText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
        })

        if (parseResult.errors.length > 0) throw new Error("CSV_PARSE_FAILED")

        const { bedRoster, patientRoster } = buildRosterFromCsv(
          parseResult.data,
          parseResult.meta.fields ?? [],
          privacyLocale
        )

        bulkUpdateBedRoster(bedRoster)
        bulkUpdateRoster(patientRoster)

        const bedCount = Object.keys(bedRoster).length
        const patientCount = Object.keys(patientRoster).length

        setLastImportedFile(file.name)
        setStatusTone("success")
        setStatusMessage(
          t("status.imported", { bedCount, patientCount, total: bedCount + patientCount })
        )
        toast.success(
          t("toasts.synced", { bedCount, patientCount, total: bedCount + patientCount })
        )
      } catch (error) {
        const message = getLocalSyncErrorMessage(error, t)
        setStatusTone("error")
        setStatusMessage(message)
        toast.error(message)
      } finally {
        setIsImporting(false)
      }
    },
    [bulkUpdateBedRoster, bulkUpdateRoster, privacyLocale, t]
  )

  const handleClear = useCallback(() => {
    clearRoster()
    setLastImportedFile(null)
    setStatusTone("success")
    setStatusMessage(t("status.cleared"))
    toast.success(t("toasts.cleared"))
  }, [clearRoster, t])

  const { getInputProps, getRootProps, isDragActive } = useDropzone({
    accept: {
      "application/vnd.ms-excel": [".csv"],
      "text/csv": [".csv"],
    },
    disabled: isImporting,
    maxFiles: 1,
    multiple: false,
    onDrop: handleDrop,
  })

  const triggerButton = useMemo(
    () => (
      <Button
        variant={triggerVariant}
        size={triggerSize}
        className={cn("gap-2", triggerClassName)}
        type="button"
      >
        <ShieldCheck className="size-4 shrink-0" />
        {resolvedTriggerLabel}
      </Button>
    ),
    [resolvedTriggerLabel, triggerClassName, triggerSize, triggerVariant]
  )

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen)
        if (nextOpen) {
          setStatusTone("default")
          setStatusMessage(defaultStatusMessage)
        }
      }}
    >
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>

      <DialogContent
        showCloseButton={false}
        className="max-h-[calc(100vh-4rem)] overflow-y-auto sm:max-w-2xl"
      >
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{t("badges.privacy")}</Badge>
            <Badge variant="secondary">{t("badges.localOnly")}</Badge>
          </div>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription className="max-w-2xl wrap-break-word leading-6 text-wrap">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <Card size="sm" className="border-primary/15 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              {t("privacyTitle")}
            </CardTitle>
            <CardDescription className="wrap-break-word leading-6 text-wrap">
              {t("privacyDescription")}
            </CardDescription>
          </CardHeader>
        </Card>

        <div
          {...getRootProps()}
          className={cn(
            "rounded-xl border border-dashed px-6 py-7 text-center transition-colors sm:p-8",
            isDragActive
              ? "border-primary bg-primary/5"
              : "border-border bg-muted/20 hover:bg-muted/40",
            isImporting && "pointer-events-none opacity-70"
          )}
        >
          <input {...getInputProps()} />
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UploadCloud className="size-5" />
          </div>
          <p className="font-medium">{isDragActive ? t("dropzone.active") : t("dropzone.idle")}</p>
          <p className="mt-2 text-sm text-muted-foreground">{t("dropzone.expectation")}</p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <FileSpreadsheet className="size-3.5" />
            {t("dropzone.fileHint")}
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("summary.statusTitle")}</CardTitle>
              <CardDescription className="wrap-break-word text-wrap">
                {entryCount > 0
                  ? t("summary.statusWithCounts", {
                      bedCount: bedEntryCount,
                      patientCount: patientEntryCount,
                    })
                  : t("summary.statusEmpty")}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>{t("summary.latestImportTitle")}</CardTitle>
              <CardDescription className="wrap-break-word text-wrap">
                {lastImportedFile
                  ? t("summary.latestImportWithFile", { fileName: lastImportedFile })
                  : t("summary.latestImportEmpty")}
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        <div
          className={cn(
            "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
            statusTone === "error" && "border-destructive/30 text-destructive",
            statusTone === "success" && "border-primary/20 text-foreground",
            statusTone === "default" && "border-border text-muted-foreground"
          )}
        >
          <CheckCircle2
            className={cn(
              "size-4 shrink-0",
              statusTone === "error" && "text-destructive",
              statusTone !== "error" && "text-primary"
            )}
          />
          <span>{statusMessage}</span>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
            {t("actions.close")}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleClear}
            disabled={entryCount === 0 || isImporting}
          >
            <Trash2 className="size-4" />
            {t("actions.clear")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
