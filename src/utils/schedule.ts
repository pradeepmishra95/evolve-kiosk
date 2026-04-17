export interface ScheduleDateOption {
 value: string
 label: string
 shortLabel: string
}

const formatDateValue = (date: Date) => {
 const year = date.getFullYear()
 const month = String(date.getMonth() + 1).padStart(2, "0")
 const day = String(date.getDate()).padStart(2, "0")

 return `${year}-${month}-${day}`
}

export const getUpcomingScheduleDates = (count = 7): ScheduleDateOption[] => {
 const options: ScheduleDateOption[] = []
 const formatter = new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "2-digit",
  month: "short"
 })

 for (let index = 0; index < count; index += 1) {
  const date = new Date()
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() + index)

  const value = formatDateValue(date)
  const label =
   index === 0
    ? `Today, ${formatter.format(date)}`
    : index === 1
     ? `Tomorrow, ${formatter.format(date)}`
     : formatter.format(date)

  options.push({
   value,
   label,
   shortLabel: formatter.format(date)
  })
 }

 return options
}

export const formatScheduleDate = (value: string) => {
 if (!value) {
  return "-"
 }

 const date = new Date(`${value}T00:00:00`)

 if (Number.isNaN(date.getTime())) {
  return value
 }

 return new Intl.DateTimeFormat("en-IN", {
  weekday: "short",
  day: "2-digit",
  month: "short",
  year: "numeric"
 }).format(date)
}
