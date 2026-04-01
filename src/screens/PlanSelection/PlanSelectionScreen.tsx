import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import OptionCard from "../../components/cards/OptionCard"
import { kidsPlans } from "../../database/kidsPlan"
import { adultPlans } from "../../database/adultPlans"
import { useUserStore } from "../../store/userStore"
import { typography, spacing } from "../../styles/GlobalStyles"
import type { PlanPricing, ProgramPlan } from "../../types/domain"

export default function PlanSelectionScreen(){

 const navigate = useNavigate()

 const { age, program } = useUserStore()

 const setData = useUserStore(state=>state.setData)

 const plans: ProgramPlan[] = age && age <= 12 ? kidsPlans : adultPlans

 const selectedPlan = plans.find(p => p.name === program)

 const selectDuration = (duration: PlanPricing)=>{

  setData({
   duration: duration.duration,
   price: duration.price
  })

  navigate("/batch-type")

 }

 return(

  <Container>

   <h2
    style={{
     textAlign:"center",
     fontSize:typography.subtitle.fontSize,
     marginBottom:spacing.lg
    }}
   >
    Select Duration
   </h2>

   <Grid>

    {selectedPlan?.pricing?.map((p) => (
     
     <OptionCard
      key={p.duration}
      title={`${p.duration} - ₹${p.price}`}
      onClick={()=>selectDuration(p)}
     />

    ))}

   </Grid>

  </Container>

 )

}
