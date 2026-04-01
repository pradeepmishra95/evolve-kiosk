import { Fragment } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../layout/Container"
import Grid from "../layout/Grid"
import OptionCard from "../components/cards/OptionCard"

import { useUserStore } from "../store/userStore"
import { personalTraining } from "../database/personalTraining"
import type { PersonalTrainingCoach } from "../types/domain"

import { typography, spacing } from "../styles/GlobalStyles"

export default function PersonalTrainingSelectionScreen(){

 const navigate = useNavigate()

 const { purpose, setData } = useUserStore()

 const selectOption = (coach: PersonalTrainingCoach, type:"session" | "package") => {

  if (purpose === "trial") {
   setData({
    coach: coach.coach,
    duration: "Free Trial",
    price: 0,
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: "free"
   })

   navigate("/batch-type")
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

  navigate("/batch-type")

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
    Select Personal Training
   </h2>

   <Grid>

    {personalTraining.map((coach) => (
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

    ))}

   </Grid>

  </Container>

 )

}
