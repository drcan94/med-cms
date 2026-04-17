import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { enUS, trTR } from "@clerk/localizations"
import { Geist_Mono, Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

import { ConvexClientProvider } from "@/components/convex-client-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { TooltipProvider } from "@/components/ui/tooltip"
import { getAuthPathnames } from "@/lib/auth-paths"
import { cn } from "@/lib/utils"

import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
})

const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export const metadata: Metadata = {
  title: {
    default: "Med CMS",
    template: "%s | Med CMS",
  },
  description: "Multi-tenant clinical management SaaS foundation.",
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()])
  const authPathnames = getAuthPathnames(locale)
  const clerkLocalization = locale === "tr" ? trTR : enUS

  return (
    <ClerkProvider
      localization={clerkLocalization}
      afterSignOutUrl={authPathnames.signIn}
      signInFallbackRedirectUrl={authPathnames.patients}
      signInUrl={authPathnames.signIn}
      signUpFallbackRedirectUrl={authPathnames.patients}
      signUpUrl={authPathnames.signUp}
    >
      <html lang={locale} suppressHydrationWarning>
        <body
          className={cn(
            inter.variable,
            geistMono.variable,
            "min-h-screen bg-background font-sans text-foreground antialiased"
          )}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <NextIntlClientProvider locale={locale} messages={messages}>
              <TooltipProvider>
                <ConvexClientProvider>{children}</ConvexClientProvider>
              </TooltipProvider>
            </NextIntlClientProvider>
            <Toaster closeButton position="top-right" richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
