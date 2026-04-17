import { useId, useMemo, useRef, useState, type KeyboardEvent } from "react"
import { colors, radius, spacing } from "../../styles/GlobalStyles"
import {
 formatTwelveHourTime,
 parseTwelveHourTime,
 type ParsedTwelveHourTime
} from "../../utils/dateTimeSelector"
import type { SlotAvailability } from "./SlotDateSelector"

export interface TimeSlotOption {
 value: string
 label: string
 description?: string
 availability?: SlotAvailability
}

interface TimeSelectorProps {
 label: string
 value: string
 onChange: (value: string) => void
 options: TimeSlotOption[]
 error?: string
 helperText?: string
 emptyMessage?: string
 allowCustom?: boolean
 customHeading?: string
 customOnly?: boolean
}

const segmentedMinuteOptions = ["00", "15", "30", "45"] as const
const periodOptions = ["AM", "PM"] as const

const getAvailabilityLabel = (availability: SlotAvailability) => {
 if (availability === "limited") {
  return "Limited"
 }

 if (availability === "unavailable") {
  return "Unavailable"
 }

 return "Available"
}

const buildUpdatedCustomTime = (
 current: ParsedTwelveHourTime | null,
 updates: Partial<ParsedTwelveHourTime>
) => {
 const next: ParsedTwelveHourTime = {
  hour: updates.hour ?? current?.hour ?? 9,
  minute: updates.minute ?? current?.minute ?? "00",
  period: updates.period ?? current?.period ?? "AM"
 }

 return next
}

const clampHour = (hour: number) => Math.max(1, Math.min(12, Math.round(hour)))
const clampMinute = (minute: number) =>
 String(Math.max(0, Math.min(59, Math.round(minute)))).padStart(2, "0")

