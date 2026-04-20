"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { signInWithPhoneNumber, type ConfirmationResult, type RecaptchaVerifier } from "firebase/auth"
import { consentOtpAuth } from "../firebase/firebase"
import {
 cleanupConsentOtpAuth,
 clearConsentOtpRecaptcha,
 createConsentOtpRecaptcha,
 ensureConsentOtpAuthReady,
 getConsentOtpErrorDetails,
 isConsentOtpRecaptchaStale
} from "../services/consentOtp"
import type {
 PhoneOtpRequestState,
 PhoneOtpSendResult,
 PhoneOtpVerifyResult
} from "../types/phoneOtp"

type GrecaptchaLike = {
 reset: (widgetId: number) => void
}

// Error codes that mean the confirmationResult is permanently invalid and
// cannot be retried — the user must request a new OTP.
const staleConfirmationCodes = new Set([
 "auth/code-expired",
 "auth/session-expired",
 "auth/invalid-verification-id",
 "auth/missing-verification-id",
])

const initialRequestState: PhoneOtpRequestState = {
 status: "idle",
 error: ""
}

export const usePhoneOtp = () => {
 const recaptchaContainerRef = useRef<HTMLDivElement | null>(null)
 const verifierRef = useRef<RecaptchaVerifier | null>(null)
 const widgetIdRef = useRef<number | null>(null)
 const confirmationResultRef = useRef<ConfirmationResult | null>(null)
 const renderPromiseRef = useRef<Promise<number> | null>(null)
 const recaptchaExpiredRef = useRef(false)
 const sendStatusRef = useRef<PhoneOtpRequestState["status"]>("idle")
 const verifyStatusRef = useRef<PhoneOtpRequestState["status"]>("idle")
 const [sendState, setSendState] = useState(initialRequestState)
 const [verifyState, setVerifyState] = useState(initialRequestState)
 const [hasConfirmationResult, setHasConfirmationResult] = useState(false)

 const updateSendState = useCallback((nextState: PhoneOtpRequestState) => {
  sendStatusRef.current = nextState.status
  setSendState(nextState)
 }, [])

 const updateVerifyState = useCallback((nextState: PhoneOtpRequestState) => {
  verifyStatusRef.current = nextState.status
  setVerifyState(nextState)
 }, [])

 const clearRecaptcha = useCallback(() => {
  clearConsentOtpRecaptcha(verifierRef.current)
  verifierRef.current = null
  widgetIdRef.current = null
  renderPromiseRef.current = null
  recaptchaExpiredRef.current = false
 }, [])

 const resetRenderedWidget = useCallback(() => {
  if (typeof window === "undefined" || widgetIdRef.current === null) {
   return
  }

  const grecaptcha = (window as Window & { grecaptcha?: GrecaptchaLike }).grecaptcha

  if (!grecaptcha || typeof grecaptcha.reset !== "function") {
   return
  }

  try {
   grecaptcha.reset(widgetIdRef.current)
  } catch {
   return
  }
 }, [])

 const createRecaptcha = useCallback(async () => {
  if (typeof window === "undefined") {
   throw new Error("OTP verification is only available in the browser.")
  }

  const container = recaptchaContainerRef.current

  if (!container) {
   throw new Error("OTP verification is not ready yet. Please try again.")
  }

  // Clear any existing reCAPTCHA DOM before mounting a fresh widget to avoid
  // "reCAPTCHA has already been rendered in this element" errors.
  try {
   if (container instanceof HTMLElement) {
    while (container.firstChild) {
     container.removeChild(container.firstChild)
    }
   }
  } catch {
   // best-effort; ignore DOM errors
  }

  await ensureConsentOtpAuthReady()

  const verifier = createConsentOtpRecaptcha(container, {
   // This fires when the reCAPTCHA *widget token* expires (≈2 min idle),
   // which is distinct from Firebase phone-auth session/code expiry.
   onExpired: () => {
    recaptchaExpiredRef.current = true

    if (!confirmationResultRef.current) {
     updateSendState({
      status: "error",
      error: "The reCAPTCHA challenge expired. Please send OTP again."
     })
    }
   }
  })

  verifierRef.current = verifier
  renderPromiseRef.current = verifier
   .render()
   .then((widgetId) => {
    widgetIdRef.current = widgetId
    return widgetId
   })
   .catch((error) => {
    clearRecaptcha()
    throw error
   })

  await renderPromiseRef.current

  return verifier
 }, [clearRecaptcha, updateSendState])

 const ensureRecaptcha = useCallback(async () => {
  if (verifierRef.current && widgetIdRef.current !== null) {
   return verifierRef.current
  }

  if (renderPromiseRef.current) {
   await renderPromiseRef.current
  }

  if (verifierRef.current && widgetIdRef.current !== null) {
   return verifierRef.current
  }

  return await createRecaptcha()
 }, [createRecaptcha])

 const recreateRecaptcha = useCallback(async () => {
  clearRecaptcha()
  return await createRecaptcha()
 }, [clearRecaptcha, createRecaptcha])

 const sendOtp = useCallback(async (phoneNumber: string): Promise<PhoneOtpSendResult> => {
  if (sendStatusRef.current === "loading") {
   return {
    ok: false,
    error: "OTP request is already in progress."
   }
  }

  updateSendState({
   status: "loading",
   error: ""
  })

  try {
   // cleanupConsentOtpAuth() signs out, which invalidates any existing
   // confirmationResult — always clear it before attempting a fresh send.
   await cleanupConsentOtpAuth()
   confirmationResultRef.current = null
   setHasConfirmationResult(false)

   // Phone auth consumes the reCAPTCHA token, so each send starts fresh.
   const verifier = await recreateRecaptcha()
   const confirmationResult = await signInWithPhoneNumber(consentOtpAuth, phoneNumber, verifier)

   confirmationResultRef.current = confirmationResult
   setHasConfirmationResult(true)
   recaptchaExpiredRef.current = false
   updateSendState({
    status: "success",
    error: ""
   })

   return {
    ok: true,
    confirmationResult
   }
  } catch (error) {
   const { code, message } = getConsentOtpErrorDetails(error)
   console.error("[usePhoneOtp] sendOtp failed — code:", code, "| raw:", error)

   // Send failed — the confirmationResult is already cleared above (before
   // the attempt), so no stale state can linger here.
   confirmationResultRef.current = null
   setHasConfirmationResult(false)

   resetRenderedWidget()

   if (recaptchaExpiredRef.current || isConsentOtpRecaptchaStale(code)) {
    await recreateRecaptcha().catch(() => undefined)
   } else {
    await ensureRecaptcha().catch(() => undefined)
   }

   updateSendState({
    status: "error",
    error: message
   })

   return {
    ok: false,
    error: message,
    code: code || undefined
   }
  }
 }, [ensureRecaptcha, recreateRecaptcha, resetRenderedWidget, updateSendState])

 const verifyOtp = useCallback(async (otpCode: string): Promise<PhoneOtpVerifyResult> => {
  if (verifyStatusRef.current === "loading") {
   return {
    ok: false,
    error: "OTP verification is already in progress."
   }
  }

  const confirmationResult = confirmationResultRef.current

  if (!confirmationResult) {
   const error = "Please send a new OTP before verifying."

   updateVerifyState({
    status: "error",
    error
   })

   return {
    ok: false,
    error
   }
  }

  updateVerifyState({
   status: "loading",
   error: ""
  })

  try {
   await ensureConsentOtpAuthReady()
   const result = await confirmationResult.confirm(otpCode.trim())

   await cleanupConsentOtpAuth()

   confirmationResultRef.current = null
   setHasConfirmationResult(false)
   clearRecaptcha()
   updateVerifyState({
    status: "success",
    error: ""
   })

   return {
    ok: true,
    verificationId: confirmationResult.verificationId,
    uid: result.user.uid
   }
  } catch (error) {
   const { code, message } = getConsentOtpErrorDetails(error)
   console.error("[usePhoneOtp] verifyOtp failed — code:", code, "| raw:", error)

   // For codes that permanently invalidate the session (expired, bad ID,
   // etc.) clear the confirmationResult so the user is forced to resend.
   // For auth/invalid-verification-code (wrong digits) we keep it so the
   // user can correct and retry without requesting a new OTP.
   if (staleConfirmationCodes.has(code)) {
    confirmationResultRef.current = null
    setHasConfirmationResult(false)
   }

   updateVerifyState({
    status: "error",
    error: message
   })

   return {
    ok: false,
    error: message,
    code: code || undefined
   }
  }
 }, [clearRecaptcha, updateVerifyState])

 const reset = useCallback(() => {
  confirmationResultRef.current = null
  setHasConfirmationResult(false)
  updateSendState(initialRequestState)
  updateVerifyState(initialRequestState)
  clearRecaptcha()
  void cleanupConsentOtpAuth()
 }, [clearRecaptcha, updateSendState, updateVerifyState])

 useEffect(() => {
  return () => {
   confirmationResultRef.current = null
   clearRecaptcha()
   void cleanupConsentOtpAuth()
  }
 }, [clearRecaptcha])

 return {
  recaptchaContainerRef,
  sendOtp,
  verifyOtp,
  reset,
  hasConfirmationResult,
  sendState,
  verifyState
 }
}
