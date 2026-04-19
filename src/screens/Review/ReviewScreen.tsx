import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import ChoiceCard from "../../components/cards/ChoiceCard"
import DialogDateField, { type DialogDateOption } from "../../components/datetime/DialogDateField"
import DialogTimeField, { type DialogTimeOption } from "../../components/datetime/DialogTimeField"
import { useUserStore } from "../../store/userStore"
import { useAuthStore } from "../../store/authStore"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"
import { useDevice } from "../../hooks/useDevice"
import { formatDateOfBirth } from "../../utils/dateOfBirth"
import { formatPhoneNumber } from "../../utils/validation"
import { saveEnquirySubmission } from "../../services/enquirySubmission"
import { usePlanCatalog } from "../../hooks/usePlanCatalog"
import { isPersonalTrainingLabel, matchesLabel } from "../../utils/labelMatch"
import {
 getSchedulePeriodOptions,
 getTimingsForPeriod,
 getUpcomingScheduleDatesForDays
} from "../../utils/planSchedule"
import { formatScheduleDate, getUpcomingScheduleDates, isTrialBookingDateAllowed } from "../../utils/schedule"
import { buildPriceBreakdown, resolveAddonPlans, resolvePlanPricing } from "../../utils/planPricing"
import { TRIAL_FEE, TRIAL_FEE_NOTE } from "../../utils/trialPricing"
import { PAYMENT_METHOD_OPTIONS, getPaymentSurchargeAmount } from "../../utils/payment"
import { getProfilePhotoUploadStatusMessage, uploadProfilePhoto } from "../../services/profilePhoto"
import type { ProfilePhotoSource, ProgramPlan } from "../../types/domain"
import { startOfDay, toDateInputValue } from "../../utils/dateTimeSelector"
import { optimizeProfilePhotoBlob } from "../../utils/profilePhotoCapture"

const formatScheduleMoment = (date: string, time: string) => {
 const parts: string[] = []

 if (date) {
  parts.push(formatScheduleDate(date))
 }

 if (time) {
  parts.push(time)
 }

 return parts.length > 0 ? parts.join(" · ") : "-"
}

const PROFILE_PHOTO_FILE_NAME = "profile-photo.jpg"

