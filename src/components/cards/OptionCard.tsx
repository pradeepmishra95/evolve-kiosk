import { colors, radius, shadow, typography } from "../../styles/GlobalStyles"

interface Props {
 title: string
 subtitle?: string
 disabled?: boolean
 showBadge?: boolean
 centered?: boolean
 onClick: () => void
}

export default function OptionCard({
 title,
 subtitle,
 disabled = false,
 showBadge = true,
 centered = false,
 onClick
}: Props) {

 return (

  <button
   onClick={onClick}
   disabled={disabled}
   style={{
    display: "flex",
    flexDirection: "column",
    justifyContent: centered ? "center" : "flex-start",
    alignItems: centered ? "center" : "flex-start",
    padding: "clamp(14px, 1.8vh, 24px)",
    border: `1px solid ${disabled ? "rgba(255,255,255,0.08)" : colors.border}`,
    borderRadius: radius.lg,
    cursor: disabled ? "not-allowed" : "pointer",
    textAlign: centered ? "center" : "left",
    background: disabled
     ? "linear-gradient(160deg, rgba(255,255,255,0.02), rgba(255,255,255,0.008))"
     : "linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
    width: "100%",
    minHeight: centered ? "128px" : "auto",
    color: disabled ? colors.textMuted : colors.textPrimary,
    boxShadow: shadow.card,
    transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
    opacity: disabled ? 0.72 : 1
   }}
   className="touch-feedback"
  >

   {showBadge && (
    <div
     style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: "34px",
      height: "34px",
      marginBottom: "10px",
      borderRadius: "50%",
      border: `1px solid ${disabled ? "rgba(255,255,255,0.12)" : colors.borderStrong}`,
      background: disabled
       ? "rgba(255,255,255,0.05)"
       : "linear-gradient(135deg, rgba(200,169,108,0.18), rgba(106,166,154,0.14))",
      color: disabled ? colors.textMuted : colors.primaryLight,
      fontSize: "11px",
      letterSpacing: "0.18em"
     }}
    >
     {disabled ? "SOON" : "GO"}
    </div>
   )}

   <h3
    style={{
     ...typography.subtitle,
     fontSize: "clamp(22px, 3vh, 28px)",
     marginBottom: subtitle ? "6px" : "0",
     lineHeight: 1.02,
     width: "100%"
    }}
   >
    {title}
   </h3>

   {subtitle && (
    <p
     style={{
      color: colors.textSecondary,
      fontSize: "13px",
      lineHeight: 1.55,
      maxWidth: "100%",
      width: "100%"
     }}
    >
     {subtitle}
    </p>
   )}

  </button>

 )

}
