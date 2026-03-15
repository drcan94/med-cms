"use client"

import { useEffect, useRef, useState } from "react"
import { useSearchParams } from "next/navigation"
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
      toast.success("WardOS Premium has been activated for this clinic.")
      return
    }

    toast.error("Iyzico payment verification did not complete successfully.")
  }, [searchParams])

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
        throw new Error(data.error || "Unable to initialize the Iyzico checkout.")
      }

      if (data.redirectUrl) {
        window.location.assign(data.redirectUrl)
        return
      }

      if (!data.checkoutFormContent) {
        throw new Error("No Iyzico checkout content was returned.")
      }

      setCheckoutFormContent(data.checkoutFormContent)
      toast.success("Iyzico checkout initialized. Complete the payment below.")
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Unable to initialize the Iyzico checkout."
      )
    } finally {
      setIsStartingCheckout(false)
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Upgrade to Premium</CardTitle>
          <CardDescription>
            Start the Iyzico checkout flow for this clinic organization and unlock
            Premium immediately after successful payment verification.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-sm leading-6 text-muted-foreground">
            Premium removes the 50-patient PLG cap while keeping the existing
            tenant-aware and privacy-preserving architecture unchanged.
          </p>
          <Button
            type="button"
            disabled={isPremium || isStartingCheckout}
            onClick={() => {
              void handleUpgradeToPremium()
            }}
          >
            {isPremium
              ? "Premium is active"
              : isStartingCheckout
                ? "Starting checkout..."
                : "Upgrade to Premium via Iyzico"}
          </Button>
        </CardContent>
      </Card>

      {checkoutFormContent ? (
        <Card>
          <CardHeader>
            <CardTitle>Iyzico checkout</CardTitle>
            <CardDescription>
              Complete the secure payment form below. You will return to Billing
              automatically after Iyzico posts the callback.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <IyzicoCheckoutEmbed checkoutFormContent={checkoutFormContent} />
          </CardContent>
        </Card>
      ) : null}
    </>
  )
}
