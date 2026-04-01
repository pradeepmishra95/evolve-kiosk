import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import OptionCard from "../../components/cards/OptionCard"
import { useUserStore } from "../../store/userStore"
import { typography, spacing } from "../../styles/GlobalStyles"

export default function ExperienceScreen() {

 const navigate = useNavigate()
 const exerciseType = useUserStore(state => state.exerciseType)
 const setData = useUserStore(state => state.setData)
 const screenHeading = exerciseType || "Experience Level"

 const selectExperience = (value: string) => {

  setData({ experience: value })
  navigate("/program")

 }

 return (

  <Container>

   <h2
   style={{
     textAlign: "center",
     fontSize: typography.subtitle.fontSize,
     marginBottom: spacing.md
    }}
   >
    {screenHeading}
   </h2>

   <p
    style={{
     textAlign: "center",
     color: "var(--text-secondary)",
     marginBottom: spacing.lg
    }}
   >
    Choose your experience level to continue.
   </p>

   <Grid>

    <OptionCard
     title="Beginner"
     onClick={() => selectExperience("Beginner")}
    />

    <OptionCard
     title="Intermediate"
     onClick={() => selectExperience("Intermediate")}
    />

    <OptionCard
     title="Advance"
     onClick={() => selectExperience("Advance")}
    />

    <OptionCard
     title="Expert"
     onClick={() => selectExperience("Expert")}
    />

   </Grid>

  </Container>

 )
}
