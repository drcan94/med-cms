"use client"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useMutation, useQuery } from "convex/react"
import { Plus, Save } from "lucide-react"
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
      toast.error("Select an organization before saving clinic settings.")
      return
    }

    if (!settings) {
      toast.error("Settings are still loading.")
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
      toast.success("Clinical conventions saved.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save clinic settings."
      )
    }
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conventions</CardTitle>
          <CardDescription>Loading organization context...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!orgId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Conventions</CardTitle>
          <CardDescription>
            Select a clinic organization to manage tenant-specific rules.
          </CardDescription>
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
                <Badge variant="outline">Conventions</Badge>
                <Badge variant="secondary">If / Then workflow logic</Badge>
              </div>
              <div className="space-y-1">
                <CardTitle>Clinical convention builder</CardTitle>
                <CardDescription className="max-w-2xl leading-6">
                  Define when diagnoses or surgery terms should require a
                  checklist item before the workflow can move forward.
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={handleAddRule}>
                <Plus className="size-4" />
                Add rule
              </Button>
              <Button type="submit" disabled={isSubmitting || settings === undefined}>
                <Save className="size-4" />
                {isSubmitting ? "Saving..." : "Save conventions"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 pt-6">
          <div className="rounded-xl border border-dashed px-4 py-3 text-sm leading-6 text-muted-foreground">
            Example: IF <span className="font-medium text-foreground">Diagnosis</span>{" "}
            contains <span className="font-medium text-foreground">CABG</span>,
            THEN require{" "}
            <span className="font-medium text-foreground">
              Cardiac surgery checklist
            </span>
            .
          </div>

          <div className="rounded-xl border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            {settings === undefined
              ? "Loading saved rules..."
              : `${fields.length} rule${fields.length === 1 ? "" : "s"} configured for this clinic.`}
          </div>
        </CardContent>
      </Card>

      {fields.length === 0 ? (
        <Card size="sm" className="border-dashed">
          <CardContent className="flex flex-col items-start gap-4 pt-6">
            <div className="space-y-2">
              <h2 className="text-base font-medium">No conventions yet</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Start with a rule that maps a diagnosis or surgery keyword to a
                required checklist item.
              </p>
            </div>
            <Button type="button" onClick={handleAddRule}>
              <Plus className="size-4" />
              Add first rule
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