export default function ReviewScreen() {

 const navigate = useNavigate()
 const data = useUserStore()
 const staffUser = useAuthStore((state) => state.user)
 const { isMobile, isTablet, isPortrait, isCompactHeight, viewportWidth } = useDevice()

 // Treat iPad-sized viewports (>= 768px) like desktop so buttons stay compact.
 // Fallback behavior:
 // - viewportWidth >= 768 => 3 columns (compact row)
 // - otherwise mobile: 1 column; tablet landscape: 2 columns
 const actionGridColumns = viewportWidth >= 768
  ? "repeat(3, 1fr)"
  : isMobile
  ? "1fr"
  : isTablet
   ? isPortrait
    ? "1fr"
    : "repeat(2, 1fr)"
   : "repeat(3, 1fr)"
 const isEnquiryFlow = data.purpose === "enquiry"
 const [savingEnquiry, setSavingEnquiry] = useState(false)
 const [enquiryChoice, setEnquiryChoice] = useState<"followup" | "trial" | "enroll" | null>(null)

 // When enquiry user picks trial/enroll, drive UI from enquiryChoice until they confirm
 const effectivePurpose = isEnquiryFlow && enquiryChoice === "trial"
  ? "trial"
  : isEnquiryFlow && enquiryChoice === "enroll"
   ? "enroll"
   : data.purpose

 const isBookingFlow =
  effectivePurpose === "trial" || effectivePurpose === "enroll" || effectivePurpose === "renew"
 const isTrialBooking = effectivePurpose === "trial"
 const isPersonalTraining = isPersonalTrainingLabel(data.program) || isPersonalTrainingLabel(data.exerciseType)
 const bookingCardTitle =
  effectivePurpose === "trial"
   ? "Trial Booking"
   : effectivePurpose === "enroll"
    ? "Joining Schedule"
    : effectivePurpose === "renew"
     ? "Renewal Schedule"
   : "Booking Schedule"
 const { adultPlans, kidsPlans } = usePlanCatalog()
 const [bookingError, setBookingError] = useState("")
 const [saveError, setSaveError] = useState("")
 const [photoError, setPhotoError] = useState("")
 const [photoStatusMessage, setPhotoStatusMessage] = useState("")
 const [photoUploading, setPhotoUploading] = useState(false)
 const [pendingPhotoBlob, setPendingPhotoBlob] = useState<Blob | null>(null)
 const [pendingPhotoSource, setPendingPhotoSource] = useState<ProfilePhotoSource>("camera")
 const [pendingPhotoFileName, setPendingPhotoFileName] = useState(PROFILE_PHOTO_FILE_NAME)
 const [draftPreviewUrl, setDraftPreviewUrl] = useState("")
 const [expandedEditor, setExpandedEditor] = useState<"program" | "duration" | "batchType" | "batchTime" | null>(null)
 const [partialEnabled, setPartialEnabled] = useState(false)
 const [partialInput, setPartialInput] = useState("")
 const [partialError, setPartialError] = useState("")
 const [splitEnabled, setSplitEnabled] = useState(false)
 const [splitMethod1, setSplitMethod1] = useState("")
 const [splitAmount1Input, setSplitAmount1Input] = useState("")
 const [splitError, setSplitError] = useState("")
 const [partialDueDate, setPartialDueDate] = useState("")
 const cameraInputRef = useRef<HTMLInputElement | null>(null)
 const galleryInputRef = useRef<HTMLInputElement | null>(null)
 const previewUrlRef = useRef<string | null>(null)
 const trialCreditApplied = data.cameFromTrial && effectivePurpose === "enroll"
 const bookingPrice = isTrialBooking ? TRIAL_FEE : trialCreditApplied ? Math.max(0, data.price - TRIAL_FEE) : data.price
 const followUpMinDate = useMemo(() => toDateInputValue(startOfDay()), [])

 const plans = data.age !== null && data.age <= 12 ? kidsPlans : adultPlans
 const selectedPlan = plans.find(
  (plan) =>
   matchesLabel(plan.name, data.program) ||
   matchesLabel(plan.name, data.exerciseType) ||
   (plan.program ? matchesLabel(plan.program, data.exerciseType) : false)
 )
 const selectedMainPricing = isTrialBooking
  ? { duration: "1 Day" as const, price: TRIAL_FEE }
  : resolvePlanPricing(selectedPlan, data.duration)
 const selectedAddonPlans = isBookingFlow
  ? resolveAddonPlans(
     plans,
     selectedPlan,
     data.exerciseType,
     selectedMainPricing?.duration || data.duration
    ).filter((plan) => data.selectedAddOnIds.includes(plan.id))
  : []
 const addonTotal = selectedAddonPlans.reduce((total, addon) => total + addon.pricing.price, 0)
 const mainPlanPrice =
  data.mainPlanPrice ||
  selectedMainPricing?.price ||
  (isTrialBooking ? TRIAL_FEE : Math.max((data.price || 0) - addonTotal, 0))
 const mainPlanOriginalPrice =
  data.mainPlanOriginalPrice ||
  ("originalPrice" in (selectedMainPricing ?? {}) ? (selectedMainPricing as { originalPrice?: number }).originalPrice : undefined) ||
  0
 const resolvedTimings = useMemo(() => selectedPlan?.timings ?? [], [selectedPlan?.timings])
 const scheduleDays = useMemo(() => selectedPlan?.scheduleDays ?? [], [selectedPlan?.scheduleDays])
 const schedulePeriodOptions = getSchedulePeriodOptions(resolvedTimings)
 const resolvedBookingBatchType = data.batchType || schedulePeriodOptions[0]?.value || "custom"
 const bookingTimings = useMemo(
  () => getTimingsForPeriod(resolvedTimings, resolvedBookingBatchType),
  [resolvedBookingBatchType, resolvedTimings]
 )
 const bookingTimeOptions = useMemo(
  () => (bookingTimings.length > 0 ? bookingTimings : data.batchTime ? [data.batchTime] : []),
  [bookingTimings, data.batchTime]
 )
 const bookingTimeSlotOptions = useMemo<DialogTimeOption[]>(
  () =>
   bookingTimeOptions.map((timing, index) => ({
    value: timing,
    label: timing,
    description: index === 0 ? "Recommended" : "Available"
   })),
  [bookingTimeOptions]
 )
 const bookingDateOptions = useMemo(() => {
  if (!isBookingFlow) {
   return []
  }

  const count = effectivePurpose === "trial" ? 40 : 14

  if (scheduleDays.length > 0) {
   return getUpcomingScheduleDatesForDays(scheduleDays, count)
  }

  return getUpcomingScheduleDates(count)
 }, [effectivePurpose, isBookingFlow, scheduleDays])
 const trialDateOptions = useMemo<DialogDateOption[]>(
  () =>
   bookingDateOptions
    .filter((option) => isTrialBookingDateAllowed(option.value))
    .slice(0, 10)
    .map((option, index) => ({
     ...option,
     disabled: bookingTimeSlotOptions.length === 0,
     description:
      bookingTimeSlotOptions.length > 0
       ? index === 0
        ? `${bookingTimeSlotOptions.length} slots · soonest`
        : `${bookingTimeSlotOptions.length} slots`
       : "No slots"
    })),
  [bookingDateOptions, bookingTimeSlotOptions.length]
 )
 const heroMomentLabel = isEnquiryFlow && !enquiryChoice
  ? "Follow-up"
  : effectivePurpose === "trial"
   ? "Trial Booking"
   : effectivePurpose === "enroll"
    ? "Joining"
    : effectivePurpose === "renew"
     ? "Renewal"
     : "Schedule"
 const heroMomentValue =
  isEnquiryFlow && enquiryChoice !== "trial" && enquiryChoice !== "enroll"
   ? formatScheduleMoment(data.followUpDate, data.followUpTime)
   : formatScheduleMoment(data.batchDate, data.batchTime)
 const shouldShowProfilePhotoOnReview = effectivePurpose === "enroll" && data.status !== "new"
 const hasSavedProfilePhoto = Boolean(data.profilePhotoUrl || data.profilePhotoStoragePath)
 const displayPhotoUrl = draftPreviewUrl || data.profilePhotoUrl

 const releaseDraftPreview = useCallback(() => {
  if (previewUrlRef.current) {
   URL.revokeObjectURL(previewUrlRef.current)
   previewUrlRef.current = null
  }
 }, [])

 useEffect(() => {
  if (!shouldShowProfilePhotoOnReview) {
   setPhotoError("")
   setPhotoStatusMessage("")
   return
  }

  if (hasSavedProfilePhoto && !draftPreviewUrl) {
   setPhotoStatusMessage("Profile photo already available for this member.")
  } else if (!hasSavedProfilePhoto && !draftPreviewUrl) {
   setPhotoStatusMessage("Profile photo is optional here. Add one now or continue to payment.")
  }
 }, [draftPreviewUrl, hasSavedProfilePhoto, shouldShowProfilePhotoOnReview])

 useEffect(() => {
  return () => {
   releaseDraftPreview()
  }
 }, [releaseDraftPreview])

 const goToDetails = () => navigate("/user-details")
 const goToTraining = () => navigate("/user-details")
 const goToProgram = () => navigate("/program")
 const goToBatch = () => navigate("/plan")

 const handleChangeProgram = (plan: ProgramPlan) => {
  const firstPricing = plan.pricing?.find((p) => p.duration !== "1 Day") ?? plan.pricing?.[0]
  const planScheduleOptions = getSchedulePeriodOptions(plan.timings ?? [])
  const firstBatchType = planScheduleOptions[0]?.value || "custom"
  const firstBatchTime = getTimingsForPeriod(plan.timings ?? [], firstBatchType)[0] || ""
  data.setData({
   program: plan.name,
   selectedPlanId: plan.id,
   days: plan.scheduleDays?.join(", ") || plan.days || "",
   duration: firstPricing?.duration || "",
   price: firstPricing?.price || 0,
   mainPlanPrice: firstPricing?.price || 0,
   mainPlanOriginalPrice: firstPricing?.originalPrice ?? 0,
   batchType: firstBatchType,
   batchTime: firstBatchTime,
   selectedAddOnIds: [],
   batchDate: ""
  })
  setExpandedEditor(null)
 }

 const handleChangeDuration = (index: number) => {
  const pricing = selectedPlan?.pricing?.[index]
  if (!pricing) return
  data.setData({
   duration: pricing.duration,
   price: pricing.price,
   mainPlanPrice: pricing.price,
   mainPlanOriginalPrice: pricing.originalPrice ?? 0,
   selectedAddOnIds: [],
   batchDate: ""
  })
  setExpandedEditor(null)
 }

 const handleChangeBatchType = (value: string) => {
  const nextTimings = getTimingsForPeriod(resolvedTimings, value)
  data.setData({
   batchType: value,
   batchTime: nextTimings[0] || ""
  })
  setExpandedEditor(null)
 }

 const handleChangeBatchTime = (value: string) => {
  data.setData({ batchTime: value })
  setExpandedEditor(null)
 }

 const toggleEditor = (field: "program" | "duration" | "batchType" | "batchTime") => {
  setExpandedEditor((prev) => (prev === field ? null : field))
 }

 const formatYesNo = (value: string) => value === "yes" ? "Yes" : value === "no" ? "No" : "-"
 const formatActivities = (values: string[]) => values.length ? values.join(", ") : "-"
 const formatPurpose = (purpose: string) => {
  if (purpose === "trial") return "Trial"
  if (purpose === "enroll") return "Enroll"
  if (purpose === "renew") return "Renew"
  if (purpose === "enquiry") return "Enquiry"

  return "-"
 }

 const renderTile = (label: string, value: string, accent = false) => (
  <div
   style={{
    ...styles.detailTile,
    ...(accent ? styles.detailTileAccent : {})
   }}
  >
   <p style={styles.detailLabel}>{label}</p>
   <p style={styles.detailValue}>{value || "-"}</p>
  </div>
 )

 const uploadPhoto = async (blob: Blob, source: ProfilePhotoSource, fileName: string) => {
  if (!data.name || !data.phone) {
   setPhotoError("Member details are missing. Please go back and verify profile details.")
   return
  }

 try {
   setPhotoUploading(true)
   setPhotoError("")
   setPhotoStatusMessage("Preparing profile photo...")

   const result = await uploadProfilePhoto({
    name: data.name.trim(),
    phone: data.phone,
    countryCode: data.countryCode,
    source,
    blob,
    fileName,
    contentType: blob.type || "image/jpeg",
    onProgress: (progress) => {
     setPhotoStatusMessage(getProfilePhotoUploadStatusMessage(progress))
    }
   })

   data.setData({
    profilePhotoUrl: result.downloadUrl,
    profilePhotoStoragePath: result.storagePath,
    profilePhotoHash: result.hash,
    profilePhotoUploadedAt: result.uploadedAt,
    profilePhotoSource: result.source
   })

   releaseDraftPreview()
   setDraftPreviewUrl("")
   setPendingPhotoBlob(null)
   setPendingPhotoSource(source)
   setPendingPhotoFileName(PROFILE_PHOTO_FILE_NAME)
   setPhotoStatusMessage("Profile photo saved. You can continue to payment.")
  } catch (error) {
   setPhotoError(error instanceof Error ? error.message : "Could not save the profile photo.")
   setPhotoStatusMessage("Upload failed. Please retry.")
  } finally {
   setPhotoUploading(false)
  }
 }

 const handleSelectTakePhoto = () => {
  setPhotoError("")
  cameraInputRef.current?.click()
 }

 const handlePhotoFile = async (file: File | null | undefined, source: ProfilePhotoSource) => {
  if (!file) {
   return
  }

  if (!file.type.startsWith("image/")) {
   setPhotoError("Please choose an image file.")
   return
  }

  try {
   setPhotoError("")
   setPhotoStatusMessage(source === "camera" ? "Optimizing captured photo..." : "Optimizing selected photo...")
   const optimizedBlob = await optimizeProfilePhotoBlob(file)

   releaseDraftPreview()
   const objectUrl = URL.createObjectURL(optimizedBlob)
   previewUrlRef.current = objectUrl
   setDraftPreviewUrl(objectUrl)
   setPendingPhotoBlob(optimizedBlob)
   setPendingPhotoSource(source)
   setPendingPhotoFileName(PROFILE_PHOTO_FILE_NAME)
   void uploadPhoto(optimizedBlob, source, PROFILE_PHOTO_FILE_NAME)
  } catch (error) {
   setPhotoError(error instanceof Error ? error.message : "Could not process the selected photo.")
   setPhotoStatusMessage("Please choose another image or try again.")
  }
 }

 const handleRetryPhotoUpload = () => {
  if (!pendingPhotoBlob) {
   setPhotoError("Capture or select a photo first.")
   return
  }

  void uploadPhoto(pendingPhotoBlob, pendingPhotoSource, pendingPhotoFileName)
 }

 const handleContinue = () => {
  if (isEnquiryFlow) {
   if (enquiryChoice === "trial" || enquiryChoice === "enroll") {
    handleProceedFromEnquiry()
   } else {
    void handleFinishEnquiry()
   }
   return
  }

  if (shouldShowProfilePhotoOnReview && photoUploading) {
   setPhotoError("Profile photo is still uploading. Please wait for it to finish.")
   return
  }

  if (isBookingFlow) {
   if (isPersonalTraining && !data.batchTime) {
    setBookingError("Please select a booking time.")
    return
   }

   if (data.purpose !== "renew" && !data.batchDate) {
    setBookingError("Please select a booking date.")
    return
   }

   if (isTrialBooking && !isTrialBookingDateAllowed(data.batchDate)) {
    setBookingError("Trial booking is not available on Wednesday, Saturday, or Sunday.")
    return
   }
  }

  if (splitEnabled) {
   const parsedSplit = parseInt(splitAmount1Input, 10)

   if (!splitMethod1) {
    setSplitError("Please select the first payment method.")
    return
   }

   if (!splitAmount1Input || isNaN(parsedSplit) || parsedSplit <= 0) {
    setSplitError("Enter a valid amount for the first payment method.")
    return
   }

   if (parsedSplit >= bookingPrice) {
    setSplitError("First amount must be less than the total. Use full payment for a single method.")
    return
   }

   const split1Surcharge = getPaymentSurchargeAmount(parsedSplit, splitMethod1 as Parameters<typeof getPaymentSurchargeAmount>[1])
   const split2Amount = bookingPrice - parsedSplit

   data.setData({
    price: bookingPrice,
    isSplitPayment: true,
    isPartialPayment: false,
    partialPaymentDueDate: "",
    paidAmount: parsedSplit,
    dueAmount: split2Amount,
    paymentMethod1: splitMethod1 as Parameters<typeof getPaymentSurchargeAmount>[1],
    paymentMethod2: "",
    paymentCollectionStep: 1,
    paymentSurchargeAmount: split1Surcharge,
    paymentTotalAmount: bookingPrice + split1Surcharge,
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })
  } else if (partialEnabled) {
   const parsed = parseInt(partialInput, 10)

   if (!partialInput || isNaN(parsed) || parsed <= 0) {
    setPartialError("Enter a valid partial amount.")
    return
   }

   if (parsed >= bookingPrice) {
    setPartialError("Partial amount must be less than the total.")
    return
   }

   data.setData({
    price: bookingPrice,
    isPartialPayment: true,
    isSplitPayment: false,
    partialPaymentDueDate: partialDueDate,
    paidAmount: parsed,
    dueAmount: bookingPrice - parsed,
    paymentCollectionStep: 1,
    paymentMethod1: "",
    paymentMethod2: "",
    paymentSurchargeAmount: 0,
    paymentTotalAmount: bookingPrice,
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })
  } else {
   data.setData({
    price: bookingPrice,
    isPartialPayment: false,
    isSplitPayment: false,
    partialPaymentDueDate: "",
    paidAmount: 0,
    dueAmount: 0,
    paymentCollectionStep: 1,
    paymentMethod1: "",
    paymentMethod2: "",
    paymentSurchargeAmount: 0,
    paymentTotalAmount: bookingPrice,
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })
  }

  data.clearConsentSigning()
  navigate("/payment")
 }

 const handleProceedFromEnquiry = () => {
  if (!enquiryChoice || enquiryChoice === "followup") return

  if (enquiryChoice === "trial") {
   if (!data.batchDate) {
    setBookingError("Please select a trial booking date.")
    return
   }
   if (!isTrialBookingDateAllowed(data.batchDate)) {
    setBookingError("Trial booking is not available on Wednesday, Saturday, or Sunday.")
    return
   }
   data.setData({
    purpose: "trial",
    duration: "1 Day",
    price: TRIAL_FEE,
    mainPlanPrice: TRIAL_FEE,
    mainPlanOriginalPrice: 0,
    selectedAddOnIds: [],
    isPartialPayment: false,
    isSplitPayment: false,
    partialPaymentDueDate: "",
    paidAmount: 0,
    dueAmount: 0,
    paymentCollectionStep: 1,
    paymentMethod1: "",
    paymentMethod2: "",
    paymentSurchargeAmount: 0,
    paymentTotalAmount: TRIAL_FEE,
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })
   data.clearConsentSigning()
   navigate("/payment")
   return
  }

  // enroll
  if (isPersonalTraining && !data.batchTime) {
   setBookingError("Please select a booking time.")
   return
  }

  if (!data.batchDate) {
   setBookingError("Please select a joining date.")
   return
  }

  if (splitEnabled) {
   const parsedSplit = parseInt(splitAmount1Input, 10)
   if (!splitMethod1) { setSplitError("Please select the first payment method."); return }
   if (!splitAmount1Input || isNaN(parsedSplit) || parsedSplit <= 0) { setSplitError("Enter a valid amount for the first payment method."); return }
   if (parsedSplit >= bookingPrice) { setSplitError("First amount must be less than the total. Use full payment for a single method."); return }
   const split1Surcharge = getPaymentSurchargeAmount(parsedSplit, splitMethod1 as Parameters<typeof getPaymentSurchargeAmount>[1])
   const split2Amount = bookingPrice - parsedSplit
   data.setData({
    purpose: "enroll",
    price: bookingPrice,
    isSplitPayment: true,
    isPartialPayment: false,
    partialPaymentDueDate: "",
    paidAmount: parsedSplit,
    dueAmount: split2Amount,
    paymentMethod1: splitMethod1 as Parameters<typeof getPaymentSurchargeAmount>[1],
    paymentMethod2: "",
    paymentCollectionStep: 1,
    paymentSurchargeAmount: split1Surcharge,
    paymentTotalAmount: bookingPrice + split1Surcharge,
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })
  } else if (partialEnabled) {
   const parsed = parseInt(partialInput, 10)
   if (!partialInput || isNaN(parsed) || parsed <= 0) { setPartialError("Enter a valid partial amount."); return }
   if (parsed >= bookingPrice) { setPartialError("Partial amount must be less than the total."); return }
   data.setData({
    purpose: "enroll",
    price: bookingPrice,
    isPartialPayment: true,
    isSplitPayment: false,
    partialPaymentDueDate: partialDueDate,
    paidAmount: parsed,
    dueAmount: bookingPrice - parsed,
    paymentCollectionStep: 1,
    paymentMethod1: "",
    paymentMethod2: "",
    paymentSurchargeAmount: 0,
    paymentTotalAmount: bookingPrice,
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })
  } else {
   data.setData({
    purpose: "enroll",
    price: bookingPrice,
    isPartialPayment: false,
    isSplitPayment: false,
    partialPaymentDueDate: "",
    paidAmount: 0,
    dueAmount: 0,
    paymentCollectionStep: 1,
    paymentMethod1: "",
    paymentMethod2: "",
    paymentSurchargeAmount: 0,
    paymentTotalAmount: bookingPrice,
    paymentReference: "",
    paymentMethod: "",
    paymentStatus: ""
   })
  }

  data.clearConsentSigning()
  navigate("/payment")
 }

 const handleFinishEnquiry = async () => {
  try {
   setSavingEnquiry(true)
   setSaveError("")

   await saveEnquirySubmission({
    name: data.name,
    phone: data.phone,
    countryCode: data.countryCode,
    dateOfBirth: data.dateOfBirth,
    lookingFor: data.lookingFor,
    referenceSource: data.referenceSource,
    age: data.age,
    gender: data.gender,
    primaryGoal: data.primaryGoal,
    enquiryMessage: data.enquiryMessage,
    experience: data.experience,
    priorExerciseExperience: data.priorExerciseExperience,
    priorExerciseActivity: data.priorExerciseActivity,
    priorExerciseDuration: data.priorExerciseDuration,
    lastExerciseTime: data.lastExerciseTime,
    injury: data.injury,
    injuryDetails: data.injuryDetails,
    exerciseType: data.exerciseType,
    program: data.program,
    days: data.days,
    duration: data.duration,
    batchType: data.batchType,
    batchTime: data.batchTime,
    batchDate: data.batchDate,
    followUpDate: data.followUpDate,
    followUpTime: data.followUpTime,
    price: data.price,
    staffUser
   })

   navigate("/enquiry-thank-you")
  } catch (error) {
   console.error("Failed to save enquiry from review:", error)
   setSaveError("Unable to save enquiry right now. Please try again.")
  } finally {
   setSavingEnquiry(false)
  }
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
  <Container scrollable>
   <div style={styles.wrapper}>
    <div style={styles.heroCard}>
     <div style={styles.heroHeader}>
      <div>
       <p style={styles.kicker}>
        {isEnquiryFlow ? "Enquiry Review" : isBookingFlow ? "Booking Review" : "Review"}
       </p>
       <h2 style={styles.heroTitle}>Almost there</h2>
      </div>

      <div style={styles.statusPill}>
       {formatPurpose(data.purpose)}
      </div>
     </div>

     <div style={styles.heroGrid(isMobile)}>
     {renderTile("Program", data.program || "-")}
     {renderTile("Plan", data.duration || "-")}
     {renderTile(heroMomentLabel, heroMomentValue, true)}
     <div style={styles.detailTile}>
      <p style={styles.detailLabel}>Price</p>
      <p style={styles.detailValue}>
       {mainPlanOriginalPrice > mainPlanPrice && mainPlanOriginalPrice > 0 && (
        <span style={{ fontSize: "12px", textDecoration: "line-through", textDecorationColor: "#E85A5A", textDecorationThickness: "1.5px", color: "#E85A5A", fontWeight: 400, display: "block" }}>
         ₹{mainPlanOriginalPrice.toLocaleString("en-IN")}
        </span>
       )}
       {bookingPrice ? `₹${bookingPrice.toLocaleString("en-IN")}` : "-"}
      </p>
     </div>
    </div>

     {isTrialBooking && (
      <div style={styles.noticeCard}>
       <p style={styles.noticeTitle}>Trial booking fee: ₹{TRIAL_FEE}</p>
       <p style={styles.noticeText}>{TRIAL_FEE_NOTE}</p>
      </div>
     )}
    </div>

    <div style={styles.sectionStack}>
     <div style={styles.sectionCard(isMobile, isCompactHeight)}>
     <div style={styles.sectionHeader}>
      <div>
       <p style={styles.sectionEyebrow}>Profile</p>
       <h3 style={styles.sectionTitle}>Personal Details</h3>
      </div>
       {renderEditButton("Edit", goToDetails)}
      </div>

      <div style={styles.detailGrid(isMobile)}>
       {renderTile("Name", data.name || "-")}
       {renderTile("Phone", formatPhoneNumber(data.phone, data.countryCode) || data.phone || "-")}
       {renderTile("Gender", data.gender || "-")}
       {renderTile("Looking For", data.lookingFor || "-")}
       {renderTile("Date of Birth", formatDateOfBirth(data.dateOfBirth))}
       {renderTile("Reference", data.referenceSource || "-")}
      </div>
     </div>

     <div style={styles.sectionCard(isMobile, isCompactHeight)}>
     <div style={styles.sectionHeader}>
      <div>
       <p style={styles.sectionEyebrow}>Assessment</p>
       <h3 style={styles.sectionTitle}>Training Background</h3>
      </div>
      {renderEditButton("Edit", goToTraining)}
     </div>

      <div style={styles.detailGrid(isMobile)}>
       {renderTile("Purpose", formatPurpose(data.purpose))}
       {renderTile("Injury", data.injury ? "Yes" : "No")}
       {renderTile("Training Type", data.exerciseType || "-")}
       {renderTile("Experience", data.experience || "-")}
       {renderTile("Prior Exercise Experience", formatYesNo(data.priorExerciseExperience))}
      </div>

      {data.priorExerciseExperience === "yes" && (
       <div style={styles.subSection}>
        <p style={styles.subSectionTitle}>Previous activity</p>
        <div style={styles.detailGrid(isMobile)}>
         {renderTile("Exercise / Sport", formatActivities(data.priorExerciseActivity))}
         {renderTile("Experience Duration", data.priorExerciseDuration || "-")}
         {renderTile("Last Active", data.lastExerciseTime || "-")}
        </div>
       </div>
      )}
     </div>

     <div style={styles.sectionCard(isMobile, isCompactHeight)}>
      <div style={styles.sectionHeader}>
       <div>
        <p style={styles.sectionEyebrow}>Program</p>
        <h3 style={styles.sectionTitle}>Program & Batch</h3>
       </div>
       {!isBookingFlow || isTrialBooking ? (
        <div style={styles.editGroup}>
         {renderEditButton("Program", goToProgram)}
         {renderEditButton("Batch", goToBatch)}
        </div>
       ) : null}
      </div>

      {isBookingFlow && !isTrialBooking ? (
       <div style={styles.inlineEditStack}>

        {/* Program */}
        <div style={styles.inlineEditRow}>
         <div style={styles.inlineEditTile}>
          <div>
           <p style={styles.detailLabel}>Program</p>
           <p style={styles.detailValue}>{data.program || "-"}</p>
          </div>
          <button type="button" style={styles.changeButton} onClick={() => toggleEditor("program")}>
           {expandedEditor === "program" ? "Close" : "Change"}
          </button>
         </div>
         {expandedEditor === "program" && (
          <div style={styles.inlineOptions}>
           {plans.map((plan) => (
            <ChoiceCard
             key={plan.id}
             title={plan.name}
             subtitle={plan.pricing?.[0] ? `From ₹${plan.pricing[0].price.toLocaleString("en-IN")}` : plan.days || ""}
             footer={
              plan.pricing?.[0]?.originalPrice !== undefined && plan.pricing[0].originalPrice! > plan.pricing[0].price ? (
               <p style={{ fontSize: "12px", textDecoration: "line-through", textDecorationColor: "#E85A5A", textDecorationThickness: "1.5px", color: "#E85A5A", marginTop: "6px" }}>
                MRP ₹{plan.pricing[0].originalPrice!.toLocaleString("en-IN")}
               </p>
              ) : undefined
             }
             selected={matchesLabel(plan.name, data.program)}
             badgeLabel={matchesLabel(plan.name, data.program) ? "Current" : "Select"}
             centered={false}
             onClick={() => handleChangeProgram(plan)}
            />
           ))}
          </div>
         )}
        </div>

        {/* Duration */}
        <div style={styles.inlineEditRow}>
         <div style={styles.inlineEditTile}>
          <div>
           <p style={styles.detailLabel}>Plan Duration</p>
           <p style={styles.detailValue}>{data.duration || "-"}</p>
          </div>
          {selectedPlan?.pricing && selectedPlan.pricing.length > 1 && (
           <button type="button" style={styles.changeButton} onClick={() => toggleEditor("duration")}>
            {expandedEditor === "duration" ? "Close" : "Change"}
           </button>
          )}
         </div>
         {expandedEditor === "duration" && selectedPlan?.pricing && (
          <div style={styles.inlineOptions}>
           {[...selectedPlan.pricing]
            .sort((a, b) => {
             const order: Record<string, number> = { "1 Day": 0, "1 Session": 1, "Free Trial": 2, "1 Week": 3, "Monthly": 4, "Quarterly": 5, "Half Yearly": 6, "Yearly": 7 }
             return (order[a.duration] ?? 99) - (order[b.duration] ?? 99)
            })
            .filter((p) => p.duration !== "1 Day")
            .map((pricing, index) => (
             <ChoiceCard
              key={pricing.duration}
              title={pricing.duration}
              subtitle={`₹${pricing.price.toLocaleString("en-IN")}`}
              footer={
               pricing.originalPrice !== undefined && pricing.originalPrice > pricing.price ? (
                <p style={{ fontSize: "12px", textDecoration: "line-through", textDecorationColor: "#E85A5A", textDecorationThickness: "1.5px", color: "#E85A5A", marginTop: "6px" }}>
                 MRP ₹{pricing.originalPrice.toLocaleString("en-IN")}
                </p>
               ) : undefined
              }
              selected={data.duration === pricing.duration}
              badgeLabel={data.duration === pricing.duration ? "Current" : index === 0 ? "Popular" : "Pick"}
              centered={false}
              onClick={() => handleChangeDuration((selectedPlan.pricing ?? []).indexOf(pricing))}
             />
            ))}
          </div>
         )}
        </div>

        {/* Batch Type */}
        <div style={styles.inlineEditRow}>
         <div style={styles.inlineEditTile}>
          <div>
           <p style={styles.detailLabel}>Batch Type</p>
           <p style={styles.detailValue}>{data.batchType || "-"}</p>
          </div>
          {schedulePeriodOptions.length > 1 && (
           <button type="button" style={styles.changeButton} onClick={() => toggleEditor("batchType")}>
            {expandedEditor === "batchType" ? "Close" : "Change"}
           </button>
          )}
         </div>
         {expandedEditor === "batchType" && schedulePeriodOptions.length > 0 && (
          <div style={styles.inlineOptions}>
           {schedulePeriodOptions.map((option) => (
            <ChoiceCard
             key={option.value}
             title={option.label}
             subtitle={`${option.timings.length} slot${option.timings.length === 1 ? "" : "s"} available`}
             selected={data.batchType === option.value}
             badgeLabel={data.batchType === option.value ? "Current" : "Pick"}
             centered={false}
             onClick={() => handleChangeBatchType(option.value)}
            />
           ))}
          </div>
         )}
        </div>

        {/* Batch Time */}
        <div style={styles.inlineEditRow}>
         <div style={styles.inlineEditTile}>
          <div>
           <p style={styles.detailLabel}>Batch Time</p>
           <p style={styles.detailValue}>{data.batchTime || "-"}</p>
          </div>
          {bookingTimings.length > 1 && (
           <button type="button" style={styles.changeButton} onClick={() => toggleEditor("batchTime")}>
            {expandedEditor === "batchTime" ? "Close" : "Change"}
           </button>
          )}
         </div>
         {expandedEditor === "batchTime" && bookingTimings.length > 0 && (
          <div style={styles.inlineOptions}>
           {bookingTimings.map((timing, index) => (
            <ChoiceCard
             key={timing}
             title={timing}
             subtitle={index === 0 ? "Recommended" : "Available"}
             selected={data.batchTime === timing}
             badgeLabel={data.batchTime === timing ? "Current" : "Pick"}
             centered
             onClick={() => handleChangeBatchTime(timing)}
            />
           ))}
          </div>
         )}
        </div>

        {/* Read-only summary tiles */}
        <div style={styles.detailGrid(isMobile)}>
         <div style={styles.detailTile}>
          <p style={styles.detailLabel}>Price</p>
          <p style={styles.detailValue}>
           {mainPlanOriginalPrice > mainPlanPrice && mainPlanOriginalPrice > 0 && (
            <span style={{ fontSize: "12px", textDecoration: "line-through", textDecorationColor: "#E85A5A", textDecorationThickness: "1.5px", color: "#E85A5A", fontWeight: 400, display: "block" }}>
             ₹{mainPlanOriginalPrice.toLocaleString("en-IN")}
            </span>
           )}
           {data.price ? `₹${data.price.toLocaleString("en-IN")}` : "-"}
          </p>
         </div>
         {renderTile("Days", data.days || "-")}
        </div>
       </div>
      ) : (
       <div style={styles.detailGrid(isMobile)}>
        {renderTile("Program", data.program || "-")}
        {renderTile("Plan Duration", data.duration || "-")}
        {renderTile("Batch Type", data.batchType || "-")}
        {renderTile("Batch Time", data.batchTime || "-")}
        <div style={styles.detailTile}>
         <p style={styles.detailLabel}>Price</p>
         <p style={styles.detailValue}>
          {mainPlanOriginalPrice > mainPlanPrice && mainPlanOriginalPrice > 0 && (
           <span style={{ fontSize: "12px", textDecoration: "line-through", textDecorationColor: "#E85A5A", textDecorationThickness: "1.5px", color: "#E85A5A", fontWeight: 400, display: "block" }}>
            ₹{mainPlanOriginalPrice.toLocaleString("en-IN")}
           </span>
          )}
          {data.price ? `₹${data.price.toLocaleString("en-IN")}` : "-"}
         </p>
        </div>
        {renderTile("Days", data.days || "-")}
       </div>
      )}
     </div>

     {shouldShowProfilePhotoOnReview && (
      <div style={styles.sectionCard(isMobile, isCompactHeight)}>
       <div style={styles.sectionHeader}>
        <div>
         <p style={styles.sectionEyebrow}>Verification</p>
         <h3 style={styles.sectionTitle}>Profile Photo Capture</h3>
         <p style={styles.sectionHint}>
          Add a profile photo for the member record now, or skip it and continue to payment.
         </p>
        </div>
        <span style={styles.optionalPill}>Optional</span>
       </div>

       <div style={styles.photoCaptureLayout(isMobile)}>
        <div style={styles.photoPreviewCard}>
         {displayPhotoUrl ? (
         <img src={displayPhotoUrl} alt="Member profile preview" style={styles.photoPreviewImage} />
        ) : (
         <div style={styles.photoPreviewPlaceholder}>
          <span style={styles.photoPlaceholderBadge}>No Photo</span>
           <p style={styles.photoPlaceholderText}>Use Take Photo or Choose Gallery to capture client photo.</p>
          </div>
         )}
        </div>

        <div style={styles.photoActionColumn}>
         <div style={styles.photoActionRow}>
          <button
           type="button"
           onClick={handleSelectTakePhoto}
           style={styles.photoSecondaryButton}
           disabled={photoUploading}
          >
           {photoUploading ? "Uploading..." : "Take Photo"}
          </button>

          <button
           type="button"
           onClick={() => {
             galleryInputRef.current?.click()
           }}
           style={styles.photoSecondaryButton}
           disabled={photoUploading}
          >
           Choose Gallery
          </button>

          <button
           type="button"
           onClick={handleRetryPhotoUpload}
           style={styles.photoTertiaryButton}
           disabled={photoUploading || !pendingPhotoBlob}
          >
           Retry Upload
          </button>
         </div>

         <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="user"
          onChange={(event) => {
           void handlePhotoFile(event.target.files?.[0] || null, "camera")
           event.currentTarget.value = ""
          }}
          style={{ display: "none" }}
         />

         <input
          ref={galleryInputRef}
          type="file"
          accept="image/*"
          onChange={(event) => {
           void handlePhotoFile(event.target.files?.[0] || null, "gallery")
           event.currentTarget.value = ""
          }}
          style={{ display: "none" }}
         />

         {photoStatusMessage && <p style={styles.photoStatus}>{photoStatusMessage}</p>}
         {photoError && <p style={styles.photoError}>{photoError}</p>}
        </div>
       </div>
      </div>
     )}

     {isBookingFlow && (
      <div style={styles.sectionCard(isMobile, isCompactHeight)}>
       <div style={styles.sectionHeader}>
        <div>
         <p style={styles.sectionEyebrow}>Pricing</p>
         <h3 style={styles.sectionTitle}>Price Breakdown</h3>
        </div>
       </div>

       <div style={styles.breakdownCard}>
        {buildPriceBreakdown("Main Plan", mainPlanPrice, selectedAddonPlans, mainPlanOriginalPrice).map((item) => (
         <div key={item.label} style={styles.breakdownRow}>
          <span style={styles.breakdownLabel}>{item.label}</span>
          <span style={{ ...styles.breakdownValue, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "2px" }}>
           {item.originalAmount !== undefined && (
            <span style={{ fontSize: "12px", textDecoration: "line-through", textDecorationColor: "#E85A5A", textDecorationThickness: "1.5px", color: "#E85A5A", fontWeight: 400 }}>
             ₹{item.originalAmount.toLocaleString("en-IN")}
            </span>
           )}
           ₹{item.amount.toLocaleString("en-IN")}
          </span>
         </div>
        ))}

        {selectedAddonPlans.length > 0 && (
         <>
          <div style={styles.breakdownDivider} />
          <div style={styles.breakdownRowTotal}>
           <span style={styles.breakdownLabel}>Add-ons Total</span>
           <span style={styles.breakdownValue}>₹{addonTotal.toLocaleString("en-IN")}</span>
          </div>
         </>
        )}

        {trialCreditApplied && (
         <div style={styles.breakdownRow}>
          <span style={{ ...styles.breakdownLabel, color: "#4ade80" }}>Trial Credit</span>
          <span style={{ ...styles.breakdownValue, color: "#4ade80" }}>- ₹{TRIAL_FEE.toLocaleString("en-IN")}</span>
         </div>
        )}

        <div style={styles.breakdownDivider} />
        <div style={styles.breakdownRowTotal}>
         <span style={styles.breakdownLabel}>Total</span>
         <span style={styles.breakdownValue}>₹{(isTrialBooking ? TRIAL_FEE : bookingPrice).toLocaleString("en-IN")}</span>
        </div>

        {!isTrialBooking && (
         <>
          <div style={styles.breakdownDivider} />

          {/* Partial Payment */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }}>
           <span style={styles.breakdownLabel}>Partial Payment</span>
           <div style={{ display: "flex", gap: "6px" }}>
            <button
             type="button"
             onClick={() => {
              const next = !partialEnabled
              setPartialEnabled(next)
              setPartialInput("")
              setPartialError("")
              setPartialDueDate("")
              if (next) { setSplitEnabled(false); setSplitMethod1(""); setSplitAmount1Input(""); setSplitError("") }
             }}
             style={{ background: partialEnabled ? colors.primary : "rgba(255,255,255,0.08)", border: "none", borderRadius: "999px", color: partialEnabled ? colors.textOnAccent : colors.textSecondary, fontSize: "12px", fontWeight: 700, padding: "4px 14px", cursor: "pointer" }}
            >
             {partialEnabled ? "On" : "Off"}
            </button>
           </div>
          </div>

          {partialEnabled && (
           <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
            <input
             type="number"
             min={1}
             max={bookingPrice - 1}
             placeholder={`Collect now (max ₹${(bookingPrice - 1).toLocaleString("en-IN")})`}
             value={partialInput}
             onChange={(e) => { setPartialInput(e.target.value); setPartialError("") }}
             style={{ width: "100%", padding: "10px 12px", borderRadius: radius.md, border: `1px solid ${partialError ? "#F1A596" : colors.border}`, background: "rgba(255,255,255,0.06)", color: colors.textPrimary, fontSize: "16px", boxSizing: "border-box" as const, outline: "none" }}
            />
            <DialogDateField
             label="Next Payment Due Date"
             value={partialDueDate}
             onChange={setPartialDueDate}
             min={followUpMinDate}
             helperText="When will the remaining amount be paid?"
             pickerTitle="Select Due Date"
             size="compact"
            />
            {partialInput && !isNaN(parseInt(partialInput, 10)) && parseInt(partialInput, 10) > 0 && parseInt(partialInput, 10) < bookingPrice && (
             <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: colors.textSecondary }}>
              <span>Now: <b style={{ color: "#4ade80" }}>₹{parseInt(partialInput, 10).toLocaleString("en-IN")}</b></span>
              <span>Remaining: <b style={{ color: "#f59e0b" }}>₹{(bookingPrice - parseInt(partialInput, 10)).toLocaleString("en-IN")}</b></span>
             </div>
            )}
            {partialError && <p style={{ margin: 0, color: "#F1A596", fontSize: "13px" }}>{partialError}</p>}
           </div>
          )}

          <div style={styles.breakdownDivider} />

          {/* Split Payment (two modes) */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: spacing.sm }}>
           <span style={styles.breakdownLabel}>Split Payment (2 Modes)</span>
           <button
            type="button"
            onClick={() => {
             const next = !splitEnabled
             setSplitEnabled(next)
             setSplitMethod1("")
             setSplitAmount1Input("")
             setSplitError("")
             if (next) { setPartialEnabled(false); setPartialInput(""); setPartialError(""); setPartialDueDate("") }
            }}
            style={{ background: splitEnabled ? colors.primary : "rgba(255,255,255,0.08)", border: "none", borderRadius: "999px", color: splitEnabled ? colors.textOnAccent : colors.textSecondary, fontSize: "12px", fontWeight: 700, padding: "4px 14px", cursor: "pointer" }}
           >
            {splitEnabled ? "On" : "Off"}
           </button>
          </div>

          {splitEnabled && (
           <div style={{ display: "flex", flexDirection: "column" as const, gap: "8px" }}>
            <p style={{ margin: 0, color: colors.textMuted, fontSize: "12px", lineHeight: 1.5 }}>
             Choose mode for the first portion. Remaining will be collected separately.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap" as const, gap: "6px" }}>
             {PAYMENT_METHOD_OPTIONS.map((m) => (
              <button
               key={m.value}
               type="button"
               onClick={() => { setSplitMethod1(m.value); setSplitError("") }}
               style={{ padding: "6px 14px", borderRadius: "999px", border: `1px solid ${splitMethod1 === m.value ? colors.primaryLight : colors.borderStrong}`, background: splitMethod1 === m.value ? "linear-gradient(135deg, rgba(200,169,108,0.98), rgba(195,160,93,0.96))" : "rgba(255,255,255,0.04)", color: splitMethod1 === m.value ? colors.textOnAccent : colors.textSecondary, fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
              >
               {m.title}
              </button>
             ))}
            </div>
            <input
             type="number"
             min={1}
             max={bookingPrice - 1}
             placeholder={`Amount for ${splitMethod1 ? PAYMENT_METHOD_OPTIONS.find(m => m.value === splitMethod1)?.title : "Mode 1"} (max ₹${(bookingPrice - 1).toLocaleString("en-IN")})`}
             value={splitAmount1Input}
             onChange={(e) => { setSplitAmount1Input(e.target.value); setSplitError("") }}
             style={{ width: "100%", padding: "10px 12px", borderRadius: radius.md, border: `1px solid ${splitError ? "#F1A596" : colors.border}`, background: "rgba(255,255,255,0.06)", color: colors.textPrimary, fontSize: "16px", boxSizing: "border-box" as const, outline: "none" }}
            />
            {splitAmount1Input && !isNaN(parseInt(splitAmount1Input, 10)) && parseInt(splitAmount1Input, 10) > 0 && parseInt(splitAmount1Input, 10) < bookingPrice && (
             <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", color: colors.textSecondary }}>
              <span>{splitMethod1 ? PAYMENT_METHOD_OPTIONS.find(m => m.value === splitMethod1)?.title : "Mode 1"}: <b style={{ color: "#4ade80" }}>₹{parseInt(splitAmount1Input, 10).toLocaleString("en-IN")}</b></span>
              <span>Remaining Mode: <b style={{ color: "#f59e0b" }}>₹{(bookingPrice - parseInt(splitAmount1Input, 10)).toLocaleString("en-IN")}</b></span>
             </div>
            )}
            {splitError && <p style={{ margin: 0, color: "#F1A596", fontSize: "13px" }}>{splitError}</p>}
           </div>
          )}
         </>
        )}
       </div>
      </div>
     )}

     {isBookingFlow && (
      <div style={styles.sectionCard(isMobile, isCompactHeight)}>
      <div style={styles.sectionHeader}>
       <div>
        <p style={styles.sectionEyebrow}>Next Step</p>
        <h3 style={styles.sectionTitle}>{bookingCardTitle}</h3>
       </div>
      </div>

       <div style={styles.followUpGrid(isMobile)}>
        {effectivePurpose === "trial" ? (
         <DialogDateField
          label="Trial Booking Date"
          value={data.batchDate}
          onChange={(value) => {
           setBookingError("")
           data.setData({ batchDate: value })
          }}
          options={trialDateOptions}
          helperText="Open the calendar-style picker and confirm the trial day."
          error={bookingError && !data.batchDate ? bookingError : ""}
          min={followUpMinDate}
          pickerTitle="Select Trial Date"
          size="compact"
         />
        ) : (
         <DialogDateField
          label={effectivePurpose === "enroll" ? "Joining Date" : "Renewal Date"}
          value={data.batchDate}
          onChange={(value) => {
           setBookingError("")
           data.setData({ batchDate: value })
          }}
          min={followUpMinDate}
          helperText={
           effectivePurpose === "enroll"
            ? "Open the picker and confirm the joining date."
            : "Open the picker and confirm the renewal date."
          }
          error={bookingError && !data.batchDate && effectivePurpose !== "renew" ? bookingError : ""}
          pickerTitle={effectivePurpose === "enroll" ? "Select Joining Date" : "Select Renewal Date"}
          size="compact"
         />
        )}

        {isPersonalTraining && (
         <DialogTimeField
          label={
           effectivePurpose === "trial"
            ? "Trial Booking Time"
            : effectivePurpose === "enroll"
             ? "Joining Time"
             : "Renewal Time"
          }
          value={data.batchTime}
          onChange={(value) => {
           setBookingError("")
           data.setData({
            batchTime: value,
            batchType: resolvedBookingBatchType
           })
          }}
          options={bookingTimeSlotOptions}
          error={bookingError && !data.batchTime ? bookingError : ""}
          helperText="Use the dialog picker or choose a suggested batch time."
          allowCustom
          emptyMessage="No booking times are available for this plan."
          pickerTitle={
           effectivePurpose === "trial"
            ? "Select Trial Time"
            : effectivePurpose === "enroll"
             ? "Select Joining Time"
             : "Select Renewal Time"
          }
         />
        )}
       </div>

       {bookingError && <p style={styles.bookingError}>{bookingError}</p>}
      </div>
     )}

     {isEnquiryFlow && enquiryChoice === "followup" && (
      <div style={styles.sectionCard(isMobile, isCompactHeight)}>
     <div style={styles.sectionHeader}>
      <div>
       <p style={styles.sectionEyebrow}>Reminder</p>
       <h3 style={styles.sectionTitle}>Follow-up</h3>
      </div>
      <span style={styles.optionalPill}>Optional</span>
     </div>

       <div style={styles.followUpGrid(isMobile)}>
        <DialogDateField
         label="Follow-up Date"
         value={data.followUpDate}
         onChange={(value) => data.setData({ followUpDate: value })}
         min={followUpMinDate}
         helperText="Open the picker and confirm the reminder date."
         pickerTitle="Select Follow-up Date"
         size="compact"
        />

        <DialogTimeField
         label="Follow-up Time"
         value={data.followUpTime}
         onChange={(value) => data.setData({ followUpTime: value })}
         options={[]}
         helperText="Open the time picker and confirm the reminder time."
         customOnly
         pickerTitle="Select Follow-up Time"
         size="compact"
        />
       </div>
      </div>
     )}
    </div>

    {isEnquiryFlow ? (
     <div style={{ ...styles.actionCard, flexDirection: "column" as const, alignItems: "stretch" }}>
      <p style={styles.actionKicker}>What would you like to do next?</p>
      <div style={{ display: "grid", gridTemplateColumns: actionGridColumns, gap: "10px", marginTop: "10px", gridAutoRows: "min-content", alignItems: "center" }}>
       <button
        type="button"
        disabled={savingEnquiry}
        onClick={() => setEnquiryChoice(enquiryChoice === "followup" ? null : "followup")}
        style={{
         minHeight: "48px",
         alignSelf: "center",
         borderRadius: "999px",
         border: `1px solid ${enquiryChoice === "followup" ? colors.primaryLight : colors.borderStrong}`,
         background: enquiryChoice === "followup" ? "linear-gradient(135deg, rgba(200,169,108,0.98), rgba(195,160,93,0.96))" : "rgba(255,255,255,0.04)",
         color: enquiryChoice === "followup" ? colors.textOnAccent : colors.primaryLight,
         fontSize: "12px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" as const, cursor: "pointer"
        }}
       >
        Follow Up
       </button>
       <button
        type="button"
        disabled={savingEnquiry}
        onClick={() => { setEnquiryChoice(enquiryChoice === "trial" ? null : "trial"); setBookingError("") }}
        style={{
         minHeight: "48px",
         alignSelf: "center",
         borderRadius: "999px",
         border: `1px solid ${enquiryChoice === "trial" ? colors.primaryLight : colors.borderStrong}`,
         background: enquiryChoice === "trial" ? "linear-gradient(135deg, rgba(200,169,108,0.98), rgba(195,160,93,0.96))" : "rgba(255,255,255,0.04)",
         color: enquiryChoice === "trial" ? colors.textOnAccent : colors.primaryLight,
         fontSize: "12px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" as const, cursor: "pointer"
        }}
       >
        Book Trial
       </button>
       <button
        type="button"
        disabled={savingEnquiry}
        onClick={() => { setEnquiryChoice(enquiryChoice === "enroll" ? null : "enroll"); setBookingError("") }}
        style={{
         minHeight: "48px",
         alignSelf: "center",
         borderRadius: "999px",
         border: `1px solid ${enquiryChoice === "enroll" ? colors.primaryLight : colors.borderStrong}`,
         background: enquiryChoice === "enroll" ? "linear-gradient(135deg, rgba(200,169,108,0.98), rgba(195,160,93,0.96))" : "rgba(255,255,255,0.04)",
         color: enquiryChoice === "enroll" ? colors.textOnAccent : colors.primaryLight,
         fontSize: "12px", fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase" as const, cursor: "pointer"
        }}
       >
        Enrol
       </button>
      </div>
      {enquiryChoice === "followup" && (
       <div style={{ marginTop: "14px" }}>
        <PrimaryButton
         title={savingEnquiry ? "Saving..." : "Save Enquiry"}
         onClick={handleContinue}
         disabled={savingEnquiry}
         fullWidth
        />
       </div>
      )}
      {(enquiryChoice === "trial" || enquiryChoice === "enroll") && (
       <div style={{ marginTop: "14px" }}>
        <PrimaryButton
         title={`Proceed to Payment`}
         onClick={handleContinue}
         fullWidth
        />
       </div>
      )}
      {saveError && <p style={{ marginTop: "10px", color: "#F1A596", fontSize: "13px", textAlign: "center" as const }}>{saveError}</p>}
     </div>
    ) : (
     <div style={styles.actionCard}>
      <div style={styles.actionCopy}>
       <p style={styles.actionKicker}>Continue to payment</p>
      </div>
      <div style={styles.actionButtonWrap}>
       <PrimaryButton
        title="Proceed to Payment"
        onClick={handleContinue}
        disabled={shouldShowProfilePhotoOnReview && photoUploading}
        fullWidth
       />
      </div>
     </div>
    )}

    {saveError && isEnquiryFlow && <p style={styles.saveError}>{saveError}</p>}
   </div>
  </Container>
 )
}

