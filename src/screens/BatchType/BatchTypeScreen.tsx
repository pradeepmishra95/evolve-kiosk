import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import ChoiceCard from "../../components/cards/ChoiceCard"
import { usePlanCatalog } from "../../hooks/usePlanCatalog"
import { useUserStore } from "../../store/userStore"
import { matchesLabel } from "../../utils/labelMatch"
import { getSchedulePeriodOptions } from "../../utils/planSchedule"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"

export default function BatchTypeScreen() {
 const navigate = useNavigate()
 const { age, program, exerciseType } = useUserStore()
 const setData = useUserStore((state) => state.setData)
 const { adultPlans, kidsPlans, loading } = usePlanCatalog()

 const plans = age !== null && age <= 12 ? kidsPlans : adultPlans
 const selectedPlan = plans.find(
  (plan) =>
   matchesLabel(plan.name, program) ||
   matchesLabel(plan.name, exerciseType) ||
   (plan.program ? matchesLabel(plan.program, exerciseType) : false)
 )
 const scheduleOptions = getSchedulePeriodOptions(selectedPlan?.timings ?? [])

 const selectBatch = (type: string) => {
  setData({
   batchType: type,
   batchTime: "",
   batchDate: ""
  })

  navigate("/program")
 }

 if (loading && !selectedPlan) {
  return (
   <Container centerContent>
    <div style={styles.state}>
     Loading batch types...
    </div>
   </Container>
  )
 }

 if (!loading && !selectedPlan) {
  return (
   <Container centerContent>
    <div style={styles.state}>
     No batch options are available for this plan.
    </div>
   </Container>
  )
 }

 if (!loading && scheduleOptions.length === 0) {
  return (
   <Container centerContent>
    <div style={styles.wrapper}>
     <div style={styles.state}>
      <h2
       style={{
        fontSize: typography.subtitle.fontSize,
        marginBottom: spacing.sm
       }}
      >
       Choose Batch
      </h2>

      <p style={{ lineHeight: 1.6 }}>
       No batch options are available for this plan.
      </p>
     </div>
    </div>
   </Container>
  )
 }

 return (
  <Container centerContent>
   <div style={styles.wrapper}>
    <div style={styles.surface}>
     <p style={styles.kicker}>Schedule</p>

     <h2 style={styles.heading}>
      Choose Batch
     </h2>

     <Grid>
      {scheduleOptions.map((option) => (
       <ChoiceCard
        key={option.value}
        title={option.label}
        subtitle={`${option.timings.length} timing${option.timings.length === 1 ? "" : "s"} available`}
        footer={
         <div style={styles.timeChipWrap}>
          {option.timings.map((timing) => (
           <span key={timing} style={styles.timeChip}>
            {timing}
           </span>
          ))}
         </div>
        }
        onClick={() => selectBatch(option.value)}
       />
      ))}
     </Grid>
    </div>
   </div>
  </Container>
 )
}

const styles = {
 wrapper: {
  width: "100%",
  maxWidth: "760px",
  margin: "0 auto"
 },
 surface: {
  padding: "clamp(18px, 2.4vh, 28px)",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  background: "linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
  boxShadow: "0 20px 60px rgba(0,0,0,0.22)"
 },
 kicker: {
  color: colors.primaryLight,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: spacing.xs
 },
 heading: {
  ...typography.subtitle,
  fontSize: "clamp(28px, 3.4vh, 36px)",
  marginBottom: spacing.sm
 },
 description: {
  textAlign: "center" as const,
  color: colors.textSecondary,
  marginBottom: spacing.lg,
  lineHeight: 1.6
 },
 timeChipWrap: {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px"
 },
 timeChip: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "6px 10px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textPrimary,
  fontSize: "12px",
  fontWeight: 700,
  lineHeight: 1
 },
 state: {
  textAlign: "center" as const,
  padding: spacing.xl,
  color: colors.textSecondary
 }
}
