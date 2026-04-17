"use client"

import { useEffect } from "react"
import { Controller, type Control, type UseFormSetValue, type UseFormWatch } from "react-hook-form"
import { Activity, Cigarette, FlaskConical, Radiation } from "lucide-react"
import { useTranslations } from "next-intl"

import {
  calculateAaGradient,
  DEFAULT_PATM_MMHG,
  DEFAULT_WATER_VAPOR_PRESSURE_MMHG,
} from "@/lib/aa-gradient-calculator"
import type { PatientFormData } from "@/lib/schemas/patient-form.schema"
import { Card, CardContent } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
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
import { Textarea } from "@/components/ui/textarea"

type SymptomKey =
  | "fever"
  | "weightLoss"
  | "nightSweats"
  | "fatigue"
  | "cough"
  | "sputum"
  | "hemoptysis"
  | "dyspneaExertion"
  | "dyspneaRest"
  | "orthopnea"
  | "wheezing"
  | "chestPain"
  | "palpitation"
  | "syncope"
  | "legEdema"
  | "dysphagia"
  | "pyrosis"
  | "nauseaVomiting"
  | "abdominalPain"
  | "constipationDiarrhea"
  | "hematuria"
  | "dysuria"
  | "frequentUrination"
  | "hoarseness"
  | "jointPain"
  | "alteredConsciousness"

type SymptomCategory = {
  categoryKey: string
  symptoms: SymptomKey[]
}

const SYMPTOM_CATEGORIES: SymptomCategory[] = [
  {
    categoryKey: "constitutional",
    symptoms: ["fever", "weightLoss", "nightSweats", "fatigue"],
  },
  {
    categoryKey: "respiratory",
    symptoms: ["cough", "sputum", "hemoptysis", "dyspneaExertion", "dyspneaRest", "orthopnea", "wheezing"],
  },
  {
    categoryKey: "cardiac",
    symptoms: ["chestPain", "palpitation", "syncope", "legEdema"],
  },
  {
    categoryKey: "gastrointestinal",
    symptoms: ["dysphagia", "pyrosis", "nauseaVomiting", "abdominalPain", "constipationDiarrhea"],
  },
  {
    categoryKey: "genitourinary",
    symptoms: ["hematuria", "dysuria", "frequentUrination"],
  },
  {
    categoryKey: "other",
    symptoms: ["hoarseness", "jointPain", "alteredConsciousness"],
  },
]

type VitalsAnamnesisSectionProps = {
  control: Control<PatientFormData>
  defaultPatmMmHg?: number
  setValue: UseFormSetValue<PatientFormData>
  watch: UseFormWatch<PatientFormData>
}

