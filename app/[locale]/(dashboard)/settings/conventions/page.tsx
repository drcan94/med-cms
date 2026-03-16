"use client"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useMutation, useQuery } from "convex/react"
import { Plus, Save } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
import { RuleBuilderRow } from "@/components/molecules/rule-builder-row"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  createEmptyConventionRule,
  parseConventionRules,
  serializeConventionRules,
  type ConventionSourceField,
  type ConventionsFormValues,
} from "@/lib/clinic-settings"

export default function ConventionsPage() {
  const t = useTranslations("ConventionsPage")
  const { isLoaded, orgId } = useAuth()
  const settings = useQuery(
    api.clinicSettings.getClinicSettings,
    orgId ? { organizationId: orgId } : "skip"
  )
  const upsertClinicSettings = useMutation(api.clinicSettings.upsertClinicSettings)
  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
  } = useForm<ConventionsFormValues>({
    defaultValues: {
      rules: [],
    },
  })
  const { append, fields, remove } = useFieldArray({
    control,
    keyName: "fieldKey",
    name: "rules",
  })
  const watchedRules = useWatch({
    control,
    name: "rules",
  })

  useEffect(() => {
    if (!settings) {
      return
    }

    reset({
      rules: parseConventionRules(settings.conventions),
    })
  }, [reset, settings])

  const handleAddRule = (): void => {
    append(createEmptyConventionRule())
  }

  const handleSourceFieldChange = (
    index: number,
    sourceField: ConventionSourceField
  ): void => {
    setValue(`rules.${index}.sourceField`, sourceField, {
      shouldDirty: true,
      shouldValidate: true,
    })
  }

  const onSubmit = async (values: ConventionsFormValues): Promise<void> => {
    if (!orgId) {
      toast.error(t("toasts.selectOrganization"))
      return
    }

    if (!settings) {
      toast.error(t("toasts.loading"))
      return
    }

    const rules = serializeConventionRules(values.rules)

    try {
      await upsertClinicSettings({
        conventions: rules,
        organizationId: orgId,
        wardLayout: settings.wardLayout,
      })

      reset({ rules })
      toast.success(t("toasts.saved"))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("toasts.saveError")
      )
    }
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("state.title")}</CardTitle>
          <CardDescription>{t("state.loading")}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!orgId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("state.title")}</CardTitle>
          <CardDescription>{t("state.selectOrganization")}</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
      <Card>
        <CardHeader className="border-b">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline">{t("badges.title")}</Badge>
                <Badge variant="secondary">{t("badges.subtitle")}</Badge>
              </div>
              <div className="space-y-1">
                <CardTitle>{t("title")}</CardTitle>
                <CardDescription className="max-w-2xl leading-6">
                  {t("description")}
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleAddRule}>
                <Plus className="size-4" />
                {t("actions.addRule")}
              </Button>
              <Button type="submit" disabled={isSubmitting || settings === undefined}>
                <Save className="size-4" />
                {isSubmitting ? t("actions.saving") : t("actions.save")}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 pt-6">
          <div className="rounded-xl border border-dashed px-4 py-3 text-sm leading-6 text-muted-foreground">
            {t("example.prefix")}{" "}
            <span className="font-medium text-foreground">
              {t("example.sourceField")}
            </span>{" "}
            {t("example.contains")}{" "}
            <span className="font-medium text-foreground">{t("example.matchValue")}</span>
            , {t("example.thenRequire")}{" "}
            <span className="font-medium text-foreground">
              {t("example.checklistItem")}
            </span>
            .
          </div>

          <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            {settings === undefined
              ? t("status.loadingRules")
              : t("status.rulesConfigured", { count: fields.length })}
          </div>
        </CardContent>
      </Card>

      {fields.length === 0 ? (
        <Card size="sm" className="border-dashed">
          <CardContent className="flex flex-col items-start gap-4 pt-6">
            <div className="space-y-2">
              <h2 className="text-base font-medium">{t("empty.title")}</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                {t("empty.description")}
              </p>
            </div>
            <Button type="button" onClick={handleAddRule}>
              <Plus className="size-4" />
              {t("actions.addFirstRule")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {fields.map((field, index) => (
        <RuleBuilderRow
          key={field.fieldKey}
          checklistItemError={errors.rules?.[index]?.checklistItem?.message}
          index={index}
          matchValueError={errors.rules?.[index]?.matchValue?.message}
          onRemove={() => remove(index)}
          onSourceFieldChange={(value) => handleSourceFieldChange(index, value)}
          register={register}
          sourceField={watchedRules?.[index]?.sourceField ?? field.sourceField}
        />
      ))}
    </form>
  )
}
