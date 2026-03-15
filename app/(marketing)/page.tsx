import type { Metadata } from "next"
import Link from "next/link"
import {
  ArrowRight,
  FileText,
  LayoutGrid,
  ShieldCheck,
  Stethoscope,
} from "lucide-react"

import { ThemeToggle } from "@/components/molecules/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export const metadata: Metadata = {
  title: "WardOS | Mobile Surgical Rounds & Visit Sheets",
  description:
    "WardOS helps surgical teams run mobile clinical rounds, real-time ward maps, and one-click visit-sheet printing without sending full patient names to the server.",
}

const FEATURE_CARDS = [
  {
    description:
      "Move patients across configured beds in real time with a tenant-aware ward board that stays aligned to each clinic's own room layout.",
    icon: LayoutGrid,
    title: "Real-time Ward Map",
  },
  {
    description:
      "Switch from bedside mobile cards to a dense A4 rounding list instantly, so teams can print the visit sheet the moment they need paper backup.",
    icon: FileText,
    title: "One-click Visit Sheet",
  },
  {
    description:
      "WardOS keeps full names local to each workstation, which dramatically reduces backend liability while preserving clinical usability on the floor.",
    icon: ShieldCheck,
    title: "Zero-Liability Privacy",
  },
]

const COMMERCIAL_POINTS = [
  "Launch a clinic in minutes with a product-led free tier.",
  "Upgrade only when the active patient census outgrows the free limit.",
  "Keep the same privacy model, visit-sheet flow, and ward map after conversion.",
]

export default function MarketingPage() {
  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 py-6">
        <div className="flex justify-end">
          <ThemeToggle />
        </div>

        <section className="grid gap-10 py-14 lg:grid-cols-[minmax(0,1fr)_430px] lg:items-center">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">WardOS</Badge>
              <Badge variant="secondary">PLG-ready clinical SaaS</Badge>
            </div>
            <div className="space-y-4">
              <h1 className="max-w-4xl text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                Mobile clinical rounds, real-time ward maps, and printable visit
                sheets in one privacy-safe workspace.
              </h1>
              <p className="max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">
                WardOS gives surgical teams a bedside-first operating system for
                patient tracking. Run rounds on mobile, print a dense A4 visit
                sheet in one click, and keep full patient names off the server by
                design.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Start free
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            </div>
          </div>

          <Card className="border-border/60 bg-background/95">
            <CardHeader>
              <div className="flex items-center gap-2 text-primary">
                <Stethoscope className="size-4" />
                <span className="text-sm font-medium">Why clinics adopt WardOS</span>
              </div>
              <CardTitle>Built for rounds, not generic spreadsheets</CardTitle>
              <CardDescription>
                WardOS combines bedside readability, print readiness, and
                commercial self-serve onboarding for modern surgical teams.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {COMMERCIAL_POINTS.map((point) => (
                <div key={point} className="rounded-xl border bg-muted/40 px-4 py-3">
                  <p className="text-sm leading-6 text-muted-foreground">{point}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 pb-16 md:grid-cols-3">
          {FEATURE_CARDS.map(({ description, icon: Icon, title }) => (
            <Card key={title} className="border-border/60 bg-background/95">
              <CardHeader>
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="size-5" />
                </div>
                <CardTitle>{title}</CardTitle>
                <CardDescription>{description}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </section>

        <section className="rounded-3xl border bg-background px-6 py-10 text-center shadow-xs sm:px-10">
          <div className="mx-auto max-w-3xl space-y-4">
            <Badge variant="outline">Start your clinic workspace</Badge>
            <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
              Launch WardOS for your surgical service today.
            </h2>
            <p className="text-base leading-7 text-muted-foreground">
              Start on the free tier, prove workflow value during rounds, then
              upgrade to Premium only when patient volume requires it.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link href="/sign-up">
                  Create clinic account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/sign-in">Sign in to existing clinic</Link>
              </Button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
