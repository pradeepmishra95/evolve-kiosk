import type { MembershipDuration } from "../types/domain"

export type SchedulePeriod = "morning" | "evening" | "custom"

export interface SchedulePeriodOption {
 value: SchedulePeriod
 label: string
 timings: string[]
}

const normalizeRaw = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")

const formatDateValue = (date: Date) => {
 const year = date.getFullYear()
 const month = String(date.getMonth() + 1).padStart(2, "0")
 const day = String(date.getDate()).padStart(2, "0")

 return `${year}-${month}-${day}`
}

const normalizeWeekday = (value: string) => {
 const normalized = normalizeRaw(value)

 if (
  normalized === "mon" ||
  normalized === "monday"
) {
  return "mon"
 }

 if (
  normalized === "tue" ||
  normalized === "tues" ||
  normalized === "tuesday"
) {
  return "tue"
 }

 if (
  normalized === "wed" ||
  normalized === "weds" ||
  normalized === "wednesday"
) {
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

 if (
  normalized === "fri" ||
  normalized === "friday"
) {
  return "fri"
 }

 if (
  normalized === "sat" ||
  normalized === "saturday"
) {
  return "sat"
 }

 if (
  normalized === "sun" ||
  normalized === "sunday"
) {
  return "sun"
 }

 return ""
}

export const normalizeDurationLabel = (value: string): MembershipDuration => {
 const normalized = normalizeRaw(value)

 if (!normalized) {
  return "Monthly"
 }

 if (
  normalized === "1day" ||
  normalized === "oneday" ||
  normalized === "day" ||
  normalized === "daily"
) {
  return "1 Day"
 }

 if (
  normalized === "1session" ||
  normalized === "onesession" ||
  normalized === "session" ||
  normalized === "singleSession".toLowerCase()
) {
  return "1 Session"
 }

 if (normalized.includes("trial")) {
  return "Free Trial"
 }

 if (normalized === "monthly" || normalized === "month" || normalized === "permonth") {
  return "Monthly"
 }

 if (normalized === "quarterly" || normalized === "quarter" || normalized === "3months") {
  return "Quarterly"
 }

 if (
  normalized === "halfyearly" ||
  normalized === "halfyear" ||
  normalized === "halfannual" ||
  normalized === "halfannualy" ||
  normalized === "halfannually" ||
  normalized === "semiannual" ||
  normalized === "semiannualy" ||
  normalized === "semiannually" ||
  normalized === "6months"
 ) {
  return "Half Yearly"
 }

 if (
  normalized === "yearly" ||
  normalized === "annual" ||
  normalized === "annually" ||
  normalized === "year" ||
  normalized === "annualy"
) {
  return "Yearly"
 }

 const sessionMatch = normalized.match(/^(\d+)sessions?$/)

 if (sessionMatch) {
  return `${sessionMatch[1]} Sessions` as MembershipDuration
 }

 return value as MembershipDuration
}

export const detectSchedulePeriod = (timing: string): SchedulePeriod | null => {
 const normalized = timing.trim().toLowerCase()

 if (normalized.includes("am")) {
  return "morning"
 }

 if (normalized.includes("pm")) {
  return "evening"
 }

 return null
}

export const getSchedulePeriodOptions = (timings: string[]): SchedulePeriodOption[] => {
 const morning = timings.filter((timing) => detectSchedulePeriod(timing) === "morning")
 const evening = timings.filter((timing) => detectSchedulePeriod(timing) === "evening")
 const unknown = timings.filter((timing) => detectSchedulePeriod(timing) === null)

 const options: SchedulePeriodOption[] = []

 if (morning.length > 0) {
  options.push({
   value: "morning",
   label: "Morning",
   timings: morning
  })
 }

 if (evening.length > 0) {
  options.push({
   value: "evening",
   label: "Evening",
   timings: evening
  })
 }

 if (options.length === 0 && timings.length > 0) {
  options.push({
   value: "custom",
   label: "Available Batches",
   timings: unknown.length > 0 ? unknown : timings
  })
 }

 return options
}

export const getTimingsForPeriod = (timings: string[], period?: string) => {
 if (!period || period === "custom") {
  return timings
 }

 const filtered = timings.filter((timing) => detectSchedulePeriod(timing) === period)

 return filtered.length > 0 ? filtered : timings
}

export const getUpcomingScheduleDatesForDays = (weekdays: string[], count = 7) => {
 const allowedWeekdays = new Set(weekdays.map((day) => normalizeWeekday(day)).filter(Boolean))

 if (allowedWeekdays.size === 0) {
  return []
 }

 const options: Array<{
  value: string
  label: string
  shortLabel: string
 }> = []
 const formatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "2-digit",
  month: "short"
 })
 const weekdayFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short"
 })
 const date = new Date()
 date.setHours(0, 0, 0, 0)

 let attempts = 0

 while (options.length < count && attempts < 120) {
  const weekday = normalizeWeekday(weekdayFormatter.format(date))

  if (weekday && allowedWeekdays.has(weekday)) {
   const value = formatDateValue(date)
   const label =
    options.length === 0
     ? `Next available, ${formatter.format(date)}`
     : formatter.format(date)

   options.push({
    value,
    label,
    shortLabel: formatter.format(date)
   })
  }

  date.setDate(date.getDate() + 1)
  attempts += 1
 }

 return options
}
