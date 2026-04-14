export interface AaGradientInput {
  age: number
  paO2: number
  paCO2: number
  fio2?: number
  o2Liters?: number
  patm?: number
  waterVaporPressure?: number
}

export interface AaGradientResult {
  estimatedFiO2: number
  pAO2: number
  gradient: number
  expectedGradient: number
  isElevated: boolean
  etiology: "intrinsic" | "extrinsic"
  clinicalInterpretation: string
}

export const DEFAULT_PATM_MMHG = 760
export const DEFAULT_WATER_VAPOR_PRESSURE_MMHG = 47

export function convertLitersToFiO2(liters: number): number {
  if (liters <= 0) {
    return 0.21
  }

  const calculatedFiO2 = 0.2 + liters * 0.04
  return Math.min(Math.max(calculatedFiO2, 0.21), 1)
}

function normalizeFiO2(fio2: number): number {
  const adjustedFiO2 = fio2 > 1 ? fio2 / 100 : fio2
  return Math.min(Math.max(adjustedFiO2, 0.21), 1)
}

export function calculateAaGradient({
  age,
  paO2,
  paCO2,
  fio2,
  o2Liters,
  patm = DEFAULT_PATM_MMHG,
  waterVaporPressure = DEFAULT_WATER_VAPOR_PRESSURE_MMHG,
}: AaGradientInput): AaGradientResult {
  let currentFiO2 = 0.21

  if (typeof fio2 === "number") {
    currentFiO2 = normalizeFiO2(fio2)
  } else if (typeof o2Liters === "number") {
    currentFiO2 = convertLitersToFiO2(o2Liters)
  }

  const R = currentFiO2 >= 1 ? 1 : 0.8
  const pAO2 = (patm - waterVaporPressure) * currentFiO2 - paCO2 / R
  const gradient = pAO2 - paO2
  const expectedGradient = age / 4 + 4
  const isElevated = gradient > expectedGradient
  const etiology = isElevated ? "intrinsic" : "extrinsic"

  return {
    estimatedFiO2: Number(currentFiO2.toFixed(2)),
    pAO2: Number(pAO2.toFixed(2)),
    gradient: Number(gradient.toFixed(2)),
    expectedGradient: Number(expectedGradient.toFixed(2)),
    isElevated,
    etiology,
    clinicalInterpretation: isElevated
      ? "Elevated A-a gradient: supports intrinsic lung pathology (V/Q mismatch, shunt, diffusion defect)."
      : "Normal A-a gradient: supports extrapulmonary etiology such as hypoventilation.",
  }
}
