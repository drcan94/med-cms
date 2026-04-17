import { v } from "convex/values"

import type { Doc } from "./_generated/dataModel"
import {
  FREE_TRIAL_PATIENT_LIMIT,
  normalizeSubscriptionStatus,
} from "../lib/commercial"
import { STAGING_BED_ID } from "../lib/patient-privacy"
import { internal } from "./_generated/api"
import { mutation, query } from "./_generated/server"
import { requireOrgMembership } from "./authz"
import {
  aaGradientValidator,
  anamnesisValidator,
  antibioticValidator,
  consultationValidator,
  criticalMedicationValidator,
  externalWardValidator,
  labCultureValidator,
  oncologyHistoryValidator,
  reportsValidator,
  thoracicInterventionValidator,
  visitNoteValidator,
  vitalsValidator,
} from "./clinicalValidators"
import { mergePatientFromPatch, type PatientUpsertPatch } from "./patientMerge"
import { requireText, sanitizePatientFields } from "./patientValidators"

function patientPatchFromMutationArgs(args: {
  initials?: string
  identifierCode?: string
  bedId?: string
  diagnosis?: string
  admissionDate?: string
  surgeryDate?: string
  procedureName?: string
  serviceName?: string
  gender?: Doc<"patients">["gender"]
  isPregnant?: boolean
  anamnesis?: PatientUpsertPatch["anamnesis"]
  vitals?: PatientUpsertPatch["vitals"]
  aaGradient?: PatientUpsertPatch["aaGradient"]
  criticalMedications?: PatientUpsertPatch["criticalMedications"]
  oncologyHistory?: PatientUpsertPatch["oncologyHistory"]
  reports?: PatientUpsertPatch["reports"]
  externalWard?: PatientUpsertPatch["externalWard"]
  thoracicInterventions?: PatientUpsertPatch["thoracicInterventions"]
  labCultures?: PatientUpsertPatch["labCultures"]
  consultations?: PatientUpsertPatch["consultations"]
  antibiotics?: PatientUpsertPatch["antibiotics"]
  visitNotes?: PatientUpsertPatch["visitNotes"]
}): PatientUpsertPatch {
  const patch: PatientUpsertPatch = {}
  if (args.initials !== undefined) {
    patch.initials = args.initials
  }
  if (args.identifierCode !== undefined) {
    patch.identifierCode = args.identifierCode
  }
  if (args.bedId !== undefined) {
    patch.bedId = args.bedId
  }
  if (args.diagnosis !== undefined) {
    patch.diagnosis = args.diagnosis
  }
  if (args.admissionDate !== undefined) {
    patch.admissionDate = args.admissionDate
  }
  if (args.surgeryDate !== undefined) {
    patch.surgeryDate = args.surgeryDate
  }
  if (args.procedureName !== undefined) {
    patch.procedureName = args.procedureName
  }
  if (args.serviceName !== undefined) {
    patch.serviceName = args.serviceName
  }
  if (args.gender !== undefined) {
    patch.gender = args.gender
  }
  if (args.isPregnant !== undefined) {
    patch.isPregnant = args.isPregnant
  }
  if (args.anamnesis !== undefined) {
    patch.anamnesis = args.anamnesis
  }
  if (args.vitals !== undefined) {
    patch.vitals = args.vitals
  }
  if (args.aaGradient !== undefined) {
    patch.aaGradient = args.aaGradient
  }
  if (args.criticalMedications !== undefined) {
    patch.criticalMedications = args.criticalMedications
  }
  if (args.oncologyHistory !== undefined) {
    patch.oncologyHistory = args.oncologyHistory
  }
  if (args.reports !== undefined) {
    patch.reports = args.reports
  }
  if (args.externalWard !== undefined) {
    patch.externalWard = args.externalWard
  }
  if (args.thoracicInterventions !== undefined) {
    patch.thoracicInterventions = args.thoracicInterventions
  }
  if (args.labCultures !== undefined) {
    patch.labCultures = args.labCultures
  }
  if (args.consultations !== undefined) {
    patch.consultations = args.consultations
  }
  if (args.antibiotics !== undefined) {
    patch.antibiotics = args.antibiotics
  }
  if (args.visitNotes !== undefined) {
    patch.visitNotes = args.visitNotes
  }
  return patch
}

