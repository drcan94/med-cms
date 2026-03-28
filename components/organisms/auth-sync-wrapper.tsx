"use client"

import type { ReactNode } from "react"
import { useAuth } from "@clerk/nextjs"
import { useQuery } from "convex/react"
import { Loader2, ShieldCheck } from "lucide-react"
import { useTranslations } from "next-intl"

import { api } from "@/convex/_generated/api"

type AuthSyncWrapperProps = {
  children: ReactNode
}

export function AuthSyncWrapper({ children }: Readonly<AuthSyncWrapperProps>) {
  const t = useTranslations("AuthSyncWrapper")
  const { isLoaded: isClerkLoaded, isSignedIn, orgId } = useAuth()

  const syncStatus = useQuery(
    api.users.getAuthSyncStatus,
    isClerkLoaded && isSignedIn ? { organizationId: orgId ?? undefined } : "skip"
  )

  if (!isClerkLoaded) {
    return <SyncLoadingState message={t("loading")} />
  }

  if (!isSignedIn) {
    return <SyncLoadingState message={t("authenticating")} />
  }

  if (syncStatus === undefined) {
    return <SyncLoadingState message={t("connecting")} />
  }

  if (syncStatus.status === "unauthenticated") {
    return <SyncLoadingState message={t("authenticating")} />
  }

  if (syncStatus.status === "user_pending") {
    return <SyncLoadingState message={t("userSync")} />
  }

  if (syncStatus.status === "membership_pending") {
    return <SyncLoadingState message={t("membershipSync")} />
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
