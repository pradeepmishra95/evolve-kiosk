import { useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import OptionCard from "../../components/cards/OptionCard"
import { useUserStore } from "../../store/userStore"
import { colors, typography, spacing } from "../../styles/GlobalStyles"

export default function PaymentScreen(){

 const navigate = useNavigate()
 const data = useUserStore()
 const [activeMethod, setActiveMethod] = useState<"upi" | "cash" | "">("")
 const [paymentError, setPaymentError] = useState("")

 const selectPayment = (method: "upi" | "cash") => {
  if (activeMethod) {
   return
  }

  setActiveMethod(method)
  setPaymentError("")

  const paymentStatus = method === "upi" ? "upi_pending" : "cash_pending"

  data.setData({
   paymentReference: "",
   paymentMethod: method,
   paymentStatus
  })

  navigate(method === "upi" ? "/payment/upi" : "/payment/cash")
  setActiveMethod("")
 }

 return(

  <Container>

   <h2
    style={{
     textAlign:"center",
     fontSize:typography.subtitle.fontSize,
     marginBottom:spacing.lg
    }}
   >
    Payment Method
   </h2>

   <p
    style={{
     textAlign: "center",
     color: colors.textSecondary,
     marginBottom: spacing.lg
    }}
   >
    Select how you want to receive payment confirmation before completing the enrollment.
   </p>

   {paymentError && (
    <p
     style={{
      textAlign: "center",
      color: "#F1A596",
      marginBottom: spacing.lg
     }}
    >
     {paymentError}
    </p>
   )}

   <Grid>

    <OptionCard
     title="UPI"
     subtitle={activeMethod === "upi" ? "Preparing UPI payment..." : "Scan the QR and confirm the payment on the next screen."}
     onClick={() => selectPayment("upi")}
    />

    <OptionCard
     title="Cash"
     subtitle={activeMethod === "cash" ? "Preparing cash confirmation..." : "Collect cash at the counter and confirm manually."}
     onClick={() => selectPayment("cash")}
    />

   </Grid>

  </Container>

 )

}
