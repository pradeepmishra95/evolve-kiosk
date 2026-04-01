import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import OptionCard from "../../components/cards/OptionCard"
import { useUserStore } from "../../store/userStore"

export default function ReturnUserScreen() {

 const navigate = useNavigate()

 const { name, status, setData } = useUserStore()
 const showTrialAndEnrollOnly = status === "enquiry"
 const showNewUserOptions = !status || status === "new" || showTrialAndEnrollOnly

 // HANDLERS

 const handleTrial = () => {
  setData({
   purpose: "trial",
   status: status === "enquiry" ? "enquiry" : "new",
   injury: false,
   injuryAnswered: false,
   injuryDetails: "",
   exerciseType: "",
   experience: "",
   duration: "Free Trial",
   price: 0,
   paymentReference: "",
   paymentMethod: "",
   paymentStatus: "free",
   program: "",
   plan: "",
   days: "",
   coach: "",
   batchType: "",
   batchTime: ""
  })
  navigate("/user-details")
 }

 const handleEnroll = () => {
  setData({
   purpose: "enroll",
   status: status === "enquiry" ? "enquiry" : "new",
   injury: false,
   injuryAnswered: false,
   injuryDetails: "",
   exerciseType: "",
   experience: "",
   program: "",
   plan: "",
   coach: "",
   days: "",
   duration: "",
   price: 0,
   paymentReference: "",
   paymentMethod: "",
   paymentStatus: "",
   batchType: "",
   batchTime: ""
  })
  navigate("/user-details")
 }

 const handleEnquiry = () => {
  setData({
   purpose: "enquiry",
   status: "new",
   primaryGoal: "",
   specificGoal: "",
   enquiryMessage: "",
   exerciseType: "",
   experience: "",
   injury: false,
   injuryAnswered: false,
   injuryDetails: "",
   program: "",
   plan: "",
   coach: "",
   days: "",
   duration: "",
   price: 0,
   batchType: "",
   batchTime: "",
   paymentReference: "",
   paymentMethod: "",
   paymentStatus: ""
  })
  navigate("/user-details")
 }

 const handleRenew = () => {
  navigate("/review")
 }

 const handlePlanChange = () => {
  navigate("/exercise-type")
 }

 // HEADING

 const getHeading = () => {

  if (!status || status === "new") {
   return "What are you looking for?"
  }

  if (status === "enquiry") {
   return `Welcome Back${name ? `, ${name}` : ""}`
  }

  if (status === "trial") {
   return `Hello${name ? ` ${name}` : ""}, we hope you enjoyed the trial! Let's enroll.`
  }

  if (status === "member") {
   return `Welcome Back${name ? `, ${name}` : ""}`
  }

  return "Welcome"
 }

 return (

  <Container>

   <h2 style={{ textAlign: "center" }}>
    {getHeading()}
   </h2>

   <Grid>

    {/* NEW USER */}

    {showNewUserOptions && (
     <>
      <OptionCard
       title="Free Trial"
       onClick={handleTrial}
      />

      <OptionCard
       title="Enroll Program"
       onClick={handleEnroll}
      />

      {!showTrialAndEnrollOnly && (
       <OptionCard
        title="Enquiry"
        onClick={handleEnquiry}
       />
      )}
     </>
    )}

    {/* TRIAL USER */}

    {status === "trial" && (
     <OptionCard
      title="Enroll Program"
      onClick={() => {
       setData({
        purpose: "enroll",
        exerciseType: "",
        experience: "",
        program: "",
        plan: "",
        coach: "",
        days: "",
        duration: "",
        price: 0,
        paymentReference: "",
        paymentMethod: "",
        paymentStatus: "",
        batchType: "",
        batchTime: ""
       })
       navigate("/exercise-type")
      }}
     />
    )}

    {/* MEMBER */}

    {status === "member" && (
     <>
      <OptionCard
       title="Renew Plan"
       onClick={handleRenew}
      />

      <OptionCard
       title="Change Plan"
       onClick={handlePlanChange}
      />
     </>
    )}

   </Grid>

  </Container>
 )
}
