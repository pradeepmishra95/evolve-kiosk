import {
 ConfirmationResult,
 RecaptchaVerifier,
 inMemoryPersistence,
 setPersistence,
 signInWithPhoneNumber,
 signOut
} from "firebase/auth"
import { consentOtpAuth } from "../firebase/firebase"

let consentOtpPersistencePromise: Promise<void> | null = null
const staleRecaptchaErrorCodes = new Set([
 "auth/captcha-check-failed",
 "auth/invalid-app-credential",
 "auth/missing-app-credential"
])
const defaultConsentOtpErrorMessage =
 "We could not complete OTP verification right now. Please try again."

export const ensureConsentOtpAuthReady = () => {
 if (!consentOtpPersistencePromise) {
  consentOtpPersistencePromise = setPersistence(consentOtpAuth, inMemoryPersistence)
 }

 return consentOtpPersistencePromise
}

const mapConsentOtpError = (code?: string) => {
 switch (code) {
  case "auth/invalid-phone-number":
   return "Please enter a valid mobile number for OTP verification."
  case "auth/missing-phone-number":
   return "Mobile number is required before sending OTP."
  case "auth/invalid-app-credential":
  case "auth/missing-app-credential":
   return "The phone verification session expired. Please send OTP again."
  case "auth/quota-exceeded":
   return "OTP quota is exhausted right now. Please try again later."
  case "auth/too-many-requests":
   return "Too many OTP attempts right now. Please wait and try again."
  case "auth/network-request-failed":
   return "Network issue while connecting to Firebase. Please check the internet and retry."
  case "auth/web-storage-unsupported":
   return "This browser does not support secure storage required for OTP verification."
  case "auth/captcha-check-failed":
   return "reCAPTCHA verification failed. Please try sending OTP again."
  case "auth/app-not-authorized":
   return "This Firebase project does not allow OTP on the current kiosk domain yet."
  case "auth/operation-not-allowed":
   return "Phone Authentication is not enabled in Firebase yet."
  case "auth/invalid-verification-code":
   return "The OTP entered is invalid. Please check and try again."
  case "auth/invalid-verification-id":
  case "auth/missing-verification-id":
   return "This OTP session is no longer valid. Please send OTP again."
  case "auth/code-expired":
   return "The OTP has expired. Please request a new one."
  case "auth/session-expired":
   return "This OTP session expired. Please request a new OTP."
  case "auth/missing-verification-code":
   return "Please enter the OTP sent to the mobile number."
  case "auth/invalid-credential":
   return "This OTP verification attempt is no longer valid. Please send OTP again."
  case "auth/invalid-recaptcha-token":
  case "auth/missing-recaptcha-token":
  case "auth/invalid-recaptcha-action":
  case "auth/invalid-recaptcha-version":
  case "auth/missing-recaptcha-version":
  case "auth/recaptcha-not-enabled":
   return "reCAPTCHA verification could not be completed. Please send OTP again."
  case "auth/app-deleted":
   return "The OTP session was reset. Please send OTP again."
  case "auth/unauthorized-domain":
   return "This kiosk domain is not authorized for Firebase OTP yet."
  default:
   return ""
 }
}

const getConsentOtpErrorCode = (error: unknown) =>
 typeof error === "object" && error && "code" in error ? String(error.code) : ""

export const getConsentOtpErrorDetails = (error: unknown) => {
 const code = getConsentOtpErrorCode(error)
 const mappedMessage = code ? mapConsentOtpError(code) : ""
 const rawMessage = error instanceof Error ? error.message.trim() : ""
 const looksLikeFirebaseCodeOnlyMessage =
  rawMessage.startsWith("Firebase: Error (auth/") && rawMessage.endsWith(").")

 return {
  code,
  message:
   mappedMessage ||
   (rawMessage && !looksLikeFirebaseCodeOnlyMessage
    ? rawMessage
    : code
     ? `OTP verification failed (${code}). Please try again.`
     : defaultConsentOtpErrorMessage)
 }
}

export const isConsentOtpRecaptchaStale = (code?: string) => staleRecaptchaErrorCodes.has(code || "")

export const createConsentOtpRecaptcha = (
 container: HTMLElement | string,
 options?: {
  onExpired?: () => void
 }
) =>
 new RecaptchaVerifier(consentOtpAuth, container, {
  size: "invisible",
  "expired-callback": options?.onExpired
 })

export const clearConsentOtpRecaptcha = (recaptchaVerifier?: RecaptchaVerifier | null) => {
 try {
  recaptchaVerifier?.clear()
 } catch {
  return undefined
 }
}

export const cleanupConsentOtpAuth = async () => {
 await signOut(consentOtpAuth).catch(() => {
  return undefined
 })
}

export const requestConsentOtp = async (phoneNumber: string, recaptchaVerifier: RecaptchaVerifier) => {
 try {
  await ensureConsentOtpAuthReady()
  await cleanupConsentOtpAuth()
  return await signInWithPhoneNumber(consentOtpAuth, phoneNumber, recaptchaVerifier)
 } catch (error) {
  const { code, message } = getConsentOtpErrorDetails(error)
  console.error("[consentOtp] requestConsentOtp failed — code:", code, "| raw:", error)
  throw new Error(message)
 }
}

export const verifyConsentOtp = async (confirmationResult: ConfirmationResult, otpCode: string) => {
 try {
  await ensureConsentOtpAuthReady()
  const result = await confirmationResult.confirm(otpCode.trim())

  await cleanupConsentOtpAuth()

  return {
   verificationId: confirmationResult.verificationId,
   uid: result.user.uid
  }
 } catch (error) {
  const { code, message } = getConsentOtpErrorDetails(error)
  console.error("[consentOtp] verifyConsentOtp failed — code:", code, "| raw:", error)
  throw new Error(message)
 }
}
