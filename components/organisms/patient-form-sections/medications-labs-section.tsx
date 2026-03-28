"use client"

import { Controller, useFieldArray, type Control, type UseFormSetValue, type UseFormWatch } from "react-hook-form"
import { AlertTriangle, Droplets, FlaskConical, Pill, Plus, Syringe, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import type { PatientFormData } from "@/lib/schemas/patient-form.schema"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Field,
  FieldDescription,
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
  setValue: UseFormSetValue<PatientFormData>
  watch: UseFormWatch<PatientFormData>
}

function generateLabId(): string {
  return `lab_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

function generateAbxId(): string {
  return `abx_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
}

export function MedicationsLabsSection({
  control,
  setValue,
  watch,
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

  const {
    fields: anticoagulantFields,
    append: appendAnticoagulant,
    remove: removeAnticoagulant,
  } = useFieldArray({
    control,
    name: "criticalMedications.anticoagulants",
  })

  const {
    fields: antidiabeticFields,
    append: appendAntidiabetic,
    remove: removeAntidiabetic,
  } = useFieldArray({
    control,
    name: "criticalMedications.antidiabetics",
  })

  const initializeCriticalMedications = () => {
    const current = watch("criticalMedications")
    if (!current) {
      setValue("criticalMedications", {
        anticoagulants: [],
        antidiabetics: [],
      })
    }
  }

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

  const handleAddAnticoagulant = () => {
    initializeCriticalMedications()
    appendAnticoagulant({
      name: "",
      lastDoseAt: new Date().toISOString().slice(0, 16),
    })
  }

  const handleAddAntidiabetic = (type: "oral" | "insulin") => {
    initializeCriticalMedications()
    appendAntidiabetic({
      type,
      name: "",
      lastDoseAt: new Date().toISOString().slice(0, 16),
    })
  }

  return (
    <div className="space-y-8">
      {/* Critical Medications - Preoperative Section */}
      <FieldSet>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="size-4 text-destructive" />
            <FieldLegend variant="label" className="mb-0">{t("criticalMeds.title")}</FieldLegend>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("criticalMeds.description")}</p>

        {/* Anticoagulants Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="size-3.5 text-red-500" />
              <span className="text-sm font-medium">{t("criticalMeds.anticoagulants.title")}</span>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddAnticoagulant}
            >
              <Plus className="mr-1.5 size-3.5" />
              {t("criticalMeds.anticoagulants.add")}
            </Button>
          </div>

          <FieldGroup className="gap-2">
            {anticoagulantFields.length === 0 ? (
              <Card className="border-dashed border-red-200 bg-red-50/30">
                <CardContent className="flex flex-col items-center justify-center py-4 text-center">
                  <p className="text-xs text-muted-foreground">{t("criticalMeds.anticoagulants.empty")}</p>
                </CardContent>
              </Card>
            ) : (
              anticoagulantFields.map((field, index) => (
                <Card key={field.id} className="border-red-200 bg-red-50/20">
                  <CardContent className="grid gap-3 p-3 sm:grid-cols-3">
                    <Controller
                      name={`criticalMedications.anticoagulants.${index}.name`}
                      control={control}
                      render={({ field: controllerField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={controllerField.name} className="text-xs">
                            {t("criticalMeds.anticoagulants.name")}
                          </FieldLabel>
                          <Input
                            {...controllerField}
                            id={controllerField.name}
                            aria-invalid={fieldState.invalid}
                            placeholder={t("criticalMeds.anticoagulants.namePlaceholder")}
                            className="h-8"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name={`criticalMedications.anticoagulants.${index}.lastDoseAt`}
                      control={control}
                      render={({ field: controllerField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={controllerField.name} className="text-xs">
                            {t("criticalMeds.anticoagulants.lastDose")}
                          </FieldLabel>
                          <Input
                            {...controllerField}
                            id={controllerField.name}
                            type="datetime-local"
                            aria-invalid={fieldState.invalid}
                            className="h-8"
                          />
                          <FieldDescription className="text-xs">
                            {t("criticalMeds.anticoagulants.lastDoseHint")}
                          </FieldDescription>
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeAnticoagulant(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">{t("criticalMeds.remove")}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </FieldGroup>
        </div>

        {/* Antidiabetics Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Syringe className="size-3.5 text-blue-500" />
              <span className="text-sm font-medium">{t("criticalMeds.antidiabetics.title")}</span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddAntidiabetic("oral")}
              >
                <Pill className="mr-1.5 size-3.5" />
                {t("criticalMeds.antidiabetics.addOral")}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleAddAntidiabetic("insulin")}
              >
                <Syringe className="mr-1.5 size-3.5" />
                {t("criticalMeds.antidiabetics.addInsulin")}
              </Button>
            </div>
          </div>

          <FieldGroup className="gap-2">
            {antidiabeticFields.length === 0 ? (
              <Card className="border-dashed border-blue-200 bg-blue-50/30">
                <CardContent className="flex flex-col items-center justify-center py-4 text-center">
                  <p className="text-xs text-muted-foreground">{t("criticalMeds.antidiabetics.empty")}</p>
                </CardContent>
              </Card>
            ) : (
              antidiabeticFields.map((field, index) => (
                <Card key={field.id} className={field.type === "insulin" ? "border-purple-200 bg-purple-50/20" : "border-blue-200 bg-blue-50/20"}>
                  <CardContent className="grid gap-3 p-3 sm:grid-cols-4">
                    <div className="flex items-center">
                      <Badge variant={field.type === "insulin" ? "default" : "secondary"} className="gap-1">
                        {field.type === "insulin" ? <Syringe className="size-3" /> : <Pill className="size-3" />}
                        {t(`criticalMeds.antidiabetics.types.${field.type}`)}
                      </Badge>
                    </div>

                    <Controller
                      name={`criticalMedications.antidiabetics.${index}.name`}
                      control={control}
                      render={({ field: controllerField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={controllerField.name} className="text-xs">
                            {t("criticalMeds.antidiabetics.name")}
                          </FieldLabel>
                          <Input
                            {...controllerField}
                            id={controllerField.name}
                            aria-invalid={fieldState.invalid}
                            placeholder={t("criticalMeds.antidiabetics.namePlaceholder")}
                            className="h-8"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <Controller
                      name={`criticalMedications.antidiabetics.${index}.lastDoseAt`}
                      control={control}
                      render={({ field: controllerField, fieldState }) => (
                        <Field data-invalid={fieldState.invalid}>
                          <FieldLabel htmlFor={controllerField.name} className="text-xs">
                            {t("criticalMeds.antidiabetics.lastDose")}
                          </FieldLabel>
                          <Input
                            {...controllerField}
                            id={controllerField.name}
                            type="datetime-local"
                            aria-invalid={fieldState.invalid}
                            className="h-8"
                          />
                          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                        </Field>
                      )}
                    />

                    <div className="flex items-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => removeAntidiabetic(index)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">{t("criticalMeds.remove")}</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </FieldGroup>
        </div>
      </FieldSet>

      <hr className="border-dashed" />

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
