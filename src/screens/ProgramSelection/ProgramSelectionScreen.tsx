import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import { usePlanCatalog } from "../../hooks/usePlanCatalog"
import { useUserStore } from "../../store/userStore"
import type { ProgramPlan } from "../../types/domain"
import { TRIAL_FEE, TRIAL_FEE_NOTE } from "../../utils/trialPricing"
import { matchesLabel, normalizeLabel } from "../../utils/labelMatch"
import { colors, radius, shadow, spacing, typography } from "../../styles/GlobalStyles"
import { getPlanWeekdays, weekdayChips } from "./planSelectionHelpers"

const getPlanCardSubtitle = (plan: ProgramPlan) => {
 const timingCount = plan.timings?.length ?? 0

 if (timingCount > 0) {
  return `${timingCount} timing${timingCount === 1 ? "" : "s"} available`
 }

 if (plan.days?.trim()) {
  return plan.days.trim()
 }

 return "Structured weekly batch"
}

export default function ProgramSelectionScreen() {
 const navigate = useNavigate()
 const { adultPlans, kidsPlans, loading } = usePlanCatalog()
 const { age, exerciseType, purpose, experience } = useUserStore()
 const setData = useUserStore((state) => state.setData)

 const plans: ProgramPlan[] = age && age <= 12 ? kidsPlans : adultPlans
 const isAdultFlow = !age || age > 12
 const currentExperience = experience || "Beginner"
 const selectedProgram = normalizeLabel(exerciseType)

 const visiblePlans = plans.filter((plan) => {
  if (selectedProgram && plan.program) {
   const planProgram = normalizeLabel(plan.program)

   if (!matchesLabel(planProgram, selectedProgram) && !matchesLabel(plan.name, exerciseType)) {
    return false
   }
  }

  if (!isAdultFlow) {
   return true
  }

  if (plan.type === "personal" || matchesLabel(plan.name, "Personal Training")) {
   return true
  }

  if (plan.audience && plan.audience !== "adult") {
   return false
  }

  if (plan.experienceLevels?.length) {
   return plan.experienceLevels.some((level) => matchesLabel(level, currentExperience))
  }

  return true
 })

 const screenHeading = exerciseType ? `${exerciseType} Program` : "Program & Plan"
 const planCountLabel = visiblePlans.length === 1 ? "1 Plan" : `${visiblePlans.length} Plans`

 const selectPlan = (plan: ProgramPlan) => {
  setData({
   selectedPlanId: plan.id,
   selectedAddOnIds: [],
   mainPlanPrice: 0,
   price: 0,
   batchType: "",
   batchTime: "",
   batchDate: ""
  })

  navigate("/plan")
 }

 if (loading && plans.length === 0) {
  return (
   <Container scrollable>
    <div
     style={{
      textAlign: "center",
      padding: spacing.xl,
      color: colors.textSecondary
     }}
    >
     Loading plans...
    </div>
   </Container>
  )
 }

 if (!loading && visiblePlans.length === 0) {
  return (
   <Container scrollable>
    <div
     style={{
      textAlign: "center",
      padding: spacing.xl,
      color: colors.textSecondary
     }}
    >
     No plans available.
    </div>
   </Container>
  )
 }

 return (
  <Container scrollable>
   <div style={styles.headerCard}>
    <p style={styles.badge}>Program Selection</p>
    <h2 style={styles.heading}>{screenHeading}</h2>
    <p style={styles.planCount}>{planCountLabel}</p>
   </div>

   <Grid>
    {visiblePlans.map((plan) => {
     const availableWeekdays = getPlanWeekdays(plan)

     return (
      <div key={plan.id} style={styles.card}>
       <div>
        <p style={styles.cardLabel}>Program</p>

        <h3 style={styles.cardTitle}>{plan.name}</h3>

        <p style={styles.cardSubtitle}>{getPlanCardSubtitle(plan)}</p>

        {availableWeekdays.length > 0 && (
         <div style={styles.weekdayBlock}>
          <p style={styles.weekdayLabel}>Days</p>

          <div style={styles.weekdayRow}>
           {weekdayChips.map((day) => {
            const isAvailable = availableWeekdays.includes(day.key)

            return (
             <span
              key={day.key}
              title={day.fullLabel}
              aria-label={day.fullLabel}
              style={{
               ...styles.weekdayChip,
               border: `1px solid ${isAvailable ? colors.borderStrong : colors.border}`,
               background: isAvailable
                ? "linear-gradient(135deg, rgba(200,169,108,0.20), rgba(200,169,108,0.12))"
                : "rgba(255,255,255,0.03)",
               color: isAvailable ? colors.textPrimary : colors.textMuted,
               opacity: isAvailable ? 1 : 0.55
              }}
             >
              {day.label}
             </span>
            )
           })}
          </div>
         </div>
        )}

        {purpose === "trial" && (
         <div style={styles.trialBlock}>
          <p style={styles.trialLabel}>Trial booking fee</p>
          <p style={styles.trialAmount}>₹{TRIAL_FEE}</p>
          <p style={styles.trialNote}>{TRIAL_FEE_NOTE}</p>
         </div>
        )}
       </div>

       <button
        type="button"
        onClick={() => selectPlan(plan)}
        style={styles.chooseButton}
       >
        Choose Plan
       </button>
      </div>
     )
    })}
   </Grid>
  </Container>
 )
}

