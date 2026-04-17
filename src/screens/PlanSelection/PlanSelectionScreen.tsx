"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import ChoiceCard from "../../components/cards/ChoiceCard"
import { usePlanCatalog } from "../../hooks/usePlanCatalog"
import { useUserStore } from "../../store/userStore"
import type { ProgramPlan } from "../../types/domain"
import { TRIAL_FEE, TRIAL_FEE_NOTE, getTrialPlanPricing } from "../../utils/trialPricing"
import { matchesLabel } from "../../utils/labelMatch"
import { getSchedulePeriodOptions, getTimingsForPeriod, normalizeDurationLabel } from "../../utils/planSchedule"
import { buildPriceBreakdown, resolveAddonPlans, resolvePlanPricing } from "../../utils/planPricing"
import { colors, radius, shadow, spacing, typography } from "../../styles/GlobalStyles"
import {
 buildPlanInfo,
 formatCurrency,
 getRelatedTrainingType,
} from "../ProgramSelection/planSelectionHelpers"

const isPersonalTrainingPlan = (plan: ProgramPlan) =>
 plan.type === "personal" || matchesLabel(plan.name, "Personal Training")

const getSelectedPlan = (plans: ProgramPlan[], planId: string, program: string, exerciseType: string) =>
 plans.find((plan) => plan.id === planId) ||
 plans.find(
  (plan) =>
   matchesLabel(plan.name, program) ||
   matchesLabel(plan.name, exerciseType) ||
   (plan.program ? matchesLabel(plan.program, exerciseType) : false)
 )

