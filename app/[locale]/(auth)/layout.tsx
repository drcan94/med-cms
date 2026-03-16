import { getTranslations } from "next-intl/server"

import { ThemeToggle } from "@/components/molecules/theme-toggle"
import { Link } from "@/i18n/navigation"

type AuthLayoutProps = {
  children: React.ReactNode
}

export default async function AuthLayout({
  children,
}: Readonly<AuthLayoutProps>) {
  const t = await getTranslations("AuthLayout")

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-muted/30 px-4 py-10">
      <div className="absolute top-4 left-4">
        <Link href="/" className="text-sm font-semibold tracking-tight">
          {t("brand")}
        </Link>
      </div>
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md">{children}</div>
    </div>
  )
}
