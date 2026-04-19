import type { MembershipDuration, PlanPricing, PriceBreakdownLine, ProgramPlan } from "../types/domain"
import { matchesLabel } from "./labelMatch"
import { normalizeDurationLabel } from "./planSchedule"

const isPersonalTrainingPlan = (plan: ProgramPlan) =>
 plan.type === "personal" || matchesLabel(plan.name, "Personal Training")

const getProgramFamilyLabel = (plan: ProgramPlan) => plan.program || plan.name

// Add-ons are charged at half of the resolved plan price, rounded to the nearest rupee.
const getAddonDiscountPrice = (price: number) => Math.max(0, Math.round(price / 2))

export interface ResolvedPlanPricing {
 duration: MembershipDuration
 price: number
 originalPrice?: number
}

export interface ResolvedAddonPlan {
 id: string
 name: string
 pricing: ResolvedPlanPricing
}

const getPricingMatch = (pricing: PlanPricing[], preferredDuration?: string) => {
 if (!pricing.length) {
  return null
 }

 const normalizedPreferred = preferredDuration ? normalizeDurationLabel(preferredDuration) : ""

 if (normalizedPreferred) {
  const matched = pricing.find(
   (option) => normalizeDurationLabel(option.duration) === normalizedPreferred
  )

  if (matched) {
   return matched
  }
 }

 return pricing[0] ?? null
}

export const resolvePlanPricing = (plan?: ProgramPlan, preferredDuration?: string) => {
 if (!plan?.pricing?.length) {
  return null
 }

 const pricing = getPricingMatch(plan.pricing, preferredDuration)

 if (!pricing) {
  return null
 }

 return {
  duration: pricing.duration,
  price: pricing.price,
  originalPrice: pricing.originalPrice
 } satisfies ResolvedPlanPricing
}

export const isAddonCandidate = (
 candidate: ProgramPlan,
 selectedPlan?: ProgramPlan,
 exerciseType = ""
) => {
 if (!selectedPlan) {
  return false
 }

 if (candidate.id === selectedPlan.id) {
  return false
 }

 if (isPersonalTrainingPlan(candidate) || isPersonalTrainingPlan(selectedPlan)) {
  return false
 }

 if (selectedPlan.audience && candidate.audience && selectedPlan.audience !== candidate.audience) {
  return false
 }

 const selectedFamily = selectedPlan.program || exerciseType || selectedPlan.name
 const candidateFamily = getProgramFamilyLabel(candidate)

 if (!selectedFamily || !candidateFamily) {
  return false
 }

 return !matchesLabel(candidateFamily, selectedFamily)
}

export const resolveAddonPlans = (
 plans: ProgramPlan[],
 selectedPlan?: ProgramPlan,
 exerciseType = "",
 preferredDuration?: string
): ResolvedAddonPlan[] =>
 plans
  .filter((plan) => isAddonCandidate(plan, selectedPlan, exerciseType))
  .map<ResolvedAddonPlan | null>((plan) => {
   const pricing = resolvePlanPricing(plan, preferredDuration)

   if (!pricing) {
    return null
   }

   return {
    id: plan.id,
    name: plan.name,
    pricing: {
     duration: pricing.duration,
     price: getAddonDiscountPrice(pricing.price),
     originalPrice: pricing.price
    }
   }
  })
  .filter((plan): plan is ResolvedAddonPlan => plan !== null)

export const buildPriceBreakdown = (
 mainLabel: string,
 mainPrice: number,
 addons: ResolvedAddonPlan[],
 mainOriginalPrice?: number
): PriceBreakdownLine[] => {
 const mainLine: PriceBreakdownLine = { label: mainLabel, amount: mainPrice }

 if (mainOriginalPrice !== undefined && mainOriginalPrice > mainPrice) {
  mainLine.originalAmount = mainOriginalPrice
 }

 const lines: PriceBreakdownLine[] = [mainLine]

 addons.forEach((addon) => {
  const line: PriceBreakdownLine = { label: addon.name, amount: addon.pricing.price }

  if (addon.pricing.originalPrice !== undefined && addon.pricing.originalPrice > addon.pricing.price) {
   line.originalAmount = addon.pricing.originalPrice
  }

  lines.push(line)
 })

 return lines
}

export const sumPrices = (lines: PriceBreakdownLine[]) =>
 lines.reduce((total, line) => total + line.amount, 0)
