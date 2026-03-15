import Link from "next/link"
import { ArrowRight, Crown } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { formatSubscriptionStatusLabel } from "@/lib/commercial"

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
  return (
    <section className="border-b border-amber-200 bg-amber-50/90 px-4 py-4 text-amber-950 print:hidden sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="gap-1 bg-amber-200 text-amber-950">
              <Crown className="size-3" />
              Upgrade required
            </Badge>
            <Badge variant="outline" className="border-amber-300 bg-transparent">
              {patientCount} / {patientLimit} patients
            </Badge>
            <Badge variant="outline" className="border-amber-300 bg-transparent">
              {formatSubscriptionStatusLabel(subscriptionStatus)}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold">
              You have reached the 50-patient free trial limit.
            </p>
            <p className="text-sm leading-6 text-amber-900/80">
              Upgrade to Premium to continue admitting patients and moving beds while
              keeping all current data available in read-only mode.
            </p>
          </div>
        </div>

        <Button asChild className="w-full sm:w-auto">
          <Link href="/settings/billing">
            Upgrade to Premium
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}
