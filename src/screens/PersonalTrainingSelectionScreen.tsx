import { Fragment } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../layout/Container"
import Grid from "../layout/Grid"
import OptionCard from "../components/cards/OptionCard"

import { usePlanCatalog } from "../hooks/usePlanCatalog"
import { useUserStore } from "../store/userStore"
import { getTrialPersonalTrainingPricing, TRIAL_FEE } from "../utils/trialPricing"
import type { CatalogPersonalTrainingCoach } from "../services/planCatalog"

import { colors, spacing, typography } from "../styles/GlobalStyles"
import { getNextRoute } from "../flow/getNextRoute"
import { ROUTES } from "../flow/routes"

export default function PersonalTrainingSelectionScreen(){

 const navigate = useNavigate()
 const { personalTraining, loading } = usePlanCatalog()

 const state = useUserStore()
 const { purpose, setData } = state

 const selectOption = (coach: CatalogPersonalTrainingCoach, type:"session" | "package") => {

  if (purpose === "trial") {
   const trialPricing = getTrialPersonalTrainingPricing(coach)

   setData({
    coach: coach.coach,
    duration: trialPricing.duration,
    price: trialPricing.price,
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })

   navigate(getNextRoute(ROUTES.PERSONAL_TRAINING, state) ?? "/review")
   return
  }

  if(type === "session"){

   setData({
    coach: coach.coach,
    duration: "1 Session",
    price: coach.perSession,
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })

  }else{

   setData({
    coach: coach.coach,
    duration: `${coach.packageSessions} Sessions`,
    price: coach.packagePrice,
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })

  }

  navigate(getNextRoute(ROUTES.PERSONAL_TRAINING, state) ?? "/review")

 }

 if (loading && personalTraining.length === 0) {
  return (
   <Container scrollable>
    <div
     style={{
      textAlign: "center",
      padding: spacing.xl,
      color: colors.textSecondary
     }}
    >
     Loading personal training options...
    </div>
   </Container>
  )
 }

 return(

  <Container scrollable>

   <h2
    style={{
     textAlign:"center",
     fontSize: typography.subtitle.fontSize,
     marginBottom: spacing.lg
    }}
   >
    Select Personal Training
   </h2>

	   <Grid>

     {personalTraining.map((coach) => (
      purpose === "trial" ? (
       <OptionCard
        key={`${coach.coach}-trial`}
        title={coach.coach}
        subtitle={`1 Session Trial - ₹${TRIAL_FEE}. This amount will be adjusted in your total plan fee when you enroll.`}
        onClick={()=>selectOption(coach,"session")}
       />
      ) : (
	      <Fragment key={coach.coach}>
	       <OptionCard
	        key={`${coach.coach}-session`}
	        title={`${coach.coach} - ₹${coach.perSession}`}
	        subtitle="1 Session"
	        onClick={()=>selectOption(coach,"session")}
	       />

	       <OptionCard
	        key={`${coach.coach}-package`}
	        title={`${coach.coach} - ₹${coach.packagePrice}`}
	        subtitle={`${coach.packageSessions} Sessions`}
	        onClick={()=>selectOption(coach,"package")}
	       />
	      </Fragment>
	     )
	    ))}

   </Grid>

  </Container>

 )

}
