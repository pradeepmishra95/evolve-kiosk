import type { CatalogTrainingType } from "../../services/planCatalog"
import { matchesLabel } from "../../utils/labelMatch"
import type { ProgramPlan } from "../../types/domain"

const weekdayOrder = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const

export type WeekdayKey = (typeof weekdayOrder)[number]

export const weekdayChips: Array<{ key: WeekdayKey; label: string; fullLabel: string }> = [
 { key: "mon", label: "M", fullLabel: "Monday" },
 { key: "tue", label: "T", fullLabel: "Tuesday" },
 { key: "wed", label: "W", fullLabel: "Wednesday" },
 { key: "thu", label: "T", fullLabel: "Thursday" },
 { key: "fri", label: "F", fullLabel: "Friday" },
 { key: "sat", label: "S", fullLabel: "Saturday" },
 { key: "sun", label: "S", fullLabel: "Sunday" }
]

const normalizeWeekdayKey = (value: string): WeekdayKey | "" => {
 const normalized = value.trim().toLowerCase().replace(/[^a-z]+/g, "")

 if (normalized === "mon" || normalized === "monday") {
  return "mon"
 }

 if (normalized === "tue" || normalized === "tues" || normalized === "tuesday") {
  return "tue"
 }

 if (normalized === "wed" || normalized === "weds" || normalized === "wednesday") {
  return "wed"
 }

 if (
  normalized === "thu" ||
  normalized === "thur" ||
  normalized === "thurs" ||
  normalized === "thursday"
 ) {
  return "thu"
 }

 if (normalized === "fri" || normalized === "friday") {
  return "fri"
 }

 if (normalized === "sat" || normalized === "saturday") {
  return "sat"
 }

 if (normalized === "sun" || normalized === "sunday") {
  return "sun"
 }

 return ""
}

const expandWeekdayRange = (start: WeekdayKey, end: WeekdayKey) => {
 const startIndex = weekdayOrder.indexOf(start)
 const endIndex = weekdayOrder.indexOf(end)

 if (startIndex === -1 || endIndex === -1) {
  return [start, end]
 }

 if (startIndex <= endIndex) {
  return weekdayOrder.slice(startIndex, endIndex + 1)
 }

 return [...weekdayOrder.slice(startIndex), ...weekdayOrder.slice(0, endIndex + 1)]
}

export const getPlanWeekdays = (plan?: ProgramPlan) => {
 if (!plan) {
  return []
 }

 const scheduleDays = plan.scheduleDays
  ?.map((day) => normalizeWeekdayKey(day))
  .filter((day): day is WeekdayKey => Boolean(day))

 if (scheduleDays?.length) {
  return weekdayOrder.filter((day) => scheduleDays.includes(day))
 }

 const rawDays = plan.days?.trim()

 if (!rawDays) {
  return []
 }

 const rangeMatch = rawDays.match(
  /\b(mon(?:day)?|tue(?:s|sday)?|wed(?:s|nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b\s*[–-]\s*\b(mon(?:day)?|tue(?:s|sday)?|wed(?:s|nesday)?|thu(?:r|rs|rsday)?|fri(?:day)?|sat(?:urday)?|sun(?:day)?)\b/i
 )

 if (rangeMatch) {
  const start = normalizeWeekdayKey(rangeMatch[1])
  const end = normalizeWeekdayKey(rangeMatch[2])

  if (start && end) {
   return expandWeekdayRange(start, end)
  }
 }

 const list = rawDays
  .split(/[,/|&]+/)
  .map((item) => normalizeWeekdayKey(item))
  .filter((day): day is WeekdayKey => Boolean(day))

 return weekdayOrder.filter((day) => list.includes(day))
}

export const formatWeekdayLabel = (weekday: WeekdayKey) =>
 weekdayChips.find((day) => day.key === weekday)?.fullLabel || weekday.toUpperCase()

export const formatCurrency = (value: number) => `₹${value.toLocaleString("en-IN")}`

export const getRelatedTrainingType = (
 plan: ProgramPlan,
 trainingTypes: CatalogTrainingType[],
 exerciseType: string
) => {
 const candidate = plan.program || exerciseType

 return trainingTypes.find(
  (trainingType) =>
   (candidate && matchesLabel(trainingType.name, candidate)) ||
   matchesLabel(trainingType.name, plan.name)
 )
}

export const buildPlanInfo = (
 plan: ProgramPlan,
 trainingType: CatalogTrainingType | undefined,
 exerciseType: string
) => {
 const programName = trainingType?.name || plan.program || exerciseType || "this program"
 const weekdays = getPlanWeekdays(plan)
 const scheduleText = weekdays.length
  ? weekdays.map(formatWeekdayLabel).join(", ")
  : plan.days?.trim() || "Structured weekly batches"
 const audienceText =
  plan.audience === "kids"
   ? "Kids / juniors"
   : plan.audience === "adult"
    ? "Adults"
    : "All members"
 const experienceText = plan.experienceLevels?.length
  ? plan.experienceLevels.join(", ")
  : "All experience levels"
 const summary =
  trainingType?.summary ||
  `${plan.name} is part of ${programName} training and follows a guided batch structure.`
 const description =
  trainingType?.description ||
  `This plan gives you a structured training rhythm with coaching support and steady progression.`
 const benefits = trainingType?.benefits?.length
  ? trainingType.benefits
  : [
     `${programName} training stays structured and easy to follow`,
     `Weekday schedule and timings are planned for consistency`,
     `Built for steady progress with coach guidance`
    ]
 const tags = plan.tags?.length
  ? plan.tags
  : trainingType?.exercises?.length
   ? trainingType.exercises
   : []

 return {
  programName,
  scheduleText,
  audienceText,
  experienceText,
  summary,
  description,
  benefits,
  tags,
  bestFor: trainingType?.bestFor || `${audienceText} looking for structured ${programName} training`
 }
}
