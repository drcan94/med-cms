"use client"

import { Controller, useFieldArray, type Control } from "react-hook-form"
import { FlaskConical, Pill, Plus, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import type { PatientFormData } from "@/lib/schemas/patient-form.schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

type MedicationsLabsSectionProps = {
  control: Control<PatientFormData>
}

function generateLabId(): string {
  return `lab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function generateAbxId(): string {
  return `abx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function MedicationsLabsSection({
  control,
}: Readonly<MedicationsLabsSectionProps>) {
  const t = useTranslations("PatientFormSections")

  const {
    fields: labFields,
    append: appendLab,
    remove: removeLab,
  } = useFieldArray({
    control,
    name: "labCultures",
  })

  const {
    fields: abxFields,
    append: appendAbx,
    remove: removeAbx,
  } = useFieldArray({
    control,
    name: "antibiotics",
  })

  const handleAddLabCulture = () => {
    appendLab({
      id: generateLabId(),
      type: "blood_culture",
      status: "ordered",
      orderedAt: new Date().toISOString(),
    })
  }

  const handleAddAntibiotic = () => {
    appendAbx({
      id: generateAbxId(),
      name: "",
      startedAt: new Date().toISOString().split("T")[0],
    })
  }

  return (
    <div className="space-y-8">
      <FieldSet>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-muted-foreground" />
            <FieldLegend variant="label" className="mb-0">{t("labs.title")}</FieldLegend>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddLabCulture}
          >
            <Plus className="mr-1.5 size-3.5" />
            {t("labs.addCulture")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("labs.description")}</p>

        <FieldGroup className="gap-3">
          {labFields.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-muted-foreground">{t("labs.empty")}</p>
              </CardContent>
            </Card>
          ) : (
            labFields.map((field, index) => (
              <Card key={field.id} className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30 px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xs font-medium">
                      <Badge variant="secondary" className="font-mono">
                        #{index + 1}
                      </Badge>
                      {t("labs.cultureTitle")}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeLab(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">{t("labs.remove")}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
                  <Controller
                    name={`labCultures.${index}.type`}
                    control={control}
                    render={({ field: controllerField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={controllerField.name} className="text-xs">
                          {t("labs.type")}
                        </FieldLabel>
                        <Select
                          name={controllerField.name}
                          value={controllerField.value}
                          onValueChange={controllerField.onChange}
                        >
                          <SelectTrigger
                            id={controllerField.name}
                            aria-invalid={fieldState.invalid}
                            className="h-9"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="blood_culture">{t("labs.types.bloodCulture")}</SelectItem>
                            <SelectItem value="urine_culture">{t("labs.types.urineCulture")}</SelectItem>
                            <SelectItem value="sputum_culture">{t("labs.types.sputumCulture")}</SelectItem>
                            <SelectItem value="fluid_culture">{t("labs.types.fluidCulture")}</SelectItem>
                            <SelectItem value="fluid_biochemistry">{t("labs.types.fluidBiochemistry")}</SelectItem>
                            <SelectItem value="cytology">{t("labs.types.cytology")}</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`labCultures.${index}.status`}
                    control={control}
                    render={({ field: controllerField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={controllerField.name} className="text-xs">
                          {t("labs.status")}
                        </FieldLabel>
                        <Select
                          name={controllerField.name}
                          value={controllerField.value}
                          onValueChange={controllerField.onChange}
                        >
                          <SelectTrigger
                            id={controllerField.name}
                            aria-invalid={fieldState.invalid}
                            className="h-9"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ordered">{t("labs.statuses.ordered")}</SelectItem>
                            <SelectItem value="resulted">{t("labs.statuses.resulted")}</SelectItem>
                            <SelectItem value="printed">{t("labs.statuses.printed")}</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`labCultures.${index}.result`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Field>
                        <FieldLabel htmlFor={controllerField.name} className="text-xs">
                          {t("labs.result")}
                        </FieldLabel>
                        <Input
                          {...controllerField}
                          id={controllerField.name}
                          placeholder={t("labs.resultPlaceholder")}
                          className="h-9"
                        />
                      </Field>
                    )}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </FieldGroup>
      </FieldSet>

      <hr className="border-dashed" />

      <FieldSet>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pill className="size-4 text-muted-foreground" />
            <FieldLegend variant="label" className="mb-0">{t("antibiotics.title")}</FieldLegend>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddAntibiotic}
          >
            <Plus className="mr-1.5 size-3.5" />
            {t("antibiotics.addAntibiotic")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("antibiotics.description")}</p>

        <FieldGroup className="gap-3">
          {abxFields.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-6 text-center">
                <p className="text-sm text-muted-foreground">{t("antibiotics.empty")}</p>
              </CardContent>
            </Card>
          ) : (
            abxFields.map((field, index) => (
              <Card key={field.id} className="overflow-hidden">
                <CardHeader className="border-b bg-muted/30 px-4 py-2.5">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-xs font-medium">
                      <Badge variant="secondary" className="font-mono">
                        #{index + 1}
                      </Badge>
                      {t("antibiotics.antibioticTitle")}
                    </CardTitle>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => removeAbx(index)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="size-3.5" />
                      <span className="sr-only">{t("antibiotics.remove")}</span>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
                  <Controller
                    name={`antibiotics.${index}.name`}
                    control={control}
                    render={({ field: controllerField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={controllerField.name} className="text-xs">
                          {t("antibiotics.name")}
                        </FieldLabel>
                        <Input
                          {...controllerField}
                          id={controllerField.name}
                          aria-invalid={fieldState.invalid}
                          placeholder={t("antibiotics.namePlaceholder")}
                          className="h-9"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`antibiotics.${index}.startedAt`}
                    control={control}
                    render={({ field: controllerField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={controllerField.name} className="text-xs">
                          {t("antibiotics.startedAt")}
                        </FieldLabel>
                        <Input
                          {...controllerField}
                          id={controllerField.name}
                          type="date"
                          aria-invalid={fieldState.invalid}
                          className="h-9"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`antibiotics.${index}.stoppedAt`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Field>
                        <FieldLabel htmlFor={controllerField.name} className="text-xs">
                          {t("antibiotics.stoppedAt")}
                        </FieldLabel>
                        <Input
                          {...controllerField}
                          id={controllerField.name}
                          type="date"
                          className="h-9"
                        />
                      </Field>
                    )}
                  />
                </CardContent>
              </Card>
            ))
          )}
        </FieldGroup>
      </FieldSet>
    </div>
  )
}
