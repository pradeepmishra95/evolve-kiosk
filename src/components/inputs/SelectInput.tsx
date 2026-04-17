"use client"

import { createPortal } from "react-dom"
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from "react"
import { colors, fontSize, radius, spacing } from "../../styles/GlobalStyles"

interface Option {
 value: string
 label: string
 disabled?: boolean
}

interface Props {
 label: string
 value: string
 onChange: (value: string) => void
 options: Option[]
 error?: string
 placeholder?: string
 compact?: boolean
}

const findNextEnabledIndex = (options: Option[], startIndex: number, step: 1 | -1) => {
 if (options.length === 0) {
  return -1
 }

 let index = startIndex

 for (let attempt = 0; attempt < options.length; attempt += 1) {
  index = (index + step + options.length) % options.length

  if (!options[index]?.disabled) {
   return index
  }
 }

 return -1
}

export default function SelectInput({
 label,
 value,
 onChange,
 options,
 error,
 placeholder,
 compact = false
}: Props) {
 const wrapperRef = useRef<HTMLDivElement>(null)
 const triggerRef = useRef<HTMLButtonElement>(null)
 const popupRef = useRef<HTMLDivElement>(null)
 const [open, setOpen] = useState(false)
 const [highlightedIndex, setHighlightedIndex] = useState(-1)
 const [popupPosition, setPopupPosition] = useState<{
  top: number
  left: number
  width: number
  maxHeight: number
 } | null>(null)

 const selectedIndex = useMemo(
  () => options.findIndex((option) => option.value === value),
  [options, value]
 )

 const selectedOption = selectedIndex >= 0 ? options[selectedIndex] : null
 const selectedLabel = selectedOption?.label || ""
 const displayLabel = selectedLabel || placeholder || `Select ${label.toLowerCase()}`

 const closeMenu = useCallback(() => {
  setOpen(false)
 }, [])

 const updatePopupPosition = useCallback(() => {
  const trigger = triggerRef.current

  if (!trigger || typeof window === "undefined") {
   return
  }

  const rect = trigger.getBoundingClientRect()
  const width = compact
   ? Math.min(Math.max(rect.width, 300), Math.min(window.innerWidth - 24, 420))
   : Math.min(Math.max(rect.width, 320), window.innerWidth - 24)
  const spaceAbove = Math.max(0, rect.top - 16)
  const spaceBelow = Math.max(0, window.innerHeight - rect.bottom - 16)
  const estimatedHeight = Math.min(420, 92 + options.length * 58)
  const openAbove = spaceBelow < 240 && spaceAbove > spaceBelow

  if (openAbove) {
   const maxHeight = Math.max(180, Math.min(estimatedHeight, spaceAbove))

   setPopupPosition({
    top: Math.max(12, rect.top - maxHeight - 12),
    left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
    width,
    maxHeight
   })

   return
  }

  const maxHeight = Math.max(180, Math.min(estimatedHeight, spaceBelow))

  setPopupPosition({
   top: Math.min(window.innerHeight - 12 - maxHeight, rect.bottom + 12),
   left: Math.max(12, Math.min(rect.left, window.innerWidth - width - 12)),
   width,
   maxHeight
  })
 }, [compact, options.length])

 const openMenu = useCallback(() => {
  if (!options.length) {
   return
  }

  setOpen(true)
  setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : findNextEnabledIndex(options, -1, 1))
 }, [options, selectedIndex])

 const selectOption = useCallback(
  (option: Option) => {
   if (option.disabled) {
    return
   }

   onChange(option.value)
   closeMenu()
  },
  [closeMenu, onChange]
 )

 const moveHighlight = useCallback(
  (step: 1 | -1) => {
   const nextIndex = findNextEnabledIndex(options, highlightedIndex, step)

   if (nextIndex >= 0) {
    setHighlightedIndex(nextIndex)
   }
  },
  [highlightedIndex, options]
 )

 const handleTriggerKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
   event.preventDefault()

   if (!open) {
    openMenu()
    return
   }

   moveHighlight(event.key === "ArrowDown" ? 1 : -1)
   return
  }

  if (event.key === "Enter" || event.key === " ") {
   event.preventDefault()

   if (!open) {
    openMenu()
   } else if (highlightedIndex >= 0 && options[highlightedIndex]) {
    selectOption(options[highlightedIndex])
   }
   return
  }

  if (event.key === "Escape") {
   closeMenu()
  }
 }

 useEffect(() => {
  if (!open) {
   return
  }

  updatePopupPosition()
 }, [open, updatePopupPosition])

 useEffect(() => {
  if (!open) {
   return
  }

  const handlePointerDown = (event: MouseEvent | TouchEvent) => {
   const target = event.target

   if (
    target instanceof Node &&
    !wrapperRef.current?.contains(target) &&
    !popupRef.current?.contains(target)
   ) {
    closeMenu()
   }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
   if (event.key === "Escape") {
    closeMenu()
    return
   }

   if (event.key === "ArrowDown") {
    event.preventDefault()
    moveHighlight(1)
   }

   if (event.key === "ArrowUp") {
    event.preventDefault()
    moveHighlight(-1)
   }

   if (event.key === "Enter" && highlightedIndex >= 0 && options[highlightedIndex]) {
    event.preventDefault()
    selectOption(options[highlightedIndex])
   }
  }

  const handleResize = () => {
   updatePopupPosition()
  }

  document.addEventListener("mousedown", handlePointerDown)
  document.addEventListener("touchstart", handlePointerDown)
  document.addEventListener("keydown", handleKeyDown)
  window.addEventListener("resize", handleResize)
  window.addEventListener("orientationchange", handleResize)

  return () => {
   document.removeEventListener("mousedown", handlePointerDown)
   document.removeEventListener("touchstart", handlePointerDown)
   document.removeEventListener("keydown", handleKeyDown)
   window.removeEventListener("resize", handleResize)
   window.removeEventListener("orientationchange", handleResize)
  }
 }, [closeMenu, highlightedIndex, moveHighlight, open, options, selectOption, updatePopupPosition])

 const shouldRenderPopup = open && popupPosition && typeof document !== "undefined"
 const hasSelection = Boolean(selectedOption)

 return (
  <div style={{ marginBottom: compact ? 0 : spacing.md }} ref={wrapperRef}>
   <label
    style={{
     display: "block",
     marginBottom: spacing.sm,
     fontSize: fontSize.sm,
     color: colors.textSecondary,
     letterSpacing: "0.14em",
     textTransform: "uppercase",
     fontWeight: 700
    }}
   >
    {label}
   </label>

   <button
    ref={triggerRef}
    type="button"
    aria-haspopup="listbox"
    aria-expanded={open}
    aria-label={label}
    onClick={() => {
     if (open) {
      closeMenu()
      return
     }

     openMenu()
    }}
    onKeyDown={handleTriggerKeyDown}
    style={{
     width: "100%",
     minHeight: compact ? "56px" : "62px",
     padding: compact ? "13px 18px" : "14px 20px",
     borderRadius: compact ? "18px" : radius.lg,
     border: `1px solid ${error ? "#D97C6C" : hasSelection ? colors.borderStrong : colors.border}`,
     boxShadow: hasSelection
      ? "0 18px 44px rgba(0,0,0,0.26), inset 0 1px 0 rgba(255,255,255,0.04)"
      : "inset 0 1px 0 rgba(255,255,255,0.04)",
     background: hasSelection
      ? "linear-gradient(145deg, rgba(200,169,108,0.12), rgba(106,166,154,0.08)), linear-gradient(180deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))"
      : "linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.02))",
     color: hasSelection ? colors.textPrimary : colors.textMuted,
     textAlign: "left",
     cursor: "pointer",
     display: "flex",
     alignItems: "center",
     justifyContent: "space-between",
     gap: spacing.sm,
     transition: "border-color 0.25s ease, box-shadow 0.25s ease, transform 0.25s ease"
    }}
   >
    <span
     style={{
      fontSize: compact ? "14px" : "15px",
      lineHeight: 1.35,
      fontWeight: hasSelection ? 700 : 500,
      letterSpacing: hasSelection ? "0.01em" : "0"
     }}
    >
     {displayLabel}
    </span>

    <span
     aria-hidden="true"
     style={{
      flex: "0 0 auto",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: compact ? 30 : 34,
      height: compact ? 30 : 34,
      borderRadius: "999px",
      background: "linear-gradient(135deg, rgba(200,169,108,0.24), rgba(106,166,154,0.18))",
      color: colors.primaryLight,
      border: `1px solid ${colors.borderStrong}`,
      boxShadow: "0 10px 24px rgba(0,0,0,0.24)",
      backdropFilter: "blur(10px)"
     }}
    >
     <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" style={{ width: 16, height: 16, display: "block" }}>
      <path
       d="M7 10l5 5 5-5"
       stroke="currentColor"
       strokeWidth="1.9"
       strokeLinecap="round"
       strokeLinejoin="round"
      />
     </svg>
    </span>
   </button>

   {shouldRenderPopup
    ? createPortal(
      <div
       ref={popupRef}
       role="listbox"
       aria-label={`${label} options`}
       style={{
        position: "fixed",
        zIndex: 9999,
        top: popupPosition.top,
        left: popupPosition.left,
        width: popupPosition.width,
        maxWidth: "calc(100vw - 24px)",
        maxHeight: popupPosition.maxHeight,
        overflowY: "auto",
        borderRadius: compact ? "22px" : radius.lg,
        border: `1px solid ${colors.borderStrong}`,
        background: "linear-gradient(180deg, rgba(11,18,24,0.98), rgba(7,12,17,0.98))",
        boxShadow: "0 32px 90px rgba(0,0,0,0.48)",
        padding: compact ? "14px" : spacing.md,
        backdropFilter: "blur(18px)"
       }}
      >
       <div
        style={{
         paddingBottom: spacing.sm,
         marginBottom: spacing.sm,
         borderBottom: `1px solid rgba(255,255,255,0.08)`
        }}
       >
        <p
         style={{
          color: colors.primaryLight,
          fontSize: "11px",
          fontWeight: 800,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          marginBottom: "4px"
         }}
        >
         {label}
        </p>
        <p
         style={{
          color: colors.textSecondary,
          fontSize: "13px",
          lineHeight: 1.5
         }}
        >
         {hasSelection ? selectedLabel : "Choose one premium option"}
        </p>
       </div>

       <div style={{ display: "grid", gap: "10px" }}>
        {options.length === 0 ? (
         <div
          style={{
           padding: "12px 14px",
           borderRadius: radius.md,
           border: `1px solid rgba(255,255,255,0.08)`,
           color: colors.textMuted,
           fontSize: "13px"
          }}
         >
          No options available.
         </div>
        ) : (
         options.map((option, index) => {
          const selected = option.value === value
          const highlighted = index === highlightedIndex
          const disabled = option.disabled

          return (
           <button
            key={option.value}
            type="button"
            role="option"
            aria-selected={selected}
            aria-disabled={disabled}
            disabled={disabled}
            onMouseEnter={() => setHighlightedIndex(index)}
            onClick={() => selectOption(option)}
            style={{
             display: "flex",
             alignItems: "center",
             justifyContent: "space-between",
             gap: spacing.sm,
             width: "100%",
             padding: "12px 14px",
             borderRadius: radius.md,
             border: `1px solid ${
              selected ? colors.primaryLight : highlighted ? colors.borderStrong : "rgba(255,255,255,0.08)"
             }`,
             background: selected
              ? "linear-gradient(135deg, rgba(200,169,108,0.24), rgba(106,166,154,0.14))"
              : highlighted
               ? "rgba(255,255,255,0.07)"
               : "rgba(255,255,255,0.04)",
             color: disabled ? colors.textMuted : selected ? colors.textPrimary : colors.textSecondary,
             cursor: disabled ? "not-allowed" : "pointer",
             textAlign: "left",
             boxShadow: selected ? "0 18px 40px rgba(0,0,0,0.24)" : "none",
             opacity: disabled ? 0.56 : 1,
             transition: "transform 0.18s ease, border-color 0.18s ease, background 0.18s ease"
            }}
           >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
             <span
              aria-hidden="true"
              style={{
               width: "10px",
               height: "10px",
               borderRadius: "999px",
               flex: "0 0 auto",
               background: selected
                ? colors.primaryLight
                : highlighted
                 ? "rgba(243,224,182,0.7)"
                 : "rgba(255,255,255,0.18)",
               boxShadow: selected ? "0 0 0 5px rgba(243,224,182,0.08)" : "none"
              }}
             />
             <span
              style={{
               fontSize: "14px",
               fontWeight: selected ? 800 : 600,
               lineHeight: 1.35,
               color: disabled ? colors.textMuted : selected ? colors.textPrimary : colors.textSecondary,
               overflow: "hidden",
               textOverflow: "ellipsis",
               whiteSpace: "nowrap"
              }}
             >
              {option.label}
             </span>
            </div>

            {selected && (
             <span
              style={{
               display: "inline-flex",
               alignItems: "center",
               justifyContent: "center",
               padding: "5px 9px",
               borderRadius: "999px",
               border: `1px solid ${colors.borderStrong}`,
               background: "rgba(255,255,255,0.06)",
               color: colors.primaryLight,
               fontSize: "10px",
               fontWeight: 800,
               letterSpacing: "0.16em",
               textTransform: "uppercase",
               flex: "0 0 auto"
              }}
             >
              Selected
             </span>
            )}
           </button>
          )
         })
        )}
       </div>
      </div>,
      document.body
     )
    : null}

   {error && (
    <p
     style={{
      marginTop: spacing.sm,
      fontSize: fontSize.sm,
      color: "#F1A596",
      lineHeight: 1.5
     }}
    >
     {error}
    </p>
   )}
  </div>
 )
}
