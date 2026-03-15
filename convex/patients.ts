import { v } from "convex/values"

import {
  FREE_TRIAL_PATIENT_LIMIT,
  normalizeSubscriptionStatus,
} from "../lib/commercial"
import { internal } from "./_generated/api"
import type { Doc } from "./_generated/dataModel"
import { mutation, query } from "./_generated/server"

type PatientRecord = Doc<"patients">
type WritablePatientFields = Pick<
  PatientRecord,
  "organizationId" | "initials" | "bedId" | "diagnosis" | "admissionDate" | "surgeryDate"
>

function requireText(value: string, fieldName: string): string {
  const normalizedValue = value.trim()

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`)
  }

  return normalizedValue
}

function sanitizePatientFields(args: {
  organizationId: string
  initials: string
  bedId: string
  diagnosis: string
  admissionDate: string
  surgeryDate?: string
}): WritablePatientFields {
  const surgeryDate = args.surgeryDate?.trim()

  return {
    organizationId: requireText(args.organizationId, "Organization"),
    initials: requireText(args.initials, "Patient initials"),
    bedId: requireText(args.bedId, "Bed"),
    diagnosis: requireText(args.diagnosis, "Diagnosis"),
    admissionDate: requireText(args.admissionDate, "Admission date"),
    ...(surgeryDate ? { surgeryDate } : {}),
  }
}

export const getPatientsByOrganization = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_organization_id", (queryBuilder) =>
        queryBuilder.eq("organizationId", args.organizationId)
      )
      .collect()

    return patients.sort((leftPatient, rightPatient) =>
      leftPatient.bedId.localeCompare(rightPatient.bedId, undefined, {
        numeric: true,
        sensitivity: "base",
      })
    )
  },
})

export const getPatientCount = query({
  args: {
    organizationId: v.string(),
  },
  handler: async (ctx, args) => {
    const organizationId = requireText(args.organizationId, "Organization")
    const patients = await ctx.db
      .query("patients")
      .withIndex("by_organization_id", (queryBuilder) =>
        queryBuilder.eq("organizationId", organizationId)
      )
      .collect()

    return patients.length
  },
})

export const upsertPatient = mutation({
  args: {
    patientId: v.optional(v.id("patients")),
    organizationId: v.string(),
    userId: v.string(),
    initials: v.string(),
    bedId: v.string(),
    diagnosis: v.string(),
    admissionDate: v.string(),
    surgeryDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const patientFields = sanitizePatientFields(args)

    const conflictingBedAssignment = await ctx.db
      .query("patients")
      .withIndex("by_organization_bed_id", (queryBuilder) =>
        queryBuilder
          .eq("organizationId", patientFields.organizationId)
          .eq("bedId", patientFields.bedId)
      )
      .unique()

    if (
      conflictingBedAssignment &&
      conflictingBedAssignment._id !== args.patientId
    ) {
      throw new Error("That bed is already assigned to another patient.")
    }

    let patientId = args.patientId
    let action = `patient.created:${patientFields.bedId}`

    if (patientId) {
      const existingPatient = await ctx.db.get(patientId)

      if (!existingPatient) {
        throw new Error("Patient record not found.")
      }

      if (existingPatient.organizationId !== patientFields.organizationId) {
        throw new Error("You cannot update a patient outside your organization.")
      }

      await ctx.db.replace(patientId, patientFields)
      action = `patient.updated:${patientFields.bedId}`
    } else {
      const [organization, patients] = await Promise.all([
        ctx.db
          .query("organizations")
          .withIndex("by_clerk_id", (queryBuilder) =>
            queryBuilder.eq("clerkId", patientFields.organizationId)
          )
          .unique(),
        ctx.db
          .query("patients")
          .withIndex("by_organization_id", (queryBuilder) =>
            queryBuilder.eq("organizationId", patientFields.organizationId)
          )
          .collect(),
      ])
      const patientCount = patients.length
      const subscriptionStatus = normalizeSubscriptionStatus(
        organization?.subscriptionStatus
      )

      if (
        patientCount >= FREE_TRIAL_PATIENT_LIMIT &&
        subscriptionStatus !== "active"
      ) {
        throw new Error("TRIAL_LIMIT_REACHED")
      }

      patientId = await ctx.db.insert("patients", patientFields)
    }

    await ctx.runMutation(internal.audit.recordAuditLog, {
      action,
      organizationId: patientFields.organizationId,
      timestamp: Date.now(),
      userId: requireText(args.userId, "User"),
    })

    return {
      action,
      patientId,
    }
  },
})

export const updatePatientBed = mutation({
  args: {
    organizationId: v.string(),
    patientId: v.id("patients"),
    newBedId: v.string(),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const organizationId = requireText(args.organizationId, "Organization")
    const userId = requireText(args.userId, "User")
    const newBedId = requireText(args.newBedId, "Bed")
    const patient = await ctx.db.get(args.patientId)

    if (!patient) {
      throw new Error("Patient record not found.")
    }

    if (patient.organizationId !== organizationId) {
      throw new Error("You cannot move a patient outside your organization.")
    }

    const conflictingBedAssignment = await ctx.db
      .query("patients")
      .withIndex("by_organization_bed_id", (queryBuilder) =>
        queryBuilder.eq("organizationId", organizationId).eq("bedId", newBedId)
      )
      .unique()

    if (conflictingBedAssignment && conflictingBedAssignment._id !== args.patientId) {
      throw new Error("That bed is already assigned to another patient.")
    }

    await ctx.db.patch(args.patientId, {
      bedId: newBedId,
    })

    const action = `patient.moved:${newBedId}`

    await ctx.runMutation(internal.audit.recordAuditLog, {
      action,
      organizationId,
      timestamp: Date.now(),
      userId,
    })

    return {
      action,
      patientId: args.patientId,
    }
  },
})
