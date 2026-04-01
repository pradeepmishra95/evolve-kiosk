import { useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import { useUserStore } from "../../store/userStore"

import { kidsPlans } from "../../database/kidsPlan"
import { adultPlans } from "../../database/adultPlans"
import { personalTraining } from "../../database/personalTraining"
import type { PersonalTrainingCoach, ProgramPlan, PlanPricing } from "../../types/domain"

import { colors, radius, shadow, spacing, typography } from "../../styles/GlobalStyles"

export default function ProgramSelectionScreen(){

 const navigate = useNavigate()
 const [visiblePrices, setVisiblePrices] = useState<Record<number, boolean>>({})

 const { age, exerciseType, purpose } = useUserStore()
 const setData = useUserStore(state => state.setData)

 const plans: ProgramPlan[] = age && age <= 12 ? kidsPlans : adultPlans
 const isAdultFlow = !age || age > 12
 const visiblePlans = purpose === "trial"
  ? plans.filter((plan) => plan.type !== "personal")
  : plans
 const screenHeading = exerciseType || "Select Program"
 const screenDescription = exerciseType
  ? `Choose your ${exerciseType.toLowerCase()} plan and view prices only if needed.`
  : "Choose your training path and view prices only if needed."

 const togglePrices = (planId: number) => {
  setVisiblePrices((current) => ({
   ...current,
   [planId]: !current[planId]
  }))
 }

 const getResolvedDays = (plan: ProgramPlan) => {
  if (exerciseType === "MMA" && isAdultFlow && plan.type !== "personal") {
   return "Mon, Wed, Fri"
  }

  return plan.days || ""
 }

 const selectPlan = (plan: ProgramPlan) => {
  const resolvedDays = getResolvedDays(plan)

  if (purpose === "trial") {
   setData({
    program: plan.name,
    days: resolvedDays,
    coach: "",
    duration: "Free Trial",
    price: 0,
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: "free"
   })

   if (plan.type === "personal") {
    navigate("/personal-training")
   } else {
    navigate("/batch-type")
   }

   return
  }

  setData({
   program: plan.name,
   days: resolvedDays,
   paymentReference: "",
   paymentMethod: "",
   paymentStatus: ""
  })

  if(plan.type === "personal"){
   navigate("/personal-training")
  }else{
   navigate("/plan")
  }

 }


 const getPricingDetails = (plan: ProgramPlan) => {

  if(plan.pricing){
   return plan.pricing.map((p: PlanPricing) => `${p.duration} - ₹${p.price}`)
  }

  if(plan.type === "personal"){
   return personalTraining
    .map((p: PersonalTrainingCoach)=>
     `${p.coach}: ₹${p.perSession}/session or ₹${p.packagePrice} (${p.packageSessions} sessions)`
    )
  }

  return []

 }

 const getDaysLabel = (plan: ProgramPlan) => {
  const resolvedDays = getResolvedDays(plan)

  if (resolvedDays) {
   return resolvedDays
  }

  if (plan.type === "personal") {
   return "Custom coaching schedule"
  }

  return "Schedule available on selection"
 }


 return(

  <Container>

   <h2
    style={{
     textAlign:"center",
     fontSize: typography.subtitle.fontSize,
     marginBottom: spacing.lg
    }}
   >
    {screenHeading}
   </h2>

   <p
   style={{
     textAlign: "center",
     color: colors.textSecondary,
     marginBottom: spacing.lg
    }}
   >
    {screenDescription}
   </p>

   <Grid>

    {visiblePlans.map((plan) => (
     <div
      key={plan.id}
      onClick={() => selectPlan(plan)}
      onKeyDown={(event) => {
       if (event.key === "Enter" || event.key === " ") {
        event.preventDefault()
        selectPlan(plan)
       }
      }}
      role="button"
      tabIndex={0}
      style={{
       padding: spacing.xl,
       border: `1px solid ${colors.border}`,
       borderRadius: radius.lg,
       background: "linear-gradient(160deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))",
       boxShadow: shadow.card,
       color: colors.textPrimary,
       display: "flex",
       flexDirection: "column",
       gap: spacing.md,
       minHeight: "250px",
       justifyContent: "space-between",
       textAlign: "left",
       cursor: "pointer"
      }}
     >
      <div>
       <p
        style={{
         color: colors.secondary,
         textTransform: "uppercase",
         letterSpacing: "0.16em",
         fontSize: "12px",
         marginBottom: spacing.sm,
         fontWeight: 700
        }}
       >
        Program
       </p>

       <h3
        style={{
         ...typography.subtitle,
         fontSize: "30px",
         marginBottom: spacing.sm
        }}
       >
        {plan.name}
       </h3>

       <p
        style={{
         color: colors.textSecondary,
         fontSize: typography.caption.fontSize
        }}
       >
        {getDaysLabel(plan)}
       </p>
      </div>

      {visiblePrices[plan.id] && (
       <div
        style={{
         padding: "14px 16px",
         borderRadius: radius.md,
         background: "rgba(255,255,255,0.04)",
         border: `1px solid ${colors.border}`
        }}
       >
        {getPricingDetails(plan).map((detail) => (
         <p
          key={detail}
          style={{
           color: colors.textSecondary,
           fontSize: "14px",
           lineHeight: 1.7
          }}
         >
          {detail}
         </p>
        ))}
       </div>
      )}

      <div
       style={{
        display: "flex"
       }}
      >
       <button
        type="button"
        onClick={(event) => {
         event.stopPropagation()
         togglePrices(plan.id)
        }}
        style={{
         minHeight: "48px",
         borderRadius: "999px",
         border: `1px solid ${colors.borderStrong}`,
         background: "transparent",
         color: colors.primaryLight,
         padding: "12px 18px",
         cursor: "pointer",
         letterSpacing: "0.12em",
         textTransform: "uppercase",
         fontSize: "12px",
         fontWeight: 700
        }}
       >
        {visiblePrices[plan.id] ? "Hide Prices" : "View Prices"}
       </button>
      </div>
     </div>

    ))}

   </Grid>

  </Container>

 )
}
