"use client"

import { useState } from "react"
import { Check, ClipboardCheck, ClipboardList, Loader2, Plus, Trash2 } from "lucide-react"
import { useTranslations } from "next-intl"

import { formatCompletionDate } from "@/lib/date-utils"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"

export type CompletedRequirement = {
  item: string
  completedAt: string
}

export type CustomTodo = {
  id: string
  text: string
  completed: boolean
  createdAt: string
  completedAt?: string
}

type PatientClinicalRequirementsAlertProps = {
  completedRequirements?: CompletedRequirement[]
  customTodos?: CustomTodo[]
  items: string[]
  loading?: string | null
  onAddTodo?: (text: string) => void
  onDeleteTodo?: (todoId: string) => void
  onToggle?: (item: string, completed: boolean) => void
  onToggleTodo?: (todoId: string, completed: boolean) => void
}

export function PatientClinicalRequirementsAlert({
  completedRequirements = [],
  customTodos = [],
  items,
  loading,
  onAddTodo,
  onDeleteTodo,
  onToggle,
  onToggleTodo,
}: Readonly<PatientClinicalRequirementsAlertProps>) {
  const t = useTranslations("PatientSheet")
  const [newTodoText, setNewTodoText] = useState("")
  const completedItems = completedRequirements.filter((req) =>
    items.includes(req.item)
  )
  const pendingItems = items.filter(
    (item) => !completedRequirements.some((req) => req.item === item)
  )
  const pendingTodos = customTodos.filter((todo) => !todo.completed)
  const completedTodos = customTodos.filter((todo) => todo.completed)
  const hasAnyItems = items.length > 0 || completedItems.length > 0 || customTodos.length > 0 || onAddTodo

  const handleAddTodo = () => {
    if (newTodoText.trim() && onAddTodo) {
      onAddTodo(newTodoText.trim())
      setNewTodoText("")
    }
  }

  if (!hasAnyItems) {
    return null
  }

  return (
    <div className="space-y-3">
      {(pendingItems.length > 0 || pendingTodos.length > 0 || onAddTodo) ? (
        <div className="rounded-xl border border-amber-500/50 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-950/40">
          <div className="mb-2 flex items-center gap-2">
            <ClipboardList className="size-4 text-amber-600 dark:text-amber-400" />
            <h4 className="text-sm font-semibold text-amber-900 dark:text-amber-100">
              {t("clinicalRequirements.pending")}
            </h4>
          </div>
          <div className="space-y-1.5">
            {pendingItems.map((item) => {
              const isLoading = loading === item

              return (
                <label
                  key={item}
                  className={cn(
                    "flex cursor-pointer items-center gap-2.5 rounded-lg border border-amber-200/60 bg-white/80 px-2.5 py-2 text-sm transition-colors hover:bg-amber-100/50 dark:border-amber-800/40 dark:bg-amber-950/30 dark:hover:bg-amber-900/40",
                    isLoading && "pointer-events-none opacity-70"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-amber-600" />
                  ) : (
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => onToggle?.(item, true)}
                      className="border-amber-400 data-[state=checked]:bg-amber-600"
                    />
                  )}
                  <span className="flex-1 text-amber-900 dark:text-amber-100">{item}</span>
                  <span className="shrink-0 rounded bg-amber-200/60 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-700 dark:bg-amber-800/40 dark:text-amber-300">
                    {t("clinicalRequirements.ruleTag")}
                  </span>
                </label>
              )
            })}

            {pendingTodos.map((todo) => {
              const isLoading = loading === todo.id

              return (
                <div
                  key={todo.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border border-amber-200/60 bg-white/80 px-2.5 py-2 text-sm transition-colors dark:border-amber-800/40 dark:bg-amber-950/30",
                    isLoading && "pointer-events-none opacity-70"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-amber-600" />
                  ) : (
                    <Checkbox
                      checked={false}
                      onCheckedChange={() => onToggleTodo?.(todo.id, true)}
                      className="border-amber-400 data-[state=checked]:bg-amber-600"
                    />
                  )}
                  <span className="flex-1 text-amber-900 dark:text-amber-100">{todo.text}</span>
                  {onDeleteTodo ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="size-6 shrink-0 text-amber-600 hover:bg-amber-200/50 hover:text-amber-800"
                      onClick={() => onDeleteTodo(todo.id)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  ) : null}
                </div>
              )
            })}

            {onAddTodo ? (
              <div className="flex items-center gap-2 pt-1">
                <Input
                  value={newTodoText}
                  onChange={(e) => setNewTodoText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault()
                      handleAddTodo()
                    }
                  }}
                  placeholder={t("clinicalRequirements.addPlaceholder")}
                  className="h-8 flex-1 border-amber-300 bg-white/90 text-sm placeholder:text-amber-500/70 focus-visible:ring-amber-500 dark:border-amber-700 dark:bg-amber-950/50"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="h-8 shrink-0 border-amber-400 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-600 dark:bg-amber-900/50 dark:text-amber-200 dark:hover:bg-amber-800/50"
                  onClick={handleAddTodo}
                  disabled={!newTodoText.trim()}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {(completedItems.length > 0 || completedTodos.length > 0) ? (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-50 p-3 dark:border-emerald-500/30 dark:bg-emerald-950/30">
          <div className="mb-2 flex items-center gap-2">
            <ClipboardCheck className="size-4 text-emerald-600 dark:text-emerald-400" />
            <h4 className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">
              {t("clinicalRequirements.completed")}
            </h4>
          </div>
          <div className="space-y-1.5">
            {completedItems.map((req) => {
              const isLoading = loading === req.item

              return (
                <div
                  key={req.item}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border border-emerald-200/60 bg-white/80 px-2.5 py-2 text-sm transition-colors dark:border-emerald-800/40 dark:bg-emerald-950/30",
                    isLoading && "pointer-events-none opacity-70"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-emerald-600" />
                  ) : (
                    <span className="flex size-4 shrink-0 items-center justify-center rounded border border-emerald-500 bg-emerald-500 text-white">
                      <Check className="size-3" />
                    </span>
                  )}
                  <span className="flex-1 text-emerald-800 line-through decoration-emerald-400/60 dark:text-emerald-200">
                    {req.item}
                  </span>
                  <span className="shrink-0 text-xs text-emerald-600 dark:text-emerald-400">
                    {formatCompletionDate(req.completedAt)}
                  </span>
                </div>
              )
            })}

            {completedTodos.map((todo) => {
              const isLoading = loading === todo.id

              return (
                <div
                  key={todo.id}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg border border-emerald-200/60 bg-white/80 px-2.5 py-2 text-sm transition-colors dark:border-emerald-800/40 dark:bg-emerald-950/30",
                    isLoading && "pointer-events-none opacity-70"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="size-4 shrink-0 animate-spin text-emerald-600" />
                  ) : (
                    <span className="flex size-4 shrink-0 items-center justify-center rounded border border-emerald-500 bg-emerald-500 text-white">
                      <Check className="size-3" />
                    </span>
                  )}
                  <span className="flex-1 text-emerald-800 line-through decoration-emerald-400/60 dark:text-emerald-200">
                    {todo.text}
                  </span>
                  <span className="shrink-0 text-xs text-emerald-600 dark:text-emerald-400">
                    {todo.completedAt ? formatCompletionDate(todo.completedAt) : ""}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}
