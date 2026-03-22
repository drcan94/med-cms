"use client"

import { useCallback, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { useMutation } from "convex/react"
import { Check, Loader2, Plus, Square, Trash2, X } from "lucide-react"
import { useTranslations } from "next-intl"

import { api } from "@/convex/_generated/api"
import type { Id } from "@/convex/_generated/dataModel"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

type CompletedRequirement = {
  item: string
  completedAt: string
}

type CustomTodo = {
  id: string
  text: string
  completed: boolean
  createdAt: string
  completedAt?: string
}

type RuleRequirement = {
  id: string
  message: string
  ruleId: string
}

type VisitTodoListProps = {
  className?: string
  completedRequirements?: CompletedRequirement[]
  customTodos?: CustomTodo[]
  patientId: Id<"patients">
  requirements?: RuleRequirement[]
  variant?: "compact" | "full"
}

export function VisitTodoList({
  className,
  completedRequirements = [],
  customTodos = [],
  patientId,
  requirements = [],
  variant = "full",
}: Readonly<VisitTodoListProps>) {
  const t = useTranslations("VisitTodoList")
  const { orgId, userId } = useAuth()
  const [newTodoText, setNewTodoText] = useState("")
  const [isAdding, setIsAdding] = useState(false)
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set())

  const addCustomTodo = useMutation(api.patients.addCustomTodo)
  const toggleCustomTodo = useMutation(api.patients.toggleCustomTodo)
  const deleteCustomTodo = useMutation(api.patients.deleteCustomTodo)
  const toggleClinicalRequirement = useMutation(api.patients.toggleClinicalRequirement)

  const completedRequirementsSet = new Set(completedRequirements.map((r) => r.item))

  const handleAddTodo = useCallback(async () => {
    if (!newTodoText.trim() || !orgId || !userId) return

    setIsAdding(true)
    try {
      await addCustomTodo({
        organizationId: orgId,
        patientId,
        userId,
        text: newTodoText.trim(),
      })
      setNewTodoText("")
    } finally {
      setIsAdding(false)
    }
  }, [addCustomTodo, newTodoText, orgId, patientId, userId])

  const handleToggleCustomTodo = useCallback(
    async (todoId: string, currentCompleted: boolean) => {
      if (!orgId || !userId) return

      setLoadingItems((prev) => new Set(prev).add(todoId))
      try {
        await toggleCustomTodo({
          organizationId: orgId,
          patientId,
          userId,
          todoId,
          completed: !currentCompleted,
        })
      } finally {
        setLoadingItems((prev) => {
          const next = new Set(prev)
          next.delete(todoId)
          return next
        })
      }
    },
    [orgId, patientId, toggleCustomTodo, userId]
  )

  const handleDeleteCustomTodo = useCallback(
    async (todoId: string) => {
      if (!orgId || !userId) return

      setLoadingItems((prev) => new Set(prev).add(`delete-${todoId}`))
      try {
        await deleteCustomTodo({
          organizationId: orgId,
          patientId,
          userId,
          todoId,
        })
      } finally {
        setLoadingItems((prev) => {
          const next = new Set(prev)
          next.delete(`delete-${todoId}`)
          return next
        })
      }
    },
    [deleteCustomTodo, orgId, patientId, userId]
  )

  const handleToggleRequirement = useCallback(
    async (item: string, currentCompleted: boolean) => {
      if (!orgId || !userId) return

      setLoadingItems((prev) => new Set(prev).add(`req-${item}`))
      try {
        await toggleClinicalRequirement({
          organizationId: orgId,
          patientId,
          userId,
          item,
          completed: !currentCompleted,
        })
      } finally {
        setLoadingItems((prev) => {
          const next = new Set(prev)
          next.delete(`req-${item}`)
          return next
        })
      }
    },
    [orgId, patientId, toggleClinicalRequirement, userId]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault()
        handleAddTodo()
      }
    },
    [handleAddTodo]
  )

  const incompleteTodos = customTodos.filter((t) => !t.completed)
  const completedTodos = customTodos.filter((t) => t.completed)
  const pendingRequirements = requirements.filter((r) => !completedRequirementsSet.has(r.id))
  const completedRequirementItems = requirements.filter((r) => completedRequirementsSet.has(r.id))

  const totalPending = incompleteTodos.length + pendingRequirements.length
  const totalCompleted = completedTodos.length + completedRequirementItems.length

  const isCompact = variant === "compact"

  if (isCompact) {
    return (
      <div className={cn("space-y-1.5", className)}>
        {pendingRequirements.map((req) => {
          const isLoading = loadingItems.has(`req-${req.id}`)
          return (
            <button
              key={req.id}
              type="button"
              disabled={isLoading}
              onClick={() => handleToggleRequirement(req.id, false)}
              className="flex w-full items-center gap-1.5 text-left text-[10px] leading-tight hover:bg-muted/50 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Square className="size-3 shrink-0 text-amber-600" />
              )}
              <span className="line-clamp-2">{req.message}</span>
            </button>
          )
        })}
        {incompleteTodos.map((todo) => {
          const isLoading = loadingItems.has(todo.id)
          return (
            <button
              key={todo.id}
              type="button"
              disabled={isLoading}
              onClick={() => handleToggleCustomTodo(todo.id, todo.completed)}
              className="flex w-full items-center gap-1.5 text-left text-[10px] leading-tight hover:bg-muted/50 disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="size-3 shrink-0 animate-spin text-muted-foreground" />
              ) : (
                <Square className="size-3 shrink-0 text-blue-600" />
              )}
              <span className="line-clamp-2">{todo.text}</span>
            </button>
          )
        })}
        {totalPending === 0 && (
          <p className="text-[10px] text-muted-foreground">{t("noPending")}</p>
        )}
      </div>
    )
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-semibold">{t("title")}</h4>
        {totalPending > 0 && (
          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">
            {totalPending}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newTodoText}
          onChange={(e) => setNewTodoText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t("placeholder")}
          className="h-8 text-sm"
          disabled={isAdding}
        />
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          onClick={handleAddTodo}
          disabled={!newTodoText.trim() || isAdding}
        >
          {isAdding ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
        </Button>
      </div>

      <div className="space-y-1">
        {pendingRequirements.map((req) => {
          const isLoading = loadingItems.has(`req-${req.id}`)
          return (
            <div
              key={req.id}
              className="flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50/50 px-2.5 py-2 dark:border-amber-900 dark:bg-amber-950/20"
            >
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleToggleRequirement(req.id, false)}
                className="mt-0.5 shrink-0 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <Square className="size-4 text-amber-600" />
                )}
              </button>
              <span className="text-sm leading-tight">{req.message}</span>
            </div>
          )
        })}

        {incompleteTodos.map((todo) => {
          const isLoading = loadingItems.has(todo.id)
          const isDeleting = loadingItems.has(`delete-${todo.id}`)
          return (
            <div
              key={todo.id}
              className="group flex items-start gap-2 rounded-md border bg-muted/30 px-2.5 py-2"
            >
              <button
                type="button"
                disabled={isLoading}
                onClick={() => handleToggleCustomTodo(todo.id, todo.completed)}
                className="mt-0.5 shrink-0 disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <Square className="size-4 text-blue-600" />
                )}
              </button>
              <span className="flex-1 text-sm leading-tight">{todo.text}</span>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => handleDeleteCustomTodo(todo.id)}
                className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="size-4 animate-spin text-muted-foreground" />
                ) : (
                  <Trash2 className="size-4 text-muted-foreground hover:text-destructive" />
                )}
              </button>
            </div>
          )
        })}
      </div>

      {totalCompleted > 0 && (
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground">
            {t("completedCount", { count: totalCompleted })}
          </summary>
          <div className="mt-2 space-y-1">
            {completedRequirementItems.map((req) => {
              const isLoading = loadingItems.has(`req-${req.id}`)
              return (
                <div key={req.id} className="flex items-start gap-2 px-2.5 py-1.5 opacity-60">
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleToggleRequirement(req.id, true)}
                    className="mt-0.5 shrink-0 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Check className="size-4 text-green-600" />
                    )}
                  </button>
                  <span className="text-sm leading-tight line-through">{req.message}</span>
                </div>
              )
            })}

            {completedTodos.map((todo) => {
              const isLoading = loadingItems.has(todo.id)
              const isDeleting = loadingItems.has(`delete-${todo.id}`)
              return (
                <div
                  key={todo.id}
                  className="group/item flex items-start gap-2 px-2.5 py-1.5 opacity-60"
                >
                  <button
                    type="button"
                    disabled={isLoading}
                    onClick={() => handleToggleCustomTodo(todo.id, todo.completed)}
                    className="mt-0.5 shrink-0 disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <Check className="size-4 text-green-600" />
                    )}
                  </button>
                  <span className="flex-1 text-sm leading-tight line-through">{todo.text}</span>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => handleDeleteCustomTodo(todo.id)}
                    className="shrink-0 opacity-0 transition-opacity group-hover/item:opacity-100 disabled:opacity-50"
                  >
                    {isDeleting ? (
                      <Loader2 className="size-4 animate-spin text-muted-foreground" />
                    ) : (
                      <X className="size-4 text-muted-foreground hover:text-destructive" />
                    )}
                  </button>
                </div>
              )
            })}
          </div>
        </details>
      )}
    </div>
  )
}
