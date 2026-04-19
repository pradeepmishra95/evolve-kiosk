"use client"

import { usePathname, useRouter } from "next/navigation"
import { getPreviousRoutePath } from "../../navigation/routeHistory"
import { useUserStore } from "../../store/userStore"
import { colors } from "../../styles/GlobalStyles"

function getBackRoute(pathname: string, purpose: string, status: string): string | null {
 switch (pathname) {
  case "/phone":
   return "/"
  case "/return-user":
   return "/phone"
  case "/user-details":
   return "/phone"
  case "/profile-photo":
   return "/user-details"
  case "/program":
   return "/profile-photo"
  case "/plan":
   // enquiry user who selected enroll comes here from /review
   return status === "enquiry" || purpose === "enquiry" ? "/review" : "/program"
  case "/review":
   return "/plan"
  case "/payment":
   return "/review"
  case "/payment/cash":
  case "/payment/upi":
   return "/payment"
  case "/consent":
   return "/payment"
  default:
   return null
 }
}

interface Props {
 label?: string
}

export default function BackButton({ label = "← Back" }: Props) {
 const router = useRouter()
 const pathname = usePathname()
 const purpose = useUserStore((state) => state.purpose)
 const status = useUserStore((state) => state.status)
 const reset = useUserStore((state) => state.reset)

 const backRoute = getBackRoute(pathname, purpose, status)

 if (!backRoute) {
  return null
 }

 const handleBack = () => {
  if (pathname === "/phone") {
   reset()
  }

  const previousRoutePath = getPreviousRoutePath(pathname)

  if (previousRoutePath) {
   router.back()
   return
  }

  router.replace(backRoute)
 }

 return (
  <button
   type="button"
   onClick={handleBack}
   aria-label={label}
   style={{
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: "999px",
    border: `1px solid ${colors.borderStrong}`,
    background: "rgba(255,255,255,0.04)",
    color: colors.primaryLight,
    cursor: "pointer",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontSize: "12px",
    fontWeight: 800,
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)"
   }}
  >
   {label}
  </button>
 )
}
