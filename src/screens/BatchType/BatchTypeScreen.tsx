import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import OptionCard from "../../components/cards/OptionCard"
import { useUserStore } from "../../store/userStore"
import { typography, spacing } from "../../styles/GlobalStyles"

export default function BatchTypeScreen(){

 const navigate = useNavigate()

 const { age } = useUserStore()

 const setData = useUserStore(state=>state.setData)

 const selectBatch = (type:string)=>{

  setData({ batchType:type })

  navigate("/time-selection")

 }

 const isKids = age !== null && age >= 7 && age <= 12

 return(

  <Container>

   <h2
    style={{
     textAlign:"center",
     fontSize: typography.subtitle.fontSize,
     marginBottom: spacing.lg
    }}
   >
    Choose Batch
   </h2>

   <Grid>

    {!isKids && (
     <OptionCard
      title="Morning"
      onClick={()=>selectBatch("morning")}
     />
    )}

    <OptionCard
     title="Evening"
     onClick={()=>selectBatch("evening")}
    />

   </Grid>

  </Container>

 )

}
