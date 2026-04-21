import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import OptionCard from "../../components/cards/OptionCard"
import { useUserStore } from "../../store/userStore"
import { spacing, typography } from "../../styles/GlobalStyles"
import { getNextRoute } from "../../flow/getNextRoute"
import { ROUTES } from "../../flow/routes"

export default function InjuryScreen() {

 const navigate = useNavigate()
 const state = useUserStore()
 const setData = state.setData

 const selectInjury = (value: boolean) => {

  setData({
   injury: value,
   injuryAnswered: true,
   injuryDetails: value ? "" : ""
  })

  const action = value ? "injury" : "no-injury"
  navigate(
   getNextRoute(ROUTES.INJURY, state, action) ??
    (value ? "/injury-details" : "/experience")
  )

 }

 return (

  <Container centerContent>
   <div style={styles.centerStack}>
    <h2
     style={{
      textAlign: "center",
      fontSize: typography.subtitle.fontSize,
      marginBottom: spacing.sm,
      marginTop: 0
     }}
    >
     Any Injury?
    </h2>

    <Grid style={styles.grid}>
     <OptionCard
      title="No Injury"
      centered
      showBadge={false}
      onClick={() => selectInjury(false)}
     />

     <OptionCard
      title="Yes"
      centered
      showBadge={false}
      onClick={() => selectInjury(true)}
     />
    </Grid>
   </div>
  </Container>

 )

}

const styles = {
 centerStack: {
  width: "100%",
  display: "flex",
  flexDirection: "column" as const,
  justifyContent: "center",
  alignItems: "stretch",
  gap: spacing.md,
  transform: "translateY(calc(clamp(36px, 5vh, 64px) * -1))"
 },
 grid: {
  marginTop: 0
 }
}
