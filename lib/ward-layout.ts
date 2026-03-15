import type { WardRoom } from "@/lib/clinic-settings"

export type WardLayoutFormRoom = {
  capacity: number
  name: string
  roomId: string
}

export type WardLayoutFormValues = {
  rooms: WardLayoutFormRoom[]
}

export type WardBedSlot = {
  bedId: string
  bedLabel: string
  bedNumber: number
}

export type WardRoomWithBeds = WardRoom & {
  beds: WardBedSlot[]
}

function createUniqueRoomId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `room-${crypto.randomUUID()}`
  }

  return `room-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function normalizeCapacity(value: number): number {
  if (!Number.isFinite(value)) {
    return 0
  }

  return Math.max(0, Math.trunc(value))
}

export function createBedId(roomId: string, bedNumber: number): string {
  return `${roomId}-bed-${bedNumber}`
}

export function createEmptyWardLayoutRoom(): WardLayoutFormRoom {
  return {
    capacity: 1,
    name: "",
    roomId: createUniqueRoomId(),
  }
}

export function toWardLayoutFormValues(
  wardLayout: WardRoom[]
): WardLayoutFormValues {
  return {
    rooms: wardLayout.map((room) => ({
      capacity: normalizeCapacity(room.bedCapacity),
      name: room.roomName,
      roomId: room.roomId,
    })),
  }
}

export function serializeWardLayout(rooms: WardLayoutFormRoom[]): WardRoom[] {
  return rooms.map((room) => {
    const roomId = room.roomId.trim() || createUniqueRoomId()
    const roomName = room.name.trim()
    const bedCapacity = normalizeCapacity(room.capacity)

    return {
      bedCapacity,
      bedIds: Array.from({ length: bedCapacity }, (_, index) =>
        createBedId(roomId, index + 1)
      ),
      roomId,
      roomName,
    }
  })
}

export function buildWardRoomsWithBeds(
  wardLayout: WardRoom[]
): WardRoomWithBeds[] {
  return wardLayout.map((room) => {
    const bedCapacity = normalizeCapacity(room.bedCapacity)

    return {
      ...room,
      bedCapacity,
      beds: Array.from({ length: bedCapacity }, (_, index) => ({
        bedId: room.bedIds?.[index] ?? createBedId(room.roomId, index + 1),
        bedLabel: `Bed ${index + 1}`,
        bedNumber: index + 1,
      })),
    }
  })
}
