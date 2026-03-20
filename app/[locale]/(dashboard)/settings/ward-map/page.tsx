"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useMutation, useQuery } from "convex/react"
import { Plus } from "lucide-react"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { api } from "@/convex/_generated/api"
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
  createEmptyWardLayoutRoom,
  serializeWardLayout,
  toWardLayoutFormValues,
  type WardLayoutFormValues,
} from "@/lib/ward-layout"

import { WardLayoutRoomCard } from "./_components/ward-layout-room-card"

type AutoSaveState = "idle" | "saving" | "saved" | "error" | "invalid"
type SaveResult = {
  organizationId: string
  snapshot: string
  type: "error" | "saved"
}

function getWardLayoutSnapshot(rooms: WardLayoutFormValues["rooms"] | undefined) {
  const wardLayout = serializeWardLayout(rooms ?? [])
  return {
    formValues: toWardLayoutFormValues(wardLayout),
    snapshot: JSON.stringify(wardLayout),
    wardLayout,
  }
}

export default function WardMapSettingsPage() {
  const t = useTranslations("WardMapSettingsPage")
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
  } = useForm<WardLayoutFormValues>({
    defaultValues: {
      rooms: [],
    },
    mode: "onChange",
  })
  const { append, fields, remove } = useFieldArray({
    control,
    keyName: "fieldKey",
    name: "rooms",
  })
  const watchedRooms = useWatch({
    control,
    name: "rooms",
  })
  const {
    formValues: currentFormValues,
    snapshot: currentWardLayoutSnapshot,
    wardLayout: currentWardLayout,
  } = useMemo(() => getWardLayoutSnapshot(watchedRooms), [watchedRooms])
  const latestWardLayoutSnapshotRef = useRef("[]")
  const [saveResult, setSaveResult] = useState<SaveResult | null>(null)

  useEffect(() => {
    if (!settings) {
      return
    }

    const initialFormValues = toWardLayoutFormValues(settings.wardLayout)
    reset(initialFormValues)
  }, [reset, settings])

  useEffect(() => {
    latestWardLayoutSnapshotRef.current = currentWardLayoutSnapshot
  }, [currentWardLayoutSnapshot])

  useEffect(() => {
    if (!orgId || settings === undefined || !isDirty || !isValid) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          await upsertClinicSettings({
            conventions: settings.conventions,
            organizationId: orgId,
            wardLayout: currentWardLayout,
          })

          if (latestWardLayoutSnapshotRef.current !== currentWardLayoutSnapshot) {
            return
          }

          reset(currentFormValues)
          setSaveResult({
            organizationId: orgId,
            snapshot: currentWardLayoutSnapshot,
            type: "saved",
          })
        } catch (error) {
          if (latestWardLayoutSnapshotRef.current === currentWardLayoutSnapshot) {
            setSaveResult({
              organizationId: orgId,
              snapshot: currentWardLayoutSnapshot,
              type: "error",
            })
          }

          toast.error(error instanceof Error ? error.message : t("toasts.saveError"))
        }
      })()
    }, 600)

    return () => window.clearTimeout(timeoutId)
  }, [
    currentFormValues,
    currentWardLayout,
    currentWardLayoutSnapshot,
    isDirty,
    isValid,
    orgId,
    reset,
    settings,
    t,
    upsertClinicSettings,
  ])

  const totalBeds =
    watchedRooms?.reduce((sum, room) => {
      const capacity = Number.isFinite(room?.capacity) ? room.capacity : 0
      return sum + Math.max(0, Math.trunc(capacity))
    }, 0) ?? 0
  const currentSaveResultType =
    saveResult?.organizationId === orgId &&
    saveResult?.snapshot === currentWardLayoutSnapshot
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
      ? t("state.loading")
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
              <Button
                type="button"
                variant="outline"
                onClick={() => append(createEmptyWardLayoutRoom())}
              >
                <Plus className="size-4" />
                {t("actions.addRoom")}
              </Button>
              <p className={autoSaveStatusClassName}>{autoSaveStatusLabel}</p>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="rounded-xl border px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("metrics.rooms")}
            </p>
            <p className="mt-2 text-2xl font-semibold">{fields.length}</p>
          </div>
          <div className="rounded-xl border px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {t("metrics.bedCapacity")}
            </p>
            <p className="mt-2 text-2xl font-semibold">{totalBeds}</p>
          </div>
        </CardContent>
      </Card>

      {fields.length === 0 ? (
        <Card size="sm" className="border-dashed">
          <CardContent className="flex flex-col items-start gap-4 pt-6">
            <div className="space-y-2">
              <h2 className="text-base font-medium">{t("empty.title")}</h2>
              <p className="text-sm leading-6 text-muted-foreground">{t("empty.description")}</p>
            </div>
            <Button type="button" onClick={() => append(createEmptyWardLayoutRoom())}>
              <Plus className="size-4" />
              {t("actions.addFirstRoom")}
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-2">
        {fields.map((field, index) => (
          <WardLayoutRoomCard
            key={field.fieldKey}
            errors={errors}
            index={index}
            onRemove={() => remove(index)}
            register={register}
          />
        ))}
      </div>
    </form>
  )
}
