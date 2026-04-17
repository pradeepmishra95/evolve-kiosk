import { useEffect, useId, useMemo, useState, type CSSProperties } from "react"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"
import {
 formatTwelveHourTime,
 parseTwelveHourTime,
 type ParsedTwelveHourTime
} from "../../utils/dateTimeSelector"

export type DialogTimeAvailability = "available" | "limited" | "unavailable"

export interface DialogTimeOption {
 value: string
 label: string
 description?: string
 availability?: DialogTimeAvailability
}

interface DialogTimeFieldProps {
 label: string
 value: string
 onChange: (value: string) => void
 options?: DialogTimeOption[]
 error?: string
 helperText?: string
 emptyMessage?: string
 allowCustom?: boolean
 customOnly?: boolean
 pickerTitle?: string
 size?: "default" | "compact"
}

const accentColor = colors.primaryLight
const accentFill = colors.primary
const accentBorder = colors.borderStrong
const accentSurface = "rgba(200,169,108,0.14)"
const accentSurfaceStrong = "rgba(200,169,108,0.2)"
const hourDialValues = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const
const minuteDialValues = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"] as const

const padHour = (hour: number) => String(hour).padStart(2, "0")

const isSameTime = (left: ParsedTwelveHourTime, right: ParsedTwelveHourTime) =>
 left.hour === right.hour && left.minute === right.minute && left.period === right.period

const findMatchingOption = (timeValue: string, options: DialogTimeOption[]) => {
 if (!timeValue) {
  return null
 }

 const exactMatch = options.find((option) => option.value === timeValue)

 if (exactMatch) {
  return exactMatch
 }

 const parsedTime = parseTwelveHourTime(timeValue)

 if (!parsedTime) {
  return null
 }

 return (
  options.find((option) => {
   const parsedOption = parseTwelveHourTime(option.value)

   return parsedOption ? isSameTime(parsedOption, parsedTime) : false
  }) || null
 )
}

const resolveInitialTime = (value: string, options: DialogTimeOption[]) => {
 const selectedTime = parseTwelveHourTime(value)

 if (selectedTime) {
  return selectedTime
 }

 for (const option of options) {
  if ((option.availability || "available") === "unavailable") {
   continue
  }

  const parsedOption = parseTwelveHourTime(option.value)

  if (parsedOption) {
   return parsedOption
  }
 }

 return {
  hour: 10,
  minute: "00",
  period: "AM"
 } satisfies ParsedTwelveHourTime
}

const buildNextTime = (
 current: ParsedTwelveHourTime,
 updates: Partial<ParsedTwelveHourTime>
): ParsedTwelveHourTime => ({
 hour: updates.hour ?? current.hour,
 minute: updates.minute ?? current.minute,
 period: updates.period ?? current.period
})

const getClockPoint = (index: number, total: number, radius: number) => {
 const angle = (Math.PI * 2 * index) / total - Math.PI / 2

 return {
  x: 50 + Math.cos(angle) * radius,
  y: 50 + Math.sin(angle) * radius
 }
}

