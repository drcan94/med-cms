"use client"

import { useEffect } from "react"
import { OrganizationList, useAuth } from "@clerk/nextjs"
import { Building2, Loader2 } from "lucide-react"
import { useTranslations } from "next-intl"
import { useRouter, useSearchParams } from "next/navigation"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { getAuthPathnames } from "@/lib/auth-paths"

export default function OrganizationSelectionPage() {
  const t = useTranslations("OrganizationSelectionPage")
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isLoaded, orgId } = useAuth()

  const redirectUrl = searchParams.get("redirect_url")
  const defaultRedirect = getAuthPathnames().patients

  useEffect(() => {
    if (isLoaded && orgId) {
      router.push(redirectUrl ?? defaultRedirect)
    }
  }, [isLoaded, orgId, redirectUrl, defaultRedirect, router])

  if (!isLoaded) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (orgId) {
    return (
      <Card className="border-none shadow-lg">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            {t("redirecting")}
          </span>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-none shadow-lg">
      <CardHeader className="space-y-4 text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="size-6 text-primary" />
        </div>
        <div className="space-y-2">
          <CardTitle className="text-2xl font-semibold tracking-tight">
            {t("title")}
          </CardTitle>
          <CardDescription className="text-sm leading-relaxed">
            {t("description")}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <OrganizationList
          afterCreateOrganizationUrl={redirectUrl ?? defaultRedirect}
          afterSelectOrganizationUrl={redirectUrl ?? defaultRedirect}
          hidePersonal
        />
      </CardContent>
    </Card>
  )
}
