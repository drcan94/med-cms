"use client"

import { type ReactNode, useEffect, useRef, useState } from "react"
import { useAuth, useClerk, useOrganization, useUser } from "@clerk/nextjs"
import { useMutation, useQuery } from "convex/react"
import { AlertTriangle, Loader2, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { api } from "@/convex/_generated/api"
import { Button } from "@/components/ui/button"

const SYNC_TIMEOUT_MS = 20_000

type AuthSyncWrapperProps = {
  children: ReactNode
}

export function AuthSyncWrapper({ children }: Readonly<AuthSyncWrapperProps>) {
  const t = useTranslations("AuthSyncWrapper")
  const { signOut } = useClerk()
  const { isLoaded: isClerkLoaded, isSignedIn, orgId, orgRole } = useAuth()
  const { organization } = useOrganization()
  const { user } = useUser()
  const [isTimedOut, setIsTimedOut] = useState(false)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const selfSyncAttemptRef = useRef<string | null>(null)
  const ensureAuthRecords = useMutation(api.users.ensureAuthRecords)

  const syncStatus = useQuery(
    api.users.getAuthSyncStatus,
    isClerkLoaded && isSignedIn ? { organizationId: orgId ?? undefined } : "skip"
  )

  const isPending =
    !isClerkLoaded ||
    !isSignedIn ||
    syncStatus === undefined ||
    syncStatus.status === "unauthenticated" ||
    syncStatus.status === "user_pending" ||
    syncStatus.status === "membership_pending"

  useEffect(() => {
    console.log("[AuthSync] Status:", {
      isClerkLoaded,
      isSignedIn,
      orgId,
      orgRole,
      syncStatus,
      isPending,
      isTimedOut,
    })
  }, [isClerkLoaded, isSignedIn, orgId, orgRole, syncStatus, isPending, isTimedOut])

  useEffect(() => {
    if (!isClerkLoaded || !isSignedIn || syncStatus === undefined) {
      return
    }

    if (syncStatus.status !== "user_pending" && syncStatus.status !== "membership_pending") {
      return
    }

    const attemptKey = `${syncStatus.status}:${orgId ?? "no_org"}`

    if (selfSyncAttemptRef.current === attemptKey) {
      return
    }

    selfSyncAttemptRef.current = attemptKey
    console.log("[AuthSync] Self-heal sync triggered", { attemptKey })

    void ensureAuthRecords({
      organizationId: orgId ?? undefined,
      organizationName: organization?.name ?? undefined,
      organizationRole: orgRole ?? undefined,
      email: user?.primaryEmailAddress?.emailAddress ?? undefined,
      firstName: user?.firstName ?? undefined,
      lastName: user?.lastName ?? undefined,
      imageUrl: user?.imageUrl ?? undefined,
    })
      .then((result) => {
        console.log("[AuthSync] Self-heal sync result", result)
        if (result.status !== "synced") {
          selfSyncAttemptRef.current = null
        }
      })
      .catch((error) => {
        console.error("[AuthSync] Self-heal sync failed:", error)
        selfSyncAttemptRef.current = null
      })
  }, [
    ensureAuthRecords,
    isClerkLoaded,
    isSignedIn,
    orgId,
    orgRole,
    organization?.name,
    syncStatus,
    user?.firstName,
    user?.lastName,
    user?.imageUrl,
    user?.primaryEmailAddress?.emailAddress,
  ])

  useEffect(() => {
    if (!isPending || isTimedOut) {
      return
    }

    timeoutRef.current = setTimeout(() => {
      console.warn("[AuthSync] Timeout reached after 20 seconds")
      setIsTimedOut(true)
    }, SYNC_TIMEOUT_MS)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = null
      }
    }
  }, [isPending, isTimedOut])

  const renderErrorState = () => (
    <SyncErrorState
      title={t("timeoutTitle")}
      message={t("timeoutMessage")}
      onRefresh={() => window.location.reload()}
      onSignOut={() => signOut()}
      refreshLabel={t("refresh")}
      signOutLabel={t("signOut")}
    />
  )

  if (!isClerkLoaded) {
    return isTimedOut ? renderErrorState() : <SyncLoadingState message={t("loading")} />
  }

  if (!isSignedIn) {
    return isTimedOut ? renderErrorState() : <SyncLoadingState message={t("authenticating")} />
  }

  if (syncStatus === undefined) {
    return isTimedOut ? renderErrorState() : <SyncLoadingState message={t("connecting")} />
  }

  if (syncStatus.status === "unauthenticated") {
    return isTimedOut ? renderErrorState() : <SyncLoadingState message={t("authenticating")} />
  }

  if (syncStatus.status === "user_pending") {
    return isTimedOut ? renderErrorState() : <SyncLoadingState message={t("userSync")} />
  }

  if (syncStatus.status === "membership_pending") {
    return isTimedOut ? renderErrorState() : <SyncLoadingState message={t("membershipSync")} />
  }

  return <>{children}</>
}

function SyncLoadingState({ message }: Readonly<{ message: string }>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="relative">
          <div className="flex size-16 items-center justify-center rounded-full bg-primary/10">
            <ShieldCheck className="size-8 text-primary" />
          </div>
          <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-background shadow-sm ring-1 ring-border">
            <Loader2 className="size-4 animate-spin text-muted-foreground" />
          </div>
        </div>

        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">WardOS</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="size-1.5 animate-pulse rounded-full bg-primary/60 [animation-delay:0ms]" />
          <span className="size-1.5 animate-pulse rounded-full bg-primary/60 [animation-delay:150ms]" />
          <span className="size-1.5 animate-pulse rounded-full bg-primary/60 [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

type SyncErrorStateProps = {
  title: string
  message: string
  onRefresh: () => void
  onSignOut: () => void
  refreshLabel: string
  signOutLabel: string
}

function SyncErrorState({
  title,
  message,
  onRefresh,
  onSignOut,
  refreshLabel,
  signOutLabel,
}: Readonly<SyncErrorStateProps>) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10">
          <AlertTriangle className="size-8 text-destructive" />
        </div>

        <div className="max-w-sm space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={onRefresh}>{refreshLabel}</Button>
          <Button variant="outline" onClick={onSignOut}>
            {signOutLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
