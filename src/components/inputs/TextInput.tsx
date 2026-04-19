import type { FocusEventHandler, InputHTMLAttributes, RefObject } from "react"
import { colors, spacing, radius, fontSize } from "../../styles/GlobalStyles"

interface Props {
 label: string
 value: string
 onChange: (v: string) => void
 type?: string
 placeholder?: string
 error?: string
 compact?: boolean
 inputMode?: InputHTMLAttributes<HTMLInputElement>["inputMode"]
 autoComplete?: InputHTMLAttributes<HTMLInputElement>["autoComplete"]
 min?: string
 max?: string
 maxLength?: number
 inputRef?: RefObject<HTMLInputElement | null>
 onFocus?: FocusEventHandler<HTMLInputElement>
 onBlur?: FocusEventHandler<HTMLInputElement>
}

export default function TextInput({
 label,
 value,
 onChange,
 type = "text",
 placeholder,
 error,
 compact = false,
 inputMode,
 autoComplete,
 min,
 max,
 maxLength,
 inputRef,
 onFocus,
 onBlur
}: Props) {

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

   <input
    ref={inputRef}
    type={type}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    onFocus={onFocus}
    onBlur={onBlur}
    inputMode={inputMode}
    autoComplete={autoComplete}
    min={min}
    max={max}
    maxLength={maxLength}
    style={{
     width: "100%",
     padding: "13px 16px",
     fontSize: "16px",
     border: `1px solid ${error ? "#D97C6C" : colors.border}`,
     borderRadius: radius.md,
     outline: "none",
     background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
     color: colors.textPrimary,
     boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)"
    }}
    className="input-field"
   />

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
