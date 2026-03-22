"use client"

import { useMemo } from "react"
import { useQuery } from "convex/react"
import {
  Activity,
  AlertCircle,
  Beaker,
  Calendar,
  ClipboardList,
  Droplets,
  FileText,
  Hash,
  HeartPulse,
  MapPin,
  MessageSquare,
  Pencil,
  Pill,
  Stethoscope,
  Syringe,
  Thermometer,
  User,
  X,
} from "lucide-react"
import { useTranslations } from "next-intl"

import { api } from "@/convex/_generated/api"
import type { Doc } from "@/convex/_generated/dataModel"
import { calculateClinicalDays } from "@/hooks/useClinicalDates"
import { useLocalRoster } from "@/hooks/useLocalRoster"
import { parseConventionRules } from "@/lib/clinic-settings"
import { defaultClinicalRules, evaluateClinicalRules } from "@/lib/clinical-rules"
import { formatDisplayDate } from "@/lib/date-utils"
import { STAGING_BED_ID } from "@/lib/patient-privacy"
import { evaluatePatientRules } from "@/lib/rule-engine"
import { ClinicalAlertsPanel } from "@/components/molecules/clinical-alerts-panel"
import { PatientClinicalRequirementsAlert } from "@/components/molecules/patient-clinical-requirements-alert"
import { VisitTodoList } from "@/components/molecules/visit-todo-list"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

type PatientRecord = Doc<"patients">
type Vitals = NonNullable<PatientRecord["vitals"]>
type Anamnesis = NonNullable<PatientRecord["anamnesis"]>
type ThoracicIntervention = NonNullable<PatientRecord["thoracicInterventions"]>[number]
type Antibiotic = NonNullable<PatientRecord["antibiotics"]>[number]
type LabCulture = NonNullable<PatientRecord["labCultures"]>[number]
type Consultation = NonNullable<PatientRecord["consultations"]>[number]
type CriticalMedications = NonNullable<PatientRecord["criticalMedications"]>

type PatientDialogViewProps = {
  onClose: () => void
  onEdit: () => void
  open: boolean
  organizationId?: string | null
  patient: PatientRecord | null
}

type InfoRowProps = {
  icon: React.ReactNode
  label: string
  value: React.ReactNode
}

function InfoRow({ icon, label, value }: Readonly<InfoRowProps>) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-wrap wrap-break-word">{value || "—"}</p>
      </div>
    </div>
  )
}

