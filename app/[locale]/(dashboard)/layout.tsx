"use client"

import * as React from "react"

import { AuthSyncWrapper } from "@/components/organisms/auth-sync-wrapper"
import { Header } from "@/components/organisms/header"
import { Sidebar } from "@/components/organisms/sidebar"
import { UpgradeBanner } from "@/components/organisms/upgrade-banner"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { usePLGLimits } from "@/hooks/usePLGLimits"

type DashboardLayoutProps = {
  children: React.ReactNode
}

export default function DashboardLayout({
  children,
}: Readonly<DashboardLayoutProps>) {
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false)
  const { isLocked, patientCount, patientLimit, subscriptionStatus } = usePLGLimits()

  return (
    <AuthSyncWrapper>
      <div className="min-h-screen bg-muted/30 print:min-h-0 print:bg-white">
        <div className="grid min-h-screen w-full print:block print:min-h-0 md:grid-cols-[280px_minmax(0,1fr)]">
          <div className="hidden border-r bg-background print:hidden md:block">
            <Sidebar className="sticky top-0 h-screen" />
          </div>

          <div className="flex min-w-0 flex-col print:min-w-full">
            <Header onOpenSidebar={() => setMobileSidebarOpen(true)} />
            {isLocked ? (
              <UpgradeBanner
                patientCount={patientCount}
                patientLimit={patientLimit}
                subscriptionStatus={subscriptionStatus}
              />
            ) : null}
            <main className="flex-1 px-4 py-6 print:w-full print:max-w-none print:px-0 print:py-0 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </div>

        <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
          <SheetContent
            side="left"
            className="w-80 p-0 print:hidden"
            showCloseButton={false}
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Workspace navigation</SheetTitle>
              <SheetDescription>
                Navigate between core clinic modules.
              </SheetDescription>
            </SheetHeader>
            <Sidebar
              className="h-full"
              onNavigate={() => setMobileSidebarOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </AuthSyncWrapper>
  )
}
