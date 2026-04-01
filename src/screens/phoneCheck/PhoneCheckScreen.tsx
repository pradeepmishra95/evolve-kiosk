import { useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import { collection, doc, getDoc, getDocs, query, serverTimestamp, where } from "firebase/firestore"
import { db } from "../../firebase/firebase"
import Container from "../../layout/Container"
import TextInput from "../../components/inputs/TextInput"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import { useUserStore, type UserStoreData } from "../../store/userStore"
import type { EnquirySource, EnquiryStatus, PaymentMethod, PaymentStatus, UserGender, UserPurpose, UserStatus } from "../../types/domain"
import { colors, spacing, typography } from "../../styles/GlobalStyles"
import { normalizePhoneNumber, validatePhoneNumber } from "../../utils/validation"

const emptyLookupState: UserStoreData = {
 language: "",
 purpose: "",
 primaryGoal: "",
 specificGoal: "",
 enquiryMessage: "",
 name: "",
 age: null,
 phone: "",
 gender: "",
 experience: "",
 injury: false,
 injuryAnswered: false,
 injuryDetails: "",
 exerciseType: "",
 program: "",
 plan: "",
 coach: "",
 days: "",
 price: 0,
 duration: "",
 batchType: "",
 batchTime: "",
 paymentReference: "",
 paymentMethod: "",
 paymentStatus: "",
 status: "new"
}

const isPaymentMethod = (value: unknown): value is PaymentMethod =>
 value === "cash" || value === "upi" || value === ""

const isPaymentStatus = (value: unknown): value is PaymentStatus =>
 value === "free" ||
 value === "cash_pending" ||
 value === "upi_pending" ||
 value === "paid" ||
 value === "cancelled" ||
 value === ""

const isUserGender = (value: unknown): value is UserGender =>
 value === "male" || value === "female" || value === "other" || value === ""

const isUserPurpose = (value: unknown): value is UserPurpose =>
 value === "trial" || value === "enroll" || value === "enquiry" || value === ""

const isUserStatus = (value: unknown): value is UserStatus =>
 value === "new" || value === "enquiry" || value === "trial" || value === "member" || value === ""

const isEnquiryStatus = (value: unknown): value is EnquiryStatus =>
 value === "new" ||
 value === "contacted" ||
 value === "trial_booked" ||
 value === "ready_for_enrollment" ||
 value === "converted"

const isEnquirySource = (value: unknown): value is EnquirySource =>
 value === "website" ||
 value === "instagram" ||
 value === "walk_in" ||
 value === "other" ||
 value === "kiosk"

const toNullableNumber = (value: unknown) =>
 typeof value === "number" && Number.isFinite(value) ? value : null

const toNumber = (value: unknown) =>
 typeof value === "number" && Number.isFinite(value) ? value : 0

const toTimeValue = (value: unknown) => {
 if (value instanceof Date) {
  return value.getTime()
 }

 if (typeof value === "string") {
  const parsedValue = Date.parse(value)
  return Number.isNaN(parsedValue) ? 0 : parsedValue
 }

 if (
  value &&
  typeof value === "object" &&
  "toMillis" in value &&
  typeof value.toMillis === "function"
 ) {
  return value.toMillis()
 }

 return 0
}

const getRecordRecency = (data: Record<string, unknown>) =>
 Math.max(
  toTimeValue(data.updatedAt),
  toTimeValue(data.createdAt),
  toTimeValue(data.enquiryCreatedAt),
  toTimeValue(data.expiryDate)
 )

const getMostRecentRecord = (records: Record<string, unknown>[]) =>
 records.reduce<Record<string, unknown> | undefined>((latestRecord, currentRecord) => {
  if (!latestRecord) {
   return currentRecord
  }

  return getRecordRecency(currentRecord) >= getRecordRecency(latestRecord)
   ? currentRecord
   : latestRecord
 }, undefined)

const getPhoneLookupVariants = (phone: string) =>
 Array.from(new Set([
  phone,
  `0${phone}`,
  `91${phone}`,
  `+91${phone}`
 ]))

const getUserStatusFromRecord = (data: Record<string, unknown>): UserStatus => {
 const enquiryStatus = isEnquiryStatus(data.enquiryStatus) ? data.enquiryStatus : ""

 if (enquiryStatus === "converted") {
  return "member"
 }

 if (isUserStatus(data.status) && data.status && data.status !== "new") {
  return data.status
 }

 if (enquiryStatus) {
  return "enquiry"
 }

 if (
  data.purpose === "trial" ||
  data.duration === "Free Trial" ||
  data.paymentStatus === "free"
 ) {
  return "trial"
 }

 if (
  data.purpose === "enroll" ||
  data.paymentStatus === "paid" ||
  (typeof data.program === "string" && data.program.trim().length > 0)
  ) {
  return "member"
 }

 if (data.purpose === "enquiry") {
  return "enquiry"
 }

 return "new"
}

const mergeLegacyEnquiryIntoUser = (
 phone: string,
 existingUser?: Record<string, unknown>,
 legacyEnquiry?: Record<string, unknown>
) => {
 const currentUser = existingUser ?? {}
 const legacyUser = legacyEnquiry ?? {}

 return {
  ...currentUser,
  name:
   typeof currentUser.name === "string" && currentUser.name
    ? currentUser.name
    : String(legacyUser.name || ""),
  phone,
  age: typeof currentUser.age === "number" ? currentUser.age : legacyUser.age ?? null,
  gender:
   typeof currentUser.gender === "string" && currentUser.gender
    ? currentUser.gender
    : String(legacyUser.gender || ""),
  purpose: currentUser.purpose || "enquiry",
  status: "enquiry",
  primaryGoal:
   typeof currentUser.primaryGoal === "string" && currentUser.primaryGoal
    ? currentUser.primaryGoal
    : String(legacyUser.primaryGoal || ""),
  enquiryMessage:
   typeof currentUser.enquiryMessage === "string" && currentUser.enquiryMessage
    ? currentUser.enquiryMessage
    : String(legacyUser.message || ""),
  experience:
   typeof currentUser.experience === "string" && currentUser.experience
    ? currentUser.experience
    : String(legacyUser.experience || ""),
  injury:
   typeof currentUser.injury === "boolean"
    ? currentUser.injury
    : Boolean(legacyUser.injury),
  injuryDetails:
   typeof currentUser.injuryDetails === "string" && currentUser.injuryDetails
    ? currentUser.injuryDetails
    : String(legacyUser.injuryDetails || ""),
  exerciseType:
   typeof currentUser.exerciseType === "string" && currentUser.exerciseType
    ? currentUser.exerciseType
    : String(legacyUser.exerciseType || ""),
  program:
   typeof currentUser.program === "string" && currentUser.program
    ? currentUser.program
    : String(legacyUser.program || ""),
  days:
   typeof currentUser.days === "string" && currentUser.days
    ? currentUser.days
    : String(legacyUser.days || ""),
  duration:
   typeof currentUser.duration === "string" && currentUser.duration
    ? currentUser.duration
    : String(legacyUser.duration || ""),
  batchType:
   typeof currentUser.batchType === "string" && currentUser.batchType
    ? currentUser.batchType
    : String(legacyUser.batchType || ""),
  batchTime:
   typeof currentUser.batchTime === "string" && currentUser.batchTime
    ? currentUser.batchTime
    : String(legacyUser.batchTime || ""),
  price:
   typeof currentUser.price === "number"
    ? currentUser.price
    : typeof legacyUser.price === "number"
     ? legacyUser.price
     : 0,
  enquiryStatus: isEnquiryStatus(legacyUser.status)
   ? legacyUser.status
   : isEnquiryStatus(currentUser.enquiryStatus)
    ? currentUser.enquiryStatus
    : "new",
  enquirySource: isEnquirySource(legacyUser.source)
   ? legacyUser.source
   : isEnquirySource(currentUser.enquirySource)
    ? currentUser.enquirySource
    : "kiosk",
  enquiryCreatedAt: legacyUser.createdAt ?? currentUser.enquiryCreatedAt ?? serverTimestamp(),
  updatedAt: serverTimestamp()
 }
}

const buildLookupState = (
 phone: string,
 data?: Record<string, unknown>,
 statusResolver?: (record: Record<string, unknown>) => UserStatus
): UserStoreData => {
 const resolvedData = data ?? {}
 const paymentMethod = isPaymentMethod(resolvedData.paymentMethod) ? resolvedData.paymentMethod : ""
 const paymentStatus = isPaymentStatus(resolvedData.paymentStatus) ? resolvedData.paymentStatus : ""
 const injury = typeof resolvedData.injury === "boolean" ? resolvedData.injury : false
 const injuryAnswered = typeof resolvedData.injuryAnswered === "boolean"
  ? resolvedData.injuryAnswered
  : typeof resolvedData.injury === "boolean"

 return {
  ...emptyLookupState,
  language: typeof resolvedData.language === "string" ? resolvedData.language : "",
  purpose: isUserPurpose(resolvedData.purpose) ? resolvedData.purpose : "",
  primaryGoal: typeof resolvedData.primaryGoal === "string" ? resolvedData.primaryGoal : "",
  specificGoal: typeof resolvedData.specificGoal === "string" ? resolvedData.specificGoal : "",
  enquiryMessage:
   typeof resolvedData.enquiryMessage === "string"
    ? resolvedData.enquiryMessage
    : typeof resolvedData.message === "string"
     ? resolvedData.message
     : "",
  name: typeof resolvedData.name === "string" ? resolvedData.name : "",
  age: toNullableNumber(resolvedData.age),
  phone,
  gender: isUserGender(resolvedData.gender) ? resolvedData.gender : "",
  experience: typeof resolvedData.experience === "string" ? resolvedData.experience : "",
  injury,
  injuryAnswered,
  injuryDetails: typeof resolvedData.injuryDetails === "string" ? resolvedData.injuryDetails : "",
  exerciseType: typeof resolvedData.exerciseType === "string" ? resolvedData.exerciseType : "",
  program: typeof resolvedData.program === "string" ? resolvedData.program : "",
  plan: typeof resolvedData.plan === "string" ? resolvedData.plan : "",
  coach: typeof resolvedData.coach === "string" ? resolvedData.coach : "",
  days: typeof resolvedData.days === "string" ? resolvedData.days : "",
  price: toNumber(resolvedData.price),
  duration:
   typeof resolvedData.duration === "string"
    ? resolvedData.duration as UserStoreData["duration"]
    : "",
  batchType: typeof resolvedData.batchType === "string" ? resolvedData.batchType : "",
  batchTime: typeof resolvedData.batchTime === "string" ? resolvedData.batchTime : "",
  paymentReference: typeof resolvedData.paymentReference === "string" ? resolvedData.paymentReference : "",
  paymentMethod,
  paymentStatus,
  status: statusResolver ? statusResolver(resolvedData) : "new"
 }
}

export default function PhoneCheckScreen() {

 const navigate = useNavigate()
 const [phone, setPhone] = useState("")
 const [phoneError, setPhoneError] = useState("")
 const [lookupError, setLookupError] = useState("")
 const [loading, setLoading] = useState(false)
 const setData = useUserStore(state => state.setData)

 const handlePhoneChange = (value: string) => {
  setPhone(normalizePhoneNumber(value))
  setPhoneError("")
  setLookupError("")
 }

 const checkUser = async () => {

  const phoneValidation = validatePhoneNumber(phone)

  if (!phoneValidation.isValid) {
   setPhoneError(phoneValidation.error)
   return
  }

  try {
   setLoading(true)
   setLookupError("")

   const phoneVariants = getPhoneLookupVariants(phoneValidation.normalizedPhone)
   const [directUserSnapshot, userSnapshot, legacyEnquirySnapshot] = await Promise.all([
    getDoc(doc(db, "users", phoneValidation.normalizedPhone)),
    getDocs(
     query(
      collection(db, "users"),
      where("phone", "in", phoneVariants)
     )
    ),
    getDocs(
     query(
      collection(db, "enquiries"),
      where("phone", "in", phoneVariants)
     )
    )
   ])

   const userCandidates: Record<string, unknown>[] = [
    ...(directUserSnapshot.exists() ? [directUserSnapshot.data()] : []),
    ...userSnapshot.docs.map((userDoc) => userDoc.data())
   ]

   const existingUser = getMostRecentRecord(userCandidates)
   const existingUserStatus = existingUser ? getUserStatusFromRecord(existingUser) : "new"

   if (existingUser && existingUserStatus !== "new") {
    setData(buildLookupState(phoneValidation.normalizedPhone, existingUser, getUserStatusFromRecord))
    navigate("/return-user")
    return
   }

   const legacyEnquiryCandidates = legacyEnquirySnapshot.docs.map((enquiryDoc) => enquiryDoc.data())
   const legacyEnquiry = getMostRecentRecord(legacyEnquiryCandidates)

   if (legacyEnquiry) {
   const migratedUser = mergeLegacyEnquiryIntoUser(
     phoneValidation.normalizedPhone,
     existingUser,
     legacyEnquiry
    )

    setData(buildLookupState(phoneValidation.normalizedPhone, migratedUser, getUserStatusFromRecord))
    navigate("/return-user")
    return
   }

   if (existingUser) {
    setData(buildLookupState(phoneValidation.normalizedPhone, existingUser, getUserStatusFromRecord))
    navigate("/return-user")
    return
   }

   setData(buildLookupState(phoneValidation.normalizedPhone))

   navigate("/return-user")

  } catch (error) {

   console.error("Error checking user:", error)
   setLookupError("We could not check this phone number right now. Please try again.")

  } finally {

   setLoading(false)

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
     Check Membership
    </h2>

    <TextInput
     label="Phone Number"
     type="tel"
     inputMode="numeric"
     maxLength={10}
     placeholder="Enter 10-digit phone number"
     value={phone}
     onChange={handlePhoneChange}
     error={phoneError}
    />

    {lookupError && (
     <p
      style={{
       color: "#F1A596",
       marginTop: spacing.sm,
       lineHeight: 1.6
      }}
     >
      {lookupError}
     </p>
    )}

    <p
     style={{
      color: colors.textSecondary,
      marginTop: spacing.md,
      lineHeight: 1.6
     }}
    >
     Use the same phone number used for trial or membership.
    </p>

    <div
     style={{
      display: "flex",
      justifyContent: "center",
      marginTop: "20px"
     }}
    >
     <PrimaryButton
      title={loading ? "Checking..." : "Continue"}
      onClick={checkUser}
      disabled={loading}
     />
    </div>

   </div>

  </Container>

 )

}
