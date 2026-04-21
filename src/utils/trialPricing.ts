import type { PersonalTrainingCoach, PlanPricing, ProgramPlan } from "../types/domain"

export const TRIAL_FEE = 299
export const TRIAL_ORIGINAL_PRICE = 499
export const TRIAL_FEE_NOTE = "This amount will be adjusted in your total plan fee when you enroll."

const getTrialPlanOption = (pricing?: PlanPricing[]) => {
 if (!pricing?.length) {
  return null
 }

 return pricing.find((option) => option.duration === "1 Day") ?? pricing[0]
}

export const getTrialPlanPricing = (plan: ProgramPlan) => {
 const trialOption = getTrialPlanOption(plan.pricing)

 return {
  duration: trialOption?.duration ?? "1 Day",
  price: TRIAL_FEE
 }
}

export const getTrialPersonalTrainingPricing = (coach: PersonalTrainingCoach) => {
 void coach

 return {
  duration: "1 Session" as const,
  price: TRIAL_FEE
 }
}
