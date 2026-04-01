import { create } from "zustand"
import type {
 MembershipDuration,
 PaymentMethod,
 PaymentStatus,
 UserGender,
 UserPurpose,
 UserStatus
} from "../types/domain"

export interface UserState {

 language: string

 purpose: UserPurpose

 primaryGoal: string
 specificGoal: string
 enquiryMessage: string

 name: string
 age: number | null
 phone: string
 gender: UserGender

 experience: string
 injury: boolean
 injuryAnswered: boolean
 injuryDetails: string

 exerciseType: string

 program: string
 plan: string
 coach: string
 days: string

 price: number
 duration: MembershipDuration

 batchType: string
 batchTime: string

 paymentReference: string
 paymentMethod: PaymentMethod
 paymentStatus: PaymentStatus

 status: UserStatus

 setData: (data: Partial<UserState>) => void
 reset: () => void
}

export type UserStoreData = Omit<UserState, "setData" | "reset">

const initialState: UserStoreData = {

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

 status: "new"   // ✅ important
}

export const useUserStore = create<UserState>((set)=>({

 ...initialState,

 setData:(data)=>
  set((state)=>({
   ...state,
   ...data
  })),

 reset:()=>set({...initialState})

}))
