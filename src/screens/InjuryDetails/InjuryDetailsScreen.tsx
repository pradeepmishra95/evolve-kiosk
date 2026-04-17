import { useNavigate } from "@/navigation/useAppNavigation"
import { useState } from "react"
import Container from "../../layout/Container"
import TextInput from "../../components/inputs/TextInput"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import { useUserStore } from "../../store/userStore"
import { spacing, typography } from "../../styles/GlobalStyles"
import { validateInjuryDetails } from "../../utils/validation"

export default function InjuryDetailsScreen(){

 const navigate = useNavigate()

 const { injuryDetails, setData } = useUserStore()
 const [error, setError] = useState("")

 const handleContinue = () => {
  const detailsValidation = validateInjuryDetails(injuryDetails)

  if (!detailsValidation.isValid) {
   setError(detailsValidation.error)
   return
  }

  setData({
   injuryDetails: detailsValidation.trimmedDetails
  })
  navigate("/experience")
 }

 return(

  <Container centerContent>

   <div style={styles.wrapper}>

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
     onChange={(value:string) => {
      setData({ injuryDetails: value })
      setError("")
     }}
     error={error}
    />

	    <PrimaryButton
	     title="Continue"
	     onClick={handleContinue}
	    />

   </div>

  </Container>

 )
}

const styles = {
 wrapper: {
  width: "100%",
  maxWidth: "500px",
  margin: "0 auto"
 }
}