const styles = {
 headerCard: {
  padding: "22px 24px",
  marginBottom: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.015))",
  boxShadow: shadow.card
 },
 badge: {
  color: colors.secondary,
  textTransform: "uppercase" as const,
  letterSpacing: "0.16em",
  fontSize: "12px",
  marginBottom: spacing.sm,
  fontWeight: 700
 },
 heading: {
  ...typography.subtitle,
  fontSize: "clamp(28px, 4vw, 40px)",
  marginBottom: "8px",
  lineHeight: 1.02
 },
 subheading: {
  color: colors.textSecondary,
  lineHeight: 1.7,
  maxWidth: "56ch"
 },
 planCount: {
  marginTop: spacing.sm,
  color: colors.primaryLight,
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  fontSize: "12px"
 },
 card: {
  padding: "20px",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  background: "linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
  boxShadow: shadow.card,
  color: colors.textPrimary,
  display: "flex",
  flexDirection: "column" as const,
  gap: "16px",
  minHeight: "260px",
  justifyContent: "space-between",
  textAlign: "left" as const
 },
 cardLabel: {
  color: colors.secondary,
  textTransform: "uppercase" as const,
  letterSpacing: "0.16em",
  fontSize: "12px",
  marginBottom: spacing.sm,
  fontWeight: 700
 },
 cardTitle: {
  ...typography.subtitle,
  fontSize: "26px",
  marginBottom: "6px",
  lineHeight: 1.05
 },
 cardSubtitle: {
  color: colors.textSecondary,
  fontSize: "13px",
  lineHeight: 1.55
 },
 weekdayBlock: {
  display: "flex",
  flexDirection: "column" as const,
  gap: "8px",
  marginTop: spacing.md
 },
 weekdayLabel: {
  color: colors.textSecondary,
  textTransform: "uppercase" as const,
  letterSpacing: "0.16em",
  fontSize: "11px",
  fontWeight: 700
 },
 weekdayRow: {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px"
 },
 weekdayChip: {
  width: "30px",
  height: "30px",
  borderRadius: "50%",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "11px",
  fontWeight: 700
 },
 trialBlock: {
  padding: "16px 18px",
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(135deg, rgba(200,169,108,0.12), rgba(255,255,255,0.03))"
 },
 trialLabel: {
  color: colors.primaryLight,
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase" as const,
  letterSpacing: "0.12em",
  marginBottom: "6px"
 },
 trialAmount: {
  color: colors.textPrimary,
  fontSize: "28px",
  fontWeight: 800,
  marginBottom: "8px"
 },
 trialNote: {
  color: colors.textSecondary,
  lineHeight: 1.6,
  fontSize: "13px"
 },
 chooseButton: {
  minHeight: "50px",
  width: "100%",
  borderRadius: "999px",
  border: "none",
  background: colors.primary,
  color: colors.textOnAccent,
  padding: "12px 18px",
  cursor: "pointer",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontSize: "12px",
  fontWeight: 700
 }
}
