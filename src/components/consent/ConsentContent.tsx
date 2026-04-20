"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import PrimaryButton from "../buttons/PrimaryButton"
import TextInput from "../inputs/TextInput"
import SelectInput from "../inputs/SelectInput"
import { usePhoneOtp } from "../../hooks/usePhoneOtp"
import { useUserStore } from "../../store/userStore"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"
import {
 CONSENT_DOCUMENT_VERSION,
 CONSENT_SUMMARY_POINTS,
 CONSENT_TERMS_SECTIONS,
 CONSENT_TERMS_VERSION,
 CONSENT_TITLE
} from "../../consent/consentContent"
import { validateName, validatePhoneNumber } from "../../utils/validation"

const OTP_LENGTH = 6
const normalizeOtpCode = (value: string) => value.replace(/\D/g, "").slice(0, OTP_LENGTH)

const GUARDIAN_RELATIONSHIP_OPTIONS = [
 { value: "Mother", label: "Mother" },
 { value: "Father", label: "Father" },
 { value: "Parent", label: "Parent" },
 { value: "Brother", label: "Brother" },
 { value: "Sister", label: "Sister" },
 { value: "Spouse", label: "Spouse" },
 { value: "Grandmother", label: "Grandmother" },
 { value: "Grandfather", label: "Grandfather" },
 { value: "Uncle", label: "Uncle" },
 { value: "Aunt", label: "Aunt" },
 { value: "Caretaker", label: "Caretaker" },
 { value: "Guardian", label: "Guardian" },
 { value: "Other", label: "Other" },
]

interface ConsentContentProps {
 onComplete?: () => void
}

