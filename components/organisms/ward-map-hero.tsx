import { LayoutGrid } from "lucide-react"

import { Badge } from "@/components/ui/badge"

type WardMapHeroProps = {
  patientCount: number
  roomCount: number
  totalBeds: number
}

export function WardMapHero({
  patientCount,
  roomCount,
  totalBeds,
}: Readonly<WardMapHeroProps>) {
  return (
    <section className="grid gap-4 rounded-2xl border bg-background p-6 shadow-xs lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline">Phase 5.2</Badge>
          <Badge variant="secondary" className="gap-1">
            <LayoutGrid className="size-3" />
            Interactive Ward Map
          </Badge>
        </div>
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Ward layout board</h1>
          <p className="max-w-3xl text-sm leading-6 text-muted-foreground">
            Drag patient cards into empty beds for immediate local feedback while
            the updated placement is saved back to Convex in the background.
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Rooms</p>
          <p className="mt-2 text-2xl font-semibold">{roomCount}</p>
        </div>
        <div className="rounded-xl border px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Beds</p>
          <p className="mt-2 text-2xl font-semibold">{totalBeds}</p>
        </div>
        <div className="rounded-xl border px-4 py-3">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">
            Patients
          </p>
          <p className="mt-2 text-2xl font-semibold">{patientCount}</p>
        </div>
      </div>
    </section>
  )
}
