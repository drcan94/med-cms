/**
 * Default Clinical Rules
 *
 * These rules implement common clinical validations and requirements
 * for thoracic surgery patients. Rules can be extended or customized
 * per clinic via the settings interface.
 */

import type { ClinicalRule } from "./types"

export const defaultClinicalRules: ClinicalRule[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // BLOCKING RULES (Data integrity / impossible states)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "block-male-pregnant",
    name: "Erkek Hasta Gebelik Kontrolü",
    description: "Erkek hastalar gebe olarak işaretlenemez",
    enabled: true,
    condition: {
      operator: "AND",
      conditions: [
        { type: "equals", field: "gender", value: "male" },
        { type: "equals", field: "isPregnant", value: true },
      ],
    },
    action: {
      type: "block",
      id: "male-pregnant-block",
      message: "Erkek hastalar gebe olarak işaretlenemez.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // WARNING RULES (Safety alerts requiring attention)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "warn-pregnant-xray",
    name: "Gebe Röntgen Uyarısı",
    description: "Gebe hastalarda PA Akciğer grafisi radyasyon riski taşır",
    enabled: true,
    condition: {
      operator: "AND",
      conditions: [
        { type: "equals", field: "isPregnant", value: true },
        { type: "contains", field: "diagnosis", value: "PA Akciğer" },
      ],
    },
    action: {
      type: "warn",
      id: "pregnant-xray-warn",
      message: "Gebe hastada röntgen uyarısı - radyasyon riski!",
    },
  },

  {
    id: "warn-pregnant-ct",
    name: "Gebe BT Uyarısı",
    description: "Gebe hastalarda BT çekimi radyasyon riski taşır",
    enabled: true,
    condition: {
      operator: "AND",
      conditions: [
        { type: "equals", field: "isPregnant", value: true },
        {
          operator: "OR",
          conditions: [
            { type: "contains", field: "diagnosis", value: "Toraks BT" },
            { type: "contains", field: "diagnosis", value: "CT" },
            { type: "contains", field: "procedureName", value: "BT" },
          ],
        },
      ],
    },
    action: {
      type: "warn",
      id: "pregnant-ct-warn",
      message: "Gebe hastada BT uyarısı - yüksek radyasyon riski! Alternatif görüntüleme değerlendirilmeli.",
    },
  },

  {
    id: "warn-anticoagulant-surgery",
    name: "Antikoagülan Cerrahi Uyarısı",
    description: "Antikoagülan kullanan hastada cerrahi öncesi uyarı",
    enabled: true,
    condition: {
      operator: "AND",
      conditions: [
        { type: "arrayLength", field: "criticalMedications.anticoagulants", operator: "gt", value: 0 },
        { type: "exists", field: "surgeryDate" },
      ],
    },
    action: {
      type: "warn",
      id: "anticoagulant-surgery-warn",
      message: "Antikoagülan kullanan hasta - cerrahi öncesi ilaç yönetimi planlanmalı!",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REQUIREMENT RULES (Clinical tasks to be completed)
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "req-fever-symptom-culture",
    name: "Ateş Semptomu - Kan Kültürü",
    description: "Ateş semptomu işaretlendiğinde kan kültürü planlanmalı",
    enabled: true,
    condition: {
      type: "equals",
      field: "vitals.symptoms.fever",
      value: true,
    },
    action: {
      type: "require",
      id: "fever-symptom-culture",
      message: "Ateş semptomu mevcut: Kan kültürü planlanmalı.",
    },
  },

  {
    id: "req-fever-blood-culture",
    name: "Ateş - Kan Kültürü",
    description: "38.5°C üzeri ateşte kan kültürü planlanmalı",
    enabled: true,
    condition: {
      type: "greaterThan",
      field: "vitals.temperature",
      value: 38.5,
    },
    action: {
      type: "require",
      id: "fever-blood-culture",
      message: "Ateş yüksekliği (>38.5°C): Kan kültürü planlanmalı.",
    },
  },

  {
    id: "req-high-fever-sepsis-workup",
    name: "Yüksek Ateş - Sepsis Protokolü",
    description: "39°C üzeri ateşte sepsis değerlendirmesi",
    enabled: true,
    condition: {
      type: "greaterThan",
      field: "vitals.temperature",
      value: 39,
    },
    action: {
      type: "require",
      id: "high-fever-sepsis",
      message: "Yüksek ateş (>39°C): Sepsis protokolü başlatılmalı, laktat ve prokalsitonin kontrolü.",
    },
  },

  {
    id: "req-anticoagulant-inr",
    name: "Antikoagülan - INR Kontrolü",
    description: "Antikoagülan kullanan hastada kanama profili kontrolü",
    enabled: true,
    condition: {
      type: "arrayLength",
      field: "criticalMedications.anticoagulants",
      operator: "gt",
      value: 0,
    },
    action: {
      type: "require",
      id: "anticoagulant-inr-check",
      message: "Antikoagülan kullanımı mevcut, kanama profili (INR/PTZ) kontrol edilmeli.",
    },
  },

  {
    id: "req-antidiabetic-glucose",
    name: "Antidiyabetik - Glukoz Takibi",
    description: "Antidiyabetik kullanan hastada kan şekeri takibi",
    enabled: true,
    condition: {
      type: "arrayLength",
      field: "criticalMedications.antidiabetics",
      operator: "gt",
      value: 0,
    },
    action: {
      type: "require",
      id: "antidiabetic-glucose-check",
      message: "Antidiyabetik kullanımı mevcut, kan şekeri takibi yapılmalı.",
    },
  },

  {
    id: "req-low-spo2",
    name: "Düşük SpO2 - Oksijen Desteği",
    description: "SpO2 %92 altında oksijen desteği değerlendirilmeli",
    enabled: true,
    condition: {
      type: "lessThan",
      field: "vitals.spO2",
      value: 92,
    },
    action: {
      type: "require",
      id: "low-spo2-oxygen",
      message: "Düşük SpO2 (<92%): Oksijen desteği ve solunum değerlendirmesi yapılmalı.",
    },
  },

  {
    id: "req-tachycardia",
    name: "Taşikardi - Değerlendirme",
    description: "Nabız >120 ise değerlendirme gerekli",
    enabled: true,
    condition: {
      type: "greaterThan",
      field: "vitals.pulse",
      value: 120,
    },
    action: {
      type: "require",
      id: "tachycardia-evaluation",
      message: "Taşikardi (>120/dk): EKG çekilmeli, elektrolit ve hemogram kontrolü yapılmalı.",
    },
  },

  {
    id: "req-chest-tube-drainage",
    name: "Göğüs Tüpü - Drenaj Takibi",
    description: "Aktif göğüs tüpü olan hastada günlük drenaj takibi",
    enabled: true,
    condition: {
      type: "arrayLength",
      field: "thoracicInterventions",
      operator: "gt",
      value: 0,
    },
    action: {
      type: "require",
      id: "chest-tube-drainage",
      message: "Aktif göğüs tüpü/dren mevcut: Günlük drenaj miktarı kaydedilmeli.",
    },
  },

  {
    id: "req-allergy-documentation",
    name: "Alerji - Dokümantasyon",
    description: "Alerjisi olan hastada ilaç etkileşimi kontrolü",
    enabled: true,
    condition: {
      type: "arrayLength",
      field: "anamnesis.allergies",
      operator: "gt",
      value: 0,
    },
    action: {
      type: "require",
      id: "allergy-drug-check",
      message: "Hasta alerjisi mevcut: İlaç reçetelerinde alerji kontrolü yapılmalı.",
    },
  },

  {
    id: "req-dysuria-culture",
    name: "Dizüri - İdrar Kültürü",
    description: "Dizüri semptomunda idrar kültürü planlanmalı",
    enabled: true,
    condition: {
      type: "equals",
      field: "vitals.symptoms.dysuria",
      value: true,
    },
    action: {
      type: "require",
      id: "dysuria-urine-culture",
      message: "Dizüri mevcut: İdrar tetkiki ve kültür planlanmalı.",
    },
  },

  {
    id: "req-edema-cardiac",
    name: "Pretibial Ödem - Kardiyak Değerlendirme",
    description: "Pretibial ödem varlığında kardiyak değerlendirme",
    enabled: true,
    condition: {
      type: "equals",
      field: "vitals.symptoms.pretibialEdema",
      value: true,
    },
    action: {
      type: "require",
      id: "edema-cardiac-eval",
      message: "Pretibial ödem mevcut: Kardiyak değerlendirme ve sıvı dengesi kontrolü yapılmalı.",
    },
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PROCEDURE-SPECIFIC RULES
  // ═══════════════════════════════════════════════════════════════════════════

  {
    id: "req-lobectomy-pft",
    name: "Lobektomi - SFT Kontrolü",
    description: "Lobektomi planlanan hastada SFT değerlendirmesi",
    enabled: true,
    condition: {
      operator: "OR",
      conditions: [
        { type: "contains", field: "procedureName", value: "lobektomi" },
        { type: "contains", field: "procedureName", value: "lobectomy" },
        { type: "contains", field: "diagnosis", value: "lobektomi" },
      ],
    },
    action: {
      type: "require",
      id: "lobectomy-pft",
      message: "Lobektomi planlanıyor: Preoperatif SFT değerlendirmesi yapılmalı.",
    },
  },

  {
    id: "req-pneumonectomy-cardiac",
    name: "Pnömonektomi - Kardiyak Değerlendirme",
    description: "Pnömonektomi planlanan hastada kardiyak değerlendirme",
    enabled: true,
    condition: {
      operator: "OR",
      conditions: [
        { type: "contains", field: "procedureName", value: "pnömonektomi" },
        { type: "contains", field: "procedureName", value: "pneumonectomy" },
      ],
    },
    action: {
      type: "require",
      id: "pneumonectomy-cardiac",
      message: "Pnömonektomi planlanıyor: Kapsamlı kardiyak değerlendirme ve DLCO ölçümü gerekli.",
    },
  },
]

/**
 * Get rules filtered by action type
 */
export function getRulesByType(type: "require" | "warn" | "block"): ClinicalRule[] {
  return defaultClinicalRules.filter((rule) => rule.action.type === type)
}

/**
 * Get only enabled rules
 */
export function getEnabledRules(): ClinicalRule[] {
  return defaultClinicalRules.filter((rule) => rule.enabled)
}
