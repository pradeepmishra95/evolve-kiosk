import { useEffect, useRef, useState } from "react"
import { colors, fontSize, radius, spacing } from "../../styles/GlobalStyles"
import {
 detectPhoneCountryCode,
 getPhoneCountryCodeOption,
 normalizeCountryCode,
 normalizePhoneNumber,
 PHONE_COUNTRY_CODE_OPTIONS
} from "../../utils/validation"

interface Props {
 label: string
 countryCode: string
 phone: string
 onCountryCodeChange: (value: string) => void
 onPhoneChange: (value: string) => void
 error?: string
 placeholder?: string
 compact?: boolean
}

export default function PhoneInput({
 label,
 countryCode,
 phone,
 onCountryCodeChange,
 onPhoneChange,
 error,
 placeholder = "Enter phone number",
 compact = false
}: Props) {
 const selectedCountryCode = getPhoneCountryCodeOption(countryCode)
 const rootRef = useRef<HTMLDivElement>(null)
 const menuRef = useRef<HTMLDivElement>(null)
 const triggerRef = useRef<HTMLButtonElement>(null)
 const [menuOpen, setMenuOpen] = useState(false)

 const handlePhoneChange = (value: string) => {
  const detectedCountryCode = detectPhoneCountryCode(value)
  const effectiveCountryCode = detectedCountryCode ?? selectedCountryCode.value
  const effectiveCountryCodeOption = getPhoneCountryCodeOption(effectiveCountryCode)

  if (detectedCountryCode && detectedCountryCode !== selectedCountryCode.value) {
   onCountryCodeChange(detectedCountryCode)
  }

  onPhoneChange(
   normalizePhoneNumber(value, effectiveCountryCode).slice(0, effectiveCountryCodeOption.maxLength)
  )
 }

 const handleCountryCodeChange = (value: string) => {
  const nextCountryCode = normalizeCountryCode(value)
  const nextCountryCodeOption = getPhoneCountryCodeOption(nextCountryCode)

  onCountryCodeChange(nextCountryCode)
  onPhoneChange(normalizePhoneNumber(phone, nextCountryCode).slice(0, nextCountryCodeOption.maxLength))
  setMenuOpen(false)
 }

 const closeMenu = () => {
  setMenuOpen(false)
 }

 const toggleMenu = () => {
  setMenuOpen((current) => !current)
 }

 useEffect(() => {
  if (!menuOpen) {
   return
  }

  const handlePointerDown = (event: MouseEvent | TouchEvent) => {
   const target = event.target

   if (
    target instanceof Node &&
    !rootRef.current?.contains(target) &&
    !menuRef.current?.contains(target)
   ) {
    closeMenu()
   }
  }

  const handleKeyDown = (event: KeyboardEvent) => {
   if (event.key === "Escape") {
    closeMenu()
    triggerRef.current?.focus()
   }
  }

  document.addEventListener("mousedown", handlePointerDown)
  document.addEventListener("touchstart", handlePointerDown)
  document.addEventListener("keydown", handleKeyDown)

  return () => {
   document.removeEventListener("mousedown", handlePointerDown)
   document.removeEventListener("touchstart", handlePointerDown)
   document.removeEventListener("keydown", handleKeyDown)
  }
 }, [menuOpen])

 return (
  <div style={{ marginBottom: compact ? 0 : spacing.md }}>
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

   <div
    style={{
     display: "grid",
     gridTemplateColumns: compact
      ? "minmax(90px, 112px) minmax(0, 1fr)"
      : "minmax(96px, 124px) minmax(0, 1fr)",
     gap: spacing.sm
    }}
   >
    <div ref={rootRef} style={{ position: "relative" }}>
     <button
      ref={triggerRef}
      type="button"
      onClick={toggleMenu}
      aria-label={`Country code, currently ${selectedCountryCode.countryName}`}
      aria-haspopup="listbox"
      aria-expanded={menuOpen}
      style={{
       width: "100%",
       height: "100%",
       minHeight: compact ? "48px" : "52px",
       padding: compact ? "8px 28px 8px 10px" : "9px 30px 9px 12px",
       fontSize: compact ? "13px" : "14px",
       fontWeight: 800,
       lineHeight: 1,
       border: `1px solid ${error ? "#D97C6C" : colors.border}`,
       borderRadius: radius.md,
       outline: "none",
       background: menuOpen
        ? "linear-gradient(180deg, rgba(243,224,182,0.18), rgba(255,255,255,0.03))"
        : "linear-gradient(180deg, rgba(243,224,182,0.12), rgba(255,255,255,0.02))",
       color: colors.primaryLight,
       boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
       cursor: "pointer",
        appearance: "none",
       WebkitAppearance: "none",
       MozAppearance: "none",
       display: "flex",
       alignItems: "center",
       justifyContent: "space-between",
       gap: 8
      }}
      className="input-field"
     >
      <span
       style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: compact ? 18 : 20,
        fontSize: compact ? "16px" : "17px"
       }}
      >
       {selectedCountryCode.flag}
      </span>

      <span
       style={{
        flex: 1,
        textAlign: "center",
        letterSpacing: "0.04em"
       }}
      >
       {selectedCountryCode.label}
      </span>

      <span
       aria-hidden="true"
       style={{
        color: colors.textMuted,
        fontSize: "11px",
        pointerEvents: "none"
       }}
      >
       ▾
      </span>
     </button>

     {menuOpen && (
      <div
       ref={menuRef}
       role="listbox"
       aria-label="Choose country code"
       style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        left: 0,
        zIndex: 40,
        width: "min(290px, 82vw)",
        padding: "8px",
        borderRadius: radius.lg,
        border: `1px solid ${colors.borderStrong}`,
        background:
         "linear-gradient(180deg, rgba(9, 17, 22, 0.98), rgba(12, 20, 26, 0.98))",
        boxShadow: "0 30px 80px rgba(0,0,0,0.42)",
        backdropFilter: "blur(14px)"
       }}
      >
       {PHONE_COUNTRY_CODE_OPTIONS.map((option) => {
        const selected = option.value === selectedCountryCode.value

        return (
         <button
          key={option.value}
          type="button"
          role="option"
          aria-selected={selected}
          onClick={() => handleCountryCodeChange(option.value)}
          style={{
           width: "100%",
           display: "flex",
           alignItems: "center",
           justifyContent: "space-between",
           gap: 12,
           padding: "12px 14px",
           borderRadius: radius.md,
           border: `1px solid ${selected ? colors.borderStrong : "transparent"}`,
           background: selected
            ? "rgba(200,169,108,0.12)"
            : "transparent",
           color: selected ? colors.textPrimary : colors.textSecondary,
           cursor: "pointer",
           textAlign: "left"
          }}
         >
          <span style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
           <span
            aria-hidden="true"
            style={{
             width: 24,
             textAlign: "center",
             fontSize: "18px",
             flexShrink: 0
            }}
           >
            {option.flag}
           </span>
           <span style={{ display: "flex", flexDirection: "column", minWidth: 0 }}>
            <span
             style={{
              fontSize: "14px",
              fontWeight: 700,
              color: colors.textPrimary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis"
             }}
            >
             {option.countryName}
            </span>
            <span
             style={{
              fontSize: "12px",
              color: colors.textMuted,
              letterSpacing: "0.08em"
             }}
            >
             {option.label}
            </span>
           </span>
          </span>

          {selected && (
           <span
            aria-hidden="true"
            style={{
             fontSize: "12px",
             fontWeight: 800,
             color: colors.primaryLight
            }}
           >
            Selected
           </span>
          )}
         </button>
        )
       })}
      </div>
     )}
    </div>

    <input
     type="tel"
     value={phone}
     placeholder={placeholder}
     onChange={(event) => handlePhoneChange(event.target.value)}
     inputMode="numeric"
     autoComplete="tel"
     maxLength={20}
     style={{
      width: "100%",
      minHeight: compact ? "48px" : "52px",
      padding: "13px 16px",
      fontSize: "15px",
      border: `1px solid ${error ? "#D97C6C" : colors.border}`,
      borderRadius: radius.md,
      outline: "none",
      background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
      color: colors.textPrimary,
      boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)"
     }}
     className="input-field"
    />
   </div>

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
