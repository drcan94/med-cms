"use client"

import type { ReactNode } from "react"
import { useAuth } from "@clerk/nextjs"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL

if (!convexUrl) {
  throw new Error("NEXT_PUBLIC_CONVEX_URL is required to use Convex.")
}

const convex = new ConvexReactClient(convexUrl)

type ConvexClientProviderProps = {
  children: ReactNode
}

export function ConvexClientProvider({
  children,
}: Readonly<ConvexClientProviderProps>) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}