export default function DialogTimeField({
 label,
 value,
 onChange,
 options = [],
 error,
 helperText,
 emptyMessage = "No time options available.",
 allowCustom = false,
 customOnly = false,
 pickerTitle = "Select Time",
 size = "default"
}: DialogTimeFieldProps) {
 const fieldId = useId()
 const enabledOptions = useMemo(
  () => options.filter((option) => (option.availability || "available") !== "unavailable"),
  [options]
 )
 const selectedOption = findMatchingOption(value, enabledOptions)
 const [open, setOpen] = useState(false)
 const [draftTime, setDraftTime] = useState<ParsedTwelveHourTime>(() => resolveInitialTime(value, enabledOptions))
 const [draftPresetValue, setDraftPresetValue] = useState<string | null>(
  selectedOption ? selectedOption.value : null
 )
 const [activeSegment, setActiveSegment] = useState<"hour" | "minute">("minute")
 const selectedTextId = `${fieldId}-selected`
 const helperId = `${fieldId}-helper`
 const errorId = `${fieldId}-error`
 const describedBy = error
  ? `${selectedTextId} ${helperText ? helperId : ""} ${errorId}`.trim()
  : `${selectedTextId} ${helperText ? helperId : ""}`.trim()
 const canOpen = customOnly || allowCustom || enabledOptions.length > 0
 const showDial = customOnly || allowCustom
 const displayValue = selectedOption?.label || value || "Tap to choose a time"
 const isCompact = size === "compact"
 const dialPoints = useMemo(
  () =>
   (activeSegment === "hour" ? hourDialValues : minuteDialValues).map((_, index, collection) =>
    getClockPoint(index, collection.length, 36)
   ),
  [activeSegment]
 )

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
  if (!canOpen) {
   return
  }

  const initialTime = resolveInitialTime(value, enabledOptions)
  setDraftTime(initialTime)
  setDraftPresetValue(selectedOption ? selectedOption.value : null)
  setActiveSegment("minute")
  setOpen(true)
 }

 const updateManualTime = (updates: Partial<ParsedTwelveHourTime>) => {
  setDraftPresetValue(null)
  setDraftTime((current) => buildNextTime(current, updates))
 }

 const selectedDialIndex =
  activeSegment === "hour"
   ? hourDialValues.findIndex((hour) => hour === draftTime.hour)
   : minuteDialValues.findIndex((minute) => minute === draftTime.minute)
 const selectedDialPoint = selectedDialIndex >= 0 ? dialPoints[selectedDialIndex] : null

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
    disabled={!canOpen}
    style={{
     ...styles.trigger,
     ...(isCompact ? styles.triggerCompact : {}),
     ...(error ? styles.triggerError : {}),
     ...(!canOpen ? styles.triggerDisabled : {})
    }}
   >
    <span style={{ ...styles.triggerEyebrow, ...(isCompact ? styles.triggerEyebrowCompact : {}) }}>
     {pickerTitle}
    </span>
    <span style={{ ...styles.triggerValue, ...(isCompact ? styles.triggerValueCompact : {}) }}>
     {displayValue}
    </span>
    <span id={selectedTextId} style={{ ...styles.triggerMeta, ...(isCompact ? styles.triggerMetaCompact : {}) }}>
     {selectedOption?.description ||
      (enabledOptions.length > 0
       ? `${enabledOptions.length} available slot${enabledOptions.length === 1 ? "" : "s"}`
       : canOpen
        ? "Manual time picker"
        : emptyMessage)}
    </span>
   </button>

   {(error || helperText) && (
    <p id={error ? errorId : helperId} style={error ? styles.errorText : styles.helperText}>
     {error || helperText}
    </p>
   )}

   {open && (
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

      <div
       style={{
        ...styles.digitalRow,
        ...(isCompact ? styles.digitalRowCompact : {})
       }}
      >
       <button
        type="button"
        className="kiosk-focus-ring touch-feedback"
        onClick={() => setActiveSegment("hour")}
        disabled={!showDial}
        style={{
         ...styles.digitalButton,
         ...(isCompact ? styles.digitalButtonCompact : {}),
         ...(activeSegment === "hour" ? styles.digitalButtonActive : {})
        }}
       >
        {padHour(draftTime.hour)}
       </button>

       <span
        style={{
         ...styles.digitalSeparator,
         ...(isCompact ? styles.digitalSeparatorCompact : {})
        }}
       >
        :
       </span>

       <button
        type="button"
        className="kiosk-focus-ring touch-feedback"
        onClick={() => setActiveSegment("minute")}
        disabled={!showDial}
        style={{
         ...styles.digitalButton,
         ...(isCompact ? styles.digitalButtonCompact : {}),
         ...(activeSegment === "minute" ? styles.digitalButtonActive : {})
        }}
       >
        {draftTime.minute}
       </button>

       <div
        style={{
         ...styles.periodColumn,
         ...(isCompact ? styles.periodColumnCompact : {})
        }}
       >
        {(["AM", "PM"] as const).map((period) => (
         <button
          key={period}
          type="button"
          className="kiosk-focus-ring touch-feedback"
          disabled={!showDial}
          onClick={() => updateManualTime({ period })}
          style={{
           ...styles.periodButton,
           ...(isCompact ? styles.periodButtonCompact : {}),
           ...(draftTime.period === period ? styles.periodButtonActive : {}),
           ...(!showDial ? styles.controlDisabled : {})
          }}
         >
          {period}
         </button>
        ))}
       </div>
      </div>

      {enabledOptions.length > 0 && (
       <div
        style={{
         ...styles.slotSection,
         ...(isCompact ? styles.slotSectionCompact : {})
        }}
       >
        <p
         style={{
          ...styles.slotSectionLabel,
          ...(isCompact ? styles.slotSectionLabelCompact : {})
         }}
        >
         Available Slots
        </p>
        <div
         style={{
          ...styles.slotGrid,
          ...(isCompact ? styles.slotGridCompact : {})
         }}
        >
         {enabledOptions.map((option) => {
          const selected = draftPresetValue === option.value

          return (
           <button
            key={option.value}
            type="button"
            className="kiosk-focus-ring touch-feedback"
            onClick={() => {
             const parsedOption = parseTwelveHourTime(option.value)

             if (!parsedOption) {
              return
             }

             setDraftTime(parsedOption)
             setDraftPresetValue(option.value)
            }}
            style={{
             ...styles.slotButton,
             ...(isCompact ? styles.slotButtonCompact : {}),
             ...(selected ? styles.slotButtonActive : {})
            }}
           >
            <span
             style={{
              ...styles.slotTitle,
              ...(isCompact ? styles.slotTitleCompact : {})
             }}
            >
             {option.label}
            </span>
            <span
             style={{
              ...styles.slotMeta,
              ...(isCompact ? styles.slotMetaCompact : {})
             }}
            >
             {option.description || "Available"}
            </span>
           </button>
          )
         })}
        </div>
       </div>
      )}

      {showDial && (
       <div
        style={{
         ...styles.clockSection,
         ...(isCompact ? styles.clockSectionCompact : {})
        }}
       >
        <p
         style={{
          ...styles.slotSectionLabel,
          ...(isCompact ? styles.slotSectionLabelCompact : {})
         }}
        >
         {activeSegment === "hour" ? "Choose Hour" : "Choose Minute"}
        </p>

        <div
         style={{
          ...styles.clockFace,
          ...(isCompact ? styles.clockFaceCompact : {})
         }}
        >
         <svg
          viewBox="0 0 100 100"
          aria-hidden="true"
          style={{
           ...styles.clockHandLayer,
           ...(isCompact ? styles.clockHandLayerCompact : {})
          }}
         >
          <circle cx="50" cy="50" r="3.2" fill={accentColor} />
          {selectedDialPoint && (
           <line
            x1="50"
            y1="50"
            x2={selectedDialPoint.x}
            y2={selectedDialPoint.y}
            stroke={accentColor}
            strokeWidth="1.4"
            strokeLinecap="round"
           />
          )}
         </svg>

         {(activeSegment === "hour" ? hourDialValues : minuteDialValues).map((dialValue, index) => {
          const isSelected =
           activeSegment === "hour" ? draftTime.hour === dialValue : draftTime.minute === dialValue
          const point = dialPoints[index]

          return (
           <button
            key={String(dialValue)}
            type="button"
            className="kiosk-focus-ring touch-feedback"
            onClick={() => {
             if (activeSegment === "hour") {
              updateManualTime({ hour: Number(dialValue) })
             } else {
              updateManualTime({ minute: String(dialValue).padStart(2, "0") })
             }
            }}
            style={{
             ...styles.clockValueButton,
             ...(isCompact ? styles.clockValueButtonCompact : {}),
             left: `${point.x}%`,
             top: `${point.y}%`,
             ...(isSelected ? styles.clockValueButtonActive : {})
           }}
          >
           {dialValue}
           </button>
          )
         })}
        </div>
       </div>
      )}

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
         onChange(draftPresetValue || formatTwelveHourTime(draftTime))
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
  background: "linear-gradient(180deg, #1a252d, #101920)",
  boxShadow: "0 36px 120px rgba(0,0,0,0.42)",
  padding: "26px 24px 20px",
  display: "flex",
  flexDirection: "column",
  gap: "18px",
  maxHeight: "min(88vh, 760px)",
  overflowY: "auto"
 },
 dialogCompact: {
  width: "min(100%, 390px)",
  padding: "16px 14px 12px",
  gap: "10px",
  maxHeight: "min(70vh, 500px)"
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
 digitalRow: {
  display: "grid",
  gridTemplateColumns: "minmax(0, 1fr) auto minmax(0, 1fr) auto",
  alignItems: "stretch",
  gap: "12px"
 },
 digitalRowCompact: {
  gap: "6px"
 },
 digitalButton: {
  minHeight: "90px",
  borderRadius: "12px",
  border: `1px solid ${accentBorder}`,
  background: "rgba(255,255,255,0.04)",
  color: "rgba(243,248,249,0.84)",
  fontSize: "clamp(44px, 6vw, 64px)",
  fontWeight: 300,
  cursor: "pointer"
 },
 digitalButtonCompact: {
  minHeight: "56px",
  fontSize: "clamp(26px, 4vw, 34px)"
 },
 digitalButtonActive: {
  border: `1px solid ${colors.primaryLight}`,
  boxShadow: "0 0 0 1px rgba(200,169,108,0.24) inset"
 },
 digitalSeparator: {
  color: "rgba(243,248,249,0.82)",
 fontSize: "clamp(44px, 6vw, 64px)",
 lineHeight: "90px",
 fontWeight: 700
 },
 digitalSeparatorCompact: {
  fontSize: "clamp(26px, 4vw, 34px)",
  lineHeight: "56px"
 },
 periodColumn: {
  display: "grid",
  gridTemplateRows: "repeat(2, minmax(0, 1fr))",
  gap: "8px"
 },
 periodColumnCompact: {
  gap: "4px"
 },
 periodButton: {
  minWidth: "82px",
  borderRadius: "12px",
  border: `1px solid ${accentBorder}`,
  background: "rgba(255,255,255,0.04)",
  color: "rgba(243,248,249,0.84)",
  fontSize: "18px",
  fontWeight: 700,
  cursor: "pointer"
 },
 periodButtonCompact: {
  minWidth: "58px",
  fontSize: "13px"
 },
 periodButtonActive: {
  border: `1px solid ${colors.primaryLight}`,
  background: accentSurface
 },
 controlDisabled: {
  opacity: 0.5,
  cursor: "not-allowed"
 },
 slotSection: {
  display: "flex",
  flexDirection: "column",
 gap: "10px"
 },
 slotSectionCompact: {
  gap: "6px"
 },
 slotSectionLabel: {
  color: "rgba(243,248,249,0.82)",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.16em",
  textTransform: "uppercase"
 },
 slotSectionLabelCompact: {
  fontSize: "10px",
  letterSpacing: "0.1em"
 },
 slotGrid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 132px), 1fr))",
  gap: "10px"
 },
 slotGridCompact: {
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 104px), 1fr))",
  gap: "6px"
 },
 slotButton: {
  minHeight: "76px",
  borderRadius: "12px",
  border: `1px solid ${accentBorder}`,
  background: "rgba(255,255,255,0.03)",
  color: "rgba(243,248,249,0.9)",
  padding: "12px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  alignItems: "flex-start",
  textAlign: "left",
  gap: "8px",
  cursor: "pointer"
 },
 slotButtonCompact: {
  minHeight: "54px",
  padding: "8px",
  gap: "4px"
 },
 slotButtonActive: {
  border: `1px solid ${colors.primaryLight}`,
  background: accentSurfaceStrong
 },
 slotTitle: {
 fontSize: "15px",
 fontWeight: 700
 },
 slotTitleCompact: {
  fontSize: "13px"
 },
 slotMeta: {
  fontSize: "11px",
  textTransform: "uppercase",
  letterSpacing: "0.12em",
  color: accentColor,
  fontWeight: 700
 },
 slotMetaCompact: {
  fontSize: "9px"
 },
 clockSection: {
  display: "flex",
  flexDirection: "column",
  gap: "12px"
 },
 clockSectionCompact: {
  gap: "8px"
 },
 clockFace: {
  position: "relative",
  width: "min(100%, 320px)",
  aspectRatio: "1 / 1",
  alignSelf: "center",
  borderRadius: "50%",
  background: "radial-gradient(circle at center, rgba(60,80,101,0.86), rgba(42,56,72,0.96))",
  boxShadow: "inset 0 10px 30px rgba(255,255,255,0.02)"
 },
 clockFaceCompact: {
  width: "min(100%, 206px)"
 },
 clockHandLayer: {
  position: "absolute",
  inset: "18%",
  width: "64%",
  height: "64%",
  overflow: "visible"
 },
 clockHandLayerCompact: {
  inset: "21%",
  width: "58%",
  height: "58%"
 },
 clockValueButton: {
  position: "absolute",
  transform: "translate(-50%, -50%)",
  width: "46px",
  height: "46px",
  borderRadius: "999px",
  border: "1px solid transparent",
  background: "transparent",
  color: "rgba(243,248,249,0.82)",
  fontSize: "15px",
  fontWeight: 700,
  cursor: "pointer"
 },
 clockValueButtonCompact: {
  width: "30px",
  height: "30px",
  fontSize: "11px"
 },
 clockValueButtonActive: {
  background: accentFill,
  color: colors.textOnAccent
 },
 footer: {
  display: "flex",
 justifyContent: "flex-end",
  gap: "12px"
 },
 footerCompact: {
  gap: "6px"
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
 }
}
