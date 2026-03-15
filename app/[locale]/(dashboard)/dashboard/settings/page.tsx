import { redirect } from "next/navigation"

import { getAuthPathnames } from "@/lib/auth-paths"

type LocalizedDashboardSettingsPageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function LocalizedDashboardSettingsPage({
  params,
}: Readonly<LocalizedDashboardSettingsPageProps>) {
  const { locale } = await params

  redirect(getAuthPathnames(locale).settings)
}
