import { useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import { useDevice } from "../../hooks/useDevice"
import { useUserStore } from "../../store/userStore"
import { usePlanCatalog } from "../../hooks/usePlanCatalog"
import type { CatalogTrainingType } from "../../services/planCatalog"
import { getExperienceClassification } from "../../utils/experience"
import { colors, radius, shadow, spacing, typography } from "../../styles/GlobalStyles"

const getProgramSummary = (trainingType: CatalogTrainingType) =>
 trainingType.summary || trainingType.description || trainingType.bestFor

export default function ExerciseTypeScreen() {
 const navigate = useNavigate()
 const { isMobile, isCompactHeight } = useDevice()
 const { trainingTypes, loading } = usePlanCatalog()
 const {
  priorExerciseExperience,
  priorExerciseActivity,
  priorExerciseDuration,
  lastExerciseTime
 } = useUserStore()
 const setData = useUserStore((state) => state.setData)
 const [activeTrainingType, setActiveTrainingType] = useState<CatalogTrainingType | null>(null)

 if (loading && trainingTypes.length === 0) {
  return (
   <Container scrollable>
    <div style={styles.loadingState}>
     Loading training types...
    </div>
   </Container>
  )
 }

 const selectType = (type: string) => {
  const experience = getExperienceClassification({
   selectedTrainingType: type,
   priorExerciseExperience,
   priorExerciseActivity,
   priorExerciseDuration,
   lastExerciseTime
  }) || "Beginner"

  setData({
   exerciseType: type,
   experience
  })
  navigate("/program")
 }

 return (
  <Container scrollable>
   <div style={styles.wrapper}>
    <div
     style={{
      ...styles.header,
      marginBottom: isCompactHeight ? spacing.md : spacing.lg
     }}
    >
     <h2
      style={{
       textAlign: "center",
        fontSize: typography.subtitle.fontSize,
        marginBottom: spacing.sm
      }}
     >
      Choose Training Type
     </h2>

   </div>

    <div style={styles.trainingGrid(isMobile)}>
     {trainingTypes.map((trainingType) => (
      <div
       key={trainingType.name}
       style={{
        ...styles.card(isCompactHeight),
        opacity: trainingType.disabled ? 0.74 : 1
       }}
      >
       <div>
        <div style={styles.cardHeader}>
         <div style={styles.cardContent}>
          <h3 style={styles.cardTitle}>
           {trainingType.name}
          </h3>

          <p style={styles.cardSummary}>
           {getProgramSummary(trainingType)}
          </p>
         </div>

         {trainingType.disabled && (
          <span style={styles.comingSoonTag}>
           {trainingType.availabilityLabel || "Coming Soon"}
          </span>
         )}
        </div>
       </div>

       <div style={styles.cardActions}>
        <button
         type="button"
         onClick={() => {
          setActiveTrainingType(trainingType)
         }}
         style={styles.secondaryButton}
        >
         Know More
        </button>

        <button
         type="button"
         onClick={() => {
          if (trainingType.disabled) {
           return
          }

          selectType(trainingType.name)
         }}
         disabled={trainingType.disabled}
         style={{
          ...styles.primaryButton,
          border: trainingType.disabled ? `1px solid ${colors.border}` : "none",
          background: trainingType.disabled ? "rgba(255,255,255,0.08)" : colors.primary,
          color: trainingType.disabled ? colors.textMuted : colors.textOnAccent,
          cursor: trainingType.disabled ? "not-allowed" : "pointer"
         }}
        >
         {trainingType.disabled ? "Upcoming" : "Choose"}
        </button>
       </div>
      </div>
     ))}
    </div>
   </div>

   {activeTrainingType && (
    <div style={styles.overlay}>
     <div style={styles.modal}>
      <div style={styles.modalHeader}>
       <div>
        <p style={styles.badge}>Training Type</p>
        <h3 style={styles.modalTitle}>{activeTrainingType.name}</h3>
       </div>

       <button
        type="button"
        onClick={() => {
         setActiveTrainingType(null)
        }}
        style={styles.closeButton}
        aria-label="Close training type details"
       >
        X
       </button>
      </div>

      <p style={styles.modalIntro}>
       {getProgramSummary(activeTrainingType)}
      </p>

      {activeTrainingType.bestFor && (
       <div style={styles.section}>
        <h4 style={styles.sectionTitle}>Best For</h4>
        <p style={styles.sectionText}>
         {activeTrainingType.bestFor}
        </p>
       </div>
      )}

      <div style={styles.section}>
       <h4 style={styles.sectionTitle}>What Is It?</h4>
       <p style={styles.sectionText}>
        {activeTrainingType.description}
       </p>
      </div>

      <div style={styles.section}>
       <h4 style={styles.sectionTitle}>Benefits</h4>
       <ul style={styles.list}>
        {activeTrainingType.benefits.map((benefit) => (
         <li key={benefit} style={styles.listItem}>
          {benefit}
         </li>
        ))}
       </ul>
      </div>

      <div style={styles.modalActions}>
       <button
        type="button"
        onClick={() => {
         setActiveTrainingType(null)
        }}
        style={styles.secondaryButton}
       >
        Close
       </button>

       <button
        type="button"
        onClick={() => {
         if (activeTrainingType.disabled) {
          return
         }

         selectType(activeTrainingType.name)
        }}
        disabled={activeTrainingType.disabled}
        style={{
         ...styles.primaryButton,
         border: activeTrainingType.disabled ? `1px solid ${colors.border}` : "none",
         background: activeTrainingType.disabled ? "rgba(255,255,255,0.08)" : colors.primary,
         color: activeTrainingType.disabled ? colors.textMuted : colors.textOnAccent,
         cursor: activeTrainingType.disabled ? "not-allowed" : "pointer"
        }}
       >
        {activeTrainingType.disabled ? `${activeTrainingType.name} Coming Soon` : `Continue With ${activeTrainingType.name}`}
       </button>
      </div>
     </div>
    </div>
   )}
  </Container>
 )
}

const styles = {
 loadingState: {
  minHeight: "45vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
  color: colors.textSecondary,
  letterSpacing: "0.08em"
 },
 wrapper: {
  width: "min(100%, 760px)",
  margin: "0 auto"
 },
 header: {
  maxWidth: "680px",
  margin: "0 auto"
 },
 cardContent: {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px",
  flex: 1
 },
 cardSummary: {
  color: colors.textSecondary,
  lineHeight: 1.55,
  fontSize: "14px",
  margin: 0,
  maxWidth: "95%"
 },
 trainingGrid: (isMobile: boolean) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
  gap: "clamp(10px, 1.6vw, 16px)",
  alignItems: "stretch"
 }),
 card: (isCompactHeight: boolean) => ({
  padding: isCompactHeight ? "16px" : "18px",
  border: `1px solid ${colors.borderStrong}`,
  borderRadius: radius.lg,
  background:
   "radial-gradient(circle at top right, rgba(243,224,182,0.14), transparent 34%), linear-gradient(160deg, rgba(21,35,44,0.98), rgba(10,18,24,0.96))",
  boxShadow: shadow.card,
  color: colors.textPrimary,
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "space-between" as const,
  gap: "12px",
  minHeight: isCompactHeight ? "216px" : "232px",
  textAlign: "left" as const,
  overflow: "hidden" as const
 }),
 cardHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: spacing.sm,
  flexWrap: "wrap" as const
 },
 badge: {
  color: colors.secondary,
  textTransform: "uppercase" as const,
  letterSpacing: "0.16em",
  fontSize: "12px",
  marginBottom: spacing.sm,
  fontWeight: 700
 },
 comingSoonTag: {
  borderRadius: "999px",
  padding: "6px 10px",
  border: `1px solid ${colors.borderStrong}`,
  color: colors.primaryLight,
  fontSize: "10px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const
 },
 cardTitle: {
  ...typography.subtitle,
  fontSize: "29px",
  marginBottom: "0",
  lineHeight: 1.04
 },
 cardActions: {
  display: "flex",
   gap: spacing.sm,
  flexWrap: "nowrap" as const
 },
 primaryButton: {
  minHeight: "48px",
  flex: 1,
  borderRadius: "999px",
  border: "none",
  background: colors.primary,
  color: colors.textOnAccent,
  padding: "12px 16px",
  cursor: "pointer",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  fontSize: "12px",
  fontWeight: 700
 },
 secondaryButton: {
  minHeight: "48px",
  flex: 1,
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "transparent",
  color: colors.primaryLight,
  padding: "12px 16px",
  cursor: "pointer",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  fontSize: "12px",
  fontWeight: 700
 },
 overlay: {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(4,10,14,0.78)",
  backdropFilter: "blur(10px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 1000
 },
 modal: {
  width: "min(100%, 760px)",
  maxHeight: "min(82vh, 900px)",
  overflowY: "auto" as const,
  padding: "24px",
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(180deg, rgba(13,23,29,0.98), rgba(13,23,29,0.94))",
  boxShadow: shadow.modal,
  color: colors.textPrimary
 },
 modalHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: spacing.md,
  marginBottom: spacing.md
 },
 modalTitle: {
  ...typography.subtitle,
  fontSize: "34px",
  lineHeight: 1
 },
 closeButton: {
  width: "42px",
  height: "42px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "transparent",
  color: colors.primaryLight,
  cursor: "pointer",
  fontSize: "14px",
  fontWeight: 800,
  flexShrink: 0
 },
 modalIntro: {
  color: colors.textSecondary,
  lineHeight: 1.7,
  marginBottom: spacing.lg
 },
 section: {
  marginBottom: spacing.lg
 },
 sectionTitle: {
  color: colors.primaryLight,
  fontSize: "18px",
  fontWeight: 700,
  marginBottom: spacing.sm,
  letterSpacing: "0.04em"
 },
 sectionText: {
  color: colors.textSecondary,
  lineHeight: 1.75
 },
 list: {
  margin: 0,
  paddingLeft: "18px",
  color: colors.textSecondary,
  lineHeight: 1.8
 },
 listItem: {
  marginBottom: "6px"
 },
 modalActions: {
  display: "flex",
  gap: spacing.sm,
  justifyContent: "flex-end",
  flexWrap: "wrap" as const,
  paddingTop: spacing.sm
 }
}
