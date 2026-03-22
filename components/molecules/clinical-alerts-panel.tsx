"use client"

import { AlertOctagon, AlertTriangle, CheckSquare, Info } from "lucide-react"

import type { RuleEvaluationResult } from "@/lib/clinical-rules"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { cn } from "@/lib/utils"

type ClinicalAlertsPanelProps = {
  evaluation: RuleEvaluationResult
  className?: string
  compact?: boolean
}

export function ClinicalAlertsPanel({
  evaluation,
  className,
  compact = false,
}: Readonly<ClinicalAlertsPanelProps>) {
  const { blocks, warnings, requirements } = evaluation
  const hasAlerts = blocks.length > 0 || warnings.length > 0 || requirements.length > 0

  if (!hasAlerts) {
    return null
  }

  return (
    <div className={cn("space-y-3", className)}>
      {blocks.length > 0 && (
        <div className="space-y-2">
          {!compact && (
            <h4 className="flex items-center gap-2 text-sm font-semibold text-destructive">
              <AlertOctagon className="size-4" />
              Engelleyici Hatalar
            </h4>
          )}
          {blocks.map((block) => (
            <Alert
              key={block.id}
              variant="destructive"
              className={cn(
                "border-destructive/50 bg-destructive/5",
                compact && "py-2"
              )}
            >
              <AlertOctagon className="size-4" />
              <AlertTitle className={cn(compact && "text-sm")}>
                Kayıt Engelleyici
              </AlertTitle>
              <AlertDescription className={cn(compact && "text-xs")}>
                {block.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {warnings.length > 0 && (
        <div className="space-y-2">
          {!compact && (
            <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-600 dark:text-amber-500">
              <AlertTriangle className="size-4" />
              Uyarılar
            </h4>
          )}
          {warnings.map((warning) => (
            <Alert
              key={warning.id}
              className={cn(
                "border-amber-500/50 bg-amber-50 text-amber-900 dark:border-amber-500/30 dark:bg-amber-950/30 dark:text-amber-200",
                compact && "py-2"
              )}
            >
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-500" />
              <AlertTitle className={cn(compact && "text-sm")}>
                Dikkat
              </AlertTitle>
              <AlertDescription
                className={cn(
                  "text-amber-800 dark:text-amber-300",
                  compact && "text-xs"
                )}
              >
                {warning.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {requirements.length > 0 && (
        <div className="space-y-2">
          {!compact && (
            <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-600 dark:text-blue-400">
              <CheckSquare className="size-4" />
              Klinik Gereksinimler
            </h4>
          )}
          {requirements.map((req) => (
            <Alert
              key={req.id}
              className={cn(
                "border-blue-500/50 bg-blue-50 text-blue-900 dark:border-blue-500/30 dark:bg-blue-950/30 dark:text-blue-200",
                compact && "py-2"
              )}
            >
              <Info className="size-4 text-blue-600 dark:text-blue-400" />
              <AlertTitle className={cn(compact && "text-sm")}>
                Gereksinim
              </AlertTitle>
              <AlertDescription
                className={cn(
                  "text-blue-800 dark:text-blue-300",
                  compact && "text-xs"
                )}
              >
                {req.message}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}
    </div>
  )
}

export function ClinicalAlertsSummary({
  evaluation,
  className,
}: Readonly<Pick<ClinicalAlertsPanelProps, "evaluation" | "className">>) {
  const { blocks, warnings, requirements } = evaluation
  const hasAlerts = blocks.length > 0 || warnings.length > 0 || requirements.length > 0

  if (!hasAlerts) {
    return null
  }

  return (
    <div className={cn("flex items-center gap-3 text-xs", className)}>
      {blocks.length > 0 && (
        <span className="flex items-center gap-1 text-destructive">
          <AlertOctagon className="size-3.5" />
          {blocks.length} engel
        </span>
      )}
      {warnings.length > 0 && (
        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-500">
          <AlertTriangle className="size-3.5" />
          {warnings.length} uyarı
        </span>
      )}
      {requirements.length > 0 && (
        <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <CheckSquare className="size-3.5" />
          {requirements.length} gereksinim
        </span>
      )}
    </div>
  )
}
