import { ArrowRight, Crown } from "lucide-react"
import { useTranslations } from "next-intl"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Link } from "@/i18n/navigation"
import { getSubscriptionStatusKey } from "@/lib/commercial"

type UpgradeBannerProps = {
  patientCount: number
  patientLimit: number
  subscriptionStatus: string
}

export function UpgradeBanner({
  patientCount,
  patientLimit,
  subscriptionStatus,
}: Readonly<UpgradeBannerProps>) {
  const t = useTranslations("UpgradeBanner")

  return (
    <section className="border-b border-amber-200 bg-amber-50/90 px-4 py-4 text-amber-950 print:hidden sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1 bg-amber-200 text-amber-950">
              <Crown className="size-3" />
              {t("badges.upgradeRequired")}
            </Badge>
            <Badge variant="outline" className="border-amber-300 bg-transparent">
              {t("badges.patientUsage", { patientCount, patientLimit })}
            </Badge>
            <Badge variant="outline" className="border-amber-300 bg-transparent">
              {t(`statuses.${getSubscriptionStatusKey(subscriptionStatus)}`)}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">{t("title")}</p>
            <p className="text-sm leading-6 text-amber-900/80">
              {t("description")}
            </p>
          </div>
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/settings/billing">
            {t("cta")}
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
