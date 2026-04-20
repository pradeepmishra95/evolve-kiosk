import type { ConfirmationResult } from "firebase/auth"

export type PhoneOtpRequestStatus = "idle" | "loading" | "success" | "error"

export interface PhoneOtpRequestState {
 status: PhoneOtpRequestStatus
 error: string
}

export type PhoneOtpSendResult =
 | {
    ok: true
    confirmationResult: ConfirmationResult
   }
 | {
    ok: false
    error: string
    code?: string
   }

export type PhoneOtpVerifyResult =
 | {
    ok: true
    verificationId: string
    uid: string
   }
 | {
    ok: false
    error: string
    code?: string
   }
