"use client"

import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"

import { api } from "@/convex/_generated/api"
import {
  FREE_TRIAL_PATIENT_LIMIT,
  isOrganizationLocked,
  normalizeSubscriptionStatus,
} from "@/lib/commercial"

type UsePLGLimitsResult = {
  isLoading: boolean
  isLocked: boolean
  organizationName: string | null
  patientCount: number
  patientLimit: number
  subscriptionStatus: string
}

export function usePLGLimits(): UsePLGLimitsResult {
  const { isLoaded, orgId } = useAuth()
  const organization = useQuery(
    api.organizations.getOrganizationByClerkId,
    orgId ? { clerkId: orgId } : "skip"
  )
  const patientCount = useQuery(
    api.patients.getPatientCount,
    orgId ? { organizationId: orgId } : "skip"
  )
  const isLoading =
    !isLoaded || (Boolean(orgId) && (organization === undefined || patientCount === undefined))
  const subscriptionStatus = normalizeSubscriptionStatus(
    organization?.subscriptionStatus
  )
  const resolvedPatientCount = patientCount ?? 0

  return {
    isLoading,
    isLocked:
      Boolean(orgId) &&
      !isLoading &&
      isOrganizationLocked(resolvedPatientCount, subscriptionStatus),
    organizationName: organization?.name ?? null,
    patientCount: resolvedPatientCount,
    patientLimit: FREE_TRIAL_PATIENT_LIMIT,
    subscriptionStatus,
  }
}
