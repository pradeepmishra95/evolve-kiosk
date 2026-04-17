export interface DateChipOption {
 value: string
 label: string
 shortLabel: string
 date: Date
}

export interface ParsedTwelveHourTime {
 hour: number
 minute: string
 period: "AM" | "PM"
}

const DATE_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const TWELVE_HOUR_TIME_PATTERN = /^(\d{1,2}):([0-5]\d)\s*(AM|PM)$/i

const padTwoDigits = (value: number) => String(value).padStart(2, "0")

export const toDateInputValue = (date: Date) =>
 `${date.getFullYear()}-${padTwoDigits(date.getMonth() + 1)}-${padTwoDigits(date.getDate())}`

export const parseDateInputValue = (value: string) => {
 if (!value || !DATE_INPUT_PATTERN.test(value)) {
  return null
 }

 const parsed = new Date(`${value}T00:00:00`)

 return Number.isNaN(parsed.getTime()) ? null : parsed
}

export const startOfDay = (date = new Date()) => {
 const next = new Date(date)
 next.setHours(0, 0, 0, 0)

 return next
}

export const addDays = (date: Date, days: number) => {
 const next = new Date(date)
 next.setDate(next.getDate() + days)

 return next
}

export const isSameDate = (left: Date | null, right: Date | null) => {
 if (!left || !right) {
  return false
 }

 return (
  left.getFullYear() === right.getFullYear() &&
  left.getMonth() === right.getMonth() &&
  left.getDate() === right.getDate()
 )
}

export const getRelativeDateLabel = (targetDate: Date, referenceDate = new Date()) => {
 const normalizedTarget = startOfDay(targetDate)
 const normalizedReference = startOfDay(referenceDate)
 const dayDifference = Math.round(
  (normalizedTarget.getTime() - normalizedReference.getTime()) / (24 * 60 * 60 * 1000)
 )

 if (dayDifference === 0) {
  return "Today"
 }

 if (dayDifference === 1) {
  return "Tomorrow"
 }

 return ""
}

export const formatDateShort = (date: Date) =>
 new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "2-digit",
  month: "short"
 }).format(date)

export const formatDateReadable = (value: string) => {
 const parsedDate = parseDateInputValue(value)

 if (!parsedDate) {
  return value
 }

 return new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric"
 }).format(parsedDate)
}

export const buildDateChipOptions = (
 startDate: Date,
 count: number,
 options?: {
  minDate?: Date | null
  maxDate?: Date | null
 }
) => {
 const minDate = options?.minDate ? startOfDay(options.minDate) : null
 const maxDate = options?.maxDate ? startOfDay(options.maxDate) : null
 const result: DateChipOption[] = []
 const normalizedStartDate = startOfDay(startDate)

 for (let index = 0; index < count; index += 1) {
  const date = addDays(normalizedStartDate, index)

  if (minDate && date < minDate) {
   continue
  }

  if (maxDate && date > maxDate) {
   break
  }

  const relativeLabel = getRelativeDateLabel(date)

  result.push({
   value: toDateInputValue(date),
   label: relativeLabel ? `${relativeLabel}, ${formatDateShort(date)}` : formatDateShort(date),
   shortLabel: formatDateShort(date),
   date
  })
 }

 return result
}

export const parseTwelveHourTime = (value: string): ParsedTwelveHourTime | null => {
 if (!value) {
  return null
 }

 const match = value.trim().match(TWELVE_HOUR_TIME_PATTERN)

 if (!match) {
  return null
 }

 const rawHour = Number(match[1])

 if (!Number.isFinite(rawHour) || rawHour < 1 || rawHour > 12) {
  return null
 }

 return {
  hour: rawHour,
  minute: match[2],
  period: match[3].toUpperCase() as "AM" | "PM"
 }
}

export const formatTwelveHourTime = (time: ParsedTwelveHourTime) =>
 `${time.hour}:${time.minute} ${time.period}`

export const buildHalfHourTimeSlots = (startHour24 = 6, endHour24 = 22) => {
 const slots: string[] = []

 for (let minutes = startHour24 * 60; minutes <= endHour24 * 60; minutes += 30) {
  const hour24 = Math.floor(minutes / 60)
  const minute = minutes % 60
  const period = hour24 >= 12 ? "PM" : "AM"
  const hour12 = hour24 % 12 || 12

  slots.push(`${hour12}:${padTwoDigits(minute)} ${period}`)
 }

 return slots
}
