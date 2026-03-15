import type { Metadata } from "next"
import { ClerkProvider } from "@clerk/nextjs"
import { Geist_Mono, Inter } from "next/font/google"
import { NextIntlClientProvider } from "next-intl"
import { getLocale, getMessages } from "next-intl/server"

import { ConvexClientProvider } from "@/components/convex-client-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
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

  return (
    <ClerkProvider>
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
            <NextIntlClientProvider messages={messages}>
              <ConvexClientProvider>{children}</ConvexClientProvider>
            </NextIntlClientProvider>
            <Toaster closeButton position="top-right" richColors />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  )
}