export default function TimeSelector({
 label,
 value,
 onChange,
 options,
 error,
 helperText,
 emptyMessage = "No time slots available.",
 allowCustom = false,
 customHeading = "Or set a custom time",
 customOnly = false
}: TimeSelectorProps) {
 const fieldId = useId()
 const selectedPreset = customOnly ? null : options.find((option) => option.value === value) ?? null
 const initialParsedTime = useMemo(() => parseTwelveHourTime(value), [value])
 const [customMode, setCustomMode] = useState(
  Boolean(customOnly || (allowCustom && !selectedPreset && initialParsedTime))
 )
 const [customTime, setCustomTime] = useState<ParsedTwelveHourTime | null>(initialParsedTime)
 const optionRefs = useRef<Array<HTMLButtonElement | null>>([])
 const selectedTextId = `${fieldId}-selected`
 const helperId = `${fieldId}-helper`
 const errorId = `${fieldId}-error`
 const hourInputId = `${fieldId}-hour`
 const minuteInputId = `${fieldId}-minute`
 const describedBy = error
  ? `${selectedTextId} ${helperText ? helperId : ""} ${errorId}`.trim()
  : `${selectedTextId} ${helperText ? helperId : ""}`.trim()

 const applyCustomSelection = (updates: Partial<ParsedTwelveHourTime>) => {
  const nextCustomTime = buildUpdatedCustomTime(customTime, updates)
  setCustomTime(nextCustomTime)
  onChange(formatTwelveHourTime(nextCustomTime))
 }

 const bootstrapCustomTime = () => {
  if (customTime) {
   return
  }

  setCustomTime(
   parseTwelveHourTime(value) || {
    hour: 9,
    minute: "00",
    period: "AM"
   }
  )
 }

 const handleHourInputChange = (rawValue: string) => {
  if (!rawValue) {
   return
  }

  const parsed = Number(rawValue)

  if (!Number.isFinite(parsed)) {
   return
  }

  applyCustomSelection({ hour: clampHour(parsed) })
 }

 const handleMinuteInputChange = (rawValue: string) => {
  if (!rawValue) {
   return
  }

  const parsed = Number(rawValue)

  if (!Number.isFinite(parsed)) {
   return
  }

  applyCustomSelection({ minute: clampMinute(parsed) })
 }

 const hasSlots = !customOnly && options.length > 0

 const getNextEnabledIndex = (startIndex: number, step: 1 | -1) => {
  if (options.length === 0) {
   return -1
  }

  for (let offset = 1; offset <= options.length; offset += 1) {
   const nextIndex = (startIndex + step * offset + options.length) % options.length
   const availability = options[nextIndex]?.availability || "available"

   if (availability !== "unavailable") {
    return nextIndex
   }
  }

  return -1
 }

 const getEdgeEnabledIndex = (edge: "start" | "end") => {
  if (options.length === 0) {
   return -1
  }

  if (edge === "start") {
   return options.findIndex((option) => (option.availability || "available") !== "unavailable")
  }

  for (let index = options.length - 1; index >= 0; index -= 1) {
   const option = options[index]

   if ((option?.availability || "available") !== "unavailable") {
    return index
   }
  }

  return -1
 }

 const moveToOption = (index: number) => {
  const option = options[index]

  if (!option) {
   return
  }

  if ((option.availability || "available") !== "unavailable") {
   setCustomMode(false)
   onChange(option.value)
   optionRefs.current[index]?.focus()
  }
 }

 const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
  if (event.key === "Home") {
   event.preventDefault()
   const firstEnabledIndex = getEdgeEnabledIndex("start")

   if (firstEnabledIndex >= 0) {
    moveToOption(firstEnabledIndex)
   }
   return
  }

  if (event.key === "End") {
   event.preventDefault()
   const lastEnabledIndex = getEdgeEnabledIndex("end")

   if (lastEnabledIndex >= 0) {
    moveToOption(lastEnabledIndex)
   }
   return
  }

  if (
   event.key !== "ArrowRight" &&
   event.key !== "ArrowDown" &&
   event.key !== "ArrowLeft" &&
   event.key !== "ArrowUp"
  ) {
   return
  }

  event.preventDefault()

  const nextIndex = getNextEnabledIndex(
   index,
   event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1
  )

  if (nextIndex >= 0) {
   moveToOption(nextIndex)
  }
 }

 const showCustomControls = customOnly || customMode

 return (
  <div
   role="group"
   aria-labelledby={`${fieldId}-label`}
   aria-describedby={describedBy}
   aria-invalid={Boolean(error)}
  >
   <p id={`${fieldId}-label`} style={styles.label}>{label}</p>

   <div style={{ ...styles.surface, ...(error ? styles.surfaceError : {}) }}>
    {hasSlots ? (
     <div style={styles.slotGrid} role="radiogroup" aria-label={label}>
      {options.map((option, index) => {
       const availability = option.availability || "available"
       const selected = option.value === value
       const disabled = availability === "unavailable"

       return (
        <button
         className="kiosk-focus-ring"
         key={option.value}
         ref={(element) => {
          optionRefs.current[index] = element
         }}
         type="button"
         role="radio"
         aria-checked={selected}
         disabled={disabled}
         onKeyDown={(event) => handleOptionKeyDown(event, index)}
         onClick={() => {
          if (disabled) {
           return
          }

          setCustomMode(false)
          onChange(option.value)
         }}
         style={{
          ...styles.slotCard,
          ...(selected ? styles.slotCardActive : {}),
          ...(disabled ? styles.slotCardDisabled : {})
         }}
        >
         <span style={styles.slotTitle}>{option.label}</span>
         <span style={styles.slotMeta}>
          {option.description || (index === 0 && availability === "available" ? "Recommended" : getAvailabilityLabel(availability))}
         </span>
        </button>
       )
      })}
     </div>
    ) : !customOnly ? (
     <div style={styles.emptyState}>{emptyMessage}</div>
    ) : null}

    {allowCustom && (
     <div style={styles.customPanel}>
      {!customOnly && (
       <button
        className="kiosk-focus-ring"
        type="button"
        aria-expanded={customMode}
        onClick={() => {
         setCustomMode((current) => !current)
         bootstrapCustomTime()
        }}
        style={{
         ...styles.customToggle,
         ...(customMode ? styles.customToggleActive : {})
        }}
       >
        {customMode ? "Hide Custom Time" : customHeading}
       </button>
      )}

      {showCustomControls && (
       <div style={styles.customControls}>
        {customOnly ? (
         <div style={styles.manualLayout}>
          <div style={styles.manualTimeField}>
           <label htmlFor={hourInputId} style={styles.customControlLabel}>Hour</label>
           <input
            id={hourInputId}
            className="kiosk-focus-ring"
            inputMode="numeric"
            type="number"
            min={1}
            max={12}
            step={1}
            value={customTime?.hour ?? ""}
            onFocus={bootstrapCustomTime}
            onChange={(event) => handleHourInputChange(event.target.value)}
            style={styles.manualInput}
            placeholder="1-12"
           />
          </div>

          <div style={styles.manualTimeField}>
           <label htmlFor={minuteInputId} style={styles.customControlLabel}>Minute</label>
           <input
            id={minuteInputId}
            className="kiosk-focus-ring"
            inputMode="numeric"
            type="number"
            min={0}
            max={59}
            step={1}
            value={customTime ? Number(customTime.minute) : ""}
            onFocus={bootstrapCustomTime}
            onChange={(event) => handleMinuteInputChange(event.target.value)}
            style={styles.manualInput}
            placeholder="00-59"
           />
          </div>

          <div style={styles.manualTimeField}>
           <p style={styles.customControlLabel}>Period</p>
           <div style={styles.segmentRow}>
            {periodOptions.map((period) => (
             <button
              className="kiosk-focus-ring"
              key={period}
              type="button"
              aria-pressed={customTime?.period === period}
              onClick={() => {
               bootstrapCustomTime()
               applyCustomSelection({ period })
              }}
              style={{
               ...styles.segmentButton,
               ...(customTime?.period === period ? styles.segmentButtonActive : {})
              }}
             >
              {period}
             </button>
            ))}
           </div>
          </div>
         </div>
        ) : (
         <>
          <div>
           <p style={styles.customControlLabel}>Hour</p>
           <div style={styles.segmentRow}>
            {Array.from({ length: 12 }, (_, index) => index + 1).map((hour) => (
             <button
              className="kiosk-focus-ring"
              key={hour}
              type="button"
              aria-pressed={customTime?.hour === hour}
              onClick={() => applyCustomSelection({ hour })}
              style={{
               ...styles.segmentButton,
               ...(customTime?.hour === hour ? styles.segmentButtonActive : {})
              }}
             >
              {hour}
             </button>
            ))}
           </div>
          </div>

          <div>
           <p style={styles.customControlLabel}>Minute</p>
           <div style={styles.segmentRow}>
            {segmentedMinuteOptions.map((minute) => (
             <button
              className="kiosk-focus-ring"
              key={minute}
              type="button"
              aria-pressed={customTime?.minute === minute}
              onClick={() => applyCustomSelection({ minute })}
              style={{
               ...styles.segmentButton,
               ...(customTime?.minute === minute ? styles.segmentButtonActive : {})
              }}
             >
              {minute}
             </button>
            ))}
           </div>
          </div>

          <div>
           <p style={styles.customControlLabel}>Period</p>
           <div style={styles.segmentRow}>
            {periodOptions.map((period) => (
             <button
              className="kiosk-focus-ring"
              key={period}
              type="button"
              aria-pressed={customTime?.period === period}
              onClick={() => applyCustomSelection({ period })}
              style={{
               ...styles.segmentButton,
               ...(customTime?.period === period ? styles.segmentButtonActive : {})
              }}
             >
              {period}
             </button>
            ))}
           </div>
          </div>
         </>
        )}
       </div>
      )}
     </div>
    )}

    <p id={selectedTextId} style={styles.selectedText} aria-live="polite">
     Selected time: {value || "Not selected"}
    </p>
   </div>

   {(error || helperText) && (
    <p id={error ? errorId : helperId} style={error ? styles.errorText : styles.helperText}>
     {error || helperText}
    </p>
   )}
  </div>
 )
}

