"use client"

import { useCallback, useSyncExternalStore } from "react"

export const LOCAL_ROSTER_STORAGE_KEY = "wardos_local_roster"
const LOCAL_ROSTER_CHANGE_EVENT = "wardos-local-roster-change"

export type LocalRoster = Record<string, string>
type LocalRosterStore = {
  bedRoster: LocalRoster
  patientRoster: LocalRoster
}

const EMPTY_ROSTER: LocalRoster = {}
const EMPTY_ROSTER_STORE: LocalRosterStore = {
  bedRoster: EMPTY_ROSTER,
  patientRoster: EMPTY_ROSTER,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function normalizeValue(value: string): string {
  return value.trim()
}

function normalizeRosterKey(key: string): string {
  return normalizeValue(key)
}

/**
 * Browser-local PII comes from two sources: uploaded bed rosters and manually
 * entered patient names. Both stores are normalized so the UI can reconcile
 * full names without ever sending them to Convex.
 */
function sanitizeRoster(data: LocalRoster): LocalRoster {
  return Object.entries(data).reduce<LocalRoster>((nextRoster, [key, fullName]) => {
    const normalizedKey = normalizeRosterKey(key)
    const normalizedFullName = normalizeValue(fullName)

    if (!normalizedKey || !normalizedFullName) {
      return nextRoster
    }

    nextRoster[normalizedKey] = normalizedFullName
    return nextRoster
  }, {})
}

function sanitizeRosterStore(data: Partial<LocalRosterStore>): LocalRosterStore {
  return {
    bedRoster: sanitizeRoster(data.bedRoster ?? EMPTY_ROSTER),
    patientRoster: sanitizeRoster(data.patientRoster ?? EMPTY_ROSTER),
  }
}

function readRosterFromStorage(): LocalRosterStore {
  if (typeof window === "undefined") {
    return EMPTY_ROSTER_STORE
  }

  const storedRoster = window.localStorage.getItem(LOCAL_ROSTER_STORAGE_KEY)

  if (!storedRoster) {
    return EMPTY_ROSTER_STORE
  }

  try {
    const parsedRoster = JSON.parse(storedRoster) as unknown

    if (!isRecord(parsedRoster)) {
      return EMPTY_ROSTER_STORE
    }

    if ("bedRoster" in parsedRoster || "patientRoster" in parsedRoster) {
      return sanitizeRosterStore(parsedRoster as Partial<LocalRosterStore>)
    }

    return {
      bedRoster: sanitizeRoster(
        Object.entries(parsedRoster).reduce<LocalRoster>((nextRoster, [key, value]) => {
          if (typeof value === "string") {
            nextRoster[key] = value
          }

          return nextRoster
        }, {})
      ),
      patientRoster: EMPTY_ROSTER,
    }
  } catch {
    return EMPTY_ROSTER_STORE
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
  const rosterStore = useSyncExternalStore(
    subscribeToRoster,
    readRosterFromStorage,
    () => EMPTY_ROSTER_STORE
  )

  const setRoster = useCallback((data: LocalRoster) => {
    const nextRoster = sanitizeRoster(data)

    if (typeof window !== "undefined") {
      window.localStorage.setItem(
        LOCAL_ROSTER_STORAGE_KEY,
        JSON.stringify({
          bedRoster: nextRoster,
          patientRoster: rosterStore.patientRoster,
        } satisfies LocalRosterStore)
      )
      emitRosterChange()
    }
  }, [rosterStore.patientRoster])

  const setPatientName = useCallback(
    (patientId: string, fullName: string) => {
      const normalizedPatientId = normalizeRosterKey(patientId)
      const normalizedFullName = normalizeValue(fullName)

      if (!normalizedPatientId || !normalizedFullName || typeof window === "undefined") {
        return
      }

      window.localStorage.setItem(
        LOCAL_ROSTER_STORAGE_KEY,
        JSON.stringify({
          bedRoster: rosterStore.bedRoster,
          patientRoster: {
            ...rosterStore.patientRoster,
            [normalizedPatientId]: normalizedFullName,
          },
        } satisfies LocalRosterStore)
      )
      emitRosterChange()
    },
    [rosterStore.bedRoster, rosterStore.patientRoster]
  )

  const clearRoster = useCallback(() => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(LOCAL_ROSTER_STORAGE_KEY)
      emitRosterChange()
    }
  }, [])

  const getFullPatientName = useCallback(
    (initials: string, bedId: string, patientId?: string) => {
      const localNameByPatientId = patientId
        ? rosterStore.patientRoster[normalizeRosterKey(patientId)]
        : undefined
      const localNameByBed = rosterStore.bedRoster[normalizeRosterKey(bedId)]
      const localName = localNameByPatientId ?? localNameByBed

      return localName ?? normalizeValue(initials)
    },
    [rosterStore.bedRoster, rosterStore.patientRoster]
  )

  return {
    roster: rosterStore.bedRoster,
    patientRoster: rosterStore.patientRoster,
    bedEntryCount: Object.keys(rosterStore.bedRoster).length,
    patientEntryCount: Object.keys(rosterStore.patientRoster).length,
    entryCount:
      Object.keys(rosterStore.bedRoster).length +
      Object.keys(rosterStore.patientRoster).length,
    setRoster,
    setPatientName,
    clearRoster,
    getFullPatientName,
  }
}
