import type { HTMLAttributes } from "react"
import { colors, spacing, radius, fontSize } from "../../styles/GlobalStyles"

interface Props {
 label: string
 value: string
 onChange: (v: string) => void
 type?: string
 placeholder?: string
 error?: string
 inputMode?: HTMLAttributes<HTMLInputElement>["inputMode"]
 maxLength?: number
}

export default function TextInput({
 label,
 value,
 onChange,
 type = "text",
 placeholder,
 error,
 inputMode,
 maxLength
}: Props) {

 return (

  <div style={{ marginBottom: spacing.lg }}>

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
    type={type}
    value={value}
    placeholder={placeholder}
    onChange={(e) => onChange(e.target.value)}
    inputMode={inputMode}
    maxLength={maxLength}
    style={{
     width: "100%",
     padding: "16px 18px",
     fontSize: fontSize.md,
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
