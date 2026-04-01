import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import OptionCard from "../../components/cards/OptionCard"
import { useUserStore } from "../../store/userStore"
import { typography, spacing } from "../../styles/GlobalStyles"

export default function PrimaryGoalScreen() {

 const navigate = useNavigate()
 const setData = useUserStore(state => state.setData)

 const selectGoal = (goal: string) => {

  setData({ primaryGoal: goal })
  navigate("/user-details")

 }

 return (

  <Container>

   <div style={{ textAlign: "center" }}>

    <h2
     style={{
      fontSize: typography.subtitle.fontSize,
      marginBottom: spacing.lg
     }}
    >
     Select Your Goal
    </h2>

   </div>

   <Grid>

    <OptionCard
     title="Transformation"
     onClick={() => selectGoal("Transformation")}
    />

    <OptionCard
     title="Strength / Skills"
     onClick={() => selectGoal("Strength / Skills")}
    />

    <OptionCard
     title="Health"
     onClick={() => selectGoal("Health")}
    />

    <OptionCard
     title="Confidence / Discipline"
     onClick={() => selectGoal("Confidence / Discipline")}
    />

   </Grid>

  </Container>

 )

}