export function VitalsAnamnesisSection({
  control,
  defaultPatmMmHg,
  setValue,
  watch,
}: Readonly<VitalsAnamnesisSectionProps>) {
  const t = useTranslations("PatientFormSections")
  const effectiveDefaultPatmMmHg = defaultPatmMmHg ?? DEFAULT_PATM_MMHG

  const initializeVitals = () => {
    const currentVitals = watch("vitals")
    if (!currentVitals) {
      setValue("vitals", {
        temperature: 36.5,
        bloodPressure: "",
        pulse: 80,
        spO2: 98,
        symptoms: {},
        recordedAt: new Date().toISOString(),
      })
    }
  }

  const initializeAnamnesis = () => {
    const currentAnamnesis = watch("anamnesis")
    if (!currentAnamnesis) {
      setValue("anamnesis", {
        chiefComplaint: "",
        historyOfPresentIllness: "",
        knownDiseases: [],
        pastSurgeries: [],
        allergies: [],
        regularMedications: [],
      })
    }
  }

  const initializeOncologyHistory = () => {
    const currentOncology = watch("oncologyHistory")
    if (!currentOncology) {
      setValue("oncologyHistory", {
        chemotherapy: { received: false },
        radiotherapy: { received: false },
      })
    }
  }

  const watchChemotherapy = watch("oncologyHistory.chemotherapy.received")
  const watchRadiotherapy = watch("oncologyHistory.radiotherapy.received")
  const watchSmokingStatus = watch("anamnesis.smoking.status")
  const watchAaGradient = watch("aaGradient")
  const aaAge = watch("aaGradient.age")
  const aaPaO2 = watch("aaGradient.paO2")
  const aaPaCO2 = watch("aaGradient.paCO2")
  const aaFiO2 = watch("aaGradient.fio2")
  const aaO2Liters = watch("aaGradient.o2Liters")
  const aaPatm = watch("aaGradient.patm")
  const aaWaterVaporPressure = watch("aaGradient.waterVaporPressure")
  const aaGradientResult = watchAaGradient?.result

  useEffect(() => {
    if (
      typeof aaAge !== "number" ||
      typeof aaPaO2 !== "number" ||
      typeof aaPaCO2 !== "number"
    ) {
      return
    }

    const timeoutId = setTimeout(() => {
      const result = calculateAaGradient({
        age: aaAge,
        paO2: aaPaO2,
        paCO2: aaPaCO2,
        fio2: aaFiO2,
        o2Liters: aaO2Liters,
        patm: aaPatm ?? effectiveDefaultPatmMmHg,
        waterVaporPressure: aaWaterVaporPressure ?? DEFAULT_WATER_VAPOR_PRESSURE_MMHG,
      })

      setValue("aaGradient.result", result, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      })
    }, 450)

    return () => clearTimeout(timeoutId)
  }, [
    aaAge,
    aaFiO2,
    aaO2Liters,
    aaPaCO2,
    aaPaO2,
    aaPatm,
    aaWaterVaporPressure,
    effectiveDefaultPatmMmHg,
    setValue,
  ])

  return (
    <div className="space-y-6">
      <FieldSet>
        <div className="flex items-center justify-between">
          <FieldLegend variant="label">{t("vitals.title")}</FieldLegend>
          <button
            type="button"
            onClick={initializeVitals}
            className="text-xs text-primary hover:underline"
          >
            {t("vitals.initialize")}
          </button>
        </div>

        <FieldGroup className="gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Controller
              name="vitals.temperature"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("vitals.temperature")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    step="0.1"
                    min="30"
                    max="45"
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                    placeholder="36.5"
                    className="h-9"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="vitals.bloodPressure"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("vitals.bloodPressure")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="120/80"
                    className="h-9"
                  />
                  <FieldDescription className="text-xs">
                    {t("vitals.bloodPressureFormat")}
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="vitals.pulse"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("vitals.pulse")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    min="20"
                    max="300"
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                    placeholder="80"
                    className="h-9"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="vitals.spO2"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("vitals.spO2")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    min="0"
                    max="100"
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                    placeholder="98"
                    className="h-9"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          <div className="space-y-4">
            <FieldLegend variant="label">{t("vitals.systemReview.title")}</FieldLegend>
            <div className="space-y-4">
              {SYMPTOM_CATEGORIES.map((category) => (
                <div key={category.categoryKey} className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    {t(`vitals.systemReview.categories.${category.categoryKey}`)}
                  </p>
                  <div className="grid gap-x-4 gap-y-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                    {category.symptoms.map((symptomKey) => (
                      <Controller
                        key={symptomKey}
                        name={`vitals.symptoms.${symptomKey}`}
                        control={control}
                        render={({ field }) => (
                          <Field orientation="horizontal">
                            <Checkbox
                              id={field.name}
                              name={field.name}
                              checked={field.value ?? false}
                              onCheckedChange={field.onChange}
                            />
                            <FieldLabel htmlFor={field.name} className="text-xs font-normal">
                              {t(`vitals.systemReview.symptoms.${symptomKey}`)}
                            </FieldLabel>
                          </Field>
                        )}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </FieldGroup>
      </FieldSet>

      <hr className="border-dashed" />

      <FieldSet>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FlaskConical className="size-4 text-cyan-600" />
            <FieldLegend variant="label">{t("aaGradient.title")}</FieldLegend>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t("aaGradient.description")}</p>

        <FieldGroup className="gap-3">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Controller
              name="aaGradient.age"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("aaGradient.age")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    min="0"
                    max="120"
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                    className="h-9"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="aaGradient.paO2"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("aaGradient.paO2")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    min="0"
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                    className="h-9"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="aaGradient.paCO2"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("aaGradient.paCO2")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    min="0"
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                    className="h-9"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="aaGradient.fio2"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("aaGradient.fio2")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    step="0.01"
                    min="0.21"
                    max="1"
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                    placeholder="0.50"
                    className="h-9"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <FieldDescription className="text-xs">
                    {t("aaGradient.fio2Hint")}
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="aaGradient.o2Liters"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("aaGradient.o2Liters")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    min="0"
                    step="1"
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                    placeholder="5"
                    className="h-9"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  <FieldDescription className="text-xs">
                    {t("aaGradient.o2LitersHint")}
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="aaGradient.patm"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("aaGradient.patm")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    min="300"
                    max="900"
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                    placeholder={String(effectiveDefaultPatmMmHg)}
                    className="h-9"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="aaGradient.waterVaporPressure"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("aaGradient.waterVaporPressure")}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="number"
                    min="0"
                    max="100"
                    value={field.value ?? ""}
                    aria-invalid={fieldState.invalid}
                    placeholder={String(DEFAULT_WATER_VAPOR_PRESSURE_MMHG)}
                    className="h-9"
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  />
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </div>

          {aaGradientResult && (
            <Card
              className={
                (aaGradientResult.etiology ?? "extrinsic") === "intrinsic"
                  ? "border-red-200 bg-red-50/30 dark:border-red-900 dark:bg-red-950/20"
                  : "border-emerald-200 bg-emerald-50/30 dark:border-emerald-900 dark:bg-emerald-950/20"
              }
            >
              <CardContent className="space-y-3 p-4">
                <p className="text-sm font-medium">
                  {(aaGradientResult.etiology ?? "extrinsic") === "intrinsic"
                    ? t("aaGradient.result.intrinsic")
                    : t("aaGradient.result.extrinsic")}
                </p>
                <div className="grid gap-2 text-xs sm:grid-cols-2 lg:grid-cols-4">
                  <p>
                    {t("aaGradient.result.estimatedFiO2", {
                      value: aaGradientResult.estimatedFiO2 ?? 0,
                    })}
                  </p>
                  <p>
                    {t("aaGradient.result.pAO2", {
                      value: aaGradientResult.pAO2 ?? 0,
                    })}
                  </p>
                  <p>
                    {t("aaGradient.result.gradient", {
                      value: aaGradientResult.gradient ?? 0,
                    })}
                  </p>
                  <p>
                    {t("aaGradient.result.expectedGradient", {
                      value: aaGradientResult.expectedGradient ?? 0,
                    })}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  {(aaGradientResult.etiology ?? "extrinsic") === "intrinsic"
                    ? t("aaGradient.result.intrinsicHint")
                    : t("aaGradient.result.extrinsicHint")}
                </p>
              </CardContent>
            </Card>
          )}
        </FieldGroup>
      </FieldSet>

      <hr className="border-dashed" />

      <FieldSet>
        <div className="flex items-center justify-between">
          <FieldLegend variant="label">{t("anamnesis.title")}</FieldLegend>
          <button
            type="button"
            onClick={initializeAnamnesis}
            className="text-xs text-primary hover:underline"
          >
            {t("anamnesis.initialize")}
          </button>
        </div>

        <FieldGroup className="gap-4">
          <Controller
            name="anamnesis.chiefComplaint"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-xs">
                  {t("anamnesis.chiefComplaint")}
                </FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t("anamnesis.chiefComplaintPlaceholder")}
                  className="min-h-[60px] resize-none"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="anamnesis.historyOfPresentIllness"
            control={control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="text-xs">
                  {t("anamnesis.historyOfPresentIllness")}
                </FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder={t("anamnesis.historyPlaceholder")}
                  className="min-h-[80px] resize-none"
                />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <div className="grid gap-4 lg:grid-cols-3">
            <Controller
              name="anamnesis.knownDiseases"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("anamnesis.knownDiseases")}
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.value?.join("\n") ?? ""}
                    onChange={(e) => field.onChange(e.target.value.split("\n").filter(Boolean))}
                    placeholder={t("anamnesis.knownDiseasesPlaceholder")}
                    className="min-h-[80px] resize-none text-xs"
                  />
                  <FieldDescription className="text-xs">
                    {t("anamnesis.onePerLine")}
                  </FieldDescription>
                </Field>
              )}
            />

            <Controller
              name="anamnesis.pastSurgeries"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("anamnesis.pastSurgeries")}
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.value?.join("\n") ?? ""}
                    onChange={(e) => field.onChange(e.target.value.split("\n").filter(Boolean))}
                    placeholder={t("anamnesis.pastSurgeriesPlaceholder")}
                    className="min-h-[80px] resize-none text-xs"
                  />
                  <FieldDescription className="text-xs">
                    {t("anamnesis.onePerLine")}
                  </FieldDescription>
                </Field>
              )}
            />

            <Controller
              name="anamnesis.allergies"
              control={control}
              render={({ field }) => (
                <Field>
                  <FieldLabel htmlFor={field.name} className="text-xs">
                    {t("anamnesis.allergies")}
                  </FieldLabel>
                  <Textarea
                    id={field.name}
                    value={field.value?.join("\n") ?? ""}
                    onChange={(e) => field.onChange(e.target.value.split("\n").filter(Boolean))}
                    placeholder={t("anamnesis.allergiesPlaceholder")}
                    className="min-h-[80px] resize-none text-xs"
                  />
                  <FieldDescription className="text-xs">
                    {t("anamnesis.onePerLine")}
                  </FieldDescription>
                </Field>
              )}
            />
          </div>

          <Controller
            name="anamnesis.regularMedications"
            control={control}
            render={({ field }) => (
              <Field>
                <FieldLabel htmlFor={field.name} className="text-xs">
                  {t("anamnesis.regularMedications")}
                </FieldLabel>
                <Textarea
                  id={field.name}
                  value={field.value?.join("\n") ?? ""}
                  onChange={(e) => field.onChange(e.target.value.split("\n").filter(Boolean))}
                  placeholder={t("anamnesis.regularMedicationsPlaceholder")}
                  className="min-h-[80px] resize-none text-xs"
                />
                <FieldDescription className="text-xs">
                  {t("anamnesis.onePerLine")}
                </FieldDescription>
              </Field>
            )}
          />

          {/* Smoking History Section */}
          <Card className="border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/20">
            <CardContent className="space-y-3 p-4">
              <div className="flex items-center gap-2">
                <Cigarette className="size-4 text-amber-600" />
                <span className="text-sm font-medium">{t("anamnesis.smoking.title")}</span>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Controller
                  name="anamnesis.smoking.status"
                  control={control}
                  render={({ field }) => (
                    <Field>
                      <FieldLabel htmlFor={field.name} className="text-xs">
                        {t("anamnesis.smoking.status")}
                      </FieldLabel>
                      <Select
                        value={field.value ?? ""}
                        onValueChange={(value) => {
                          field.onChange(value)
                          if (value === "never") {
                            setValue("anamnesis.smoking.packYears", undefined)
                          }
                        }}
                      >
                        <SelectTrigger id={field.name} className="h-9">
                          <SelectValue placeholder={t("anamnesis.smoking.selectStatus")} />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="never">{t("anamnesis.smoking.never")}</SelectItem>
                          <SelectItem value="former">{t("anamnesis.smoking.former")}</SelectItem>
                          <SelectItem value="active">{t("anamnesis.smoking.active")}</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  )}
                />

                {(watchSmokingStatus === "active" || watchSmokingStatus === "former") && (
                  <Controller
                    name="anamnesis.smoking.packYears"
                    control={control}
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor={field.name} className="text-xs">
                          {t("anamnesis.smoking.packYears")}
                        </FieldLabel>
                        <Input
                          {...field}
                          id={field.name}
                          type="number"
                          min="0"
                          step="1"
                          aria-invalid={fieldState.invalid}
                          placeholder="20"
                          className="h-9"
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(e.target.value ? Number(e.target.value) : undefined)
                          }
                        />
                        <FieldDescription className="text-xs">
                          {t("anamnesis.smoking.packYearsHint")}
                        </FieldDescription>
                        {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                      </Field>
                    )}
                  />
                )}
              </div>
            </CardContent>
          </Card>
        </FieldGroup>
      </FieldSet>

      <hr className="border-dashed" />

      {/* Oncology History Section */}
      <FieldSet>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radiation className="size-4 text-orange-500" />
            <FieldLegend variant="label">{t("oncology.title")}</FieldLegend>
          </div>
          <button
            type="button"
            onClick={initializeOncologyHistory}
            className="text-xs text-primary hover:underline"
          >
            {t("oncology.initialize")}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">{t("oncology.description")}</p>

        <FieldGroup className="gap-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Chemotherapy Card */}
            <Card className="border-orange-200 bg-orange-50/30">
              <CardContent className="space-y-3 p-4">
                <Controller
                  name="oncologyHistory.chemotherapy.received"
                  control={control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Checkbox
                        id={field.name}
                        name={field.name}
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                      <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                        <Activity className="mr-1.5 inline size-3.5" />
                        {t("oncology.chemotherapy.received")}
                      </FieldLabel>
                    </Field>
                  )}
                />

                {watchChemotherapy && (
                  <>
                    <Controller
                      name="oncologyHistory.chemotherapy.lastSessionAt"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel htmlFor={field.name} className="text-xs">
                            {t("oncology.chemotherapy.lastSession")}
                          </FieldLabel>
                          <Input
                            {...field}
                            id={field.name}
                            type="date"
                            className="h-8"
                          />
                        </Field>
                      )}
                    />

                    <Controller
                      name="oncologyHistory.chemotherapy.details"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel htmlFor={field.name} className="text-xs">
                            {t("oncology.chemotherapy.details")}
                          </FieldLabel>
                          <Textarea
                            {...field}
                            id={field.name}
                            placeholder={t("oncology.chemotherapy.detailsPlaceholder")}
                            className="min-h-[60px] resize-none text-xs"
                          />
                        </Field>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Radiotherapy Card */}
            <Card className="border-purple-200 bg-purple-50/30">
              <CardContent className="space-y-3 p-4">
                <Controller
                  name="oncologyHistory.radiotherapy.received"
                  control={control}
                  render={({ field }) => (
                    <Field orientation="horizontal">
                      <Checkbox
                        id={field.name}
                        name={field.name}
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                      />
                      <FieldLabel htmlFor={field.name} className="text-sm font-medium">
                        <Radiation className="mr-1.5 inline size-3.5" />
                        {t("oncology.radiotherapy.received")}
                      </FieldLabel>
                    </Field>
                  )}
                />

                {watchRadiotherapy && (
                  <>
                    <Controller
                      name="oncologyHistory.radiotherapy.lastSessionAt"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel htmlFor={field.name} className="text-xs">
                            {t("oncology.radiotherapy.lastSession")}
                          </FieldLabel>
                          <Input
                            {...field}
                            id={field.name}
                            type="date"
                            className="h-8"
                          />
                        </Field>
                      )}
                    />

                    <Controller
                      name="oncologyHistory.radiotherapy.details"
                      control={control}
                      render={({ field }) => (
                        <Field>
                          <FieldLabel htmlFor={field.name} className="text-xs">
                            {t("oncology.radiotherapy.details")}
                          </FieldLabel>
                          <Textarea
                            {...field}
                            id={field.name}
                            placeholder={t("oncology.radiotherapy.detailsPlaceholder")}
                            className="min-h-[60px] resize-none text-xs"
                          />
                        </Field>
                      )}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </FieldGroup>
      </FieldSet>
    </div>
  )
}
