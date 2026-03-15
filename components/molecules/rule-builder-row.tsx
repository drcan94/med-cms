"use client"

import type { UseFormRegister } from "react-hook-form"
import { Trash2 } from "lucide-react"

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
  const baseFieldName = `rules.${index}` as const
  const selectedSourceOption = CONVENTION_SOURCE_OPTIONS.find(
    (option) => option.value === sourceField
  )
  const matchValueInputId = `rule-${index}-match-value`
  const checklistItemInputId = `rule-${index}-checklist-item`

  return (
    <Card size="sm" className="border-dashed">
      <CardHeader className="border-b">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">Rule {index + 1}</Badge>
              <Badge variant="secondary">IF / THEN</Badge>
            </div>
            <CardTitle>Clinical requirement trigger</CardTitle>
            <CardDescription>
              Match workflow requirements against diagnosis or surgery text.
            </CardDescription>
          </div>

          <Button type="button" variant="outline" size="sm" onClick={onRemove}>
            <Trash2 className="size-4" />
            Remove
          </Button>
        </div>
      </CardHeader>

      <CardContent className="grid gap-5 pt-4">
        <input type="hidden" {...register(`${baseFieldName}.id`)} />
        <input type="hidden" {...register(`${baseFieldName}.operator`)} />
        <input type="hidden" {...register(`${baseFieldName}.sourceField`)} />

        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">IF</Badge>
            <span className="text-sm text-muted-foreground">
              choose the clinical note field to inspect
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {CONVENTION_SOURCE_OPTIONS.map((option) => (
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
            <Label htmlFor={matchValueInputId}>contains</Label>
            <Input
              id={matchValueInputId}
              aria-invalid={Boolean(matchValueError)}
              placeholder="hip fracture, CABG, ORIF, etc."
              {...register(`${baseFieldName}.matchValue`, {
                validate: (value) =>
                  value.trim().length > 0 || "Enter text to match.",
              })}
            />
            {matchValueError ? (
              <p className="text-xs text-destructive">{matchValueError}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor={checklistItemInputId}>THEN require</Label>
            <Input
              id={checklistItemInputId}
              aria-invalid={Boolean(checklistItemError)}
              placeholder="VTE prophylaxis checklist"
              {...register(`${baseFieldName}.checklistItem`, {
                validate: (value) =>
                  value.trim().length > 0 || "Enter a checklist requirement.",
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