export default function PlanSelectionScreen() {
 const navigate = useNavigate()
 const { trainingTypes, adultPlans, kidsPlans, loading } = usePlanCatalog()

 const {
  age,
  exerciseType,
  purpose,
  program,
  duration,
  batchType,
  batchTime,
  selectedPlanId,
  selectedAddOnIds
 } = useUserStore()
 const setData = useUserStore((state) => state.setData)

 const plans: ProgramPlan[] = age && age <= 12 ? kidsPlans : adultPlans
 const selectedPlan = getSelectedPlan(plans, selectedPlanId, program, exerciseType)
 const selectedPlanTrainingType = selectedPlan
  ? getRelatedTrainingType(selectedPlan, trainingTypes, exerciseType)
  : undefined
 const selectedPlanInfo = selectedPlan
  ? buildPlanInfo(selectedPlan, selectedPlanTrainingType, exerciseType)
  : null
 const selectedPlanName = selectedPlan?.name || program || "Select Plan"
 const selectedPlanHeading = selectedPlanInfo && selectedPlan
  ? `${selectedPlanInfo.programName} ${selectedPlan.name}`.trim()
  : selectedPlanName

 const initialPricingIndex = useMemo(() => {
  if (!selectedPlan?.pricing?.length) {
   return 0
  }

  const normalizedDuration = normalizeDurationLabel(duration || "")

  if (!normalizedDuration) {
   return 0
  }

  const matchedIndex = selectedPlan.pricing.findIndex(
   (option) => normalizeDurationLabel(option.duration) === normalizedDuration
  )

  return matchedIndex >= 0 ? matchedIndex : 0
 }, [duration, selectedPlan])

 const [selectedPricingIndex, setSelectedPricingIndex] = useState(initialPricingIndex)
 const [selectedSchedulePeriod, setSelectedSchedulePeriod] = useState("")
 const [selectedScheduleTime, setSelectedScheduleTime] = useState("")
 const addOnsSectionRef = useRef<HTMLDivElement | null>(null)
 const canShowAddOns = purpose !== "trial" && purpose !== "enquiry"

 useEffect(() => {
  setSelectedPricingIndex(initialPricingIndex)
 }, [initialPricingIndex])

 const selectedMainPricing = selectedPlan
  ? resolvePlanPricing(selectedPlan, selectedPlan?.pricing?.[selectedPricingIndex]?.duration)
  : null
 const addonPlans = useMemo(
  () =>
   canShowAddOns
    ? resolveAddonPlans(plans, selectedPlan, exerciseType, selectedMainPricing?.duration)
    : [],
  [canShowAddOns, exerciseType, plans, selectedMainPricing?.duration, selectedPlan]
 )
 const selectedAddonPlans = addonPlans.filter((plan) => selectedAddOnIds.includes(plan.id))
 const addonTotal = selectedAddonPlans.reduce((total, addon) => total + addon.pricing.price, 0)
 const mainPlanPrice = selectedMainPricing?.price ?? 0
 const totalPrice = mainPlanPrice + addonTotal
 const showAddOnsSection = canShowAddOns && addonPlans.length > 0
 const priceBreakdown = buildPriceBreakdown(
  "Main Plan",
  mainPlanPrice,
  selectedAddonPlans
 )

 const selectedPlanScheduleOptions = selectedPlan
  ? getSchedulePeriodOptions(selectedPlan.timings ?? [])
  : []
 const resolvedSchedulePeriod =
  selectedSchedulePeriod || batchType || selectedPlanScheduleOptions[0]?.value || "custom"
 const selectedPlanScheduleTimings = selectedPlan
  ? getTimingsForPeriod(selectedPlan.timings ?? [], resolvedSchedulePeriod)
  : []
 const resolvedScheduleTime =
  selectedScheduleTime || batchTime || selectedPlanScheduleTimings[0] || ""
 const selectedPlanScheduleLabel =
  selectedPlanScheduleOptions.find((option) => option.value === resolvedSchedulePeriod)?.label ||
  "Custom"

 const handleSchedulePeriodChange = (value: string) => {
  if (!selectedPlan) {
   return
  }

  const nextTimings = getTimingsForPeriod(selectedPlan.timings ?? [], value)

  setSelectedSchedulePeriod(value)
  setSelectedScheduleTime(nextTimings[0] || "")
 }

 const handleScheduleTimeChange = (value: string) => {
  setSelectedScheduleTime(value)
 }

 const scrollToAddOns = () => {
  addOnsSectionRef.current?.scrollIntoView({
   behavior: "smooth",
   block: "start"
  })
 }

 const toggleAddon = (planId: string) => {
  const nextSelection = selectedAddOnIds.includes(planId)
   ? selectedAddOnIds.filter((id) => id !== planId)
   : [...selectedAddOnIds, planId]
  const nextSelectedAddonPlans = addonPlans.filter((plan) => nextSelection.includes(plan.id))
  const nextAddonTotal = nextSelectedAddonPlans.reduce(
   (total, addon) => total + addon.pricing.price,
   0
  )

  setData({
   selectedAddOnIds: nextSelection,
   mainPlanPrice,
   price: mainPlanPrice + nextAddonTotal
  })
 }

 const confirmSelectedPlan = () => {
  if (!selectedPlan) {
   return
  }

  const nextDays = selectedPlan.scheduleDays?.length ? selectedPlan.scheduleDays.join(", ") : selectedPlan.days || ""
  const availableScheduleOptions = getSchedulePeriodOptions(selectedPlan.timings ?? [])
  const resolvedBatchType =
   selectedSchedulePeriod ||
   batchType ||
   availableScheduleOptions[0]?.value ||
   "custom"
  const resolvedBatchTime =
   resolvedScheduleTime ||
   batchTime ||
   getTimingsForPeriod(selectedPlan.timings ?? [], resolvedBatchType)[0] ||
   ""
  const selectedPricing = selectedPlan.pricing?.[selectedPricingIndex] || selectedPlan.pricing?.[0]
  const nextMainPlanPrice = selectedPricing?.price ?? 0
  const nextAddonPlans = addonPlans.filter((plan) => selectedAddOnIds.includes(plan.id))
  const nextAddonTotal = nextAddonPlans.reduce((total, addon) => total + addon.pricing.price, 0)
  const nextTotalPrice = nextMainPlanPrice + nextAddonTotal

  if (purpose === "trial") {
   const trialPricing = getTrialPlanPricing(selectedPlan)

   setData({
    selectedPlanId: selectedPlan.id,
    purpose: "trial",
    status: "trial",
    program: selectedPlan.name,
    days: nextDays,
    duration: trialPricing.duration,
    price: trialPricing.price,
    mainPlanPrice: trialPricing.price,
    selectedAddOnIds: [],
    batchType: resolvedBatchType,
    batchTime: resolvedBatchTime,
    batchDate: "",
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })

   navigate("/review")
   return
  }

  if (purpose === "enquiry") {
   setData({
    selectedPlanId: selectedPlan.id,
    program: selectedPlan.name,
    days: nextDays,
    duration: selectedPricing?.duration || selectedPlan.pricing?.[0]?.duration || "",
    price: nextTotalPrice,
    mainPlanPrice: nextMainPlanPrice,
    selectedAddOnIds: [],
    batchType: resolvedBatchType,
    batchTime: resolvedBatchTime,
    batchDate: "",
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })

   navigate("/review")
   return
  }

  if (purpose === "renew") {
   setData({
    selectedPlanId: selectedPlan.id,
    purpose: "renew",
    program: selectedPlan.name,
    days: nextDays,
    duration: selectedPricing?.duration || selectedPlan.pricing?.[0]?.duration || "Monthly",
    price: nextTotalPrice,
    mainPlanPrice: nextMainPlanPrice,
    selectedAddOnIds,
    batchType: resolvedBatchType,
    batchTime: resolvedBatchTime,
    batchDate: "",
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })

   navigate("/review")
   return
  }

  if (isPersonalTrainingPlan(selectedPlan)) {
   setData({
    selectedPlanId: selectedPlan.id,
    program: selectedPlan.name,
    days: nextDays,
    coach: "",
    price: 0,
    mainPlanPrice: 0,
    selectedAddOnIds: [],
    batchType: resolvedBatchType,
    batchTime: resolvedBatchTime,
    batchDate: "",
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })

   navigate("/personal-training")
   return
  }

  setData({
   selectedPlanId: selectedPlan.id,
   purpose: "enroll",
   program: selectedPlan.name,
   days: nextDays,
   duration: selectedPricing?.duration || selectedPlan.pricing?.[0]?.duration || "Monthly",
   price: nextTotalPrice,
   mainPlanPrice: nextMainPlanPrice,
   selectedAddOnIds,
   batchType: resolvedBatchType,
   batchTime: resolvedBatchTime,
   batchDate: "",
   paymentReference: "",
   paymentMethod: "",
   paymentStatus: ""
  })

  navigate("/review")
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
     Loading plan details...
    </div>
   </Container>
  )
 }

 if (!loading && !selectedPlan) {
  return (
   <Container scrollable>
    <div style={styles.emptyPage}>
     <p style={styles.badge}>Plan Details</p>
     <h2 style={styles.heading}>No plan selected yet</h2>
    </div>
   </Container>
  )
 }

 return (
  <Container scrollable>
   <div style={styles.pageShell}>
    <div style={styles.heroCard}>
     <p style={styles.badge}>Plan Details & Pricing</p>
     <h2 style={styles.heading}>{selectedPlanHeading}</h2>
    </div>

    <div style={styles.sectionCard}>
     <div style={styles.sectionHeaderRow}>
      <h3 style={{ ...styles.sectionTitle, marginBottom: 0 }}>
       {purpose === "trial" ? "Trial Booking Fee" : "Choose Duration"}
      </h3>

      {showAddOnsSection && (
       <button type="button" onClick={scrollToAddOns} style={styles.secondaryButton}>
        View Add-ons
       </button>
      )}
     </div>

     {purpose === "trial" ? (
      <div style={styles.trialBlock}>
       <div style={styles.trialHeader}>
        <p style={styles.trialLabel}>Trial Session</p>
        <p style={styles.trialAmount}>₹{TRIAL_FEE}</p>
       </div>
       <p style={styles.trialNote}>{TRIAL_FEE_NOTE}</p>
      </div>
     ) : selectedPlan?.pricing?.length ? (
      <Grid
       style={{
        marginTop: 0,
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))"
       }}
      >
       {selectedPlan?.pricing?.map((pricing, index) => (
        <ChoiceCard
         key={`${pricing.duration}-${pricing.price}`}
         title={pricing.duration}
         subtitle={`₹${pricing.price.toLocaleString("en-IN")}`}
         footer={
          pricing.originalPrice !== undefined && pricing.originalPrice > pricing.price ? (
           <p style={styles.pricingOriginal}>MRP {formatCurrency(pricing.originalPrice)}</p>
          ) : undefined
         }
         selected={selectedPricingIndex === index}
         badgeLabel={selectedPricingIndex === index ? "Selected" : index === 0 ? "Popular" : "Pick"}
         centered={false}
         onClick={() => setSelectedPricingIndex(index)}
        />
       ))}
      </Grid>
     ) : (
      <p style={styles.sectionText}>Pricing will be shared at the center.</p>
     )}
    </div>

    {showAddOnsSection && (
     <div ref={addOnsSectionRef} style={styles.sectionCard}>
      <h3 style={styles.sectionTitle}>Add-ons</h3>

      <Grid
       style={{
        marginTop: spacing.sm,
        gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 210px), 1fr))"
       }}
      >
       {addonPlans.map((plan, index) => {
        const isSelected = selectedAddOnIds.includes(plan.id)

        return (
         <ChoiceCard
          key={plan.id}
          title={plan.name}
          subtitle={`${formatCurrency(plan.pricing.price)}${plan.pricing.duration ? ` · ${plan.pricing.duration}` : ""}`}
          selected={isSelected}
          badgeLabel={isSelected ? "Added" : index === 0 ? "Add" : "Pick"}
          centered={false}
          onClick={() => toggleAddon(plan.id)}
         />
        )
       })}
      </Grid>
     </div>
    )}

    {showAddOnsSection && (
     <div style={styles.sectionCard}>
      <h3 style={styles.sectionTitle}>Price Breakdown</h3>

      <div style={styles.breakdownCard}>
       {priceBreakdown.map((item) => (
        <div key={item.label} style={styles.breakdownRow}>
         <span style={styles.breakdownLabel}>{item.label}</span>
         <span style={styles.breakdownValue}>{formatCurrency(item.amount)}</span>
        </div>
       ))}

       {selectedAddonPlans.length > 0 && (
        <>
         <div style={styles.breakdownDivider} />
         <div style={styles.breakdownRowTotal}>
          <span style={styles.breakdownLabel}>Add-ons Total</span>
          <span style={styles.breakdownValue}>{formatCurrency(addonTotal)}</span>
         </div>
        </>
       )}

       <div style={styles.breakdownDivider} />
       <div style={styles.breakdownRowTotal}>
        <span style={styles.breakdownLabel}>Total</span>
        <span style={styles.breakdownValue}>{formatCurrency(totalPrice)}</span>
       </div>
      </div>
     </div>
    )}

    <div style={styles.sectionCard}>
     <h3 style={styles.sectionTitle}>Choose Batch Type</h3>

     <Grid
      style={{
       marginTop: spacing.sm,
       gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 190px), 1fr))"
      }}
     >
      {selectedPlanScheduleOptions.length > 0 ? (
       selectedPlanScheduleOptions.map((option, index) => (
        <ChoiceCard
         key={option.value}
         title={option.label}
         subtitle={`${option.timings.length} timing${option.timings.length === 1 ? "" : "s"} available`}
         selected={resolvedSchedulePeriod === option.value}
         badgeLabel={resolvedSchedulePeriod === option.value ? "Selected" : index === 0 ? "Best" : "Pick"}
         centered={false}
         onClick={() => handleSchedulePeriodChange(option.value)}
        />
       ))
      ) : (
       <div style={styles.emptyState}>Batch timing will be set from the selected plan.</div>
      )}
     </Grid>
    </div>

    <div style={styles.sectionCard}>
     <h3 style={styles.sectionTitle}>Choose Time</h3>

     <Grid
      style={{
       marginTop: spacing.sm,
       gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))"
      }}
     >
      {selectedPlanScheduleTimings.length > 0 ? (
       selectedPlanScheduleTimings.map((timing, index) => (
        <ChoiceCard
         key={timing}
         title={timing}
         subtitle={resolvedScheduleTime === timing ? "Chosen for this booking" : "Tap to select"}
         selected={resolvedScheduleTime === timing}
         badgeLabel={resolvedScheduleTime === timing ? "Selected" : index === 0 ? "Best" : "Pick"}
         centered
         onClick={() => handleScheduleTimeChange(timing)}
        />
       ))
      ) : (
       <div style={styles.emptyState}>Timing will be confirmed by the center.</div>
      )}
     </Grid>

     {(resolvedSchedulePeriod || resolvedScheduleTime) && (
      <p style={styles.scheduleSummary}>
       Selected: <b>{selectedPlanScheduleLabel}</b>
       {resolvedScheduleTime ? ` · ${resolvedScheduleTime}` : ""}
      </p>
     )}
    </div>

    <div style={styles.footerActions}>
     <button
      type="button"
      onClick={confirmSelectedPlan}
      style={styles.primaryButton}
     >
      {purpose === "trial"
       ? "Book Trial"
       : purpose === "renew"
        ? "Continue Renewal"
        : purpose === "enquiry"
         ? "Continue with Enquiry"
         : "Continue to Review"}
     </button>
    </div>
   </div>
  </Container>
 )
}

