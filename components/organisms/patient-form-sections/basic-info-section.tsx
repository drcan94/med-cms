"use client"

import { Controller, type Control } from "react-hook-form"
import { useTranslations } from "next-intl"

import type { PatientFormData } from "@/lib/schemas/patient-form.schema"
import { STAGING_BED_ID } from "@/lib/patient-privacy"
import {
  Field,
  FieldError,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

type BedOption = {
  label: string
  value: string
}

type BasicInfoSectionProps = {
  control: Control<PatientFormData>
  bedOptions: BedOption[]
  initialsPreview: string
}

export function BasicInfoSection({
  control,
  bedOptions,
  initialsPreview,
}: Readonly<BasicInfoSectionProps>) {
  const t = useTranslations("PatientSheet")

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Controller
          name="fullName"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid} className="sm:col-span-2">
              <FieldLabel htmlFor={field.name} className="text-xs">
                {t("fields.fullName.label")}
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={t("fields.fullName.placeholder")}
                className="h-9"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <div className="space-y-1.5">
          <Label htmlFor="initials" className="text-xs">
            {t("fields.initials.label")}
          </Label>
          <Input
            id="initials"
            value={initialsPreview}
            placeholder={t("fields.initials.placeholder")}
            className="h-9 bg-muted/50"
            readOnly
          />
        </div>

        <Controller
          name="identifierCode"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-xs">
                {t("fields.identifierCode.label")}
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={t("fields.identifierCode.placeholder")}
                autoCapitalize="characters"
                autoComplete="off"
                className="h-9"
                maxLength={6}
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Controller
          name="bedId"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-xs">
                {t("fields.bedId.label")}
              </FieldLabel>
              <Select
                name={field.name}
                value={field.value || STAGING_BED_ID}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  className="h-9"
                >
                  <SelectValue placeholder={t("fields.bedId.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  {bedOptions.map((bed) => (
                    <SelectItem key={bed.value} value={bed.value}>
                      {bed.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="serviceName"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-xs">
                {t("fields.serviceName.label")}
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={t("fields.serviceName.placeholder")}
                className="h-9"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="procedureName"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-xs">
                {t("fields.procedureName.label")}
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder={t("fields.procedureName.placeholder")}
                className="h-9"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Controller
          name="admissionDate"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-xs">
                {t("fields.admissionDate.label")}
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="date"
                aria-invalid={fieldState.invalid}
                className="h-9"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="surgeryDate"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-xs">
                {t("fields.surgeryDate.label")}
              </FieldLabel>
              <Input
                {...field}
                id={field.name}
                type="date"
                aria-invalid={fieldState.invalid}
                className="h-9"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="gender"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-xs">
                {t("fields.gender.label")}
              </FieldLabel>
              <Select
                name={field.name}
                value={field.value ?? ""}
                onValueChange={field.onChange}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  className="h-9"
                >
                  <SelectValue placeholder={t("fields.gender.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">{t("fields.gender.options.male")}</SelectItem>
                  <SelectItem value="female">{t("fields.gender.options.female")}</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="isPregnant"
          control={control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name} className="text-xs">
                {t("fields.isPregnant.label")}
              </FieldLabel>
              <Select
                name={field.name}
                value={field.value === true ? "true" : field.value === false ? "false" : ""}
                onValueChange={(v) => field.onChange(v === "true" ? true : v === "false" ? false : undefined)}
              >
                <SelectTrigger
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  className="h-9"
                >
                  <SelectValue placeholder={t("fields.isPregnant.placeholder")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="false">{t("fields.isPregnant.options.no")}</SelectItem>
                  <SelectItem value="true">{t("fields.isPregnant.options.yes")}</SelectItem>
                </SelectContent>
              </Select>
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name="diagnosis"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={field.name} className="text-xs">
              {t("fields.diagnosis.label")}
            </FieldLabel>
            <Textarea
              {...field}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder={t("fields.diagnosis.placeholder")}
              className="min-h-[80px] resize-none"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </div>
  )
}
