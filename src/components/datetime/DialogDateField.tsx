import { useEffect, useId, useMemo, useState, type CSSProperties } from "react"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"
import {
 addDays,
 formatDateReadable,
 parseDateInputValue,
 startOfDay,
 toDateInputValue
} from "../../utils/dateTimeSelector"

export interface DialogDateOption {
 value: string
 label?: string
 description?: string
 disabled?: boolean
}

interface DialogDateFieldProps {
 label: string
 value: string
 onChange: (value: string) => void
 error?: string
 helperText?: string
 min?: string
 max?: string
 options?: DialogDateOption[]
 emptyMessage?: string
 pickerTitle?: string
 size?: "default" | "compact"
}

const accentColor = colors.primaryLight
const accentFill = colors.primary
const accentBorder = colors.borderStrong
const weekdayLabels = ["M", "T", "W", "T", "F", "S", "S"] as const

const formatHeaderDate = (date: Date | null) => {
 if (!date) {
  return "Select a date"
 }

 return new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric"
 }).format(date)
}

const formatMonthLabel = (date: Date) =>
 new Intl.DateTimeFormat("en-IN", {
  month: "long",
  year: "numeric"
 }).format(date)

const formatWeekdayName = (date: Date) =>
 new Intl.DateTimeFormat("en-IN", {
  weekday: "long"
 }).format(date)

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1)

const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0)

const addMonths = (date: Date, months: number) => new Date(date.getFullYear(), date.getMonth() + months, 1)

const toMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

const isSelectableDate = (
 date: Date,
 minDate: Date | null,
 maxDate: Date | null,
 allowedDateSet: Set<string> | null
) => {
 const normalizedDate = startOfDay(date)

 if (minDate && normalizedDate < minDate) {
  return false
 }

 if (maxDate && normalizedDate > maxDate) {
  return false
 }

 if (allowedDateSet && !allowedDateSet.has(toDateInputValue(normalizedDate))) {
  return false
 }

 return true
}

const resolveInitialDate = ({
 value,
 minDate,
 maxDate,
 allowedDateSet,
 options
}: {
 value: string
 minDate: Date | null
 maxDate: Date | null
 allowedDateSet: Set<string> | null
 options: DialogDateOption[]
}) => {
 const selectedDate = parseDateInputValue(value)

 if (selectedDate && isSelectableDate(selectedDate, minDate, maxDate, allowedDateSet)) {
  return selectedDate
 }

 for (const option of options) {
  if (option.disabled) {
   continue
  }

  const optionDate = parseDateInputValue(option.value)

  if (optionDate && isSelectableDate(optionDate, minDate, maxDate, allowedDateSet)) {
   return optionDate
  }
 }

 const startingPoint = minDate || startOfDay()

 if (isSelectableDate(startingPoint, minDate, maxDate, allowedDateSet)) {
  return startingPoint
 }

 for (let offset = 0; offset < 366; offset += 1) {
  const candidate = addDays(startingPoint, offset)

  if (isSelectableDate(candidate, minDate, maxDate, allowedDateSet)) {
   return candidate
  }
 }

 return null
}

const buildCalendarCells = (viewMonth: Date) => {
 const monthStart = startOfMonth(viewMonth)
 const daysInMonth = endOfMonth(viewMonth).getDate()
 const leadingEmptyCells = (monthStart.getDay() + 6) % 7
 const cells: Array<Date | null> = []

 for (let index = 0; index < leadingEmptyCells; index += 1) {
  cells.push(null)
 }

 for (let day = 1; day <= daysInMonth; day += 1) {
  cells.push(new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day))
 }

 while (cells.length % 7 !== 0) {
  cells.push(null)
 }

 return cells
}

