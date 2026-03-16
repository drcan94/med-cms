"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
import { useTranslations } from "next-intl"
import { toast } from "sonner"

import { IyzicoCheckoutEmbed } from "@/components/organisms/iyzico-checkout-embed"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

type BillingUpgradeCardProps = {
  isPremium: boolean
  organizationId: string
}

type CheckoutResponse = {
  checkoutFormContent?: string
  error?: string
  redirectUrl?: string
}

export function BillingUpgradeCard({
  isPremium,
  organizationId,
}: Readonly<BillingUpgradeCardProps>) {
  const t = useTranslations("BillingUpgradeCard")
  const searchParams = useSearchParams()
  const [checkoutFormContent, setCheckoutFormContent] = useState<string | null>(null)
  const [isStartingCheckout, setIsStartingCheckout] = useState(false)
  const lastPaymentStatusRef = useRef<string | null>(null)

  useEffect(() => {
    const paymentStatus = searchParams.get("success")

    if (!paymentStatus || lastPaymentStatusRef.current === paymentStatus) {
      return
    }

    lastPaymentStatusRef.current = paymentStatus

    if (paymentStatus === "true") {
      toast.success(t("toasts.activated"))
      return
    }

    toast.error(t("toasts.verificationError"))
  }, [searchParams, t])

  const handleUpgradeToPremium = async (): Promise<void> => {
    setIsStartingCheckout(true)
    setCheckoutFormContent(null)

    try {
      const response = await fetch("/api/iyzico/checkout", {
        body: JSON.stringify({ organizationId }),
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      })
      const data = (await response.json()) as CheckoutResponse

      if (!response.ok) {
        throw new Error(data.error || t("toasts.initializeError"))
      }

      if (data.redirectUrl) {
        window.location.assign(data.redirectUrl)
        return
      }

      if (!data.checkoutFormContent) {
        throw new Error(t("toasts.missingCheckoutContent"))
      }

      setCheckoutFormContent(data.checkoutFormContent)
      toast.success(t("toasts.initialized"))
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("toasts.initializeError")
      )
    } finally {
      setIsStartingCheckout(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("title")}</CardTitle>
          <CardDescription>{t("description")}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            {t("body")}
          </p>
          <Button
            type="button"
            disabled={isPremium || isStartingCheckout}
            onClick={() => {
              void handleUpgradeToPremium()
            }}
          >
            {isPremium
              ? t("actions.active")
              : isStartingCheckout
                ? t("actions.starting")
                : t("actions.start")}
          </Button>
        </CardContent>
      </Card>

      {checkoutFormContent ? (
        <Card>
          <CardHeader>
            <CardTitle>{t("checkout.title")}</CardTitle>
            <CardDescription>{t("checkout.description")}</CardDescription>
          </CardHeader>
          <CardContent>
            <IyzicoCheckoutEmbed checkoutFormContent={checkoutFormContent} />
          </CardContent>
        </Card>
      ) : null}
    </>
  )
}
