"use client"

import { Trash2 } from "lucide-react"
import type { FieldErrors, UseFormRegister } from "react-hook-form"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { WardLayoutFormValues } from "@/lib/ward-layout"

type WardLayoutRoomCardProps = {
  errors: FieldErrors<WardLayoutFormValues>
  index: number
  onRemove: () => void
  register: UseFormRegister<WardLayoutFormValues>
}

export function WardLayoutRoomCard({
  errors,
  index,
  onRemove,
  register,
}: Readonly<WardLayoutRoomCardProps>) {
  return (
    <Card size="sm">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between gap-3">
          <div>
            <CardTitle className="text-base">Room {index + 1}</CardTitle>
            <CardDescription>Saved as room layout metadata.</CardDescription>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onRemove}>
            <Trash2 className="size-4" />
            <span className="sr-only">Remove room {index + 1}</span>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 pt-6 sm:grid-cols-2">
        <input type="hidden" {...register(`rooms.${index}.roomId`)} />

        <div className="space-y-2">
          <Label htmlFor={`room-name-${index}`}>Room name</Label>
          <Input
            id={`room-name-${index}`}
            placeholder="Room 101"
            {...register(`rooms.${index}.name`, {
              required: "Room name is required.",
            })}
          />
          {errors.rooms?.[index]?.name ? (
            <p className="text-sm text-destructive">
              {errors.rooms[index]?.name?.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor={`room-capacity-${index}`}>Capacity</Label>
          <Input
            id={`room-capacity-${index}`}
            min={1}
            type="number"
            {...register(`rooms.${index}.capacity`, {
              required: "Capacity is required.",
              min: {
                message: "Capacity must be at least 1.",
                value: 1,
              },
              valueAsNumber: true,
            })}
          />
          {errors.rooms?.[index]?.capacity ? (
            <p className="text-sm text-destructive">
              {errors.rooms[index]?.capacity?.message}
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
