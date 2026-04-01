import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import OptionCard from "../../components/cards/OptionCard"
import { useUserStore } from "../../store/userStore"
import { typography, spacing } from "../../styles/GlobalStyles"

export default function ExerciseTypeScreen(){

 const navigate = useNavigate()
 const setData = useUserStore(state => state.setData)

 const selectType = (type:string)=>{

  setData({ exerciseType:type })
  navigate("/experience")

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
    Choose Training Type
   </h2>

   <Grid>

    <OptionCard
     title="Calisthenics"
     onClick={()=>selectType("Calisthenics")}
    />

    <OptionCard
     title="MMA"
     onClick={()=>selectType("MMA")}
    />

   </Grid>

  </Container>

 )

}