const styles = {
 wrapper: {
  width: "min(100%, 760px)",
  margin: "0 auto"
 },
 heroCard: {
  marginBottom: spacing.lg,
  padding: "clamp(18px, 2.2vh, 28px)",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  background:
   "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018)), radial-gradient(circle at top right, rgba(200,169,108,0.12), transparent 36%), radial-gradient(circle at bottom left, rgba(106,166,154,0.10), transparent 32%)",
  boxShadow: "0 24px 60px rgba(0,0,0,0.24)",
  backdropFilter: "blur(14px)"
 },
 heroHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: spacing.md,
  flexWrap: "wrap" as const,
  marginBottom: spacing.md
 },
 kicker: {
  color: colors.primaryLight,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: spacing.xs
 },
 heroTitle: {
  ...typography.subtitle,
  fontSize: "clamp(28px, 3.6vh, 38px)",
  margin: 0
 },
 heroSubtitle: {
  color: colors.textSecondary,
  lineHeight: 1.65,
  marginTop: spacing.sm,
  maxWidth: "54ch"
 },
 statusPill: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "10px 14px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.05)",
  color: colors.primaryLight,
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const
 },
 heroGrid: (isMobile: boolean) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
  gap: spacing.md
 }),
 noticeCard: {
  marginTop: spacing.lg,
  padding: "16px 18px",
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(135deg, rgba(200,169,108,0.16), rgba(106,166,154,0.08))"
 },
 noticeTitle: {
  color: colors.primaryLight,
  fontSize: "13px",
  lineHeight: 1.4,
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const,
  marginBottom: "6px"
 },
 noticeText: {
  color: colors.textSecondary,
  fontSize: "13px",
  lineHeight: 1.6
 },
 sectionStack: {
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.md
 },
 sectionCard: (isMobile: boolean, isCompactHeight: boolean) => ({
  padding: isMobile ? "18px" : isCompactHeight ? "20px" : "22px",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  background: "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.016))",
  boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
  backdropFilter: "blur(10px)"
 }),
 sectionHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: spacing.sm,
  flexWrap: "wrap" as const,
  marginBottom: spacing.md
 },
 sectionEyebrow: {
  color: colors.secondary,
  textTransform: "uppercase" as const,
  letterSpacing: "0.18em",
  fontSize: "11px",
  fontWeight: 700,
  marginBottom: spacing.xs
 },
 sectionTitle: {
  ...typography.subtitle,
  fontSize: "24px",
  marginBottom: "4px"
 },
 sectionHint: {
  color: colors.textSecondary,
  lineHeight: 1.5,
  fontSize: "13px",
  maxWidth: "56ch"
 },
 editGroup: {
  display: "flex",
  gap: spacing.sm,
  flexWrap: "wrap" as const
 },
 optionalPill: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textMuted,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const
 },
 detailGrid: (isMobile: boolean) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
  gap: spacing.md
 }),
 detailTile: {
  minHeight: "88px",
  padding: "16px",
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(160deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))"
 },
 detailTileAccent: {
  border: `1px solid ${colors.primaryLight}`,
  background: "linear-gradient(160deg, rgba(200,169,108,0.18), rgba(106,166,154,0.08))"
 },
 detailLabel: {
  color: colors.textMuted,
  fontSize: "11px",
  lineHeight: 1.4,
  marginBottom: "8px",
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  fontWeight: 700
 },
 detailValue: {
  color: colors.textPrimary,
  fontSize: "15px",
  lineHeight: 1.5,
  fontWeight: 700,
  wordBreak: "break-word" as const
 },
 subSection: {
  marginTop: spacing.lg,
  paddingTop: spacing.lg,
  borderTop: `1px solid ${colors.border}`
 },
 subSectionTitle: {
  color: colors.primaryLight,
  fontSize: "13px",
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  fontWeight: 700,
  marginBottom: spacing.sm
 },
 followUpGrid: (isMobile: boolean) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
  gap: spacing.md
 }),
 photoCaptureLayout: (isMobile: boolean) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) minmax(0, 1.15fr)",
  gap: spacing.md,
  alignItems: "start"
 }),
 photoPreviewCard: {
  width: "100%",
  aspectRatio: "1 / 1",
  borderRadius: radius.md,
  overflow: "hidden",
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(180deg, rgba(10,18,23,0.92), rgba(6,12,16,0.96))",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
 },
 photoPreviewImage: {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const
 },
 photoPreviewPlaceholder: {
  width: "100%",
  height: "100%",
  display: "flex",
  flexDirection: "column" as const,
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center" as const,
  padding: spacing.md,
  gap: spacing.sm
 },
 photoPlaceholderBadge: {
  padding: "10px 14px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  color: colors.primaryLight,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const,
  fontSize: "11px",
  fontWeight: 700
 },
 photoPlaceholderText: {
  color: colors.textSecondary,
  fontSize: "13px",
  lineHeight: 1.55,
  maxWidth: "260px"
 },
 photoActionColumn: {
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.sm
 },
 photoActionRow: {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: spacing.sm
 },
 photoSecondaryButton: {
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textPrimary,
  padding: "10px 16px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
 },
 photoTertiaryButton: {
  borderRadius: "999px",
  border: `1px solid ${colors.border}`,
  background: "transparent",
  color: colors.primaryLight,
  padding: "10px 16px",
  cursor: "pointer",
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
 },
 photoStatus: {
  color: colors.textSecondary,
  fontSize: "13px",
  lineHeight: 1.55,
  margin: 0
 },
 photoError: {
  color: "#F1A596",
  fontSize: "13px",
  lineHeight: 1.55,
  margin: 0
 },
 breakdownCard: {
  display: "flex",
  flexDirection: "column" as const,
  gap: "12px",
  padding: "16px 18px",
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.03)"
 },
 breakdownRow: {
  display: "flex",
  justifyContent: "space-between",
  gap: spacing.md,
  alignItems: "center"
 },
 breakdownRowTotal: {
  display: "flex",
  justifyContent: "space-between",
  gap: spacing.md,
  alignItems: "center",
  fontWeight: 800
 },
 breakdownLabel: {
  color: colors.textSecondary,
  fontSize: "14px",
  lineHeight: 1.5
 },
 breakdownValue: {
  color: colors.textPrimary,
  fontSize: "15px",
  fontWeight: 700,
  textAlign: "right" as const
 },
 breakdownDivider: {
  height: "1px",
  width: "100%",
  background: colors.borderStrong,
  opacity: 0.8
 },
 bookingError: {
  color: "#F1A596",
  fontSize: "14px",
  lineHeight: 1.5,
  marginTop: spacing.sm
 },
 actionCard: {
  marginTop: spacing.lg,
  padding: "18px 20px",
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderStrong}`,
  background:
   "linear-gradient(160deg, rgba(255,255,255,0.05), rgba(255,255,255,0.018)), radial-gradient(circle at top right, rgba(200,169,108,0.08), transparent 34%)",
  boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: spacing.md,
  flexWrap: "wrap" as const
 },
 actionCopy: {
  flex: "1 1 320px"
 },
 actionKicker: {
  color: colors.primaryLight,
  textTransform: "uppercase" as const,
  letterSpacing: "0.16em",
  fontSize: "11px",
  fontWeight: 700,
  marginBottom: spacing.xs
 },
 actionText: {
  color: colors.textSecondary,
  lineHeight: 1.6,
  maxWidth: "50ch"
 },
 actionButtonWrap: {
  flex: "0 0 auto",
  width: "min(100%, 280px)"
 },
 saveError: {
  marginTop: spacing.md,
  color: "#F1A596",
  fontSize: "14px",
  lineHeight: 1.5,
  textAlign: "center" as const
 },
 inlineEditStack: {
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.sm
 },
 inlineEditRow: {
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.xs
 },
 inlineEditTile: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: `${spacing.sm} ${spacing.md}`,
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.04)",
  gap: spacing.sm
 },
 changeButton: {
  flexShrink: 0,
  background: "transparent",
  border: `1px solid ${colors.border}`,
  borderRadius: "999px",
  color: colors.textSecondary,
  fontSize: "12px",
  fontWeight: 700,
  padding: "4px 12px",
  cursor: "pointer",
  letterSpacing: "0.04em"
 },
 inlineOptions: {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: spacing.xs
 }
}
