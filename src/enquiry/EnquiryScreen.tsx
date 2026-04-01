import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../layout/Container"
import PrimaryButton from "../components/buttons/PrimaryButton"
import { useUserStore } from "../store/userStore"
import { useState } from "react"
import { colors, radius, spacing, typography } from "../styles/GlobalStyles"

export default function EnquiryScreen() {

 const navigate = useNavigate()
 const {
  name: storedName,
  phone: storedPhone,
  exerciseType,
  program,
  duration,
  batchType,
  batchTime,
  setData
 } = useUserStore()

 const [form, setForm] = useState({
  name: storedName,
  phone: storedPhone,
  goal: "",
  message: ""
 })

 const handleChange = (key: string, value: string) => {
  setForm(prev => ({
   ...prev,
   [key]: value
  }))
 }

 const handleSubmit = () => {

  if (!form.name || !form.phone) {
   alert("Please fill Name and Phone")
   return
  }

  // Save in global store
  setData({
   name: form.name,
   phone: form.phone,
   primaryGoal: form.goal || program || exerciseType,
   enquiryMessage: form.message,
   purpose: "enquiry"
  })

  navigate("/success")
 }

 return (

  <Container>

   <div style={{ maxWidth: "560px", margin: "0 auto" }}>

    <h2
     style={{
      ...typography.subtitle,
      textAlign: "center",
      marginBottom: spacing.lg
     }}
    >
     Enquiry Form
    </h2>

    <div style={styles.summaryCard}>
     <h3 style={styles.summaryHeading}>Selected Plan</h3>
     <div style={styles.summaryRows}>
      <p><b>Training Type:</b> {exerciseType || "-"}</p>
      <p><b>Program:</b> {program || "-"}</p>
      <p><b>Duration:</b> {duration || "-"}</p>
      <p><b>Batch Type:</b> {batchType || "-"}</p>
      <p><b>Timing:</b> {batchTime || "-"}</p>
     </div>
    </div>

    {/* NAME */}
    <input
     placeholder="Enter Name"
     value={form.name}
     onChange={(e)=>handleChange("name", e.target.value)}
     style={inputStyle}
    />

    {/* PHONE */}
    <input
     placeholder="Enter Phone"
     value={form.phone}
     onChange={(e)=>handleChange("phone", e.target.value)}
     style={inputStyle}
    />

    {/* GOAL */}
    <input
     placeholder="Your Goal (optional)"
     value={form.goal}
     onChange={(e)=>handleChange("goal", e.target.value)}
     style={inputStyle}
    />

    {/* MESSAGE */}
    <textarea
     placeholder="Message (optional)"
     value={form.message}
     onChange={(e)=>handleChange("message", e.target.value)}
     style={{ ...inputStyle, height: 100 }}
    />

    <div style={styles.actions}>
     <PrimaryButton
      title="Back"
      onClick={() => navigate("/time-selection")}
     />

     <PrimaryButton
      title="Submit Enquiry"
      onClick={handleSubmit}
     />
    </div>
   </div>

  </Container>
 )
}

// SIMPLE STYLE

const inputStyle = {
 width: "100%",
 padding: "12px",
 marginBottom: "12px",
 borderRadius: "8px",
 border: "1px solid #ccc",
 fontSize: "16px"
}

const styles = {
 summaryCard: {
  marginBottom: spacing.lg,
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)"
 },

 summaryHeading: {
  ...typography.subtitle,
  fontSize: "28px",
  marginBottom: spacing.md
 },

 summaryRows: {
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.xs,
  color: colors.textPrimary,
  lineHeight: 1.7
 },

 actions: {
  display: "flex",
  justifyContent: "space-between",
  gap: spacing.md,
  flexWrap: "wrap" as const
 }
}
