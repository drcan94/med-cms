import { redirect } from "next/navigation"

import { getAuthPathnames } from "@/lib/auth-paths"

type LocalizedDashboardPageProps = {
  params: Promise<{
    locale: string
  }>
}

export default async function LocalizedDashboardPage({
  params,
}: Readonly<LocalizedDashboardPageProps>) {
  const { locale } = await params

  redirect(getAuthPathnames(locale).patients)
}
