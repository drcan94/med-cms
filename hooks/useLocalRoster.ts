"use client"

import { useCallback, useSyncExternalStore } from "react"

export const LOCAL_ROSTER_STORAGE_KEY = "wardos_local_roster"
const LOCAL_ROSTER_CHANGE_EVENT = "wardos-local-roster-change"

export type LocalRoster = Record<string, string>
const EMPTY_ROSTER: LocalRoster = {}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeValue(value: string): string {
  return value.trim()
}

function normalizeBedId(bedId: string): string {
  return normalizeValue(bedId)
}

/**
 * Full names remain browser-local by design. Normalizing the roster prevents
 * workstation-specific spacing differences from creating duplicate bed keys.
 */
function sanitizeRoster(data: LocalRoster): LocalRoster {
  return Object.entries(data).reduce<LocalRoster>((nextRoster, [bedId, fullName]) => {
    const normalizedBedId = normalizeBedId(bedId)
    const normalizedFullName = normalizeValue(fullName)

    if (!normalizedBedId || !normalizedFullName) {
      return nextRoster
    }

    nextRoster[normalizedBedId] = normalizedFullName
    return nextRoster
  }, {})
}

function readRosterFromStorage(): LocalRoster {
  if (typeof window === "undefined") {
    return EMPTY_ROSTER
  }

  const storedRoster = window.localStorage.getItem(LOCAL_ROSTER_STORAGE_KEY)

  if (!storedRoster) {
    return EMPTY_ROSTER
  }

  try {
    const parsedRoster = JSON.parse(storedRoster) as unknown

    if (!isRecord(parsedRoster)) {
      return EMPTY_ROSTER
    }

    return Object.entries(parsedRoster).reduce<LocalRoster>(
      (nextRoster, [bedId, fullName]) => {
        if (typeof fullName !== "string") {
          return nextRoster
        }

        const normalizedBedId = normalizeBedId(bedId)
        const normalizedFullName = normalizeValue(fullName)

        if (!normalizedBedId || !normalizedFullName) {
          return nextRoster
        }

        nextRoster[normalizedBedId] = normalizedFullName
        return nextRoster
      },
      {}
    )
  } catch {
    return EMPTY_ROSTER
  }
}

function emitRosterChange(): void {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(LOCAL_ROSTER_CHANGE_EVENT))
  }
}

function subscribeToRoster(onStoreChange: () => void): () => void {
  if (typeof window === "undefined") {
    return () => {}
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === LOCAL_ROSTER_STORAGE_KEY) {
      onStoreChange()
    }
  }

  window.addEventListener("storage", handleStorage)
  window.addEventListener(LOCAL_ROSTER_CHANGE_EVENT, onStoreChange)

  return () => {
    window.removeEventListener("storage", handleStorage)
    window.removeEventListener(LOCAL_ROSTER_CHANGE_EVENT, onStoreChange)
  }
}

export function useLocalRoster() {
  const roster = useSyncExternalStore(
    subscribeToRoster,
    readRosterFromStorage,
    () => EMPTY_ROSTER
  )

  const setRoster = useCallback((data: LocalRoster) => {
    const nextRoster = sanitizeRoster(data)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        LOCAL_ROSTER_STORAGE_KEY,
        JSON.stringify(nextRoster)
      )
      emitRosterChange()
    }
  }, [])

  const clearRoster = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LOCAL_ROSTER_STORAGE_KEY)
      emitRosterChange()
    }
  }, [])

  const getFullPatientName = useCallback(
    (initials: string, bedId: string) => {
      const localName = roster[normalizeBedId(bedId)]
      return localName ?? normalizeValue(initials)
    },
    [roster]
  )

  return {
    roster,
    entryCount: Object.keys(roster).length,
    setRoster,
    clearRoster,
    getFullPatientName,
  }
}
