"use client"

import { useCallback, useState } from "react"
import { CheckCircle2, FileSpreadsheet, ShieldCheck, Trash2, UploadCloud } from "lucide-react"
import Papa from "papaparse"
import { useDropzone } from "react-dropzone"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { buildRosterFromCsv } from "@/lib/local-roster-csv"
import { cn } from "@/lib/utils"

type StatusTone = "default" | "error" | "success"

type LocalSyncModalProps = {
  triggerLabel?: string
}

const DEFAULT_STATUS_MESSAGE =
  'Upload a CSV with headers like "Bed Number" and "Patient Name".'

export function LocalSyncModal({
  triggerLabel = "Sync local roster",
}: Readonly<LocalSyncModalProps>) {
  const [isOpen, setIsOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [lastImportedFile, setLastImportedFile] = useState<string | null>(null)
  const [statusMessage, setStatusMessage] = useState(DEFAULT_STATUS_MESSAGE)
  const [statusTone, setStatusTone] = useState<StatusTone>("default")
  const { clearRoster, entryCount, setRoster } = useLocalRoster()

  const handleDrop = useCallback(
    async (acceptedFiles: File[]) => {
      const file = acceptedFiles[0]

      if (!file) {
        return
      }

      setIsImporting(true)
      setStatusTone("default")
      setStatusMessage(`Processing ${file.name}...`)

      try {
        const fileText = await file.text()
        const parseResult = Papa.parse<Record<string, string | undefined>>(fileText, {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header) => header.trim(),
        })

        if (parseResult.errors.length > 0) {
          throw new Error(parseResult.errors[0]?.message ?? "CSV parsing failed.")
        }

        const roster = buildRosterFromCsv(parseResult.data, parseResult.meta.fields ?? [])

        setRoster(roster)
        setLastImportedFile(file.name)
        setStatusTone("success")
        setStatusMessage(
          `Imported ${Object.keys(roster).length} bed-to-name mappings to this device.`
        )
        toast.success("Local roster synced to this device.")
      } catch (error) {
        const message =
          error instanceof Error
            ? error.message
            : "Unable to sync the local roster from this CSV."

        setStatusTone("error")
        setStatusMessage(message)
        toast.error(message)
      } finally {
        setIsImporting(false)
      }
    },
    [setRoster]
  )

  const handleClear = useCallback(() => {
    clearRoster()
    setLastImportedFile(null)
    setStatusTone("success")
    setStatusMessage("Local roster removed from this device.")
    toast.success("Local roster cleared from this device.")
  }, [clearRoster])

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

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(nextOpen) => {
        setIsOpen(nextOpen)

        if (nextOpen) {
          setStatusTone("default")
          setStatusMessage(DEFAULT_STATUS_MESSAGE)
        }
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <ShieldCheck className="size-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Zero-Liability PII</Badge>
            <Badge variant="secondary">Local device only</Badge>
          </div>
          <DialogTitle>Secure local roster sync</DialogTitle>
          <DialogDescription className="max-w-2xl leading-6">
            Drop a hospital CSV to map `bedId` values to full patient names on
            this workstation. Data stays on this device and never enters Convex.
          </DialogDescription>
        </DialogHeader>

        <Card size="sm" className="border-primary/15 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              Clinical privacy boundary
            </CardTitle>
            <CardDescription className="leading-6">
              The uploaded roster is stored only in browser LocalStorage. The
              backend remains limited to patient initials and operational data.
            </CardDescription>
          </CardHeader>
        </Card>

        <div
          {...getRootProps()}
          className={cn(
            "rounded-xl border border-dashed p-8 text-center transition-colors",
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
          <p className="font-medium">
            {isDragActive ? "Drop the CSV to import it" : "Drag and drop a CSV file"}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Expecting headers like &quot;Bed Number&quot; and &quot;Patient Name&quot;.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs text-muted-foreground">
            <FileSpreadsheet className="size-3.5" />
            CSV only, one file per import
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <Card size="sm">
            <CardHeader>
              <CardTitle>Local roster status</CardTitle>
              <CardDescription>
                {entryCount > 0
                  ? `${entryCount} bed-to-name mappings are stored on this device.`
                  : "No local patient roster has been synced yet."}
              </CardDescription>
            </CardHeader>
          </Card>

          <Card size="sm">
            <CardHeader>
              <CardTitle>Latest import</CardTitle>
              <CardDescription>
                {lastImportedFile
                  ? `${lastImportedFile} is the latest uploaded roster file.`
                  : "No CSV has been imported during this session."}
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

        <DialogFooter showCloseButton>
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={entryCount === 0 || isImporting}
          >
            <Trash2 className="size-4" />
            Clear local roster
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
