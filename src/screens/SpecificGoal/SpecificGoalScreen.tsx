import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import OptionCard from "../../components/cards/OptionCard"
import { useUserStore } from "../../store/userStore"
import { typography, spacing } from "../../styles/GlobalStyles"
import { getNextRoute } from "../../flow/getNextRoute"
import { ROUTES } from "../../flow/routes"

export default function SpecificGoalScreen() {

 const navigate = useNavigate()
 const setData = useUserStore(state => state.setData)
 const state = useUserStore()

 const selectGoal = (goal: string) => {

  setData({ specificGoal: goal })
  navigate(getNextRoute(ROUTES.SPECIFIC_GOAL, state) ?? "/user-details")

 }

 return (

  <Container centerContent>

   <div style={styles.wrapper}>

    <div style={{ textAlign: "center" }}>

    <h2
     style={{
      fontSize: typography.subtitle.fontSize,
      marginBottom: spacing.lg
     }}
    >
     What exactly do you want?
    </h2>

    </div>

    <Grid>

    <OptionCard
     title="Fat Loss"
     onClick={() => selectGoal("Fat Loss")}
    />

    <OptionCard
     title="Muscle Gain"
     onClick={() => selectGoal("Muscle Gain")}
    />

    <OptionCard
     title="Mobility"
     onClick={() => selectGoal("Mobility")}
    />

    <OptionCard
     title="Discipline"
     onClick={() => selectGoal("Discipline")}
    />

    </Grid>

   </div>

  </Container>

 )

}

const styles = {
 wrapper: {
  width: "100%",
  maxWidth: "720px",
  margin: "0 auto"
 }
}
