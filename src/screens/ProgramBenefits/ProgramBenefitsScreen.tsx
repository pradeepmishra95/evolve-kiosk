import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import { programs } from "../../database/programs"
import { useUserStore } from "../../store/userStore"
import { typography, spacing } from "../../styles/GlobalStyles"

export default function ProgramBenefitsScreen(){

 const navigate = useNavigate()

 const program = useUserStore(state=>state.program)

 const selected = programs.find(p=>p.name===program)

 return(

  <Container>

   <div style={{maxWidth:"600px",margin:"auto"}}>

    <h2
     style={{
      textAlign:"center",
      fontSize:typography.subtitle.fontSize,
      marginBottom:spacing.lg
     }}
    >
     Program Benefits
    </h2>

    <ul
     style={{
      marginBottom:spacing.xl,
      lineHeight:"2"
     }}
    >

     {selected?.benefits.map((b,i)=>(
      <li key={i}>{b}</li>
     ))}

    </ul>

    <PrimaryButton
     title="Continue"
     onClick={()=>navigate("/plan")}
    />

   </div>

  </Container>

 )

}
