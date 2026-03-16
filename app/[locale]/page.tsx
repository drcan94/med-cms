import type { Metadata } from "next"
import { getTranslations } from "next-intl/server"
import { ArrowRight, FileText, LayoutGrid, ShieldCheck, Stethoscope } from "lucide-react"

import { ThemeToggle } from "@/components/molecules/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Link } from "@/i18n/navigation"
import type { AppLocale } from "@/i18n/routing"

const FEATURE_CARD_SPECS = [
  { icon: LayoutGrid, translationKey: "wardMap" },
  { icon: FileText, translationKey: "visitSheet" },
  { icon: ShieldCheck, translationKey: "privacy" },
] as const
const COMMERCIAL_POINT_KEYS = ["launchFast", "upgradeWhenReady", "keepModel"] as const

type MarketingPageProps = {
  params: Promise<{
    locale: AppLocale
  }>
}

export async function generateMetadata({
  params,
}: Readonly<MarketingPageProps>): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale, namespace: "MarketingPage.metadata" })

  return {
    title: t("title"),
    description: t("description"),
  }
}

export default async function MarketingPage() {
  const t = await getTranslations("MarketingPage")

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <section className="grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{t("brandBadge")}</Badge>
              <Badge variant="secondary">{t("readinessBadge")}</Badge>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                {t("hero.description")}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  {t("hero.actions.startFree")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sign-in">{t("hero.actions.signIn")}</Link>
              </Button>
            </div>
          </div>

          <Card className="border-border/60 bg-background/95">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Stethoscope className="size-4" />
                <span className="text-sm font-medium">{t("adoption.eyebrow")}</span>
              </div>
              <CardTitle>{t("adoption.title")}</CardTitle>
              <CardDescription>{t("adoption.description")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {COMMERCIAL_POINT_KEYS.map((key) => (
                <div key={key} className="rounded-xl border bg-muted/40 px-4 py-3">
                  <p className="text-sm leading-6 text-muted-foreground">
                    {t(`adoption.points.${key}`)}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 pb-16 md:grid-cols-3">
          {FEATURE_CARD_SPECS.map(({ icon: Icon, translationKey }) => (
            <Card key={translationKey} className="border-border/60 bg-background/95">
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{t(`features.${translationKey}.title`)}</CardTitle>
                <CardDescription>{t(`features.${translationKey}.description`)}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl border bg-background px-6 py-10 text-center shadow-xs sm:px-10">
          <div className="mx-auto max-w-3xl space-y-4">
            <Badge variant="outline">{t("cta.badge")}</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              {t("cta.title")}
            </h2>
            <p className="text-base leading-7 text-muted-foreground">{t("cta.description")}</p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  {t("cta.actions.createAccount")}
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sign-in">{t("cta.actions.signInExisting")}</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
