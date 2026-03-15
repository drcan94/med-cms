import { defineRouting } from "next-intl/routing"

export const routing = defineRouting({
  defaultLocale: "en",
  locales: ["en", "tr"],
  localePrefix: "always",
})

export type AppLocale = (typeof routing.locales)[number]
