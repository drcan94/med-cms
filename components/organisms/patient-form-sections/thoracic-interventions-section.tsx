"use client"

import { Controller, useFieldArray, type Control } from "react-hook-form"
import { Plus, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import type { PatientFormData } from "@/lib/schemas/patient-form.schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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

type ThoracicInterventionsSectionProps = {
  control: Control<PatientFormData>
}

function generateInterventionId(): string {
  return `int_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function ThoracicInterventionsSection({
  control,
}: Readonly<ThoracicInterventionsSectionProps>) {
  const t = useTranslations("PatientFormSections")
  const { fields, append, remove } = useFieldArray({
    control,
    name: "thoracicInterventions",
  })

  const handleAddIntervention = () => {
    append({
      id: generateInterventionId(),
      type: "chest_tube",
      side: "right",
      indication: "",
      size: "",
      insertionDate: new Date().toISOString().split("T")[0],
      dailyDrainage: [],
      complication: { occurred: false },
      pleurodesis: { performed: false },
    })
  }

  return (
    <FieldSet>
      <div className="flex items-center justify-between">
        <div>
          <FieldLegend variant="label">{t("thoracic.title")}</FieldLegend>
          <p className="text-xs text-muted-foreground">{t("thoracic.description")}</p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddIntervention}
        >
          <Plus className="mr-1.5 size-3.5" />
          {t("thoracic.addIntervention")}
        </Button>
      </div>

      <FieldGroup className="gap-4">
        {fields.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-8 text-center">
              <p className="text-sm text-muted-foreground">{t("thoracic.empty")}</p>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleAddIntervention}
                className="mt-2"
              >
                {t("thoracic.addFirst")}
              </Button>
            </CardContent>
          </Card>
        ) : (
          fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">#{index + 1}</Badge>
                    {t("thoracic.interventionTitle")}
                  </CardTitle>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => remove(index)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    <span className="sr-only">{t("thoracic.remove")}</span>
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <Controller
                    name={`thoracicInterventions.${index}.type`}
                    control={control}
                    render={({ field: controllerField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={controllerField.name} className="text-xs">
                          {t("thoracic.type")}
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
                            <SelectItem value="chest_tube">
                              {t("thoracic.types.chestTube")}
                            </SelectItem>
                            <SelectItem value="drain">
                              {t("thoracic.types.drain")}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`thoracicInterventions.${index}.side`}
                    control={control}
                    render={({ field: controllerField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={controllerField.name} className="text-xs">
                          {t("thoracic.side")}
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
                            <SelectItem value="right">{t("thoracic.sides.right")}</SelectItem>
                            <SelectItem value="left">{t("thoracic.sides.left")}</SelectItem>
                            <SelectItem value="bilateral">{t("thoracic.sides.bilateral")}</SelectItem>
                          </SelectContent>
                        </Select>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`thoracicInterventions.${index}.size`}
                    control={control}
                    render={({ field: controllerField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={controllerField.name} className="text-xs">
                          {t("thoracic.size")}
                        </FieldLabel>
                        <Input
                          {...controllerField}
                          id={controllerField.name}
                          aria-invalid={fieldState.invalid}
                          placeholder="28F"
                          className="h-9"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`thoracicInterventions.${index}.insertionDate`}
                    control={control}
                    render={({ field: controllerField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={controllerField.name} className="text-xs">
                          {t("thoracic.insertionDate")}
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
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Controller
                    name={`thoracicInterventions.${index}.indication`}
                    control={control}
                    render={({ field: controllerField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={controllerField.name} className="text-xs">
                          {t("thoracic.indication")}
                        </FieldLabel>
                        <Input
                          {...controllerField}
                          id={controllerField.name}
                          aria-invalid={fieldState.invalid}
                          placeholder={t("thoracic.indicationPlaceholder")}
                          className="h-9"
                        />
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />

                  <Controller
                    name={`thoracicInterventions.${index}.removalDate`}
                    control={control}
                    render={({ field: controllerField, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={controllerField.name} className="text-xs">
                          {t("thoracic.removalDate")}
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
                </div>

                <div className="flex flex-wrap gap-4">
                  <Controller
                    name={`thoracicInterventions.${index}.usedUltrasound`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Field orientation="horizontal">
                        <Checkbox
                          id={controllerField.name}
                          name={controllerField.name}
                          checked={controllerField.value ?? false}
                          onCheckedChange={controllerField.onChange}
                        />
                        <FieldLabel htmlFor={controllerField.name} className="text-xs font-normal">
                          {t("thoracic.usedUltrasound")}
                        </FieldLabel>
                      </Field>
                    )}
                  />

                  <Controller
                    name={`thoracicInterventions.${index}.cytologySent`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Field orientation="horizontal">
                        <Checkbox
                          id={controllerField.name}
                          name={controllerField.name}
                          checked={controllerField.value ?? false}
                          onCheckedChange={controllerField.onChange}
                        />
                        <FieldLabel htmlFor={controllerField.name} className="text-xs font-normal">
                          {t("thoracic.cytologySent")}
                        </FieldLabel>
                      </Field>
                    )}
                  />

                  <Controller
                    name={`thoracicInterventions.${index}.complication.occurred`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Field orientation="horizontal">
                        <Checkbox
                          id={controllerField.name}
                          name={controllerField.name}
                          checked={controllerField.value ?? false}
                          onCheckedChange={controllerField.onChange}
                        />
                        <FieldLabel htmlFor={controllerField.name} className="text-xs font-normal">
                          {t("thoracic.complicationOccurred")}
                        </FieldLabel>
                      </Field>
                    )}
                  />

                  <Controller
                    name={`thoracicInterventions.${index}.pleurodesis.performed`}
                    control={control}
                    render={({ field: controllerField }) => (
                      <Field orientation="horizontal">
                        <Checkbox
                          id={controllerField.name}
                          name={controllerField.name}
                          checked={controllerField.value ?? false}
                          onCheckedChange={controllerField.onChange}
                        />
                        <FieldLabel htmlFor={controllerField.name} className="text-xs font-normal">
                          {t("thoracic.pleurodesis")}
                        </FieldLabel>
                      </Field>
                    )}
                  />
                </div>

                <Controller
                  name={`thoracicInterventions.${index}.insertedByYear`}
                  control={control}
                  render={({ field: controllerField, fieldState }) => (
                    <Field data-invalid={fieldState.invalid} className="max-w-[200px]">
                      <FieldLabel htmlFor={controllerField.name} className="text-xs">
                        {t("thoracic.insertedByYear")}
                      </FieldLabel>
                      <Input
                        {...controllerField}
                        id={controllerField.name}
                        type="number"
                        min="1"
                        max="6"
                        aria-invalid={fieldState.invalid}
                        placeholder="1-6"
                        className="h-9"
                        onChange={(e) => controllerField.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </CardContent>
            </Card>
          ))
        )}
      </FieldGroup>
    </FieldSet>
  )
}
