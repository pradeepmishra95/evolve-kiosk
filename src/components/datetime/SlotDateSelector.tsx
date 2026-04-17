import { useId, useRef, type KeyboardEvent } from "react"
import { colors, radius, spacing } from "../../styles/GlobalStyles"

export type SlotAvailability = "available" | "limited" | "unavailable"

export interface SlotDateOption {
 value: string
 label: string
 shortLabel: string
 availability?: SlotAvailability
 slotCountLabel?: string
}

interface SlotDateSelectorProps {
 label: string
 value: string
 onChange: (value: string) => void
 options: SlotDateOption[]
 error?: string
 emptyMessage?: string
 helperText?: string
}

const getAvailabilityLabel = (availability: SlotAvailability) => {
 if (availability === "limited") {
  return "Limited"
 }

 if (availability === "unavailable") {
  return "Unavailable"
 }

 return "Available"
}

export default function SlotDateSelector({
 label,
 value,
 onChange,
 options,
 error,
 emptyMessage = "No dates available.",
 helperText
}: SlotDateSelectorProps) {
 const fieldId = useId()
 const optionRefs = useRef<Array<HTMLButtonElement | null>>([])

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

 const moveToIndex = (index: number) => {
  const option = options[index]

  if (!option) {
   return
  }

  if ((option.availability || "available") !== "unavailable") {
   onChange(option.value)
   optionRefs.current[index]?.focus()
  }
 }

 const handleOptionKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
  if (event.key === "Home") {
   event.preventDefault()
   const firstEnabledIndex = getEdgeEnabledIndex("start")

   if (firstEnabledIndex >= 0) {
    moveToIndex(firstEnabledIndex)
   }
   return
  }

  if (event.key === "End") {
   event.preventDefault()
   const lastEnabledIndex = getEdgeEnabledIndex("end")

   if (lastEnabledIndex >= 0) {
    moveToIndex(lastEnabledIndex)
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

  const nextIndex = getNextEnabledIndex(index, event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1)

  if (nextIndex >= 0) {
   moveToIndex(nextIndex)
  }
 }

 const selectedTextId = `${fieldId}-selected`
 const helperId = `${fieldId}-helper`
 const errorId = `${fieldId}-error`
 const describedBy = error
  ? `${selectedTextId} ${helperText ? helperId : ""} ${errorId}`.trim()
  : `${selectedTextId} ${helperText ? helperId : ""}`.trim()

 if (options.length === 0) {
  return (
   <div role="group" aria-labelledby={`${fieldId}-label`} aria-describedby={describedBy} aria-invalid={Boolean(error)}>
    <p id={`${fieldId}-label`} style={styles.label}>{label}</p>
    <div style={styles.emptyState}>{emptyMessage}</div>
    {(error || helperText) && (
     <p id={error ? errorId : helperId} style={error ? styles.errorText : styles.helperText}>
      {error || helperText}
     </p>
    )}
   </div>
  )
 }

 return (
  <div role="group" aria-labelledby={`${fieldId}-label`} aria-describedby={describedBy} aria-invalid={Boolean(error)}>
   <p id={`${fieldId}-label`} style={styles.label}>{label}</p>

   <div style={{ ...styles.surface, ...(error ? styles.surfaceError : {}) }}>
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
         if (!disabled) {
          onChange(option.value)
         }
        }}
        style={{
         ...styles.slotCard,
         ...(selected ? styles.slotCardActive : {}),
         ...(disabled ? styles.slotCardDisabled : {})
        }}
       >
        <span style={styles.slotTitle}>{option.shortLabel}</span>
        <span style={styles.slotMeta}>
         {option.slotCountLabel || (index === 0 && availability === "available" ? "Soonest" : getAvailabilityLabel(availability))}
        </span>
       </button>
      )
     })}
    </div>

    <p id={selectedTextId} style={styles.selectedText} aria-live="polite">
     Selected date: {value ? options.find((option) => option.value === value)?.label || value : "Not selected"}
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
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 145px), 1fr))",
  gap: "8px"
 },
 slotCard: {
  minHeight: "74px",
  borderRadius: "14px",
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textPrimary,
  padding: "10px 12px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between",
  gap: "8px",
  textAlign: "left" as const,
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
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const
 },
 selectedText: {
  marginTop: "12px",
  color: colors.textSecondary,
  fontSize: "13px"
 },
 emptyState: {
  borderRadius: radius.md,
  border: `1px dashed ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textSecondary,
  padding: "12px",
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