export default function DialogDateField({
 label,
 value,
 onChange,
 error,
 helperText,
 min,
 max,
 options,
 emptyMessage = "No dates available right now.",
 pickerTitle = "Select Date",
 size = "default"
}: DialogDateFieldProps) {
 const fieldId = useId()
 const resolvedOptions = useMemo(() => options ?? [], [options])
 const hasOptionRestrictions = options !== undefined
 const minDate = useMemo(() => parseDateInputValue(min || ""), [min])
 const maxDate = useMemo(() => parseDateInputValue(max || ""), [max])
 const allowedDateSet = useMemo(() => {
  if (!hasOptionRestrictions) {
   return null
  }

  return new Set(resolvedOptions.filter((option) => !option.disabled).map((option) => option.value))
 }, [hasOptionRestrictions, resolvedOptions])
 const allowedMonthSet = useMemo(() => {
  if (!hasOptionRestrictions) {
   return null
  }

  return new Set(
   resolvedOptions
    .filter((option) => !option.disabled)
    .map((option) => parseDateInputValue(option.value))
    .filter((optionDate): optionDate is Date => Boolean(optionDate))
    .map((optionDate) => toMonthKey(optionDate))
  )
 }, [hasOptionRestrictions, resolvedOptions])
 const selectedDate = useMemo(() => parseDateInputValue(value), [value])
 const initialDate = useMemo(
  () =>
   resolveInitialDate({
    value,
    minDate,
    maxDate,
    allowedDateSet,
    options: resolvedOptions
   }),
  [allowedDateSet, maxDate, minDate, resolvedOptions, value]
 )
 const [open, setOpen] = useState(false)
 const [draftValue, setDraftValue] = useState(value)
 const [viewMonth, setViewMonth] = useState(() => startOfMonth(initialDate || startOfDay()))
 const selectedTextId = `${fieldId}-selected`
 const helperId = `${fieldId}-helper`
 const errorId = `${fieldId}-error`
 const describedBy = error
  ? `${selectedTextId} ${helperText ? helperId : ""} ${errorId}`.trim()
  : `${selectedTextId} ${helperText ? helperId : ""}`.trim()
 const draftDate = useMemo(() => parseDateInputValue(draftValue), [draftValue])
 const calendarCells = useMemo(() => buildCalendarCells(viewMonth), [viewMonth])
 const hasSelectableDates = Boolean(initialDate)
 const selectedOption = resolvedOptions.find((option) => option.value === value) || null
 const isCompact = size === "compact"

 const canViewMonth = (month: Date) => {
  if (allowedMonthSet && !allowedMonthSet.has(toMonthKey(month))) {
   return false
  }

  if (minDate && endOfMonth(month) < minDate) {
   return false
  }

  if (maxDate && startOfMonth(month) > maxDate) {
   return false
  }

  return true
 }

 useEffect(() => {
  if (!open) {
   return
  }

  const handleKeyDown = (event: KeyboardEvent) => {
   if (event.key === "Escape") {
    setOpen(false)
   }
  }

  window.addEventListener("keydown", handleKeyDown)

  return () => {
   window.removeEventListener("keydown", handleKeyDown)
  }
 }, [open])

 const openPicker = () => {
  if (!hasSelectableDates || !initialDate) {
   return
  }

  const resolvedDate =
   (selectedDate && isSelectableDate(selectedDate, minDate, maxDate, allowedDateSet) ? selectedDate : null) ||
   initialDate

  setDraftValue(toDateInputValue(resolvedDate))
  setViewMonth(startOfMonth(resolvedDate))
  setOpen(true)
 }

 return (
  <div
   role="group"
   aria-labelledby={`${fieldId}-label`}
   aria-describedby={describedBy}
   aria-invalid={Boolean(error)}
  >
   <p id={`${fieldId}-label`} style={styles.label}>{label}</p>

   <button
    type="button"
    className="kiosk-focus-ring touch-feedback"
    onClick={openPicker}
   disabled={!hasSelectableDates}
   style={{
     ...styles.trigger,
     ...(isCompact ? styles.triggerCompact : {}),
     ...(error ? styles.triggerError : {}),
     ...(!hasSelectableDates ? styles.triggerDisabled : {})
    }}
   >
    <span style={{ ...styles.triggerEyebrow, ...(isCompact ? styles.triggerEyebrowCompact : {}) }}>
     {pickerTitle}
    </span>
    <span style={{ ...styles.triggerValue, ...(isCompact ? styles.triggerValueCompact : {}) }}>
     {selectedDate ? formatHeaderDate(selectedDate) : "Tap to choose a date"}
    </span>
    <span id={selectedTextId} style={{ ...styles.triggerMeta, ...(isCompact ? styles.triggerMetaCompact : {}) }}>
     {selectedOption?.description ||
      (selectedDate ? `${formatWeekdayName(selectedDate)} selected` : hasSelectableDates ? "Calendar picker" : emptyMessage)}
    </span>
   </button>

   {(error || helperText) && (
    <p id={error ? errorId : helperId} style={error ? styles.errorText : styles.helperText}>
     {error || helperText}
    </p>
   )}

   {open && hasSelectableDates && (
   <div
     style={{
      ...styles.overlay,
      ...(isCompact ? styles.overlayCompact : {})
     }}
     role="dialog"
     aria-modal="true"
     aria-labelledby={`${fieldId}-dialog-title`}
     onClick={(event) => {
      if (event.target === event.currentTarget) {
       setOpen(false)
      }
     }}
    >
     <div
      style={{
       ...styles.dialog,
       ...(isCompact ? styles.dialogCompact : {})
      }}
     >
      <p
       id={`${fieldId}-dialog-title`}
       style={{
        ...styles.dialogEyebrow,
        ...(isCompact ? styles.dialogEyebrowCompact : {})
       }}
      >
       {pickerTitle}
      </p>
      <p
       style={{
        ...styles.dialogValue,
        ...(isCompact ? styles.dialogValueCompact : {})
       }}
      >
       {formatHeaderDate(draftDate)}
      </p>

      <div style={styles.monthRow}>
       <span
        style={{
         ...styles.monthLabel,
         ...(isCompact ? styles.monthLabelCompact : {})
        }}
       >
        {formatMonthLabel(viewMonth).toUpperCase()}
       </span>

       <div style={styles.monthActions}>
        <button
         type="button"
         className="kiosk-focus-ring touch-feedback"
         onClick={() => setViewMonth((current) => addMonths(current, -1))}
         disabled={!canViewMonth(addMonths(viewMonth, -1))}
         aria-label="Previous month"
         style={{
          ...styles.iconButton,
          ...(isCompact ? styles.iconButtonCompact : {})
         }}
        >
         ‹
        </button>
        <button
         type="button"
         className="kiosk-focus-ring touch-feedback"
         onClick={() => setViewMonth((current) => addMonths(current, 1))}
         disabled={!canViewMonth(addMonths(viewMonth, 1))}
         aria-label="Next month"
         style={{
          ...styles.iconButton,
          ...(isCompact ? styles.iconButtonCompact : {})
         }}
        >
         ›
        </button>
       </div>
      </div>

      <div
       style={{
        ...styles.weekdayRow,
        ...(isCompact ? styles.weekdayRowCompact : {})
       }}
      >
       {weekdayLabels.map((weekday) => (
        <span
         key={weekday}
         style={{
          ...styles.weekdayCell,
          ...(isCompact ? styles.weekdayCellCompact : {})
         }}
        >
         {weekday}
        </span>
       ))}
      </div>

      <div
       style={{
        ...styles.calendarGrid,
        ...(isCompact ? styles.calendarGridCompact : {})
       }}
      >
       {calendarCells.map((cell, index) => {
        if (!cell) {
         return <span key={`empty-${index}`} aria-hidden="true" />
        }

        const cellValue = toDateInputValue(cell)
        const disabled = !isSelectableDate(cell, minDate, maxDate, allowedDateSet)
        const selected = draftValue === cellValue
        const isToday = toDateInputValue(startOfDay()) === cellValue

        return (
         <button
          key={cellValue}
          type="button"
          className="kiosk-focus-ring touch-feedback"
          onClick={() => setDraftValue(cellValue)}
          disabled={disabled}
          aria-pressed={selected}
          style={{
           ...styles.dayButton,
           ...(isCompact ? styles.dayButtonCompact : {}),
           ...(selected ? styles.dayButtonActive : {}),
           ...(isToday && !selected ? styles.dayButtonToday : {}),
           ...(disabled ? styles.dayButtonDisabled : {})
          }}
         >
          {cell.getDate()}
         </button>
        )
       })}
      </div>

      <div
       style={{
        ...styles.footer,
        ...(isCompact ? styles.footerCompact : {})
       }}
      >
       <button
        type="button"
        className="kiosk-focus-ring touch-feedback"
        onClick={() => setOpen(false)}
        style={{
         ...styles.footerButton,
         ...(isCompact ? styles.footerButtonCompact : {})
        }}
       >
        Cancel
       </button>
       <button
        type="button"
        className="kiosk-focus-ring touch-feedback"
        onClick={() => {
         if (draftValue) {
          onChange(draftValue)
         }
         setOpen(false)
        }}
        style={{
         ...styles.footerButton,
         ...(isCompact ? styles.footerButtonCompact : {})
        }}
       >
        OK
       </button>
      </div>

      <p
       style={{
        ...styles.dialogHelper,
        ...(isCompact ? styles.dialogHelperCompact : {})
       }}
      >
       {draftValue ? formatDateReadable(draftValue) : emptyMessage}
      </p>
     </div>
    </div>
   )}
  </div>
 )
}

