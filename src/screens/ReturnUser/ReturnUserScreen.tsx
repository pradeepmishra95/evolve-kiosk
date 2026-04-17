import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import OptionCard from "../../components/cards/OptionCard"
import { usePlanCatalog } from "../../hooks/usePlanCatalog"
import { useUserStore } from "../../store/userStore"
import { matchesLabel } from "../../utils/labelMatch"
import { getTrialPlanPricing, TRIAL_FEE, TRIAL_FEE_NOTE } from "../../utils/trialPricing"
import type { ProgramPlan } from "../../types/domain"

const getSelectedPlan = (plans: ProgramPlan[], program: string, exerciseType: string) =>
 plans.find(
  (plan) =>
   matchesLabel(plan.name, program) ||
   matchesLabel(plan.name, exerciseType) ||
   (plan.program ? matchesLabel(plan.program, exerciseType) : false)
 )

const getRegularPlanPricing = (plan?: ProgramPlan) => {
 if (!plan?.pricing?.length) {
  return null
 }

 return plan.pricing.find((option) => option.duration !== "1 Day") ?? plan.pricing[0] ?? null
}

export default function ReturnUserScreen() {
 const navigate = useNavigate()

 const {
  name,
  status,
  age,
  program,
  exerciseType,
  days,
  duration,
  price,
  batchType,
  batchTime,
  batchDate,
  setData
 } = useUserStore()
 const { adultPlans, kidsPlans } = usePlanCatalog()

 const plans = age !== null && age <= 12 ? kidsPlans : adultPlans
 const selectedPlan = getSelectedPlan(plans, program, exerciseType)
 const resolvedProgram = program || selectedPlan?.name || ""
 const resolvedDays = days || selectedPlan?.scheduleDays?.join(", ") || selectedPlan?.days || ""
 const resolvedStatus = status || "enquiry"
 const resolvedRenewDuration = duration || selectedPlan?.pricing?.[0]?.duration || ""
 const resolvedRegularPricing = getRegularPlanPricing(selectedPlan)
 const resolvedRenewPrice =
  resolvedRegularPricing?.price ?? (price !== TRIAL_FEE ? price : 0)

 const getHeading = () => `Welcome Back${name ? `, ${name}` : ""}`

 const handleTrial = () => {
  const trialPricing = selectedPlan ? getTrialPlanPricing(selectedPlan) : null

  setData({
   purpose: "trial",
   status: "trial",
   program: resolvedProgram,
   days: resolvedDays,
   duration: trialPricing?.duration || duration || "1 Day",
   price: TRIAL_FEE,
   mainPlanPrice: TRIAL_FEE,
   selectedAddOnIds: [],
   batchType,
   batchTime,
   batchDate,
   injuryAnswered: true,
   paymentReference: "",
   paymentMethod: "",
   paymentStatus: ""
  })

  navigate("/review")
 }

 const handleEnroll = () => {
  const resolvedEnrollDuration =
   resolvedRegularPricing?.duration || (duration && duration !== "1 Day" ? duration : "")
  const resolvedEnrollPrice =
   resolvedRegularPricing?.price ?? (price !== TRIAL_FEE ? price : 0)

  setData({
   purpose: "enroll",
   status: "member",
   cameFromTrial: resolvedStatus === "trial",
   program: resolvedProgram,
   days: resolvedDays,
   duration: resolvedEnrollDuration,
   price: resolvedEnrollPrice,
   mainPlanPrice: resolvedEnrollPrice,
   selectedAddOnIds: [],
   batchType,
   batchTime,
   batchDate,
   injuryAnswered: true,
   paymentReference: "",
   paymentMethod: "",
   paymentStatus: ""
  })

  navigate("/plan")
 }

 const handleRenew = () => {
  const resolvedRenewPricing = resolvedRegularPricing

  setData({
   purpose: "renew",
   status: "member",
   program: resolvedProgram,
   days: resolvedDays,
   duration: resolvedRenewPricing?.duration || resolvedRenewDuration,
   price: resolvedRenewPricing?.price ?? resolvedRenewPrice,
   mainPlanPrice: resolvedRenewPricing?.price ?? resolvedRenewPrice,
   selectedAddOnIds: [],
   batchType,
   batchTime,
   batchDate,
   injuryAnswered: true,
   paymentReference: "",
   paymentMethod: "",
   paymentStatus: ""
  })

  navigate("/plan")
 }

 const cards = (() => {
  if (resolvedStatus === "member") {
   return [
    {
     title: "Renew",
     onClick: handleRenew
    }
   ]
  }

  if (resolvedStatus === "trial") {
   return [
    {
     title: "Enroll",
     onClick: handleEnroll
    }
   ]
  }

  return [
   {
    title: "Book Trial",
    subtitle: `₹${TRIAL_FEE} trial booking fee. ${TRIAL_FEE_NOTE}`,
    onClick: handleTrial
   },
   {
    title: "Enroll",
    onClick: handleEnroll
   }
  ]
 })()

 return (
  <Container centerContent>
   <div style={styles.centerStack}>
    <h2 style={styles.heading}>{getHeading()}</h2>

    <Grid style={styles.grid}>
     {cards.map((card) => (
      <OptionCard
       key={card.title}
       title={card.title}
       showBadge={false}
       centered
       onClick={card.onClick}
      />
     ))}
    </Grid>
   </div>
  </Container>
 )
}

const styles = {
 centerStack: {
  width: "100%",
  maxWidth: "760px",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  alignItems: "stretch",
  gap: "clamp(12px, 2vh, 22px)",
  transform: "translateY(calc(clamp(56px, 7vh, 100px) * -1))"
 },
 heading: {
  textAlign: "center" as const,
  margin: 0
 },
 subheading: {
  textAlign: "center" as const,
  color: "rgba(255,255,255,0.68)",
  fontSize: "14px",
  letterSpacing: "0.06em",
  marginTop: "-4px",
  marginBottom: "6px"
 },
 grid: {
  marginTop: 0
 }
}
