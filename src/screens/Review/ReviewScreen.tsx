import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import { useUserStore } from "../../store/userStore"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"
import { useDevice } from "../../hooks/useDevice"

export default function ReviewScreen() {

 const navigate = useNavigate()
 const data = useUserStore()
 const { isMobile } = useDevice()
 const isTrialFlow = data.purpose === "trial"
 const isEnquiryFlow = data.purpose === "enquiry"

 const goToDetails = () => navigate("/user-details")
 const goToTraining = () => navigate("/exercise-type")
 const goToProgram = () => navigate("/program")
 const goToBatch = () => navigate("/batch-type")

 const handleContinue = () => {
  if (isEnquiryFlow) {
   navigate("/success")
   return
  }

  if (isTrialFlow) {
   data.setData({
    duration: "Free Trial",
    price: 0,
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: "free"
   })
   navigate("/success")
   return
  }

  data.setData({
   paymentReference: "",
   paymentMethod: "",
   paymentStatus: ""
  })
  navigate("/payment")
 }

 const renderEditButton = (label: string, onClick: () => void) => (
  <button
   type="button"
   onClick={onClick}
   style={{
    borderRadius: "999px",
    border: `1px solid ${colors.borderStrong}`,
    background: "transparent",
    color: colors.primaryLight,
    padding: "10px 16px",
    cursor: "pointer",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontSize: "12px",
    fontWeight: 700
   }}
  >
   {label}
  </button>
 )

 return (

  <Container>

   <div style={{ maxWidth: "600px", margin: "auto" }}>

    <h2
     style={{
      textAlign: "center",
      fontSize: typography.subtitle.fontSize,
      marginBottom: spacing.lg
     }}
    >
     Review Plan
    </h2>

    <div
     style={{
      display: "flex",
      flexDirection: "column",
      gap: spacing.md
     }}
    >

     <div style={styles.sectionCard(isMobile)}>
      <div style={styles.sectionHeader}>
       <h3 style={styles.sectionTitle}>Personal Details</h3>
       {renderEditButton("Edit", goToDetails)}
      </div>

      <div style={styles.rows}>
       <p><b>Name:</b> {data.name}</p>
       <p><b>Phone:</b> {data.phone}</p>
       <p><b>Gender:</b> {data.gender}</p>
       <p><b>Age:</b> {data.age ?? "-"}</p>
      </div>
     </div>

     <div style={styles.sectionCard(isMobile)}>
      <div style={styles.sectionHeader}>
       <h3 style={styles.sectionTitle}>Training Flow</h3>
       {renderEditButton("Edit", goToTraining)}
      </div>

      <div style={styles.rows}>
       <p><b>Purpose:</b> {data.purpose}</p>
       <p><b>Injury:</b> {data.injury ? "Yes" : "No"}</p>
       <p><b>Training Type:</b> {data.exerciseType}</p>
       <p><b>Experience:</b> {data.experience}</p>
      </div>
     </div>

     <div style={styles.sectionCard(isMobile)}>
      <div style={styles.sectionHeader}>
       <h3 style={styles.sectionTitle}>Plan & Schedule</h3>
       <div style={styles.editGroup}>
        {renderEditButton("Program", goToProgram)}
        {renderEditButton("Batch", goToBatch)}
       </div>
      </div>

      <div style={styles.rows}>
       <p><b>Program:</b> {data.program}</p>
       <p><b>Days:</b> {data.days}</p>
       <p><b>Plan Duration:</b> {isTrialFlow ? "Free Trial" : data.duration}</p>
       <p><b>Batch Type:</b> {data.batchType}</p>
       <p><b>Batch Time:</b> {data.batchTime}</p>
       <p><b>Price:</b> {isTrialFlow ? "Free Trial" : `₹${data.price}`}</p>
      </div>
     </div>

    </div>

    <div
     style={{
      marginTop: spacing.lg,
      display: "flex",
      justifyContent: "space-between",
      gap: spacing.md,
      flexDirection: isMobile ? "column" : "row"
     }}
    >

     <PrimaryButton
      title="Back"
      onClick={() => navigate(-1)}
     />

     <PrimaryButton
      title={
       isEnquiryFlow
        ? "Submit Enquiry"
        : isTrialFlow
         ? "Confirm Free Trial"
         : "Proceed to Payment"
      }
      onClick={handleContinue}
     />

    </div>

   </div>

  </Container>

 )
}

const styles = {
 sectionCard: (isMobile: boolean) => ({
  padding: isMobile ? "18px" : "24px",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  background: "rgba(255,255,255,0.03)"
 }),

 sectionHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: spacing.sm,
  flexWrap: "wrap" as const,
  marginBottom: spacing.md
 },

 sectionTitle: {
  ...typography.subtitle,
  fontSize: "28px"
 },

 editGroup: {
  display: "flex",
  gap: spacing.sm,
  flexWrap: "wrap" as const
 },

 rows: {
  lineHeight: "28px",
  display: "flex",
  flexDirection: "column" as const,
  gap: "4px"
 }
}