const styles: Record<string, CSSProperties> = {
 label: {
  color: colors.textSecondary,
  fontSize: "12px",
  textTransform: "uppercase",
  letterSpacing: "0.14em",
  fontWeight: 700,
  marginBottom: spacing.sm
 },
 trigger: {
  width: "100%",
  borderRadius: radius.lg,
  border: `1px solid ${accentBorder}`,
  background: "linear-gradient(180deg, rgba(9,16,20,0.98), rgba(6,12,16,0.98))",
  boxShadow: "0 22px 54px rgba(0,0,0,0.28)",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  alignItems: "flex-start",
  gap: "10px",
  textAlign: "left",
 cursor: "pointer"
 },
 triggerCompact: {
  padding: "12px 14px",
  gap: "6px",
  boxShadow: "0 16px 36px rgba(0,0,0,0.22)"
 },
 triggerError: {
  border: "1px solid #D97C6C"
 },
 triggerDisabled: {
  opacity: 0.56,
  cursor: "not-allowed"
 },
 triggerEyebrow: {
  color: colors.primaryLight,
 fontSize: "11px",
 fontWeight: 700,
 letterSpacing: "0.18em",
 textTransform: "uppercase"
 },
 triggerEyebrowCompact: {
  fontSize: "10px",
  letterSpacing: "0.14em"
 },
 triggerValue: {
  color: colors.textPrimary,
  fontFamily: typography.subtitle.fontFamily,
  fontSize: "clamp(24px, 3vw, 34px)",
  lineHeight: 1.08
 },
 triggerValueCompact: {
  fontSize: "clamp(18px, 2.2vw, 24px)",
  lineHeight: 1.12
 },
 triggerMeta: {
  color: colors.textSecondary,
  fontSize: "13px",
  lineHeight: 1.4
 },
 triggerMetaCompact: {
  fontSize: "12px",
  lineHeight: 1.35
 },
 helperText: {
  marginTop: spacing.sm,
  color: colors.textMuted,
  fontSize: "13px"
 },
 errorText: {
  marginTop: spacing.sm,
  color: "#F1A596",
  fontSize: "13px",
  lineHeight: 1.5
 },
 overlay: {
  position: "fixed",
  inset: 0,
  zIndex: 140,
  background: "rgba(3,8,12,0.72)",
  backdropFilter: "blur(6px)",
  display: "flex",
  alignItems: "center",
 justifyContent: "center",
  padding: "20px"
 },
 overlayCompact: {
  padding: "10px"
 },
 dialog: {
  width: "min(100%, 560px)",
  borderRadius: "16px",
  background: "linear-gradient(180deg, #334047, #2a353d)",
  boxShadow: "0 36px 120px rgba(0,0,0,0.42)",
  padding: "26px 24px 20px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
  maxHeight: "min(88vh, 760px)",
  overflowY: "auto"
 },
 dialogCompact: {
  width: "min(100%, 380px)",
  padding: "16px 14px 12px",
  gap: "10px",
  maxHeight: "min(68vh, 470px)"
 },
 dialogEyebrow: {
  color: "rgba(243, 248, 249, 0.82)",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.18em",
  textTransform: "uppercase"
 },
 dialogEyebrowCompact: {
  fontSize: "10px",
  letterSpacing: "0.12em"
 },
 dialogValue: {
  color: accentColor,
  fontFamily: typography.subtitle.fontFamily,
  fontSize: "clamp(34px, 5vw, 58px)",
  lineHeight: 1
 },
 dialogValueCompact: {
  fontSize: "clamp(22px, 3.6vw, 30px)"
 },
 monthRow: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px"
 },
 monthLabel: {
  color: "rgba(243, 248, 249, 0.72)",
 fontSize: "14px",
 fontWeight: 700,
 letterSpacing: "0.14em"
 },
 monthLabelCompact: {
  fontSize: "11px"
 },
 monthActions: {
  display: "flex",
  alignItems: "center",
  gap: "8px"
 },
 iconButton: {
  width: "38px",
  height: "38px",
  borderRadius: "999px",
  border: "none",
  background: "transparent",
  color: "rgba(243, 248, 249, 0.72)",
 fontSize: "26px",
 cursor: "pointer"
 },
 iconButtonCompact: {
  width: "28px",
  height: "28px",
  fontSize: "18px"
 },
 weekdayRow: {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "8px"
 },
 weekdayRowCompact: {
  gap: "3px"
 },
 weekdayCell: {
  textAlign: "center",
  color: "rgba(243, 248, 249, 0.82)",
  fontSize: "13px",
  fontWeight: 700,
  paddingBottom: "4px"
 },
 weekdayCellCompact: {
  fontSize: "10px",
  paddingBottom: "2px"
 },
 calendarGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(7, minmax(0, 1fr))",
  gap: "8px"
 },
 calendarGridCompact: {
  gap: "3px"
 },
 dayButton: {
  aspectRatio: "1 / 1",
  minHeight: "42px",
  borderRadius: "999px",
  border: "1px solid transparent",
  background: "transparent",
  color: "rgba(243, 248, 249, 0.82)",
  fontSize: "16px",
  cursor: "pointer"
 },
 dayButtonCompact: {
  minHeight: "30px",
  fontSize: "13px"
 },
 dayButtonActive: {
  background: accentFill,
  color: colors.textOnAccent,
  fontWeight: 800
 },
 dayButtonToday: {
  border: `1px solid ${accentBorder}`
 },
 dayButtonDisabled: {
  opacity: 0.2,
  cursor: "not-allowed"
 },
 footer: {
  display: "flex",
  justifyContent: "flex-end",
 gap: "12px",
  marginTop: "4px"
 },
 footerCompact: {
  gap: "6px",
  marginTop: 0
 },
 footerButton: {
  border: "none",
  background: "transparent",
  color: accentColor,
  fontSize: "16px",
  fontWeight: 700,
  letterSpacing: "0.08em",
 textTransform: "uppercase",
 cursor: "pointer",
 padding: "8px 10px"
 },
 footerButtonCompact: {
  fontSize: "13px",
  padding: "4px 6px"
 },
 dialogHelper: {
  color: "rgba(243, 248, 249, 0.64)",
  fontSize: "12px",
  lineHeight: 1.5
 },
 dialogHelperCompact: {
  fontSize: "10px",
  lineHeight: 1.4
 }
}
