"use client"

import { colors, radius, spacing } from "../../styles/GlobalStyles"
import type { UserState } from "../../store/userStore"

export interface FlowProgressState {
 step: number
 total: number
 label: string
}

interface FlowProgressProps {
 progress: FlowProgressState
}

export interface FlowProgressContext {
 purpose: UserState["purpose"]
 status: UserState["status"]
 injury: boolean
 program: string
 exerciseType: string
 age: number | null
}

interface FlowStepDefinition {
 routes: string[]
 label: string
}

const hiddenRoutes = new Set([
 "/",
 "/goal",
 "/specific-goal",
 "/injury",
 "/injury-details",
 "/experience",
 "/exercise-type",
 "/batch-type",
 "/time-selection",
 "/personal-training",
 "/enquiry",
 "/success",
 "/enquiry-thank-you"
])

const buildNewUserSteps = (state: FlowProgressContext): FlowStepDefinition[] => {
 const steps: FlowStepDefinition[] = [
  { routes: ["/phone"], label: "Phone Check" },
  { routes: ["/user-details"], label: "Details & Assessment" },
 ]

 if (state.purpose === "enroll") {
  steps.push({ routes: ["/profile-photo"], label: "Profile Photo" })
 }

 steps.push(
  { routes: ["/program"], label: "Program Selection" },
  { routes: ["/plan"], label: "Plan Details" },
  {
   routes: ["/review"],
   label:
    state.purpose === "trial"
     ? "Review & Book Trial"
     : state.purpose === "enroll"
      ? "Review & Enroll"
      : state.purpose === "renew"
       ? "Review & Renew"
       : "Review & Finish"
  },
  { routes: ["/payment"], label: "Payment" },
  { routes: ["/payment/upi", "/payment/cash"], label: "Payment Method" },
  { routes: ["/consent"], label: "Consent" }
 )

 return steps
}

const buildBookingSteps = (state: FlowProgressContext): FlowStepDefinition[] => [
 { routes: ["/phone"], label: "Phone Check" },
 { routes: ["/return-user"], label: "Choose Next Step" },
 { routes: ["/plan"], label: "Plan & Add-ons" },
 {
  routes: ["/review"],
  label:
   state.purpose === "renew"
    ? "Review & Renew"
    : state.purpose === "trial"
     ? "Review & Book Trial"
     : "Review & Enroll"
 },
 { routes: ["/payment"], label: "Payment" },
 { routes: ["/payment/upi", "/payment/cash"], label: "Payment Method" },
 { routes: ["/consent"], label: "Consent" }
]

const buildProgress = (pathname: string, state: FlowProgressContext): FlowProgressState | null => {
 if (hiddenRoutes.has(pathname)) {
  return null
 }

 const isBookingFlow =
  state.status !== "new" &&
  (state.purpose === "trial" || state.purpose === "enroll" || state.purpose === "renew")
 const steps = isBookingFlow ? buildBookingSteps(state) : buildNewUserSteps(state)
 const currentStepIndex = steps.findIndex((step) => step.routes.includes(pathname))

 if (currentStepIndex >= 0) {
  return {
   step: currentStepIndex + 1,
   total: steps.length,
   label: steps[currentStepIndex].label
  }
 }

 return null
}

export const getFlowProgress = buildProgress

export default function FlowProgress({ progress }: FlowProgressProps) {
 const { step, total, label } = progress

 const segments = Array.from({ length: total }, (_, index) => index < step)

 return (
  <div style={styles.wrapper}>
   <div style={styles.header}>
    <span style={styles.stepText}>
     Step {step} of {total}
    </span>

    <span style={styles.label}>
     {label}
    </span>
   </div>

   <div
    style={styles.track(total)}
    role="progressbar"
    aria-valuenow={step}
    aria-valuemin={1}
    aria-valuemax={total}
    aria-label={`Step ${step} of ${total}: ${label}`}
   >
    {segments.map((active, index) => (
     <span
      key={index}
      style={active ? styles.segmentActive : styles.segmentInactive}
     />
    ))}
   </div>
  </div>
 )
}

const styles = {
 wrapper: {
  width: "100%",
  maxWidth: "560px",
  margin: "0 auto clamp(10px, 1.8vh, 16px)",
  padding: "0 4px",
  boxSizing: "border-box" as const
 },
 header: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "baseline",
  gap: spacing.sm,
  marginBottom: spacing.xs,
  flexWrap: "wrap" as const
 },
 stepText: {
  color: colors.primaryLight,
  fontSize: "12px",
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  fontWeight: 700
 },
 label: {
  color: colors.textSecondary,
  fontSize: "12px",
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontWeight: 700,
  textAlign: "right" as const
 },
 track: (total: number) => ({
  display: "grid",
  gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))`,
  gap: "6px",
  alignItems: "center"
 }),
 segmentInactive: {
  display: "block",
  height: "8px",
  borderRadius: radius.md,
  background: "rgba(255,255,255,0.08)",
  border: `1px solid ${colors.border}`
 },
 segmentActive: {
  display: "block",
  height: "8px",
  borderRadius: radius.md,
  background: "linear-gradient(135deg, rgba(200,169,108,0.95), rgba(243,224,182,0.92))",
  boxShadow: "0 0 0 1px rgba(243,224,182,0.12)"
 }
}
