import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import TextInput from "../../components/inputs/TextInput"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import { useUserStore } from "../../store/userStore"
import { spacing, typography } from "../../styles/GlobalStyles"

export default function InjuryDetailsScreen(){

 const navigate = useNavigate()

 const { injuryDetails, setData } = useUserStore()

 return(

  <Container>

   <div style={{maxWidth:"500px",margin:"auto"}}>

    <h2
     style={{
      textAlign:"center",
      fontSize:typography.subtitle.fontSize,
      marginBottom:spacing.lg
     }}
    >
     Specify Injury
    </h2>

    <TextInput
     label="Describe your injury"
     value={injuryDetails}
     onChange={(value:string)=>setData({injuryDetails:value})}
    />

    <PrimaryButton
     title="Continue"
     onClick={()=>navigate("/exercise-type")}
    />

   </div>

  </Container>

 )
}
