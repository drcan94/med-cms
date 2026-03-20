"use client"

import type { UseFormRegister } from "react-hook-form"
import { ClipboardList, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  CONVENTION_SOURCE_OPTIONS,
  type ConventionSourceField,
  type ConventionsFormValues,
} from "@/lib/clinic-settings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type RuleBuilderRowProps = {
  checklistItemError?: string
  index: number
  matchValueError?: string
  onRemove: () => void
  onSourceFieldChange: (value: ConventionSourceField) => void
  register: UseFormRegister<ConventionsFormValues>
  sourceField: ConventionSourceField
}

export function RuleBuilderRow({
  checklistItemError,
  index,
  matchValueError,
  onRemove,
  onSourceFieldChange,
  register,
  sourceField,
}: Readonly<RuleBuilderRowProps>) {
  const t = useTranslations("RuleBuilderRow")
  const baseFieldName = `rules.${index}` as const
  const sourceOptions = CONVENTION_SOURCE_OPTIONS.map((option) => ({
    ...option,
    label: t(`sourceOptions.${option.value}.label`),
  }))
  const matchValueInputId = `rule-${index}-match-value`
  const checklistItemInputId = `rule-${index}-checklist-item`

  return (
    <Card size="sm" className="border-dashed">
      <CardHeader className="border-b pb-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-4 text-primary" />
            <Badge variant="outline">{t("ruleBadge", { number: index + 1 })}</Badge>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="size-4" />
            {t("actions.remove")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="pt-4">
        <input type="hidden" {...register(`${baseFieldName}.id`)} />
        <input type="hidden" {...register(`${baseFieldName}.operator`)} />
        <input type="hidden" {...register(`${baseFieldName}.sourceField`)} />

        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium text-foreground">{t("sentence.if")}</span>

          <Select
            value={sourceField}
            onValueChange={(value) => onSourceFieldChange(value as ConventionSourceField)}
          >
            <SelectTrigger className="h-9 w-auto min-w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sourceOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <span className="text-muted-foreground">{t("sentence.contains")}</span>

          <div className="relative min-w-[180px] flex-1">
            <Input
              id={matchValueInputId}
              aria-invalid={Boolean(matchValueError)}
              aria-label={t("fields.matchValue.ariaLabel")}
              placeholder={t("fields.matchValue.placeholder")}
              className="h-9"
              {...register(`${baseFieldName}.matchValue`, {
                validate: (value) =>
                  value.trim().length > 0 || t("fields.matchValue.error"),
              })}
            />
          </div>

          <span className="font-medium text-foreground">{t("sentence.thenRequire")}</span>

          <div className="relative min-w-[200px] flex-1">
            <Input
              id={checklistItemInputId}
              aria-invalid={Boolean(checklistItemError)}
              aria-label={t("fields.checklistItem.ariaLabel")}
              placeholder={t("fields.checklistItem.placeholder")}
              className="h-9"
              {...register(`${baseFieldName}.checklistItem`, {
                validate: (value) =>
                  value.trim().length > 0 || t("fields.checklistItem.error"),
              })}
            />
          </div>
        </div>

        {(matchValueError ?? checklistItemError) ? (
          <p className="mt-2 text-xs text-destructive">
            {matchValueError ?? checklistItemError}
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
