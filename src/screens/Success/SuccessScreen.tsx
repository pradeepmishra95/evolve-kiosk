import { useNavigate } from "@/navigation/useAppNavigation"
import { doc, serverTimestamp, setDoc } from "firebase/firestore"
import { db } from "../../firebase/firebase"
import { useUserStore } from "../../store/userStore"

import Container from "../../layout/Container"
import PrimaryButton from "../../components/buttons/PrimaryButton"

import { spacing, typography } from "../../styles/GlobalStyles"
import { useState } from "react"
import { getDurationDays } from "../../utils/duration"

export default function SuccessScreen() {

 const navigate = useNavigate()

 const data = useUserStore()
 const paymentMethodLabel = data.paymentMethod ? data.paymentMethod.toUpperCase() : "PAYMENT"

 const [loading,setLoading] = useState(false)

 const handleFinish = async () => {

  if (!data.phone) {
   console.error("Phone number missing")
   return
  }

 try {

   setLoading(true)

   if (data.purpose === "enquiry") {

    await setDoc(
     doc(db, "users", data.phone),
     {
      name: data.name,
      phone: data.phone,
      age: data.age,
      gender: data.gender,
      purpose: "enquiry",
      status: "enquiry",
      primaryGoal: data.primaryGoal || data.program || data.exerciseType,
      enquiryMessage: data.enquiryMessage,
      experience: data.experience,
      injury: data.injury,
      injuryDetails: data.injury ? data.injuryDetails : "",
      exerciseType: data.exerciseType,
      program: data.program,
      days: data.days,
      duration: data.duration,
      batchType: data.batchType,
      batchTime: data.batchTime,
      price: data.price,
      enquiryStatus: "new",
      enquirySource: "kiosk",
      enquiryCreatedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
     },
     { merge: true }
    )

    data.reset()
    navigate("/")
    return
   }

   const today = new Date()
   const daysToAdd = getDurationDays(data.duration)
   const expiryDate = new Date()
   expiryDate.setDate(today.getDate() + daysToAdd)
   const cameFromEnquiry = data.status === "enquiry"

   await setDoc(
    doc(db,"users",data.phone),
    {

     name: data.name,
     phone: data.phone,
     age: data.age,
     gender: data.gender,

     purpose: data.purpose,
     experience: data.experience,

     injury: data.injury,
     injuryDetails: data.injury ? data.injuryDetails : "",

     exerciseType: data.exerciseType,

     program: data.program,
     days: data.days,          // ✅ added
     plan: data.plan,
     duration: data.duration,

     batchType: data.batchType,
     batchTime: data.batchTime,

     price: data.price,
     paymentReference: data.paymentReference,
     paymentMethod: data.paymentMethod,
     paymentStatus: data.paymentStatus,

     status: data.purpose === "trial" ? "trial" : "member",
     ...(cameFromEnquiry
      ? {
         enquiryStatus: data.purpose === "trial" ? "trial_booked" : "converted"
        }
      : {}),

     createdAt: serverTimestamp(),
     updatedAt: serverTimestamp(),
     expiryDate

    },
    { merge:true }
   )

   data.reset()
   navigate("/")

  }
  catch(error){

   console.error("Error saving user:",error)

  }
  finally{

   setLoading(false)

  }

 }

 return(

  <Container>

   <div
    style={{
     textAlign:"center",
     maxWidth:"500px",
     margin:"auto"
    }}
   >

    <h2
     style={{
      fontSize: typography.subtitle.fontSize,
      marginBottom: spacing.lg
     }}
    >
     {data.purpose === "enquiry"
      ? "Thanks for Enquiring"
      : data.purpose === "trial"
       ? "Free Trial Confirmed"
       : data.paymentMethod === "cash"
        ? "Cash Payment Confirmed"
        : "UPI Payment Confirmed"}
    </h2>

    <p style={{marginBottom:spacing.lg}}>
     {data.purpose === "enquiry"
      ? "Thank you for your enquiry. Our team will get in touch with you soon."
      : data.purpose === "trial"
       ? "Your free trial has been booked successfully."
       : `Your membership has been successfully activated through ${paymentMethodLabel}.`}
    </p>

    <PrimaryButton
     title={loading ? "Saving..." : "Finish"}
     onClick={handleFinish}
     disabled={loading}
    />

   </div>

  </Container>

 )
}