export const getPatientsByOrganization = query({
  args: {
    organizationId: v.string(),
    status: v.optional(
      v.union(
        v.literal("active"),
        v.literal("discharged"),
        v.literal("transferred"),
        v.literal("deceased"),
        v.literal("on_leave"),
        v.literal("all")
      )
    ),
  },
  handler: async (ctx, args) => {
    await requireOrgMembership(ctx, args.organizationId)

    const patients = await ctx.db
      .query("patients")
      .withIndex("by_organization_id", (queryBuilder) =>
        queryBuilder.eq("organizationId", args.organizationId)
      )
      .collect()

    const filteredPatients =
      args.status === "all"
        ? patients
        : patients.filter((patient) => {
            if (args.status) {
              return patient.status === args.status
            }
            return patient.status === "active" || patient.status === undefined
          })

    return filteredPatients.sort((leftPatient, rightPatient) =>
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
    await requireOrgMembership(ctx, args.organizationId)

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

/** Single patient for live dashboard subscription (org-scoped). */
export const getPatientByOrganization = query({
  args: {
    organizationId: v.string(),
    patientId: v.id("patients"),
  },
  handler: async (ctx, args) => {
    await requireOrgMembership(ctx, args.organizationId)

    const patient = await ctx.db.get(args.patientId)
    if (!patient || patient.organizationId !== args.organizationId) {
      return null
    }

    return patient
  },
})

export const upsertPatient = mutation({
  args: {
    patientId: v.optional(v.id("patients")),
    organizationId: v.string(),
    userId: v.string(),
    initials: v.optional(v.string()),
    identifierCode: v.optional(v.string()),
    bedId: v.optional(v.string()),
    diagnosis: v.optional(v.string()),
    admissionDate: v.optional(v.string()),
    surgeryDate: v.optional(v.string()),
    procedureName: v.optional(v.string()),
    serviceName: v.optional(v.string()),
    version: v.optional(v.number()),
    gender: v.optional(v.union(v.literal("male"), v.literal("female"))),
    isPregnant: v.optional(v.boolean()),
    anamnesis: v.optional(anamnesisValidator),
    vitals: v.optional(vitalsValidator),
    aaGradient: v.optional(aaGradientValidator),
    criticalMedications: v.optional(criticalMedicationValidator),
    oncologyHistory: v.optional(oncologyHistoryValidator),
    reports: v.optional(reportsValidator),
    externalWard: v.optional(externalWardValidator),
    thoracicInterventions: v.optional(v.array(thoracicInterventionValidator)),
    labCultures: v.optional(v.array(labCultureValidator)),
    consultations: v.optional(v.array(consultationValidator)),
    antibiotics: v.optional(v.array(antibioticValidator)),
    visitNotes: v.optional(v.array(visitNoteValidator)),
  },
  handler: async (ctx, args) => {
    const { userClerkId } = await requireOrgMembership(ctx, args.organizationId)

    let patientId = args.patientId
    let action: string
    let savedVersion = 1

    if (patientId) {
      const existingPatient = await ctx.db.get(patientId)

      if (!existingPatient) {
        throw new Error("Patient record not found.")
      }

      if (existingPatient.organizationId !== args.organizationId) {
        throw new Error("You cannot update a patient outside your organization.")
      }

      const patch = patientPatchFromMutationArgs(args)
      if (Object.keys(patch).length === 0) {
        return {
          action: "patient.unchanged",
          patientId,
          version: existingPatient.version ?? 0,
        }
      }

      const mergedPatient = mergePatientFromPatch(existingPatient, patch)

      const patientFields = sanitizePatientFields({
        organizationId: mergedPatient.organizationId,
        initials: mergedPatient.initials,
        identifierCode: mergedPatient.identifierCode,
        bedId: mergedPatient.bedId,
        diagnosis: mergedPatient.diagnosis,
        admissionDate: mergedPatient.admissionDate,
        surgeryDate: mergedPatient.surgeryDate,
        procedureName: mergedPatient.procedureName,
        serviceName: mergedPatient.serviceName,
      })

      const conflictingBedAssignment =
        patientFields.bedId === STAGING_BED_ID
          ? null
          : await ctx.db
              .query("patients")
              .withIndex("by_organization_bed_id", (queryBuilder) =>
                queryBuilder
                  .eq("organizationId", patientFields.organizationId)
                  .eq("bedId", patientFields.bedId)
              )
              .unique()

      if (
        conflictingBedAssignment &&
        conflictingBedAssignment._id !== patientId
      ) {
        throw new Error("That bed is already assigned to another patient.")
      }

      const nextVersion = (existingPatient.version ?? 0) + 1
      savedVersion = nextVersion

      await ctx.db.patch(patientId, {
        ...patientFields,
        gender: mergedPatient.gender,
        isPregnant: mergedPatient.isPregnant,
        anamnesis: mergedPatient.anamnesis,
        vitals: mergedPatient.vitals,
        aaGradient: mergedPatient.aaGradient,
        criticalMedications: mergedPatient.criticalMedications,
        oncologyHistory: mergedPatient.oncologyHistory,
        reports: mergedPatient.reports,
        externalWard: mergedPatient.externalWard,
        thoracicInterventions: mergedPatient.thoracicInterventions,
        labCultures: mergedPatient.labCultures,
        consultations: mergedPatient.consultations,
        antibiotics: mergedPatient.antibiotics,
        visitNotes: mergedPatient.visitNotes,
        version: nextVersion,
      })
      action = `patient.updated:${patientFields.bedId}`
    } else {
      if (
        args.initials === undefined ||
        args.identifierCode === undefined ||
        args.bedId === undefined ||
        args.diagnosis === undefined ||
        args.admissionDate === undefined
      ) {
        throw new Error("Missing required fields for new patient.")
      }

      const patientFields = sanitizePatientFields({
        organizationId: args.organizationId,
        initials: args.initials,
        identifierCode: args.identifierCode,
        bedId: args.bedId,
        diagnosis: args.diagnosis,
        admissionDate: args.admissionDate,
        surgeryDate: args.surgeryDate,
        procedureName: args.procedureName,
        serviceName: args.serviceName,
      })
      const clinicalFields = {
        gender: args.gender,
        isPregnant: args.isPregnant,
        anamnesis: args.anamnesis,
        vitals: args.vitals,
        aaGradient: args.aaGradient,
        criticalMedications: args.criticalMedications,
        oncologyHistory: args.oncologyHistory,
        reports: args.reports,
        externalWard: args.externalWard,
        thoracicInterventions: args.thoracicInterventions,
        labCultures: args.labCultures,
        consultations: args.consultations,
        antibiotics: args.antibiotics,
        visitNotes: args.visitNotes,
      }

      const conflictingBedAssignment =
        patientFields.bedId === STAGING_BED_ID
          ? null
          : await ctx.db
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

      patientId = await ctx.db.insert("patients", {
        ...patientFields,
        ...clinicalFields,
        version: 1,
      })
      savedVersion = 1
      action = `patient.created:${patientFields.bedId}`
    }

    const organizationId = requireText(args.organizationId, "Organization")

    await ctx.runMutation(internal.audit.recordAuditLog, {
      action,
      organizationId,
      timestamp: Date.now(),
      userId: userClerkId,
    })

    return {
      action,
      patientId,
      version: savedVersion,
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
    const { userClerkId } = await requireOrgMembership(ctx, args.organizationId)

    const organizationId = requireText(args.organizationId, "Organization")
    const newBedId = requireText(args.newBedId, "Bed")
    const patient = await ctx.db.get(args.patientId)

    if (!patient) {
      throw new Error("Patient record not found.")
    }

    if (patient.organizationId !== organizationId) {
      throw new Error("You cannot move a patient outside your organization.")
    }

    const sourceBedId = patient.bedId
    let swappedPatientId: string | null = null
    let action = `patient.moved:${newBedId}`

    if (newBedId !== STAGING_BED_ID) {
      const occupyingPatient = await ctx.db
        .query("patients")
        .withIndex("by_organization_bed_id", (queryBuilder) =>
          queryBuilder.eq("organizationId", organizationId).eq("bedId", newBedId)
        )
        .unique()

      if (occupyingPatient && occupyingPatient._id !== args.patientId) {
        const isActivePatient =
          occupyingPatient.status === "active" || occupyingPatient.status === undefined

        if (isActivePatient) {
          await ctx.db.patch(occupyingPatient._id, {
            bedId: sourceBedId,
          })
          swappedPatientId = occupyingPatient._id
          action = `patient.swapped:${newBedId}<->${sourceBedId}`
        }
      }
    }

    await ctx.db.patch(args.patientId, {
      bedId: newBedId,
    })

    await ctx.runMutation(internal.audit.recordAuditLog, {
      action,
      organizationId,
      timestamp: Date.now(),
      userId: userClerkId,
    })

    return {
      action,
      patientId: args.patientId,
      swappedPatientId,
    }
  },
})

export const updatePatientStatus = mutation({
  args: {
    organizationId: v.string(),
    patientId: v.id("patients"),
    userId: v.string(),
    status: v.union(
      v.literal("active"),
      v.literal("discharged"),
      v.literal("transferred"),
      v.literal("deceased"),
      v.literal("on_leave")
    ),
  },
  handler: async (ctx, args) => {
    const { userClerkId } = await requireOrgMembership(ctx, args.organizationId)

    const organizationId = requireText(args.organizationId, "Organization")
    const patient = await ctx.db.get(args.patientId)

    if (!patient) {
      throw new Error("Patient record not found.")
    }

    if (patient.organizationId !== organizationId) {
      throw new Error("You cannot update a patient outside your organization.")
    }

    const previousStatus = patient.status ?? "active"
    const isLeavingWard = args.status !== "active"

    const updatePayload: { status: typeof args.status; bedId?: string } = {
      status: args.status,
    }

    if (isLeavingWard && patient.bedId !== STAGING_BED_ID) {
      updatePayload.bedId = STAGING_BED_ID
    }

    await ctx.db.patch(args.patientId, updatePayload)

    const action = `patient.status:${previousStatus}->${args.status}`

    await ctx.runMutation(internal.audit.recordAuditLog, {
      action,
      organizationId,
      timestamp: Date.now(),
      userId: userClerkId,
    })

    return {
      action,
      patientId: args.patientId,
      previousStatus,
      newStatus: args.status,
    }
  },
})

export const toggleClinicalRequirement = mutation({
  args: {
    organizationId: v.string(),
    patientId: v.id("patients"),
    userId: v.string(),
    item: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userClerkId } = await requireOrgMembership(ctx, args.organizationId)

    const organizationId = requireText(args.organizationId, "Organization")
    const item = requireText(args.item, "Checklist item")
    const patient = await ctx.db.get(args.patientId)

    if (!patient) {
      throw new Error("Patient record not found.")
    }

    if (patient.organizationId !== organizationId) {
      throw new Error("You cannot update a patient outside your organization.")
    }

    const existingRequirements = patient.completedRequirements ?? []
    let updatedRequirements: { item: string; completedAt: string }[]
    let action: string

    if (args.completed) {
      const alreadyCompleted = existingRequirements.some((req) => req.item === item)

      if (alreadyCompleted) {
        return { patientId: args.patientId, action: "requirement.already_completed" }
      }

      updatedRequirements = [
        ...existingRequirements,
        {
          item,
          completedAt: new Date().toISOString(),
        },
      ]
      action = `requirement.completed:${item}`
    } else {
      updatedRequirements = existingRequirements.filter((req) => req.item !== item)
      action = `requirement.uncompleted:${item}`
    }

    await ctx.db.patch(args.patientId, {
      completedRequirements: updatedRequirements,
    })

    await ctx.runMutation(internal.audit.recordAuditLog, {
      action,
      organizationId,
      timestamp: Date.now(),
      userId: userClerkId,
    })

    return {
      action,
      patientId: args.patientId,
    }
  },
})

export const addCustomTodo = mutation({
  args: {
    organizationId: v.string(),
    patientId: v.id("patients"),
    userId: v.string(),
    text: v.string(),
  },
  handler: async (ctx, args) => {
    const { userClerkId } = await requireOrgMembership(ctx, args.organizationId)

    const organizationId = requireText(args.organizationId, "Organization")
    const text = requireText(args.text, "Todo text")
    const patient = await ctx.db.get(args.patientId)

    if (!patient) {
      throw new Error("Patient record not found.")
    }

    if (patient.organizationId !== organizationId) {
      throw new Error("You cannot update a patient outside your organization.")
    }

    const existingTodos = patient.customTodos ?? []
    const newTodo = {
      id: `todo_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      text,
      completed: false,
      createdAt: new Date().toISOString(),
    }

    await ctx.db.patch(args.patientId, {
      customTodos: [...existingTodos, newTodo],
    })

    const action = `todo.added:${text}`

    await ctx.runMutation(internal.audit.recordAuditLog, {
      action,
      organizationId,
      timestamp: Date.now(),
      userId: userClerkId,
    })

    return {
      action,
      patientId: args.patientId,
      todoId: newTodo.id,
    }
  },
})

export const toggleCustomTodo = mutation({
  args: {
    organizationId: v.string(),
    patientId: v.id("patients"),
    userId: v.string(),
    todoId: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const { userClerkId } = await requireOrgMembership(ctx, args.organizationId)

    const organizationId = requireText(args.organizationId, "Organization")
    const patient = await ctx.db.get(args.patientId)

    if (!patient) {
      throw new Error("Patient record not found.")
    }

    if (patient.organizationId !== organizationId) {
      throw new Error("You cannot update a patient outside your organization.")
    }

    const existingTodos = patient.customTodos ?? []
    const todoIndex = existingTodos.findIndex((t) => t.id === args.todoId)

    if (todoIndex === -1) {
      throw new Error("Todo not found.")
    }

    const updatedTodos = existingTodos.map((todo) =>
      todo.id === args.todoId
        ? {
            ...todo,
            completed: args.completed,
            completedAt: args.completed ? new Date().toISOString() : undefined,
          }
        : todo
    )

    await ctx.db.patch(args.patientId, {
      customTodos: updatedTodos,
    })

    const todoText = existingTodos[todoIndex].text
    const action = args.completed
      ? `todo.completed:${todoText}`
      : `todo.uncompleted:${todoText}`

    await ctx.runMutation(internal.audit.recordAuditLog, {
      action,
      organizationId,
      timestamp: Date.now(),
      userId: userClerkId,
    })

    return {
      action,
      patientId: args.patientId,
    }
  },
})

export const deleteCustomTodo = mutation({
  args: {
    organizationId: v.string(),
    patientId: v.id("patients"),
    userId: v.string(),
    todoId: v.string(),
  },
  handler: async (ctx, args) => {
    const { userClerkId } = await requireOrgMembership(ctx, args.organizationId)

    const organizationId = requireText(args.organizationId, "Organization")
    const patient = await ctx.db.get(args.patientId)

    if (!patient) {
      throw new Error("Patient record not found.")
    }

    if (patient.organizationId !== organizationId) {
      throw new Error("You cannot update a patient outside your organization.")
    }

    const existingTodos = patient.customTodos ?? []
    const todo = existingTodos.find((t) => t.id === args.todoId)

    if (!todo) {
      throw new Error("Todo not found.")
    }

    const updatedTodos = existingTodos.filter((t) => t.id !== args.todoId)

    await ctx.db.patch(args.patientId, {
      customTodos: updatedTodos,
    })

    const action = `todo.deleted:${todo.text}`

    await ctx.runMutation(internal.audit.recordAuditLog, {
      action,
      organizationId,
      timestamp: Date.now(),
      userId: userClerkId,
    })

    return {
      action,
      patientId: args.patientId,
    }
  },
})
