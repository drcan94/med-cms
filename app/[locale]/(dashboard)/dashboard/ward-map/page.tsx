import { redirect } from "next/navigation"

import { getAuthPathnames } from "@/lib/auth-paths"

type LocalizedDashboardWardMapPageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function LocalizedDashboardWardMapPage({
  params,
}: Readonly<LocalizedDashboardWardMapPageProps>) {
  const { locale } = await params

  redirect(getAuthPathnames(locale).wardMap)
}
