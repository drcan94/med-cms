import Iyzipay from "iyzipay"

const IYZICO_SANDBOX_URL = "https://sandbox-api.iyzipay.com"
const WARDOS_PREMIUM_PRICE = "1499.00"

function requireText(
  value: string | null | undefined,
  fieldName: string
): string {
  const normalizedValue = value?.trim()

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`)
  }

  return normalizedValue
}

function createIyzipayClient(): Iyzipay {
  return new Iyzipay({
    apiKey: requireText(process.env.IYZICO_API_KEY, "IYZICO_API_KEY"),
    secretKey: requireText(process.env.IYZICO_SECRET_KEY, "IYZICO_SECRET_KEY"),
    uri: process.env.IYZICO_BASE_URL?.trim() || IYZICO_SANDBOX_URL,
  })
}

type HostedCheckoutRequest = Omit<
  Iyzipay.ThreeDSInitializePaymentRequestData,
  "paymentCard"
>

export async function initializePremiumCheckout(args: {
  buyerIp: string
  callbackUrl: string
  organizationId: string
}): Promise<Iyzipay.CheckoutFormInitialResult> {
  const client = createIyzipayClient()
  const request: HostedCheckoutRequest = {
    basketId: args.organizationId,
    basketItems: [
      {
        category1: "SaaS",
        category2: "Premium",
        id: "wardos-premium-plan",
        itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
        name: "WardOS Premium",
        price: WARDOS_PREMIUM_PRICE,
      },
    ],
    billingAddress: {
      address: "Mock clinic billing address",
      city: "Istanbul",
      contactName: "WardOS Billing Contact",
      country: "Turkey",
      zipCode: "34000",
    },
    buyer: {
      city: "Istanbul",
      country: "Turkey",
      email: "billing@wardos.dev",
      gsmNumber: "+905555555555",
      id: args.organizationId,
      identityNumber: "11111111111",
      ip: requireText(args.buyerIp, "Buyer IP"),
      name: "WardOS",
      registrationAddress: "Mock clinic billing address",
      surname: "Clinic",
      zipCode: "34000",
    },
    callbackUrl: requireText(args.callbackUrl, "Callback URL"),
    conversationId: args.organizationId,
    currency: Iyzipay.CURRENCY.TRY,
    installments: 1,
    locale: Iyzipay.LOCALE.EN,
    paidPrice: WARDOS_PREMIUM_PRICE,
    paymentChannel: Iyzipay.PAYMENT_CHANNEL.WEB,
    paymentGroup: Iyzipay.PAYMENT_GROUP.SUBSCRIPTION,
    price: WARDOS_PREMIUM_PRICE,
    shippingAddress: {
      address: "Mock clinic billing address",
      city: "Istanbul",
      contactName: "WardOS Billing Contact",
      country: "Turkey",
      zipCode: "34000",
    },
  }

  return new Promise((resolve, reject) => {
    client.checkoutFormInitialize.create(
      request as Iyzipay.ThreeDSInitializePaymentRequestData,
      (error, result) => {
      if (error) {
        reject(error)
        return
      }

      resolve(result)
      }
    )
  })
}

export async function verifyPremiumCheckout(args: {
  conversationId?: string | null
  organizationId?: string | null
  token: string
}): Promise<{
  organizationId: string | null
  result: Iyzipay.CheckoutFormRetrieveResult
  success: boolean
}> {
  const client = createIyzipayClient()
  const request: Iyzipay.CheckoutFormRetrieveRequestData = {
    locale: Iyzipay.LOCALE.EN,
    token: requireText(args.token, "Iyzico token"),
    ...(args.conversationId?.trim()
      ? { conversationId: args.conversationId.trim() }
      : {}),
  }

  const result = await new Promise<Iyzipay.CheckoutFormRetrieveResult>(
    (resolve, reject) => {
      client.checkoutForm.retrieve(request, (error, retrievalResult) => {
        if (error) {
          reject(error)
          return
        }

        resolve(retrievalResult)
      })
    }
  )
  const organizationId =
    args.organizationId?.trim() ||
    result.basketId?.trim() ||
    result.conversationId?.trim() ||
    null

  return {
    organizationId,
    result,
    success:
      result.status.toLowerCase() === "success" &&
      result.paymentStatus.toLowerCase() === "success",
  }
}
