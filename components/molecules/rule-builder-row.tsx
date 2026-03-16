"use client"

import type { UseFormRegister } from "react-hook-form"
import { Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  CONVENTION_SOURCE_OPTIONS,
  type ConventionSourceField,
  type ConventionsFormValues,
} from "@/lib/clinic-settings"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

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
    description: t(`sourceOptions.${option.value}.description`),
    label: t(`sourceOptions.${option.value}.label`),
  }))
  const selectedSourceOption = sourceOptions.find((option) => option.value === sourceField)
  const matchValueInputId = `rule-${index}-match-value`
  const checklistItemInputId = `rule-${index}-checklist-item`

  return (
    <Card size="sm" className="border-dashed">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">{t("ruleBadge", { number: index + 1 })}</Badge>
              <Badge variant="secondary">{t("ifThenBadge")}</Badge>
            </div>
            <CardTitle>{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={onRemove}>
            <Trash2 className="size-4" />
            {t("actions.remove")}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 pt-4">
        <input type="hidden" {...register(`${baseFieldName}.id`)} />
        <input type="hidden" {...register(`${baseFieldName}.operator`)} />
        <input type="hidden" {...register(`${baseFieldName}.sourceField`)} />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{t("ifBadge")}</Badge>
            <span className="text-sm text-muted-foreground">{t("sourceFieldHint")}</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {sourceOptions.map((option) => (
              <Button
                key={option.value}
                type="button"
                variant={sourceField === option.value ? "secondary" : "outline"}
                size="sm"
                onClick={() => onSourceFieldChange(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>

          <p className="text-xs leading-5 text-muted-foreground">
            {selectedSourceOption?.description}
          </p>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={matchValueInputId}>{t("fields.matchValue.label")}</Label>
            <Input
              id={matchValueInputId}
              aria-invalid={Boolean(matchValueError)}
              placeholder={t("fields.matchValue.placeholder")}
              {...register(`${baseFieldName}.matchValue`, {
                validate: (value) =>
                  value.trim().length > 0 || t("fields.matchValue.error"),
              })}
            />
            {matchValueError ? (
              <p className="text-xs text-destructive">{matchValueError}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={checklistItemInputId}>
              {t("fields.checklistItem.label")}
            </Label>
            <Input
              id={checklistItemInputId}
              aria-invalid={Boolean(checklistItemError)}
              placeholder={t("fields.checklistItem.placeholder")}
              {...register(`${baseFieldName}.checklistItem`, {
                validate: (value) =>
                  value.trim().length > 0 || t("fields.checklistItem.error"),
              })}
            />
            {checklistItemError ? (
              <p className="text-xs text-destructive">{checklistItemError}</p>
            ) : null}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
