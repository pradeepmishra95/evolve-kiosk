import { useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import ChoiceCard from "../../components/cards/ChoiceCard"
import DialogDateField, { type DialogDateOption } from "../../components/datetime/DialogDateField"
import DialogTimeField, { type DialogTimeOption } from "../../components/datetime/DialogTimeField"
import { usePlanCatalog } from "../../hooks/usePlanCatalog"
import { useUserStore } from "../../store/userStore"
import { matchesLabel } from "../../utils/labelMatch"
import {
 getSchedulePeriodOptions,
 getTimingsForPeriod,
 getUpcomingScheduleDatesForDays
} from "../../utils/planSchedule"
import { formatScheduleDate, getUpcomingScheduleDates, isTrialBookingDateAllowed } from "../../utils/schedule"
import { startOfDay, toDateInputValue } from "../../utils/dateTimeSelector"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"

export default function TimeSelectionScreen() {
 const navigate = useNavigate()
 const { batchType, age, purpose, batchTime, batchDate, program, exerciseType } = useUserStore()
 const setData = useUserStore((state) => state.setData)
 const { adultPlans, kidsPlans, loading } = usePlanCatalog()
 const [error, setError] = useState("")

 const plans = age !== null && age <= 12 ? kidsPlans : adultPlans
 const selectedPlan = plans.find(
  (plan) =>
   matchesLabel(plan.name, program) ||
   matchesLabel(plan.name, exerciseType) ||
   (plan.program ? matchesLabel(plan.program, exerciseType) : false)
 )

 const resolvedTimings = selectedPlan?.timings ?? []
 const scheduleDays = selectedPlan?.scheduleDays ?? []
 const schedulePeriodOptions = getSchedulePeriodOptions(resolvedTimings)
 const resolvedBatchType = batchType || schedulePeriodOptions[0]?.value || "custom"
 const resolvedBatchTypeLabel =
  schedulePeriodOptions.find((option) => option.value === resolvedBatchType)?.label || "Custom"
 const batchTimings = getTimingsForPeriod(resolvedTimings, resolvedBatchType)
 const needsDateSelection = purpose === "trial" || purpose === "enroll"
 const requestedDateCount = purpose === "trial" ? 28 : 7
 const dateOptions =
  scheduleDays.length > 0
   ? getUpcomingScheduleDatesForDays(scheduleDays, requestedDateCount)
   : getUpcomingScheduleDates(requestedDateCount)
 const selectedTimeLabel = batchTime || ""
 const selectedDateLabel = batchDate ? formatScheduleDate(batchDate) : ""
 const timeOptions: DialogTimeOption[] = batchTimings.map((timing, index) => ({
  value: timing,
  label: timing,
  description: index === 0 ? "Recommended" : "Available"
 }))
 const trialDateOptions: DialogDateOption[] = dateOptions
  .filter((dateOption) => isTrialBookingDateAllowed(dateOption.value))
  .slice(0, 7)
  .map((dateOption, index) => ({
   ...dateOption,
   disabled: timeOptions.length === 0,
   description:
    timeOptions.length > 0 ? (index === 0 ? `${timeOptions.length} slots · soonest` : `${timeOptions.length} slots`) : "No slots"
  }))

 const handleBatchTypeChange = (value: string) => {
  setData({
   batchType: value,
   batchTime: "",
   batchDate: ""
  })
  setError("")
 }

 const handleContinue = () => {
  if (!batchTime) {
   setError("Please select a batch time.")
   return
  }

  if (needsDateSelection && !batchDate) {
   setError("Please select a preferred start date.")
   return
  }

  if (purpose === "trial" && !isTrialBookingDateAllowed(batchDate)) {
   setError("Trial booking is not available on Wednesday, Saturday, or Sunday.")
   return
  }

  if (!batchType && resolvedBatchType) {
   setData({ batchType: resolvedBatchType })
  }

  navigate("/review")
 }

 if (loading && !selectedPlan) {
  return (
   <Container>
    <div
     style={{
      textAlign: "center",
      padding: spacing.xl,
      color: colors.textSecondary
     }}
    >
     Loading schedule options...
    </div>
   </Container>
  )
 }

 if (!loading && !selectedPlan) {
  return (
   <Container>
    <div
     style={{
      textAlign: "center",
      padding: spacing.xl,
      color: colors.textSecondary
     }}
    >
     No schedule options are available for this plan.
    </div>
   </Container>
  )
 }

 if (!loading && batchTimings.length === 0) {
  return (
   <Container>
    <div
     style={{
      textAlign: "center",
      padding: spacing.xl,
      color: colors.textSecondary,
      maxWidth: "720px",
      margin: "0 auto"
     }}
    >
     <h2
      style={{
       fontSize: typography.subtitle.fontSize,
       marginBottom: spacing.sm
      }}
     >
      Select Schedule
     </h2>

     <p style={{ lineHeight: 1.6 }}>
      No batch timings are available for this plan.
     </p>
    </div>
   </Container>
  )
 }

 return (
  <Container>
   <div style={styles.wrapper}>
    <div style={styles.surface}>
     <div style={styles.header}>
      <div>
       <p style={styles.kicker}>Schedule</p>
       <h2 style={styles.heading}>Select Schedule</h2>
      </div>

      <div style={styles.headerPill}>
       {resolvedBatchTypeLabel}
      </div>
     </div>

     <div style={styles.planCard}>
      <div style={styles.planCardTopRow}>
       <p style={styles.sectionLabel}>Plan Details</p>

       <span style={styles.planBadge}>
        {batchTimings.length} slots
       </span>
      </div>

      <p style={styles.planTitle}>{selectedPlan?.name}</p>

      <div style={styles.metaRow}>
       <span style={styles.metaChip}>
        {selectedPlan?.program || exerciseType || "Training"} focus
       </span>
       <span style={styles.metaChip}>
        {needsDateSelection ? "Date required" : "Time only"}
       </span>
       <span style={styles.metaChip}>
        {scheduleDays.length > 0 ? `${scheduleDays.length} active days` : "Flexible start"}
       </span>
      </div>
     </div>

    <div style={styles.sectionCard}>
     <div style={styles.sectionHeader}>
      <div>
       <p style={styles.sectionLabel}>Batch Type</p>
      </div>
     </div>

      <div style={styles.grid}>
       {schedulePeriodOptions.map((option, index) => (
        <ChoiceCard
         key={option.value}
         title={option.label}
         subtitle={`${option.timings.length} timing${option.timings.length === 1 ? "" : "s"} available`}
         selected={resolvedBatchType === option.value}
         badgeLabel={resolvedBatchType === option.value ? "Chosen" : index === 0 ? "Default" : "Pick"}
         centered={false}
         onClick={() => handleBatchTypeChange(option.value)}
        />
       ))}
      </div>
     </div>

     {error && (
      <p style={styles.errorText}>
       {error}
      </p>
     )}

     {needsDateSelection && (
      <div style={styles.sectionCard}>
       <DialogDateField
        label={purpose === "trial" ? "Trial Booking Date" : "Joining Date"}
        value={batchDate}
        onChange={(value) => {
         setData({ batchDate: value })
         setError("")
        }}
        min={toDateInputValue(startOfDay())}
        options={purpose === "trial" ? trialDateOptions : undefined}
        helperText={
         purpose === "trial"
          ? "Open the calendar-style picker and confirm the trial day."
          : "Open the date picker and confirm the joining day."
        }
        pickerTitle={purpose === "trial" ? "Select Trial Date" : "Select Joining Date"}
       />
      </div>
     )}

    <div style={styles.sectionCard}>
     <DialogTimeField
      label={purpose === "trial" ? "Trial Booking Time" : "Batch Time"}
      value={batchTime}
      onChange={(value) => {
       setData({ batchTime: value })
       setError("")
      }}
      options={timeOptions}
      helperText={
       purpose === "trial"
        ? "Use the time selector or choose one of the available trial slots."
        : "Use the dialog picker or choose a suggested batch time."
      }
      allowCustom
      emptyMessage="No batch timings are available for this plan."
      pickerTitle={purpose === "trial" ? "Select Trial Time" : "Select Batch Time"}
     />
    </div>

     <div style={styles.actions}>
      <div style={styles.selectionSummary}>
       <div>
        <p style={styles.selectionSummaryLabel}>Selected</p>
        <p style={styles.selectionSummaryValue}>
         {selectedTimeLabel || "Pick a batch time"}
         {needsDateSelection && (
          <>
           {" "}
           · {selectedDateLabel || "Pick a start day"}
          </>
         )}
        </p>
       </div>
      </div>

      <PrimaryButton
       title="Continue"
       onClick={handleContinue}
       fullWidth
      />
     </div>
    </div>
   </div>
  </Container>
 )
}

const styles = {
 wrapper: {
  width: "min(100%, 760px)",
  margin: "0 auto"
 },
 surface: {
  padding: "clamp(18px, 2.4vh, 30px)",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  background:
   "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018)), radial-gradient(circle at top right, rgba(200,169,108,0.08), transparent 34%), radial-gradient(circle at bottom left, rgba(106,166,154,0.08), transparent 30%)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
  backdropFilter: "blur(14px)"
 },
 header: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: spacing.md,
  flexWrap: "wrap" as const,
  marginBottom: spacing.lg
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
  margin: 0
 },
 headerPill: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.primaryLight,
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const
 },
 planCard: {
  marginBottom: spacing.lg,
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018))"
 },
 planCardTopRow: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: spacing.sm,
  marginBottom: spacing.sm
 },
 planNote: {
  color: colors.textSecondary,
  lineHeight: 1.6,
  marginTop: spacing.sm
 },
 planBadge: {
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
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
 },
 errorText: {
  textAlign: "center" as const,
  color: "#F1A596",
  marginBottom: spacing.md,
  lineHeight: 1.5
 },
 sectionCard: {
  marginBottom: spacing.lg,
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.025)"
 },
 sectionLabel: {
  color: colors.primaryLight,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: spacing.md
 },
 sectionHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: spacing.md,
  flexWrap: "wrap" as const,
  marginBottom: spacing.md
 },
 sectionHint: {
  color: colors.textSecondary,
  fontSize: "13px",
  lineHeight: 1.5,
  maxWidth: "52ch"
 },
 planTitle: {
  color: colors.textPrimary,
  fontSize: "24px",
  fontWeight: 700,
  marginBottom: spacing.sm,
  lineHeight: 1.2
 },
 grid: {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))",
  gap: spacing.md
 },
 actions: {
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "stretch",
  gap: spacing.md
 },
 selectionSummary: {
  border: `1px solid ${colors.borderStrong}`,
  borderRadius: radius.lg,
  background: "rgba(255,255,255,0.04)",
  padding: "14px 16px"
 },
 selectionSummaryLabel: {
  color: colors.textMuted,
  fontSize: "11px",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  fontWeight: 700,
  marginBottom: "4px"
 },
 selectionSummaryValue: {
  color: colors.textPrimary,
  fontSize: "15px",
  lineHeight: 1.5,
  fontWeight: 600
 },
 metaRow: {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
  marginTop: spacing.md
 },
 metaChip: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "7px 11px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textSecondary,
  fontSize: "12px",
  fontWeight: 700
 }
}
