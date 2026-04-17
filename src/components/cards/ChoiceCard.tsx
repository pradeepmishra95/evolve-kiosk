import type { ReactNode } from "react"
import { colors, shadow, typography } from "../../styles/GlobalStyles"

interface Props {
 title: string
 subtitle?: string
 footer?: ReactNode
 disabled?: boolean
 selected?: boolean
 showBadge?: boolean
 badgeLabel?: string
 centered?: boolean
 onClick: () => void
}

export default function ChoiceCard({
 title,
 subtitle,
 footer,
 disabled = false,
 selected = false,
 showBadge = true,
 badgeLabel,
 centered = false,
 onClick
}: Props) {
 const isInteractive = !disabled

  return (
  <button
   type="button"
   onClick={onClick}
   disabled={disabled}
   style={{
    display: "flex",
    flexDirection: "column",
    justifyContent: centered ? "center" : "flex-start",
    alignItems: centered ? "center" : "flex-start",
    padding: "clamp(15px, 2vh, 26px)",
    border: `1px solid ${
     selected
      ? colors.primaryLight
      : disabled
       ? "rgba(255,255,255,0.08)"
       : colors.border
    }`,
    borderRadius: "26px",
    cursor: isInteractive ? "pointer" : "not-allowed",
    textAlign: centered ? "center" : "left",
    background: selected
     ? "linear-gradient(160deg, rgba(200,169,108,0.24), rgba(106,166,154,0.14) 56%, rgba(255,255,255,0.05))"
     : disabled
      ? "linear-gradient(160deg, rgba(255,255,255,0.02), rgba(255,255,255,0.008))"
      : "linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
    width: "100%",
    minHeight: centered ? "128px" : "auto",
    color: disabled ? colors.textMuted : colors.textPrimary,
    boxShadow: selected
     ? "0 28px 64px rgba(200,169,108,0.18), 0 18px 34px rgba(0,0,0,0.26)"
     : shadow.card,
    backdropFilter: "blur(14px)",
    transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease",
    opacity: disabled ? 0.72 : 1,
    position: "relative"
   }}
   className="touch-feedback"
  >
   {showBadge && (
    <div
     style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      minWidth: "34px",
      height: "34px",
      padding: "0 10px",
      marginBottom: "10px",
      borderRadius: "999px",
      border: `1px solid ${
       selected
        ? colors.primaryLight
        : disabled
         ? "rgba(255,255,255,0.12)"
         : colors.borderStrong
      }`,
      background: selected
       ? "linear-gradient(135deg, rgba(200,169,108,0.32), rgba(106,166,154,0.18))"
       : disabled
        ? "rgba(255,255,255,0.05)"
        : "linear-gradient(135deg, rgba(200,169,108,0.22), rgba(106,166,154,0.16))",
      color: selected ? colors.primaryLight : disabled ? colors.textMuted : colors.primaryLight,
      fontSize: "11px",
      fontWeight: 700,
      letterSpacing: "0.18em",
      textTransform: "uppercase"
     }}
    >
     {badgeLabel || (selected ? "Selected" : disabled ? "Soon" : "Go")}
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

   {footer && (
    <div
     style={{
      width: "100%",
      marginTop: "12px"
     }}
    >
     {footer}
    </div>
   )}
  </button>
 )
}
