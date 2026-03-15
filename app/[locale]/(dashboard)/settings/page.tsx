import { LocalSyncModal } from "@/components/organisms/local-sync-modal"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export default function GeneralSettingsPage() {
  return (
    <div className="grid min-w-0 gap-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">General</Badge>
            <Badge variant="secondary">Clinic admin workspace</Badge>
          </div>
          <CardTitle>Clinical operations setup</CardTitle>
          <CardDescription className="wrap-break-word text-wrap">
            Manage tenant-level conventions, ward planning, and privacy-aware
            workstation tools from one settings surface.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-6 text-muted-foreground">
          <p className="wrap-break-word text-wrap">
            Use the secondary navigation to define clinical conventions and
            build the room layout used by the interactive ward map.
          </p>
          <div className="rounded-xl border border-dashed px-4 py-3 wrap-break-word text-wrap">
            Phase 5.2 extends the shared clinic settings document with a live
            ward layout editor that feeds the drag-and-drop patient board.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Local roster sync</CardTitle>
          <CardDescription className="wrap-break-word text-wrap">
            Upload the hospital roster on each device to enable bedside
            full-name lookup without sending PII to the server.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex min-w-0 flex-col gap-4 text-sm leading-6 text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl wrap-break-word text-wrap">
            This privacy engine stores imported `bedId` mappings and manual
            patient-name lookups only in LocalStorage. Convex stays completely
            unaware of patient full names.
          </p>
          <LocalSyncModal />
        </CardContent>
      </Card>
    </div>
  )
}
