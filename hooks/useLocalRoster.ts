"use client"

import { useCallback, useSyncExternalStore } from "react"
import { buildPatientIdentityKey } from "@/lib/patient-identity"

export const LOCAL_ROSTER_STORAGE_KEY = "wardos_local_roster"
const LOCAL_ROSTER_CHANGE_EVENT = "wardos-local-roster-change"

export type LocalRoster = Record<string, string>
type LocalRosterStore = {
  bedRoster: LocalRoster
  patientRoster: LocalRoster
}
type PatientNameLookup = {
  bedId: string
  identifierCode?: string
  initials: string
  patientId?: string
}
type SetPatientNameArgs = {
  fullName: string
  identifierCode: string
  initials: string
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

function resolveStoredPatientName(
  rosterStore: LocalRosterStore,
  lookup: PatientNameLookup
): string | undefined {
  const identityKey = buildPatientIdentityKey(
    lookup.initials,
    lookup.identifierCode ?? ""
  )
  const normalizedIdentityKey = identityKey ? normalizeRosterKey(identityKey) : null
  const normalizedPatientId = lookup.patientId
    ? normalizeRosterKey(lookup.patientId)
    : null
  const normalizedBedId = normalizeRosterKey(lookup.bedId)

  return (
    (normalizedIdentityKey
      ? rosterStore.patientRoster[normalizedIdentityKey]
      : undefined) ??
    (normalizedPatientId ? rosterStore.patientRoster[normalizedPatientId] : undefined) ??
    (normalizedIdentityKey ? rosterStore.bedRoster[normalizedIdentityKey] : undefined) ??
    (normalizedBedId ? rosterStore.bedRoster[normalizedBedId] : undefined)
  )
}

/**
 * Browser-local PII comes from imported roster rows and manually entered names.
 * Imported CSV data may key by `bedId` or by a de-identified `initials + last4`
 * identity pair so staged patients can still resolve to the correct full name
 * without ever sending plaintext PII to Convex.
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
    ({ fullName, identifierCode, initials }: SetPatientNameArgs) => {
      const identityKey = buildPatientIdentityKey(initials, identifierCode)
      const normalizedFullName = normalizeValue(fullName)

      if (!identityKey || !normalizedFullName || typeof window === "undefined") {
        return
      }

      window.localStorage.setItem(
        LOCAL_ROSTER_STORAGE_KEY,
        JSON.stringify({
          bedRoster: rosterStore.bedRoster,
          patientRoster: {
            ...rosterStore.patientRoster,
            [normalizeRosterKey(identityKey)]: normalizedFullName,
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

  const getLocalPatientName = useCallback(
    (lookup: PatientNameLookup) => resolveStoredPatientName(rosterStore, lookup) ?? "",
    [rosterStore]
  )

  const getFullPatientName = useCallback(
    (lookup: PatientNameLookup) => {
      const localName = getLocalPatientName(lookup)
      return localName || normalizeValue(lookup.initials)
    },
    [getLocalPatientName]
  )

  return {
    roster: rosterStore.bedRoster,
    bedEntryCount: Object.keys(rosterStore.bedRoster).length,
    patientEntryCount: Object.keys(rosterStore.patientRoster).length,
    entryCount:
      Object.keys(rosterStore.bedRoster).length +
      Object.keys(rosterStore.patientRoster).length,
    setRoster,
    setPatientName,
    clearRoster,
    getLocalPatientName,
    getFullPatientName,
  }
}
