"use client"

import { useEffect } from "react"
import { useAuth } from "@clerk/nextjs"
import { useFieldArray, useForm, useWatch } from "react-hook-form"
import { useMutation, useQuery } from "convex/react"
import { Plus, Save } from "lucide-react"
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

export default function WardMapSettingsPage() {
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
  } = useForm<WardLayoutFormValues>({
    defaultValues: {
      rooms: [],
    },
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

  useEffect(() => {
    if (!settings) {
      return
    }

    reset(toWardLayoutFormValues(settings.wardLayout))
  }, [reset, settings])

  const totalBeds =
    watchedRooms?.reduce((sum, room) => {
      const capacity = Number.isFinite(room?.capacity) ? room.capacity : 0
      return sum + Math.max(0, Math.trunc(capacity))
    }, 0) ?? 0

  const onSubmit = async (values: WardLayoutFormValues): Promise<void> => {
    if (!orgId) {
      toast.error("Select an organization before saving the ward layout.")
      return
    }

    if (!settings) {
      toast.error("Settings are still loading.")
      return
    }

    const wardLayout = serializeWardLayout(values.rooms)

    try {
      await upsertClinicSettings({
        conventions: settings.conventions,
        organizationId: orgId,
        wardLayout,
      })

      reset(toWardLayoutFormValues(wardLayout))
      toast.success("Ward layout saved.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save the ward layout."
      )
    }
  }

  if (!isLoaded) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ward map</CardTitle>
          <CardDescription>Loading organization context...</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  if (!orgId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Ward map</CardTitle>
          <CardDescription>
            Select a clinic organization to edit room and bed capacity settings.
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
                <Badge variant="outline">Ward Map</Badge>
                <Badge variant="secondary">Layout editor</Badge>
              </div>
              <div className="space-y-1">
                <CardTitle>Ward layout builder</CardTitle>
                <CardDescription className="max-w-2xl leading-6">
                  Define rooms and bed counts here, then use the main ward map to
                  drag patients between the generated bed slots.
                </CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => append(createEmptyWardLayoutRoom())}
              >
                <Plus className="size-4" />
                Add room
              </Button>
              <Button type="submit" disabled={isSubmitting || settings === undefined}>
                <Save className="size-4" />
                {isSubmitting ? "Saving..." : "Save layout"}
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
          <div className="rounded-xl border px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Rooms
            </p>
            <p className="mt-2 text-2xl font-semibold">{fields.length}</p>
          </div>
          <div className="rounded-xl border px-4 py-3">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Bed capacity
            </p>
            <p className="mt-2 text-2xl font-semibold">{totalBeds}</p>
          </div>
        </CardContent>
      </Card>

      {fields.length === 0 ? (
        <Card size="sm" className="border-dashed">
          <CardContent className="flex flex-col items-start gap-4 pt-6">
            <div className="space-y-2">
              <h2 className="text-base font-medium">No rooms configured yet</h2>
              <p className="text-sm leading-6 text-muted-foreground">
                Add each room you want represented in the interactive ward map,
                then save to generate bed slots for patient placement.
              </p>
            </div>
            <Button type="button" onClick={() => append(createEmptyWardLayoutRoom())}>
              <Plus className="size-4" />
              Add first room
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
