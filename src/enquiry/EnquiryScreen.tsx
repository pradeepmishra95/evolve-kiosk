import { useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../layout/Container"
import PrimaryButton from "../components/buttons/PrimaryButton"
import TextInput from "../components/inputs/TextInput"
import PhoneInput from "../components/inputs/PhoneInput"
import { useUserStore } from "../store/userStore"
import { colors, radius, spacing, typography } from "../styles/GlobalStyles"
import { formatScheduleDate } from "../utils/schedule"
import {
 normalizeCountryCode,
 normalizePhoneNumber,
 validateName,
 validateOptionalGoal,
 validateOptionalMessage,
 validatePhoneNumber
} from "../utils/validation"

export default function EnquiryScreen() {
 const navigate = useNavigate()
 const {
 name: storedName,
 phone: storedPhone,
  countryCode: storedCountryCode,
 exerciseType,
 program,
 duration,
  batchType,
  batchTime,
  batchDate,
  setData
 } = useUserStore()

 const [form, setForm] = useState({
  name: storedName,
  phone: storedPhone,
  countryCode: storedCountryCode,
  goal: "",
  message: ""
 })
 const [errors, setErrors] = useState({
  name: "",
  phone: "",
  goal: "",
  message: ""
 })

 const handleChange = (key: keyof typeof form, value: string) => {
  const nextValue =
   key === "phone"
    ? normalizePhoneNumber(value, form.countryCode)
    : key === "countryCode"
     ? normalizeCountryCode(value)
     : value

  setForm((current) => ({
   ...current,
   [key]: nextValue
  }))
  setErrors((current) => ({
   ...current,
   [key]: ""
  }))
 }

 const handleSubmit = () => {
  const nameValidation = validateName(form.name)
  const phoneValidation = validatePhoneNumber(form.phone, form.countryCode)
  const goalValidation = validateOptionalGoal(form.goal)
  const messageValidation = validateOptionalMessage(form.message)

  const nextErrors = {
   name: nameValidation.error,
   phone: phoneValidation.error,
   goal: goalValidation.error,
   message: messageValidation.error
  }

  setErrors(nextErrors)

  if (Object.values(nextErrors).some(Boolean)) {
   return
  }

  setData({
   name: nameValidation.trimmedName,
   phone: phoneValidation.normalizedPhone,
   countryCode: phoneValidation.countryCode,
   primaryGoal: goalValidation.trimmedGoal || program || exerciseType,
   enquiryMessage: messageValidation.trimmedMessage,
   purpose: "enquiry"
  })

  navigate("/success")
 }

 return (
  <Container scrollable>
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
      {batchDate && <p><b>Date:</b> {formatScheduleDate(batchDate)}</p>}
     </div>
    </div>

    <TextInput
     label="Full Name"
     value={form.name}
     placeholder="Enter full name"
     onChange={(value) => handleChange("name", value)}
     error={errors.name}
    />

    <PhoneInput
     label="Phone Number"
     countryCode={form.countryCode}
     phone={form.phone}
     placeholder="Enter phone number"
     onCountryCodeChange={(value) => handleChange("countryCode", value)}
     onPhoneChange={(value) => handleChange("phone", value)}
     error={errors.phone}
    />

    <TextInput
     label="Goal"
     value={form.goal}
     placeholder="Optional goal"
     onChange={(value) => handleChange("goal", value)}
     error={errors.goal}
    />

    <div style={{ marginBottom: spacing.md }}>
     <label style={styles.fieldLabel}>Message</label>

     <textarea
      value={form.message}
      placeholder="Optional message"
      onChange={(event) => handleChange("message", event.target.value)}
      style={{
       ...styles.textarea,
       border: `1px solid ${errors.message ? "#D97C6C" : colors.border}`
      }}
     />

     {errors.message && (
      <p style={styles.errorText}>
       {errors.message}
      </p>
     )}
    </div>

    <div style={styles.actions}>
     <PrimaryButton
      title="Submit Enquiry"
      onClick={handleSubmit}
     />
    </div>
   </div>
  </Container>
 )
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
 fieldLabel: {
  display: "block",
  marginBottom: spacing.sm,
  color: colors.textSecondary,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  fontWeight: 700,
  fontSize: "14px"
 },
 textarea: {
  width: "100%",
  minHeight: "110px",
  padding: "13px 16px",
  borderRadius: radius.md,
  outline: "none",
  resize: "vertical" as const,
  background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
  color: colors.textPrimary,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  fontSize: "15px"
 },
 errorText: {
  marginTop: spacing.sm,
  fontSize: "14px",
  color: "#F1A596",
  lineHeight: 1.5
 },
 actions: {
  display: "flex",
  justifyContent: "center",
  gap: spacing.md,
  flexWrap: "wrap" as const
 }
}
