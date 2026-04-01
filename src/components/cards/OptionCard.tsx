import { colors, radius, shadow, spacing, typography } from "../../styles/GlobalStyles"

interface Props {
 title: string
 subtitle?: string
 onClick: () => void
}

export default function OptionCard({ title, subtitle, onClick }: Props) {

 return (

  <button
   onClick={onClick}
   style={{
    padding: spacing.xl,
    border: `1px solid ${colors.border}`,
    borderRadius: radius.lg,
    cursor: "pointer",
    textAlign: "left",
    background: "linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
    width: "100%",
    color: colors.textPrimary,
    boxShadow: shadow.card,
    transition: "transform 0.25s ease, border-color 0.25s ease, box-shadow 0.25s ease"
   }}
   className="touch-feedback"
  >

   <div
    style={{
     display: "inline-flex",
     alignItems: "center",
     justifyContent: "center",
     width: "42px",
     height: "42px",
     marginBottom: spacing.md,
     borderRadius: "50%",
     border: `1px solid ${colors.borderStrong}`,
     background: "linear-gradient(135deg, rgba(200,169,108,0.18), rgba(106,166,154,0.14))",
     color: colors.primaryLight,
     fontSize: "14px",
     letterSpacing: "0.18em"
    }}
   >
    GO
   </div>

   <h3
    style={{
     ...typography.subtitle,
     fontSize: "30px",
     marginBottom: subtitle ? spacing.sm : "0"
    }}
   >
    {title}
   </h3>

   {subtitle && (
    <p
     style={{
      color: colors.textSecondary,
      fontSize: typography.caption.fontSize,
      maxWidth: "90%"
     }}
    >
     {subtitle}
    </p>
   )}

  </button>

 )

}
