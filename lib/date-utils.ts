export function formatDisplayDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  })
}

export function formatCompletionDate(isoString: string): string {
  const date = new Date(isoString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays === 0) {
    return date.toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  if (diffDays === 1) {
    return "Yesterday"
  }

  if (diffDays < 7) {
    return `${diffDays}d ago`
  }

  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  })
}
