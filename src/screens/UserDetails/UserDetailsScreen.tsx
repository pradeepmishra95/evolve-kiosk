import { useNavigate } from "@/navigation/useAppNavigation"
import { useUserStore } from "../../store/userStore"
import { setDoc, doc } from "firebase/firestore"
import { db } from "../../firebase/firebase"

import Container from "../../layout/Container"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import TextInput from "../../components/inputs/TextInput"

import { useState } from "react"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"
import { useDevice } from "../../hooks/useDevice"
import { normalizePhoneNumber, validateAge, validateName, validatePhoneNumber } from "../../utils/validation"

export default function UserDetailsScreen() {

 const navigate = useNavigate()
 const { isMobile } = useDevice()

 const { name, phone, age, gender, setData } = useUserStore()
 const [errors, setErrors] = useState({
  name: "",
  age: "",
  phone: "",
  gender: ""
 })

 const handleNameChange = (value: string) => {
  setData({ name: value })
  setErrors((current) => ({ ...current, name: "" }))
 }

 const handleAgeChange = (value: string) => {
  setData({ age: value === "" ? null : Number(value) })
  setErrors((current) => ({ ...current, age: "" }))
 }

 const handlePhoneChange = (value: string) => {
  setData({ phone: normalizePhoneNumber(value) })
  setErrors((current) => ({ ...current, phone: "" }))
 }

 const handleGenderChange = (value: "male" | "female" | "other") => {
  setData({ gender: value })
  setErrors((current) => ({ ...current, gender: "" }))
 }

 const handleNext = async () => {
  const nameValidation = validateName(name)
  const ageValidation = validateAge(age)
  const phoneValidation = validatePhoneNumber(phone)
  const genderError = gender ? "" : "Please select a gender."

  if (!nameValidation.isValid || !ageValidation.isValid || !phoneValidation.isValid || genderError) {
   setErrors({
    name: nameValidation.error,
    age: ageValidation.error,
    phone: phoneValidation.error,
    gender: genderError
   })
   return
  }

  try {
   setData({
    name: nameValidation.trimmedName,
    phone: phoneValidation.normalizedPhone
   })

   await setDoc(
    doc(db, "users", phoneValidation.normalizedPhone),
    {
     name: nameValidation.trimmedName,
     phone: phoneValidation.normalizedPhone,
     age,
     gender
    },
    { merge: true }
   )

   navigate("/injury")

  } catch (error) {

   console.error("Error saving user:", error)

  }

 }

 return (

  <Container>

   <div style={{ maxWidth: "500px", margin: "auto" }}>

    <h2
     style={{
      ...typography.subtitle,
      textAlign: "center",
      marginBottom: spacing.lg
     }}
    >
     Personal Details
    </h2>

    {/* Name */}

    <TextInput
     label="Full Name"
     value={name}
     placeholder="Enter your name"
     onChange={handleNameChange}
     error={errors.name}
    />

    {/* Age */}

    <TextInput
     label="Age"
     type="number"
     inputMode="numeric"
     value={age !== null ? String(age) : ""}
     placeholder="Enter your age"
     onChange={handleAgeChange}
     error={errors.age}
    />

    {/* Phone */}

    <TextInput
     label="Phone Number"
     type="tel"
     inputMode="numeric"
     maxLength={10}
     value={phone}
     placeholder="Enter your phone number"
     onChange={handlePhoneChange}
     error={errors.phone}
    />

    {/* Gender */}

    <div style={{ marginBottom: spacing.lg }}>

     <label
      style={{
       display: "block",
       marginBottom: 10,
       color: colors.textSecondary,
       letterSpacing: "0.14em",
       textTransform: "uppercase",
       fontWeight: 700,
       fontSize: "14px"
      }}
     >
      Gender
     </label>

     <div
      style={{
       display: "flex",
       justifyContent: "space-between",
       gap: 16,
       flexDirection: isMobile ? "column" : "row"
      }}
     >

      <label
       style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: isMobile ? "16px" : "14px",
        border: `1px solid ${gender === "male" ? colors.borderStrong : colors.border}`,
        borderRadius: radius.md,
        cursor: "pointer",
        fontSize: 16,
        color: colors.textPrimary,
        background: gender === "male" ? "rgba(200,169,108,0.12)" : "rgba(255,255,255,0.03)"
       }}
      >
       <input
        type="radio"
        checked={gender === "male"}
        onChange={() => handleGenderChange("male")}
       />
       Male
      </label>

      <label
       style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: isMobile ? "16px" : "14px",
        border: `1px solid ${gender === "female" ? colors.borderStrong : colors.border}`,
        borderRadius: radius.md,
        cursor: "pointer",
        fontSize: 16,
        color: colors.textPrimary,
        background: gender === "female" ? "rgba(200,169,108,0.12)" : "rgba(255,255,255,0.03)"
       }}
      >
       <input
        type="radio"
        checked={gender === "female"}
        onChange={() => handleGenderChange("female")}
       />
       Female
      </label>

      <label
       style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: isMobile ? "16px" : "14px",
        border: `1px solid ${gender === "other" ? colors.borderStrong : colors.border}`,
        borderRadius: radius.md,
        cursor: "pointer",
        fontSize: 16,
        color: colors.textPrimary,
        background: gender === "other" ? "rgba(200,169,108,0.12)" : "rgba(255,255,255,0.03)"
       }}
      >
       <input
        type="radio"
        checked={gender === "other"}
        onChange={() => handleGenderChange("other")}
       />
       Other
     </label>

     </div>

     {errors.gender && (
      <p
       style={{
        marginTop: spacing.sm,
        fontSize: "14px",
        color: "#F1A596",
        lineHeight: 1.5
       }}
      >
       {errors.gender}
      </p>
     )}

    </div>

    <PrimaryButton
     title="Continue"
     onClick={handleNext}
    />

   </div>

  </Container>

 )
}