const styles = {
 pageShell: {
  width: "100%",
  maxWidth: "980px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.lg
 },
 emptyPage: {
  width: "100%",
  maxWidth: "620px",
  margin: "0 auto",
  padding: "clamp(20px, 2.6vh, 30px)",
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
  boxShadow: shadow.card,
  textAlign: "center" as const
 },
 heroCard: {
  padding: "clamp(18px, 2.4vh, 30px)",
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
  maxWidth: "62ch"
 },
 infoCard: {
  padding: "18px",
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
  boxShadow: shadow.card,
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px"
 },
 infoLabel: {
  color: colors.primaryLight,
  textTransform: "uppercase" as const,
  letterSpacing: "0.16em",
  fontSize: "11px",
  fontWeight: 700
 },
 infoValue: {
  color: colors.textSecondary,
  lineHeight: 1.7,
  fontSize: "14px"
 },
 weekdayRow: {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
  marginTop: "4px"
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
 sectionCard: {
  padding: "clamp(18px, 2.2vh, 28px)",
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "linear-gradient(160deg, rgba(255,255,255,0.035), rgba(255,255,255,0.012))",
  boxShadow: shadow.card
 },
 sectionHeaderRow: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: spacing.sm,
  flexWrap: "wrap" as const,
  marginBottom: "10px"
 },
 sectionTitle: {
  ...typography.subtitle,
  fontSize: "22px",
  marginBottom: "10px",
  lineHeight: 1.08
 },
 sectionText: {
  color: colors.textSecondary,
  lineHeight: 1.75,
  fontSize: "14px"
 },
 sectionNote: {
  color: colors.textMuted,
  lineHeight: 1.6,
  marginBottom: spacing.sm,
  fontSize: "13px"
 },
 trialBlock: {
  padding: "16px 18px",
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(135deg, rgba(200,169,108,0.12), rgba(255,255,255,0.03))"
 },
 trialHeader: {
  display: "flex",
  alignItems: "baseline",
  justifyContent: "space-between",
  gap: spacing.sm,
  flexWrap: "wrap" as const
 },
 trialLabel: {
  color: colors.primaryLight,
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase" as const,
  letterSpacing: "0.12em",
  margin: 0
 },
 trialAmount: {
  color: colors.textPrimary,
  fontSize: "30px",
  fontWeight: 800,
  margin: 0
 },
 trialNote: {
  color: colors.textSecondary,
  lineHeight: 1.6,
  marginTop: "10px",
  fontSize: "13px"
 },
 emptyState: {
  padding: "14px 16px",
  borderRadius: radius.md,
  border: `1px dashed ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textSecondary,
  lineHeight: 1.6
 },
 scheduleSummary: {
  marginTop: spacing.md,
  color: colors.textSecondary,
  fontSize: "13px",
  lineHeight: 1.6
 },
 breakdownCard: {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
  padding: "16px 18px",
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.03)"
 },
 breakdownRow: {
  display: "flex",
  justifyContent: "space-between",
  gap: spacing.md,
  alignItems: "center"
 },
 breakdownRowTotal: {
  display: "flex",
  justifyContent: "space-between",
  gap: spacing.md,
  alignItems: "center",
  fontWeight: 800
 },
 breakdownLabel: {
  color: colors.textSecondary,
  fontSize: "14px",
  lineHeight: 1.5
 },
 breakdownValue: {
  color: colors.textPrimary,
  fontSize: "15px",
  fontWeight: 700,
  textAlign: "right" as const
 },
 breakdownDivider: {
  height: "1px",
  width: "100%",
  background: colors.borderStrong,
  opacity: 0.8
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
 tagsRow: {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px"
 },
 tagChip: {
  borderRadius: "999px",
  padding: "7px 12px",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textPrimary,
  fontSize: "12px",
  fontWeight: 600
 },
 footerActions: {
  display: "flex",
  gap: spacing.sm,
  justifyContent: "flex-end",
  flexWrap: "wrap" as const,
  paddingTop: spacing.xs
 },
 primaryButton: {
  minHeight: "48px",
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
 },
 secondaryButton: {
  minHeight: "48px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "transparent",
  color: colors.primaryLight,
  padding: "12px 18px",
  cursor: "pointer",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontSize: "12px",
  fontWeight: 700
 },
 pricingOriginal: {
  color: colors.textMuted,
  fontSize: "12px",
  marginTop: "8px",
  textDecoration: "line-through",
  textDecorationThickness: "1.5px",
  textDecorationColor: "#E85A5A"
 }
}
