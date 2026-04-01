import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import OptionCard from "../../components/cards/OptionCard"
// import StepProgress from "../../components/StepProgress"

export default function TrialEnrollScreen(){

 const navigate = useNavigate()

 return(

  <Container>

   {/* <StepProgress step={11} total={16} /> */}

   <h2 style={{textAlign:"center",marginBottom:"20px"}}>
    Choose Option
   </h2>

   <Grid>

    <OptionCard
     title="Trial Class"
     onClick={()=>navigate("/batch-type")}
    />

    <OptionCard
     title="Enroll Full Program"
     onClick={()=>navigate("/batch-type")}
    />

   </Grid>

  </Container>

 )

}
