import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import OptionCard from "../../components/cards/OptionCard"
import { useUserStore } from "../../store/userStore"
import { typography, spacing } from "../../styles/GlobalStyles"

export default function InjuryScreen() {

 const navigate = useNavigate()
 const setData = useUserStore(state => state.setData)

 const selectInjury = (value: boolean) => {

  setData({
   injury: value,
   injuryAnswered: true,
   injuryDetails: value ? "" : ""
  })

  if (value) {
   navigate("/injury-details")
  } else {
   navigate("/exercise-type")
  }

 }

 return (

  <Container>

   <h2
    style={{
     textAlign: "center",
     fontSize: typography.subtitle.fontSize,
     marginBottom: spacing.lg
    }}
   >
    Any Injury?
   </h2>

   <Grid>

    <OptionCard
     title="No Injury"
     onClick={() => selectInjury(false)}
    />

    <OptionCard
     title="Yes"
     onClick={() => selectInjury(true)}
    />

   </Grid>

  </Container>

 )

}
