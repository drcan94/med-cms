"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useMutation, useQuery } from "convex/react"
import { Plus } from "lucide-react"
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

type AutoSaveState = "idle" | "saving" | "saved" | "error" | "invalid"
type SaveResult = {
  organizationId: string
  snapshot: string
  type: "error" | "saved"
}

function getRulesSnapshot(rules: ConventionsFormValues["rules"] | undefined) {
  const normalizedRules = serializeConventionRules(rules ?? [])
  return {
    normalizedRules,
    snapshot: JSON.stringify(normalizedRules),
  }
}

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
    formState: { errors, isDirty, isValid },
    register,
    reset,
    setValue,
  } = useForm<ConventionsFormValues>({
    defaultValues: {
      rules: [],
    },
    mode: "onChange",
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
  const { normalizedRules: currentRules, snapshot: currentRulesSnapshot } = useMemo(
    () => getRulesSnapshot(watchedRules),
    [watchedRules]
  )
  const latestRulesSnapshotRef = useRef("[]")
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null)

  useEffect(() => {
    if (!settings) {
      return
    }

    const { normalizedRules } = getRulesSnapshot(parseConventionRules(settings.conventions))
    reset({
      rules: normalizedRules,
    })
  }, [reset, settings])

  useEffect(() => {
    latestRulesSnapshotRef.current = currentRulesSnapshot
  }, [currentRulesSnapshot])

  useEffect(() => {
    if (!orgId || settings === undefined || !isDirty || !isValid) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          await upsertClinicSettings({
            conventions: currentRules,
            organizationId: orgId,
            wardLayout: settings.wardLayout,
          })

          if (latestRulesSnapshotRef.current !== currentRulesSnapshot) {
            return
          }

          reset({ rules: currentRules })
          setSaveResult({
            organizationId: orgId,
            snapshot: currentRulesSnapshot,
            type: "saved",
          })
        } catch (error) {
          if (latestRulesSnapshotRef.current === currentRulesSnapshot) {
            setSaveResult({
              organizationId: orgId,
              snapshot: currentRulesSnapshot,
              type: "error",
            })
          }

          toast.error(
            error instanceof Error ? error.message : t("toasts.saveError")
          )
        }
      })()
    }, 600)

    return () => window.clearTimeout(timeoutId)
  }, [
    currentRules,
    currentRulesSnapshot,
    isDirty,
    isValid,
    orgId,
    reset,
    settings,
    t,
    upsertClinicSettings,
  ])

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
  const currentSaveResultType =
    saveResult?.organizationId === orgId &&
    saveResult?.snapshot === currentRulesSnapshot
      ? saveResult.type
      : null
  const autoSaveState: AutoSaveState =
    settings === undefined
      ? "idle"
      : isDirty && !isValid
        ? "invalid"
        : currentSaveResultType === "error"
          ? "error"
          : isDirty
            ? "saving"
            : currentSaveResultType === "saved"
              ? "saved"
              : "idle"
  const autoSaveStatusLabel =
    settings === undefined
      ? t("status.loadingRules")
      : autoSaveState === "saving"
        ? t("actions.saving")
        : autoSaveState === "saved"
          ? t("toasts.saved")
          : autoSaveState === "invalid"
            ? t("status.invalid")
            : autoSaveState === "error"
              ? t("toasts.saveError")
              : t("status.autoSave")
  const autoSaveStatusClassName =
    autoSaveState === "error" || autoSaveState === "invalid"
      ? "text-sm leading-6 text-destructive"
      : "text-sm leading-6 text-muted-foreground"

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
    <form
      onSubmit={(event) => {
        event.preventDefault()
      }}
      className="grid gap-6"
    >
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

            <div className="flex flex-col items-start gap-2 lg:items-end">
              <Button type="button" variant="outline" onClick={handleAddRule}>
                <Plus className="size-4" />
                {t("actions.addRule")}
              </Button>
              <p className={autoSaveStatusClassName}>{autoSaveStatusLabel}</p>
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
