"use client"

import { Controller, type Control, type UseFormSetValue, type UseFormWatch } from "react-hook-form"
import { useTranslations } from "next-intl"

import type { PatientFormData } from "@/lib/schemas/patient-form.schema"
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
  setValue: UseFormSetValue<PatientFormData>
  watch: UseFormWatch<PatientFormData>
}

export function VitalsAnamnesisSection({
  control,
  setValue,
  watch,
}: Readonly<VitalsAnamnesisSectionProps>) {
  const t = useTranslations("PatientFormSections")

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
      })
    }
  }

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
        </FieldGroup>
      </FieldSet>
    </div>
  )
}
