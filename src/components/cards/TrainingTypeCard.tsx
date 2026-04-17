import { useId, type CSSProperties } from "react"
import { colors, shadow, spacing, typography } from "../../styles/GlobalStyles"

interface TrainingTypeCardProps {
 name: string
 summary?: string
 bestFor?: string
 selected?: boolean
 disabled?: boolean
 availabilityLabel?: string
 onSelect: () => void
 onKnowMore: () => void
}

const getSelectLabel = ({
 selected,
 disabled,
 availabilityLabel
}: {
 selected: boolean
 disabled: boolean
 availabilityLabel?: string
}) => {
 if (selected) {
  return "Selected"
 }

 if (disabled) {
  return availabilityLabel || "Coming Soon"
 }

 return "Select"
}

export default function TrainingTypeCard({
 name,
 summary,
 bestFor,
 selected = false,
 disabled = false,
 availabilityLabel,
 onSelect,
 onKnowMore
}: TrainingTypeCardProps) {
 const cardId = useId()
 const summaryId = summary ? `${cardId}-summary` : undefined
 const normalizedSummary = summary?.trim().toLowerCase() || ""
 const normalizedBestFor = bestFor?.trim().toLowerCase() || ""
 const showBestFor = Boolean(normalizedBestFor && normalizedBestFor !== normalizedSummary)
 const bestForId = showBestFor ? `${cardId}-best-for` : undefined
 const describedBy = [summaryId, bestForId].filter(Boolean).join(" ") || undefined
 const selectLabel = getSelectLabel({ selected, disabled, availabilityLabel })

 return (
  <article
   aria-labelledby={`${cardId}-title`}
   aria-describedby={describedBy}
   onClick={() => {
    if (disabled) {
     return
    }

    onSelect()
   }}
   style={styles.card(selected, disabled)}
   className={disabled ? undefined : "touch-feedback"}
  >
   <div style={styles.actionRow}>
    <button
     type="button"
     className="kiosk-focus-ring touch-feedback"
     onClick={(event) => {
      event.stopPropagation()
      onSelect()
     }}
     disabled={disabled}
     aria-pressed={selected}
     aria-describedby={describedBy}
     aria-label={`${selectLabel} ${name}`}
     style={styles.selectButton(selected, disabled)}
    >
     {selectLabel}
    </button>

    <button
     type="button"
     className="kiosk-focus-ring touch-feedback"
     onClick={(event) => {
      event.stopPropagation()
      onKnowMore()
     }}
     aria-describedby={describedBy}
     aria-haspopup="dialog"
     aria-label={`Know more about ${name}`}
     style={styles.knowMoreButton}
    >
     Know More
    </button>
   </div>

   <div style={styles.content}>
    <h3 id={`${cardId}-title`} style={styles.title}>
     {name}
    </h3>

    {summary && (
     <p id={summaryId} style={styles.summary}>
      {summary}
     </p>
    )}

    {showBestFor && (
     <div style={styles.metaBlock}>
      <p style={styles.metaLabel}>Best For</p>
      <p id={bestForId} style={styles.metaText}>
       {bestFor}
      </p>
     </div>
    )}
   </div>
  </article>
 )
}

const actionButtonBase: CSSProperties = {
 display: "inline-flex",
 alignItems: "center",
 justifyContent: "center",
 minHeight: "38px",
 padding: "9px 14px",
 borderRadius: "999px",
 fontSize: "11px",
 fontWeight: 800,
 letterSpacing: "0.14em",
 textTransform: "uppercase",
 border: `1px solid ${colors.borderStrong}`,
 transition: "transform 0.2s ease, border-color 0.2s ease, background 0.2s ease, color 0.2s ease",
 whiteSpace: "nowrap"
}

const styles = {
 card: (selected: boolean, disabled: boolean): CSSProperties => ({
  display: "flex",
  flexDirection: "column",
  minHeight: "100%",
  padding: "clamp(16px, 2vh, 24px)",
  borderRadius: "26px",
  border: `1px solid ${
   selected
    ? colors.primaryLight
    : disabled
     ? "rgba(255,255,255,0.10)"
     : colors.border
  }`,
  background: selected
   ? "linear-gradient(160deg, rgba(200,169,108,0.24), rgba(106,166,154,0.14) 56%, rgba(255,255,255,0.05))"
   : disabled
    ? "linear-gradient(160deg, rgba(255,255,255,0.02), rgba(255,255,255,0.008))"
    : "linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
  color: disabled ? colors.textMuted : colors.textPrimary,
  boxShadow: selected
   ? "0 28px 64px rgba(200,169,108,0.18), 0 18px 34px rgba(0,0,0,0.26)"
   : shadow.card,
 backdropFilter: "blur(14px)",
  gap: spacing.md,
  opacity: disabled ? 0.8 : 1,
  cursor: disabled ? "not-allowed" : "pointer",
  transition: "transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease"
 }),
 actionRow: {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: spacing.sm,
  flexWrap: "wrap" as const
 },
 selectButton: (selected: boolean, disabled: boolean): CSSProperties => ({
  ...actionButtonBase,
  cursor: disabled ? "not-allowed" : "pointer",
  borderColor: selected
   ? colors.primaryLight
   : disabled
    ? "rgba(255,255,255,0.12)"
    : colors.borderStrong,
  background: selected
   ? "linear-gradient(135deg, rgba(200,169,108,0.32), rgba(106,166,154,0.18))"
   : disabled
    ? "rgba(255,255,255,0.05)"
    : "linear-gradient(135deg, rgba(200,169,108,0.22), rgba(106,166,154,0.16))",
  color: selected
   ? colors.primaryLight
   : disabled
    ? colors.textMuted
    : colors.primaryLight
 }),
 knowMoreButton: {
  ...actionButtonBase,
  marginLeft: "auto",
  cursor: "pointer",
  background: "rgba(255,255,255,0.03)",
  color: colors.textPrimary
 },
 content: {
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.sm
 },
 title: {
  ...typography.subtitle,
  fontSize: "clamp(22px, 3vh, 28px)",
  lineHeight: 1.02,
  margin: 0
 },
 summary: {
  color: colors.textSecondary,
  fontSize: "13px",
  lineHeight: 1.6,
  margin: 0
 },
 metaBlock: {
  display: "flex",
  flexDirection: "column" as const,
  gap: "6px"
 },
 metaLabel: {
  color: colors.primaryLight,
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase",
  margin: 0
 },
 metaText: {
  color: colors.textSecondary,
  fontSize: "12px",
  lineHeight: 1.55,
  margin: 0
 }
}