const styles = {
 label: {
  color: colors.textSecondary,
  fontSize: "12px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
  fontWeight: 700,
  marginBottom: spacing.sm
 },
 surface: {
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderStrong}`,
  background:
   "radial-gradient(circle at top right, rgba(243,224,182,0.14), transparent 36%), linear-gradient(160deg, rgba(20,32,40,0.98), rgba(10,18,25,0.96))",
  boxShadow: "0 20px 52px rgba(0,0,0,0.25)",
  padding: "14px"
 },
 surfaceError: {
  border: "1px solid #D97C6C"
 },
 slotGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 148px), 1fr))",
  gap: "8px"
 },
 slotCard: {
  minHeight: "74px",
  borderRadius: "14px",
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textPrimary,
  padding: "10px 12px",
  textAlign: "left" as const,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  gap: "8px",
  cursor: "pointer",
  transition: "border-color 0.22s ease, background 0.22s ease, transform 0.18s ease"
 },
 slotCardActive: {
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(135deg, rgba(200,169,108,0.22), rgba(106,166,154,0.15))"
 },
 slotCardDisabled: {
  opacity: 0.42,
  cursor: "not-allowed"
 },
 slotTitle: {
  color: colors.textPrimary,
  fontSize: "14px",
  fontWeight: 700
 },
 slotMeta: {
  color: colors.primaryLight,
  fontSize: "11px",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  fontWeight: 700
 },
 emptyState: {
  borderRadius: radius.md,
  border: `1px dashed ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textSecondary,
  padding: "12px",
  fontSize: "13px"
 },
 customPanel: {
  marginTop: "12px",
  paddingTop: "12px",
  borderTop: `1px solid ${colors.border}`
 },
 customToggle: {
  width: "100%",
  minHeight: "44px",
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.primaryLight,
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  cursor: "pointer",
  transition: "border-color 0.22s ease, background 0.22s ease, transform 0.18s ease"
 },
 customToggleActive: {
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(135deg, rgba(200,169,108,0.2), rgba(106,166,154,0.14))"
 },
 customControls: {
  marginTop: "10px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px"
 },
 customControlLabel: {
  color: colors.textMuted,
  fontSize: "11px",
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
  marginBottom: "6px",
  fontWeight: 700
 },
 manualLayout: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 136px), 1fr))",
  gap: "10px",
  alignItems: "end"
 },
 manualTimeField: {
  display: "flex",
  flexDirection: "column" as const
 },
 manualInput: {
  minHeight: "44px",
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textPrimary,
  padding: "0 12px",
  fontSize: "16px",
  fontWeight: 700
 },
 segmentRow: {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "6px"
 },
 segmentButton: {
  minWidth: "52px",
  minHeight: "40px",
  borderRadius: "999px",
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textPrimary,
  padding: "8px 10px",
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 700,
  transition: "border-color 0.2s ease, background 0.2s ease, transform 0.16s ease"
 },
 segmentButtonActive: {
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(135deg, rgba(200,169,108,0.22), rgba(106,166,154,0.14))"
 },
 selectedText: {
  marginTop: "12px",
  color: colors.textSecondary,
  fontSize: "13px"
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
 }
}
