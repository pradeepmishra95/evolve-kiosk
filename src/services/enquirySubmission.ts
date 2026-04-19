import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "../firebase/firebase"
import type { StaffSessionUser } from "../store/authStore"
import type { MembershipDuration, UserGender } from "../types/domain"
import { trackKioskSessionCompletion } from "./kioskSessions"
import { getPhoneDocumentId } from "../utils/validation"

interface EnquirySubmissionPayload {
 name: string
 phone: string
 countryCode: string
 dateOfBirth: string
 lookingFor: string
 referenceSource: string
 age: number | null
 gender: UserGender
 primaryGoal: string
 enquiryMessage: string
 experience: string
 priorExerciseExperience: string
 priorExerciseActivity: string[]
 priorExerciseDuration: string
 lastExerciseTime: string
 injury: boolean
 injuryDetails: string
 exerciseType: string
 program: string
 days: string
 duration: MembershipDuration
 batchType: string
 batchTime: string
 batchDate: string
 followUpDate: string
 followUpTime: string
 price: number
 staffUser: StaffSessionUser | null
}

export const saveEnquirySubmission = async (payload: EnquirySubmissionPayload) => {
 const phoneDocId = getPhoneDocumentId(payload.phone, payload.countryCode)
 const staffMetadata = {
  staffName: payload.staffUser?.name || "",
  staffUid: payload.staffUser?.uid || "",
  staffEmail: payload.staffUser?.email || "",
  staffSessionId: payload.staffUser?.sessionId || ""
 }

   const docData: Record<string, unknown> = {
    name: payload.name,
    phone: payload.phone,
    countryCode: payload.countryCode,
    dateOfBirth: payload.dateOfBirth,
    lookingFor: payload.lookingFor,
    referenceSource: payload.referenceSource,
    age: payload.age,
    gender: payload.gender,
    primaryGoal: payload.primaryGoal || payload.program || payload.exerciseType,
    enquiryMessage: payload.enquiryMessage,
    experience: payload.experience,
    priorExerciseExperience: payload.priorExerciseExperience,
    priorExerciseActivity: payload.priorExerciseActivity,
    priorExerciseDuration: payload.priorExerciseDuration,
    lastExerciseTime: payload.lastExerciseTime,
    injury: payload.injury,
    injuryDetails: payload.injury ? payload.injuryDetails : "",
    exerciseType: payload.exerciseType,
    program: payload.program,
    days: payload.days,
    duration: payload.duration,
    batchType: payload.batchType,
    batchTime: payload.batchTime,
    batchDate: payload.batchDate,
    followUp:
     payload.followUpDate || payload.followUpTime
      ? {
       date: payload.followUpDate,
       time: payload.followUpTime
      }
      : null,
    price: payload.price,
    ...staffMetadata,
    ...(payload.followUpDate && payload.followUpTime
     ? {
        enquiryStatus: "new",
        enquirySource: "kiosk",
        enquiryCreatedAt: serverTimestamp()
       }
     : {}),
    updatedAt: serverTimestamp()
   }

   // Only set purpose/status if explicitly provided in the payload — do not overwrite existing value otherwise
   if ((payload as any).purpose) {
    docData.purpose = (payload as any).purpose
   }

   if ((payload as any).status) {
    docData.status = (payload as any).status
   }

   await setDoc(doc(db, "users", phoneDocId), docData, { merge: true })

 await trackKioskSessionCompletion(staffMetadata.staffSessionId, {
  purpose: (payload as any).purpose || "enquiry",
  program: payload.program
 })

}