export default function ConsentContent({ onComplete }: ConsentContentProps) {
 const navigate = useNavigate()
 const {
  age,
  name,
  phone,
  countryCode,
  consentAgreed,
  consentSigningStatus,
  consentGuardianName,
  consentGuardianPhone,
  consentGuardianRelationship,
  consentTermsVersion,
  consentDocumentVersion,
  setData
 } = useUserStore()

 const isUnder18 = typeof age === "number" && age < 18
 const isConsentSigned = consentSigningStatus === "signed" && consentAgreed
 const [agreedToTerms, setAgreedToTerms] = useState(Boolean(consentAgreed))
 const [guardianName, setGuardianName] = useState(consentGuardianName || "")
 const [guardianPhone, setGuardianPhone] = useState(consentGuardianPhone || "")
 const [guardianRelationship, setGuardianRelationship] = useState(consentGuardianRelationship || "")
 const [showFullTerms, setShowFullTerms] = useState(false)
 const [errorMessage, setErrorMessage] = useState("")
 const [otpCode, setOtpCode] = useState("")
 const [otpTargetNumber, setOtpTargetNumber] = useState("")
 const [otpStep, setOtpStep] = useState<"idle" | "sending" | "sent" | "verifying">("idle")
 const [otpEverSent, setOtpEverSent] = useState(false)
 const [keyboardInset, setKeyboardInset] = useState(0)
 const otpCardRef = useRef<HTMLDivElement | null>(null)
 const otpInputRef = useRef<HTMLInputElement | null>(null)
 const { recaptchaContainerRef, sendOtp, verifyOtp, reset, hasConfirmationResult } = usePhoneOtp()

 const handleSuccess = useCallback(() => {
  if (onComplete) {
   onComplete()
   return
  }

  navigate("/success", { replace: true })
 }, [navigate, onComplete])

 const scrollOtpIntoView = useCallback((behavior: ScrollBehavior = "smooth") => {
  if (!otpCardRef.current) {
   return
  }

  window.requestAnimationFrame(() => {
   window.requestAnimationFrame(() => {
    otpCardRef.current?.scrollIntoView({
     behavior,
     block: "center",
     inline: "nearest"
    })
   })
  })
 }, [])

 const resetOtpSession = () => {
  setOtpStep("idle")
  setOtpCode("")
  setOtpTargetNumber("")
  setOtpEverSent(false)
  reset()
 }
 const isOtpBusy = otpStep === "sending" || otpStep === "verifying"
 const isOtpSent = otpStep === "sent" && hasConfirmationResult

 const canStartOtp = useMemo(() => {
  if (!agreedToTerms) {
   return false
  }

  if (!isUnder18) {
   return true
  }

  return Boolean(
   guardianName.trim() &&
    guardianPhone.trim() &&
    guardianRelationship.trim()
  )
 }, [agreedToTerms, guardianName, guardianPhone, guardianRelationship, isUnder18])
 const canVerifyOtp = otpCode.trim().length === OTP_LENGTH
 const buttonTitle = isConsentSigned
  ? "Continue"
  : otpStep === "sending"
   ? "Sending OTP..."
   : otpStep === "verifying"
    ? "Verifying OTP..."
    : isOtpSent
     ? "Verify OTP"
     : "Send OTP"
 const buttonDisabled = isConsentSigned
  ? false
  : isOtpBusy
   ? true
   : isOtpSent
    ? !canVerifyOtp
    : !canStartOtp

 useEffect(() => {
  if (!isOtpSent) {
   return
  }

  const viewport = window.visualViewport

  if (!viewport) {
   return
  }

  let frameId = 0

  const updateKeyboardInset = () => {
   const nextInset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop)
   const resolvedInset = nextInset > 120 ? Math.round(nextInset) : 0

   setKeyboardInset((current) => (current === resolvedInset ? current : resolvedInset))

   if (document.activeElement === otpInputRef.current && resolvedInset > 0) {
    scrollOtpIntoView()
   }
  }

  frameId = window.requestAnimationFrame(updateKeyboardInset)
  viewport.addEventListener("resize", updateKeyboardInset)
  viewport.addEventListener("scroll", updateKeyboardInset)

  return () => {
   if (frameId) {
    cancelAnimationFrame(frameId)
   }

   viewport.removeEventListener("resize", updateKeyboardInset)
   viewport.removeEventListener("scroll", updateKeyboardInset)
  }
 }, [isOtpSent, scrollOtpIntoView])

 useEffect(() => {
  if (!isOtpSent) {
   return
  }

  window.requestAnimationFrame(() => {
   otpInputRef.current?.focus()
   scrollOtpIntoView("auto")
  })
 }, [isOtpSent, scrollOtpIntoView])

 const validateConsentDetails = () => {
  const nameValidation = validateName(name)
  const phoneValidation = validatePhoneNumber(phone, countryCode)

  if (!nameValidation.isValid) {
   return {
    valid: false,
    error: nameValidation.error
   }
  }

  if (!phoneValidation.isValid) {
   return {
    valid: false,
    error: phoneValidation.error
   }
  }

  if (!agreedToTerms) {
   return {
    valid: false,
    error: "Please agree to the Terms & Conditions and liability waiver."
   }
  }

  if (!isUnder18) {
   return {
    valid: true,
    memberPhoneValidation: phoneValidation
   }
  }

  const guardianNameValidation = validateName(guardianName)

  if (!guardianNameValidation.isValid) {
   return {
    valid: false,
    error: "Guardian name is required for members under 18."
   }
  }

  const guardianPhoneValidation = validatePhoneNumber(guardianPhone, countryCode)

  if (!guardianPhoneValidation.isValid) {
   return {
    valid: false,
    error: "Please enter a valid guardian mobile number."
   }
  }

  if (!guardianRelationship.trim()) {
   return {
    valid: false,
    error: "Guardian relationship is required for members under 18."
   }
  }

  return {
    valid: true,
    memberPhoneValidation: phoneValidation,
    guardianNameValidation,
    guardianPhoneValidation
   }
 }

 const handleSendOtp = async () => {
  if (isOtpBusy) {
   return
  }

  const validation = validateConsentDetails()

  if (!validation.valid) {
   setErrorMessage(validation.error || "Please review the consent details and try again.")
   return
  }

  if (!recaptchaContainerRef.current) {
   setErrorMessage("OTP verification is not ready yet. Please try again.")
   return
  }

  const otpRecipientValidation = isUnder18
   ? validation.guardianPhoneValidation
   : validation.memberPhoneValidation

  if (!otpRecipientValidation) {
   setErrorMessage("Could not resolve the OTP mobile number. Please retry.")
   return
  }

  setOtpStep("sending")
  setErrorMessage("")
  const hasPendingConfirmation = hasConfirmationResult

  try {
   const sendResult = await sendOtp(
    `+${otpRecipientValidation.phoneWithCountryCode}`,
   )

   if (!sendResult.ok) {
    setOtpStep(hasPendingConfirmation ? "sent" : "idle")
    setErrorMessage(sendResult.error)
    return
   }

   setOtpTargetNumber(otpRecipientValidation.formattedPhoneNumber)
   setOtpCode("")
   setOtpEverSent(true)
   setOtpStep("sent")
   scrollOtpIntoView()
  } catch (error) {
   setOtpStep(hasPendingConfirmation ? "sent" : "idle")
   setErrorMessage(error instanceof Error ? error.message : "Unable to send OTP right now.")
  }
 }

 const handleVerifyOtp = async () => {
  if (isOtpBusy) {
   return
  }

  const validation = validateConsentDetails()

  if (!validation.valid) {
   setErrorMessage(validation.error || "Please review the consent details and try again.")
   return
  }

  if (!hasConfirmationResult) {
   setErrorMessage("Please send a new OTP before verifying.")
   setOtpStep("idle")
   return
  }

  if (!canVerifyOtp) {
   setErrorMessage("Please enter the 6-digit OTP.")
   return
  }

  setOtpStep("verifying")
  setErrorMessage("")

  try {
   const verificationResult = await verifyOtp(otpCode)

   if (!verificationResult.ok) {
    setOtpStep("sent")
    setErrorMessage(verificationResult.error)
    return
   }

   const agreedAt = new Date().toISOString()

   setData({
    consentAgreed: true,
    consentAgreedAt: agreedAt,
    consentSigningStatus: "signed",
    consentSignerType: isUnder18 ? "guardian" : "member",
    consentGuardianName: isUnder18 ? guardianName.trim() : "",
    consentGuardianPhone:
     isUnder18 && validation.guardianPhoneValidation
      ? validation.guardianPhoneValidation.normalizedPhone
      : "",
    consentGuardianRelationship: isUnder18 ? guardianRelationship.trim() : "",
    consentTermsVersion: consentTermsVersion || CONSENT_TERMS_VERSION,
    consentDocumentVersion: consentDocumentVersion || CONSENT_DOCUMENT_VERSION,
    consentSupplementarySignatureDataUrl: "",
    consentRequestId: "",
    consentRecordId: "",
    consentProviderName: "firebase-phone-auth",
    consentProviderRequestId: verificationResult.verificationId,
    consentProviderTransactionId: verificationResult.uid,
    consentDocumentHash: "",
    consentUnsignedPdfUrl: "",
    consentSignedPdfUrl: "",
    consentAuditTrailUrl: "",
    consentUnsignedPdfStoragePath: "",
    consentSignedPdfStoragePath: "",
    consentAuditTrailStoragePath: "",
    consentSupplementarySignatureUrl: "",
    consentSupplementarySignatureStoragePath: "",
    consentSupplementarySignatureHash: "",
    consentErrorMessage: ""
   })

   setOtpStep("idle")
   setOtpCode("")
   setOtpTargetNumber("")
   handleSuccess()
  } catch (error) {
   setOtpStep("sent")
   setErrorMessage(error instanceof Error ? error.message : "Unable to verify OTP right now.")
  }
 }

 const handleContinue = () => {
  if (isConsentSigned) {
   setErrorMessage("")
   handleSuccess()
   return
  }

  if (isOtpSent) {
   void handleVerifyOtp()
   return
  }

  void handleSendOtp()
 }

 const renderTermsModal = () => {
  if (!showFullTerms) {
   return null
  }

  return (
   <div style={styles.modalOverlay} role="dialog" aria-modal="true">
    <div style={styles.modalCard}>
     <div style={styles.modalHeader}>
      <div>
       <p style={styles.kicker}>Full Terms</p>
       <h3 style={styles.modalTitle}>{CONSENT_TITLE}</h3>
      </div>
      <button type="button" style={styles.modalCloseButton} onClick={() => setShowFullTerms(false)}>
       Close
      </button>
     </div>

     <div style={styles.modalBody}>
      {CONSENT_SUMMARY_POINTS.map((point) => (
       <p key={point} style={styles.summaryBullet}>{point}</p>
      ))}

      {CONSENT_TERMS_SECTIONS.map((section) => (
       <div key={section.title} style={styles.termsSection}>
        <h4 style={styles.termsSectionTitle}>{section.title}</h4>
        {section.paragraphs.map((paragraph) => (
         <p key={paragraph} style={styles.termsParagraph}>{paragraph}</p>
        ))}
       </div>
      ))}
     </div>
    </div>
   </div>
  )
 }

 return (
  <>
   <div
    style={{
     ...styles.wrapper,
     paddingBottom: isOtpSent && keyboardInset > 0 ? `calc(${spacing.lg} + ${keyboardInset}px)` : 0,
     transition: "padding-bottom 0.2s ease"
    }}
   >
    <div style={styles.heroCard}>
     <p style={styles.kicker}>Consent</p>
     <h2 style={styles.heading}>Review the exact document before proceeding</h2>
     <p style={styles.description}>
      The checkbox confirms that the member has reviewed the terms and liability waiver. After that, an OTP will be sent to the {isUnder18 ? "guardian" : "member"} mobile number for verification.
     </p>
    </div>

    {isConsentSigned && (
     <div style={styles.successStrip}>
      Consent already accepted and OTP-verified for this payment. You can continue.
     </div>
    )}

    <button type="button" style={styles.secondaryButton} onClick={() => setShowFullTerms(true)}>
     View full terms
    </button>

    <div style={styles.sectionCard}>
     <div style={styles.checkboxRow}>
      <label style={styles.checkboxLabel}>
       <input
        type="checkbox"
        checked={agreedToTerms}
        onChange={(event) => {
         resetOtpSession()
         setAgreedToTerms(event.target.checked)
         setErrorMessage("")
        }}
        style={styles.checkbox}
       />
       <span>I agree to the Terms & Conditions and liability waiver</span>
      </label>
     </div>

     {isUnder18 && (
      <>
       <p style={styles.guardianNote}>
        Guardian details are required because the member is below 18 years of age. OTP will be sent to the guardian mobile number.
       </p>
       <div style={styles.guardianGrid}>
        <TextInput
         label="Guardian name"
         value={guardianName}
         onChange={(value) => {
          resetOtpSession()
          setGuardianName(value)
          setErrorMessage("")
         }}
         placeholder="Guardian full name"
        />
        <TextInput
         label="Guardian mobile (OTP)"
         value={guardianPhone}
         onChange={(value) => {
          resetOtpSession()
          setGuardianPhone(value)
          setErrorMessage("")
         }}
         placeholder="Guardian mobile number"
         inputMode="tel"
        />
        <SelectInput
         label="Guardian relationship"
         value={guardianRelationship}
         onChange={(value) => {
          resetOtpSession()
          setGuardianRelationship(value)
          setErrorMessage("")
         }}
         options={GUARDIAN_RELATIONSHIP_OPTIONS}
         placeholder="Select relationship"
        />
       </div>
      </>
     )}

     {isOtpSent && !isConsentSigned && (
      <div ref={otpCardRef} style={styles.otpCard}>
       <p style={styles.otpTitle}>OTP Verification</p>
       <p style={styles.otpText}>
        A 6-digit OTP has been sent to <b>{otpTargetNumber}</b>. Enter it below to complete consent verification.
       </p>
       <TextInput
        label="Enter OTP"
        value={otpCode}
        onChange={(value) => {
         setOtpCode(normalizeOtpCode(value))
         setErrorMessage("")
        }}
        onFocus={() => {
         scrollOtpIntoView()
        }}
        placeholder="6-digit OTP"
        inputMode="numeric"
        maxLength={OTP_LENGTH}
        autoComplete="one-time-code"
        inputRef={otpInputRef}
       />
      </div>
     )}
    </div>

    <div style={styles.footerCard}>
     {errorMessage && <p style={styles.inlineError}>{errorMessage}</p>}
     <PrimaryButton
      title={buttonTitle}
      onClick={handleContinue}
      disabled={buttonDisabled}
      fullWidth
     />
     {otpEverSent && !isConsentSigned && (
      <button
       type="button"
       style={styles.secondaryButton}
       disabled={isOtpBusy}
       onClick={() => {
        void handleSendOtp()
       }}
      >
       Resend OTP
      </button>
     )}
    </div>

    <div ref={recaptchaContainerRef} style={styles.recaptchaContainer} aria-hidden="true" />
   </div>

   {renderTermsModal()}
  </>
 )
}

