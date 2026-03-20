import { v } from "convex/values"

import {
  FREE_TRIAL_PATIENT_LIMIT,
  normalizeSubscriptionStatus,
} from "../lib/commercial"
import { STAGING_BED_ID } from "../lib/patient-privacy"
import { internal } from "./_generated/api"
import { mutation, query } from "./_generated/server"
import { requireText, sanitizePatientFields } from "./patientValidators"

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
    identifierCode: v.string(),
    bedId: v.string(),
    diagnosis: v.string(),
    admissionDate: v.string(),
    surgeryDate: v.optional(v.string()),
    procedureName: v.optional(v.string()),
    serviceName: v.optional(v.string()),
    version: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const patientFields = sanitizePatientFields(args)

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

      const serverVersion = existingPatient.version ?? 0
      const clientVersion = args.version ?? 0

      if (clientVersion !== serverVersion) {
        throw new Error(
          "CONFLICT: This patient was updated by another user. Please refresh and try again."
        )
      }

      const nextVersion = serverVersion + 1

      await ctx.db.patch(patientId, {
        ...patientFields,
        version: nextVersion,
      })
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

      patientId = await ctx.db.insert("patients", {
        ...patientFields,
        version: 1,
      })
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

    const conflictingBedAssignment =
      newBedId === STAGING_BED_ID
        ? null
        : await ctx.db
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

export const toggleClinicalRequirement = mutation({
  args: {
    organizationId: v.string(),
    patientId: v.id("patients"),
    userId: v.string(),
    item: v.string(),
    completed: v.boolean(),
  },
  handler: async (ctx, args) => {
    const organizationId = requireText(args.organizationId, "Organization")
    const userId = requireText(args.userId, "User")
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
      userId,
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
    const organizationId = requireText(args.organizationId, "Organization")
    const userId = requireText(args.userId, "User")
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
      userId,
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
    const organizationId = requireText(args.organizationId, "Organization")
    const userId = requireText(args.userId, "User")
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
      userId,
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
    const organizationId = requireText(args.organizationId, "Organization")
    const userId = requireText(args.userId, "User")
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
      userId,
    })

    return {
      action,
      patientId: args.patientId,
    }
  },
})