function calculateDaysSince(isoDateString: string): number {
  const date = new Date(isoDateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  return Math.floor(diffMs / (1000 * 60 * 60 * 24))
}

const SYMPTOM_LABELS: Record<string, string> = {
  fever: "Ateş",
  weightLoss: "Kilo Kaybı",
  nightSweats: "Gece Terlemesi",
  fatigue: "Halsizlik",
  cough: "Öksürük",
  sputum: "Balgam",
  hemoptysis: "Hemoptizi",
  dyspneaExertion: "Eforla Nefes Darlığı",
  dyspneaRest: "İstirahatte Nefes Darlığı",
  orthopnea: "Ortopne",
  wheezing: "Hırıltı",
  chestPain: "Göğüs Ağrısı",
  palpitation: "Çarpıntı",
  syncope: "Senkop",
  legEdema: "Bacak Ödemi",
  dysphagia: "Yutma Güçlüğü",
  pyrosis: "Pirozis",
  nauseaVomiting: "Bulantı/Kusma",
  abdominalPain: "Karın Ağrısı",
  constipationDiarrhea: "Kabızlık/İshal",
  hematuria: "Hematüri",
  dysuria: "Dizüri",
  frequentUrination: "Sık İdrara Çıkma",
  hoarseness: "Ses Kısıklığı",
  jointPain: "Eklem Ağrısı",
  alteredConsciousness: "Bilinç Değişikliği",
}

function VitalsCard({ vitals }: Readonly<{ vitals: Vitals }>) {
  const tempIsHigh = vitals.temperature >= 38
  const spO2IsLow = vitals.spO2 < 92
  const pulseIsHigh = vitals.pulse > 100

  const activeSymptoms = vitals.symptoms
    ? Object.entries(vitals.symptoms)
        .filter(([, value]) => value === true)
        .map(([key]) => ({ key, label: SYMPTOM_LABELS[key] || key }))
    : []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Activity className="size-4 text-blue-500" />
          Vitals & Symptoms
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Thermometer className="size-3" />
              Temp
            </div>
            <p className={`text-lg font-semibold ${tempIsHigh ? "text-red-500" : ""}`}>
              {vitals.temperature}°C
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <HeartPulse className="size-3" />
              BP
            </div>
            <p className="text-lg font-semibold">{vitals.bloodPressure || "—"}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Activity className="size-3" />
              Pulse
            </div>
            <p className={`text-lg font-semibold ${pulseIsHigh ? "text-orange-500" : ""}`}>
              {vitals.pulse}/dk
            </p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Droplets className="size-3" />
              SpO2
            </div>
            <p className={`text-lg font-semibold ${spO2IsLow ? "text-red-500" : ""}`}>
              {vitals.spO2}%
            </p>
          </div>
        </div>

        {activeSymptoms.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Sistem Sorgulaması</p>
            <div className="flex flex-wrap gap-1.5">
              {activeSymptoms.map(({ key, label }) => (
                <Badge key={key} variant="outline" className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-muted-foreground">
          Recorded: {formatDisplayDate(vitals.recordedAt)}
        </p>
      </CardContent>
    </Card>
  )
}

function AnamnesisCard({ anamnesis }: Readonly<{ anamnesis: Anamnesis }>) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <FileText className="size-4 text-purple-500" />
          Anamnesis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {anamnesis.chiefComplaint && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">Chief Complaint</p>
            <p className="text-sm">{anamnesis.chiefComplaint}</p>
          </div>
        )}

        {anamnesis.historyOfPresentIllness && (
          <div>
            <p className="text-xs font-medium text-muted-foreground">History of Present Illness</p>
            <p className="whitespace-pre-wrap text-sm">{anamnesis.historyOfPresentIllness}</p>
          </div>
        )}

        {anamnesis.knownDiseases.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Known Diseases</p>
            <div className="flex flex-wrap gap-1.5">
              {anamnesis.knownDiseases.map((disease) => (
                <Badge key={disease} variant="secondary" className="text-xs">
                  {disease}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {anamnesis.pastSurgeries.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Past Surgeries</p>
            <div className="flex flex-wrap gap-1.5">
              {anamnesis.pastSurgeries.map((surgery) => (
                <Badge key={surgery} variant="outline" className="text-xs">
                  {surgery}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {anamnesis.allergies.length > 0 && (
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">Allergies</p>
            <div className="flex flex-wrap gap-1.5">
              {anamnesis.allergies.map((allergy) => (
                <Badge key={allergy} variant="destructive" className="text-xs">
                  <AlertCircle className="mr-1 size-3" />
                  {allergy}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ThoracicInterventionsCard({
  interventions,
}: Readonly<{ interventions: ThoracicIntervention[] }>) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Syringe className="size-4 text-emerald-500" />
          Tubes & Drains
          <Badge variant="secondary" className="ml-auto">
            {interventions.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {interventions.map((intervention) => {
          const daysSinceInsertion = calculateDaysSince(intervention.insertionDate)
          const isActive = !intervention.removalDate
          const latestDrainage =
            intervention.dailyDrainage.length > 0
              ? intervention.dailyDrainage[intervention.dailyDrainage.length - 1]
              : null

          return (
            <div
              key={intervention.id}
              className={`rounded-lg border p-3 ${isActive ? "border-emerald-200 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/20" : "bg-muted/30"}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Syringe
                    className={`size-4 ${isActive ? "text-emerald-600" : "text-muted-foreground"}`}
                  />
                  <span className="font-medium capitalize">
                    {intervention.type.replace("_", " ")}
                  </span>
                  <Badge variant={isActive ? "default" : "secondary"} className="text-xs">
                    {intervention.side}
                  </Badge>
                </div>
                <Badge variant="outline" className="text-xs">
                  {intervention.size}
                </Badge>
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                <span>
                  Inserted: {formatDisplayDate(intervention.insertionDate)}
                  {isActive && (
                    <span className="ml-1 font-medium text-foreground">
                      (Day {daysSinceInsertion + 1})
                    </span>
                  )}
                </span>
                {intervention.removalDate && (
                  <span>Removed: {formatDisplayDate(intervention.removalDate)}</span>
                )}
              </div>

              {intervention.indication && (
                <p className="mt-1.5 text-xs text-muted-foreground">
                  <span className="font-medium">Indication:</span> {intervention.indication}
                </p>
              )}

              <div className="mt-2 flex flex-wrap gap-1.5">
                {intervention.usedUltrasound && (
                  <Badge variant="outline" className="text-xs">
                    USG-guided
                  </Badge>
                )}
                {intervention.cytologySent && (
                  <Badge variant="outline" className="text-xs">
                    Cytology sent
                  </Badge>
                )}
                {intervention.pleurodesis?.performed && (
                  <Badge variant="secondary" className="text-xs">
                    Pleurodesis
                  </Badge>
                )}
                {intervention.complication?.occurred && (
                  <Badge variant="destructive" className="text-xs">
                    Complication
                  </Badge>
                )}
              </div>

              {latestDrainage && isActive && (
                <div className="mt-2 flex items-center gap-1.5 rounded bg-muted/50 px-2 py-1 text-xs">
                  <Droplets className="size-3 text-blue-500" />
                  <span className="font-medium">Latest:</span>
                  <span>{latestDrainage.amount} mL</span>
                  <span className="text-muted-foreground">
                    ({formatDisplayDate(latestDrainage.date)})
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

function AntibioticsCard({ antibiotics }: Readonly<{ antibiotics: Antibiotic[] }>) {
  const activeAntibiotics = antibiotics.filter((abx) => !abx.stoppedAt)
  const stoppedAntibiotics = antibiotics.filter((abx) => abx.stoppedAt)

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Pill className="size-4 text-amber-500" />
          Antibiotics
          {activeAntibiotics.length > 0 && (
            <Badge variant="default" className="ml-auto">
              {activeAntibiotics.length} active
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {activeAntibiotics.map((abx) => {
          const dayCount = calculateDaysSince(abx.startedAt) + 1
          return (
            <div
              key={abx.id}
              className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50/50 p-3 dark:border-amber-900 dark:bg-amber-950/20"
            >
              <div className="flex items-center gap-2">
                <Pill className="size-4 text-amber-600" />
                <span className="font-medium">{abx.name}</span>
              </div>
              <Badge variant="outline" className="text-xs">
                Day {dayCount}
              </Badge>
            </div>
          )
        })}

        {stoppedAntibiotics.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Stopped</p>
            {stoppedAntibiotics.map((abx) => (
              <div
                key={abx.id}
                className="flex items-center justify-between rounded-lg bg-muted/30 p-2 text-sm"
              >
                <span className="text-muted-foreground">{abx.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDisplayDate(abx.startedAt)} → {formatDisplayDate(abx.stoppedAt!)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function CriticalMedicationsCard({ meds }: Readonly<{ meds: CriticalMedications }>) {
  const hasAnticoagulants = meds.anticoagulants.length > 0
  const hasAntidiabetics = meds.antidiabetics.length > 0

  if (!hasAnticoagulants && !hasAntidiabetics) return null

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <AlertCircle className="size-4 text-red-500" />
          Critical Medications
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {hasAnticoagulants && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Anticoagulants</p>
            <div className="space-y-1.5">
              {meds.anticoagulants.map((med, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded bg-red-50 px-2 py-1.5 text-sm dark:bg-red-950/30"
                >
                  <span className="font-medium">{med.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Last: {formatDisplayDate(med.lastDoseAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {hasAntidiabetics && (
          <div>
            <p className="mb-2 text-xs font-medium text-muted-foreground">Antidiabetics</p>
            <div className="space-y-1.5">
              {meds.antidiabetics.map((med, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between rounded bg-orange-50 px-2 py-1.5 text-sm dark:bg-orange-950/30"
                >
                  <span className="font-medium">{med.name}</span>
                  <span className="text-xs text-muted-foreground">
                    Last: {formatDisplayDate(med.lastDoseAt)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function LabCulturesCard({ cultures }: Readonly<{ cultures: LabCulture[] }>) {
  const cultureTypeLabels: Record<LabCulture["type"], string> = {
    blood_culture: "Blood Culture",
    urine_culture: "Urine Culture",
    sputum_culture: "Sputum Culture",
    fluid_culture: "Fluid Culture",
    fluid_biochemistry: "Fluid Biochem",
    cytology: "Cytology",
  }

  const statusColors: Record<LabCulture["status"], string> = {
    ordered: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
    resulted: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
    printed: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Beaker className="size-4 text-cyan-500" />
          Lab Cultures
          <Badge variant="secondary" className="ml-auto">
            {cultures.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {cultures.map((culture) => (
          <div key={culture.id} className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{cultureTypeLabels[culture.type]}</span>
              <Badge className={`text-xs ${statusColors[culture.status]}`}>{culture.status}</Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Ordered: {formatDisplayDate(culture.orderedAt)}
              {culture.resultedAt && ` • Resulted: ${formatDisplayDate(culture.resultedAt)}`}
            </p>
            {culture.result && (
              <p className="mt-2 rounded bg-muted/50 p-2 text-xs">{culture.result}</p>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function ConsultationsCard({ consultations }: Readonly<{ consultations: Consultation[] }>) {
  const pendingConsultations = consultations.filter((c) => c.status === "pending")
  const seenConsultations = consultations.filter((c) => c.status === "seen")

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <MessageSquare className="size-4 text-indigo-500" />
          Consultations
          {pendingConsultations.length > 0 && (
            <Badge variant="destructive" className="ml-auto">
              {pendingConsultations.length} pending
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {pendingConsultations.map((consult) => (
          <div
            key={consult.id}
            className="rounded-lg border border-orange-200 bg-orange-50/50 p-3 dark:border-orange-900 dark:bg-orange-950/20"
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{consult.department}</span>
              <Badge variant="outline" className="text-xs">
                Pending
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Requested: {formatDisplayDate(consult.requestedAt)}
            </p>
            <p className="mt-1 text-sm">{consult.reason}</p>
          </div>
        ))}

        {seenConsultations.map((consult) => (
          <div key={consult.id} className="rounded-lg border bg-muted/30 p-3">
            <div className="flex items-center justify-between">
              <span className="font-medium">{consult.department}</span>
              <Badge variant="secondary" className="text-xs">
                Seen
              </Badge>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Seen: {consult.seenAt ? formatDisplayDate(consult.seenAt) : "—"}
            </p>
            {consult.recommendations.length > 0 && (
              <div className="mt-2 space-y-1">
                {consult.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs">
                    <span
                      className={`size-1.5 rounded-full ${rec.completed ? "bg-green-500" : "bg-yellow-500"}`}
                    />
                    <span className={rec.completed ? "text-muted-foreground line-through" : ""}>
                      {rec.text}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export function PatientDialogView({
  onClose,
  onEdit,
  open,
  organizationId,
  patient,
}: Readonly<PatientDialogViewProps>) {
  const t = useTranslations("PatientSheet")
  const tView = useTranslations("PatientDialogView")
  const { getFullPatientName } = useLocalRoster()
  const clinicSettings = useQuery(
    api.clinicSettings.getClinicSettings,
    open && organizationId ? { organizationId } : "skip"
  )

  const fullName = patient
    ? getFullPatientName({
        bedId: patient.bedId,
        identifierCode: patient.identifierCode,
        initials: patient.initials,
        patientId: patient._id,
      })
    : ""

  const conventionRules = useMemo(
    () => parseConventionRules(clinicSettings?.conventions),
    [clinicSettings?.conventions]
  )

  const matchedClinicalItems = useMemo(
    () =>
      patient
        ? evaluatePatientRules(
            {
              diagnosis: patient.diagnosis,
              procedureName: patient.procedureName || undefined,
            },
            conventionRules
          )
        : [],
    [conventionRules, patient]
  )

  const hasRequirements =
    matchedClinicalItems.length > 0 ||
    (patient?.completedRequirements?.length ?? 0) > 0 ||
    (patient?.customTodos?.length ?? 0) > 0

  const clinicalEvaluation = useMemo(
    () => (patient ? evaluateClinicalRules(patient, defaultClinicalRules) : null),
    [patient]
  )

  const hasClinicalAlerts =
    clinicalEvaluation &&
    (clinicalEvaluation.blocks.length > 0 ||
      clinicalEvaluation.warnings.length > 0 ||
      clinicalEvaluation.requirements.length > 0)

  if (!patient) {
    return null
  }

  const clinicalDays = calculateClinicalDays(patient.admissionDate, patient.surgeryDate)
  const isStaging = patient.bedId === STAGING_BED_ID

  return (
    <div className="flex h-full max-h-[90vh] flex-col">
      <DialogHeader className="shrink-0 border-b px-6 py-4">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant="secondary">{t("badges.editing")}</Badge>
              <Badge variant="outline">{t("badges.privacy")}</Badge>
            </div>
            <DialogTitle className="text-xl">{fullName || patient.initials}</DialogTitle>
            <DialogDescription className="mt-1">
              {tView("subtitle", { identifierCode: patient.identifierCode })}
            </DialogDescription>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="default" size="sm" onClick={onEdit}>
              <Pencil className="mr-1.5 size-3.5" />
              {tView("editButton")}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={onClose}>
              <X className="size-4" />
              <span className="sr-only">{tView("closeButton")}</span>
            </Button>
          </div>
        </div>
      </DialogHeader>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="flex-1 overflow-y-auto p-6">
          {/* Clinical Alerts Panel - Shown at the top for immediate visibility */}
          {hasClinicalAlerts && clinicalEvaluation && (
            <div className="mb-6">
              <ClinicalAlertsPanel evaluation={clinicalEvaluation} />
            </div>
          )}

          {/* Patient & Clinical Info Header */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoRow
              icon={<User className="size-4 text-muted-foreground" />}
              label={t("fields.fullName.label")}
              value={fullName || patient.initials}
            />
            <InfoRow
              icon={<Hash className="size-4 text-muted-foreground" />}
              label={t("fields.identifierCode.label")}
              value={patient.identifierCode}
            />
            <InfoRow
              icon={<MapPin className="size-4 text-muted-foreground" />}
              label={t("fields.bedId.label")}
              value={
                isStaging
                  ? t("fields.bedId.options.staging")
                  : t("fields.bedId.options.bedLabel", {
                      number: patient.bedId.replace(/^bed-/, ""),
                    })
              }
            />
            <InfoRow
              icon={<Stethoscope className="size-4 text-muted-foreground" />}
              label={t("fields.serviceName.label")}
              value={patient.serviceName}
            />
          </div>

          <Separator className="mb-6" />

          {/* Diagnosis & Timeline Row */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <InfoRow
              icon={<ClipboardList className="size-4 text-muted-foreground" />}
              label={t("fields.diagnosis.label")}
              value={patient.diagnosis}
            />
            <InfoRow
              icon={<Stethoscope className="size-4 text-muted-foreground" />}
              label={t("fields.procedureName.label")}
              value={patient.procedureName}
            />
            <InfoRow
              icon={<Calendar className="size-4 text-muted-foreground" />}
              label={t("fields.admissionDate.label")}
              value={
                <span>
                  {formatDisplayDate(patient.admissionDate)}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    Day {clinicalDays.admittedDays}
                  </Badge>
                </span>
              }
            />
            <InfoRow
              icon={<Calendar className="size-4 text-muted-foreground" />}
              label={t("fields.surgeryDate.label")}
              value={
                patient.surgeryDate ? (
                  <span>
                    {formatDisplayDate(patient.surgeryDate)}
                    {clinicalDays.postOpDays !== null && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        PO {clinicalDays.postOpDays}
                      </Badge>
                    )}
                  </span>
                ) : null
              }
            />
          </div>

          <Separator className="mb-6" />

          {/* Clinical Cards Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Vitals Card */}
            {patient.vitals && <VitalsCard vitals={patient.vitals} />}

            {/* Anamnesis Card */}
            {patient.anamnesis && <AnamnesisCard anamnesis={patient.anamnesis} />}

            {/* Thoracic Interventions Card */}
            {(patient.thoracicInterventions?.length ?? 0) > 0 && (
              <ThoracicInterventionsCard interventions={patient.thoracicInterventions!} />
            )}

            {/* Antibiotics Card */}
            {(patient.antibiotics?.length ?? 0) > 0 && (
              <AntibioticsCard antibiotics={patient.antibiotics!} />
            )}

            {/* Critical Medications Card */}
            {patient.criticalMedications && (
              <CriticalMedicationsCard meds={patient.criticalMedications} />
            )}

            {/* Lab Cultures Card */}
            {(patient.labCultures?.length ?? 0) > 0 && (
              <LabCulturesCard cultures={patient.labCultures!} />
            )}

            {/* Consultations Card */}
            {(patient.consultations?.length ?? 0) > 0 && (
              <ConsultationsCard consultations={patient.consultations!} />
            )}
          </div>

          {/* Mobile Requirements & Quick Todos */}
          <div className="mt-6 space-y-4 lg:hidden">
            {hasRequirements && (
              <PatientClinicalRequirementsAlert
                completedRequirements={patient.completedRequirements}
                customTodos={patient.customTodos}
                items={matchedClinicalItems}
                loading={null}
              />
            )}
            <div className="rounded-lg border bg-muted/20 p-4">
              <VisitTodoList
                patientId={patient._id}
                customTodos={patient.customTodos}
                completedRequirements={patient.completedRequirements}
                requirements={clinicalEvaluation?.requirements ?? []}
              />
            </div>
          </div>
        </div>

        {/* Desktop Sidebar for Requirements & Quick Todos */}
        <div className="hidden w-80 shrink-0 overflow-y-auto border-l bg-muted/20 p-4 lg:block xl:w-96">
          {hasRequirements && (
            <PatientClinicalRequirementsAlert
              completedRequirements={patient.completedRequirements}
              customTodos={patient.customTodos}
              items={matchedClinicalItems}
              loading={null}
            />
          )}

          <div className={hasRequirements ? "mt-6" : ""}>
            <VisitTodoList
              patientId={patient._id}
              customTodos={patient.customTodos}
              completedRequirements={patient.completedRequirements}
              requirements={clinicalEvaluation?.requirements ?? []}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