const styles = {
 wrapper: {
  width: "100%",
  maxWidth: "780px",
  margin: "0 auto",
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.lg
 },
 heroCard: {
  padding: "clamp(18px, 2.4vh, 28px)",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  background: "linear-gradient(160deg, rgba(255,255,255,0.045), rgba(255,255,255,0.015))",
  boxShadow: "0 20px 60px rgba(0,0,0,0.22)"
 },
 kicker: {
  color: colors.primaryLight,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  fontSize: "12px",
  fontWeight: 800,
  marginBottom: spacing.xs
 },
 heading: {
  ...typography.subtitle,
  fontSize: "clamp(28px, 3.8vw, 38px)",
  marginBottom: spacing.sm
 },
 description: {
  color: colors.textSecondary,
  lineHeight: 1.65
 },
 successStrip: {
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(135deg, rgba(200,169,108,0.12), rgba(106,166,154,0.08))",
  color: colors.primaryLight,
  padding: "12px 14px",
  fontSize: "13px",
  lineHeight: 1.5,
  fontWeight: 700
 },
 secondaryButton: {
  padding: "10px 14px",
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textPrimary,
  cursor: "pointer",
  fontSize: "13px",
  fontWeight: 800,
  letterSpacing: "0.08em",
  textTransform: "uppercase" as const
 },
 sectionCard: {
  padding: "clamp(16px, 2.2vh, 24px)",
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.028)"
 },
 checkboxRow: {
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.sm
 },
 checkboxLabel: {
  display: "flex",
  alignItems: "flex-start",
  gap: "12px",
  color: colors.textPrimary,
  fontSize: "16px",
  lineHeight: 1.5,
  fontWeight: 700
 },
 checkbox: {
  marginTop: "4px",
  width: "18px",
  height: "18px",
  accentColor: colors.primary
 },
 guardianGrid: {
  marginTop: spacing.md,
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 220px), 1fr))",
  gap: spacing.md
 },
 guardianNote: {
  marginTop: spacing.md,
  color: colors.textSecondary,
  lineHeight: 1.6,
  fontSize: "13px"
 },
 otpCard: {
  marginTop: spacing.md,
  padding: spacing.md,
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(160deg, rgba(200,169,108,0.08), rgba(255,255,255,0.02))",
  scrollMarginTop: "96px",
  scrollMarginBottom: "180px"
 },
 otpTitle: {
  color: colors.primaryLight,
  fontSize: "12px",
  fontWeight: 800,
  textTransform: "uppercase" as const,
  letterSpacing: "0.14em",
  marginBottom: spacing.sm
 },
 otpText: {
  color: colors.textSecondary,
  fontSize: "13px",
  lineHeight: 1.6,
  marginBottom: spacing.md
 },
 footerCard: {
  padding: "clamp(14px, 2vh, 22px)",
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(160deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))",
  boxShadow: "0 14px 42px rgba(0,0,0,0.2)",
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.sm
 },
 inlineError: {
  color: "#F1A596",
  marginBottom: spacing.sm,
  lineHeight: 1.5,
  fontSize: "13px"
 },
 modalOverlay: {
  position: "fixed" as const,
  inset: 0,
  background: "rgba(7,11,16,0.78)",
  backdropFilter: "blur(8px)",
  zIndex: 40,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "clamp(14px, 3vw, 30px)"
 },
 modalCard: {
  width: "min(100%, 780px)",
  maxHeight: "86vh",
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(160deg, rgba(15,22,30,0.98), rgba(8,14,20,0.98))",
  boxShadow: "0 28px 90px rgba(0,0,0,0.45)",
  display: "flex",
  flexDirection: "column" as const
 },
 modalHeader: {
  padding: "clamp(16px, 2.4vh, 24px)",
  borderBottom: `1px solid ${colors.border}`,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: spacing.md
 },
 modalTitle: {
  ...typography.subtitle,
  fontSize: "24px"
 },
 modalCloseButton: {
  border: `1px solid ${colors.borderStrong}`,
  borderRadius: radius.md,
  background: "rgba(255,255,255,0.04)",
  color: colors.textPrimary,
  fontSize: "12px",
  letterSpacing: "0.1em",
  textTransform: "uppercase" as const,
  fontWeight: 800,
  padding: "9px 12px",
  cursor: "pointer"
 },
 modalBody: {
  overflowY: "auto" as const,
  padding: "clamp(16px, 2.4vh, 24px)",
  display: "flex",
  flexDirection: "column" as const,
  gap: spacing.md
 },
 summaryBullet: {
  color: colors.textSecondary,
  lineHeight: 1.6,
  fontSize: "14px",
  paddingLeft: "16px",
  position: "relative" as const
 },
 termsSection: {
  display: "flex",
  flexDirection: "column" as const,
  gap: "10px"
 },
 termsSectionTitle: {
  color: colors.primaryLight,
  fontSize: "14px",
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  fontWeight: 800
 },
 termsParagraph: {
  color: colors.textSecondary,
  fontSize: "14px",
  lineHeight: 1.7
 },
 recaptchaContainer: {
  width: "1px",
  height: "1px",
  overflow: "hidden",
  opacity: 0,
  pointerEvents: "none" as const
 }
}
