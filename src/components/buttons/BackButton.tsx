"use client"

import { usePathname, useRouter } from "next/navigation"
import { getPreviousRoutePath } from "../../navigation/routeHistory"
import { getPreviousRoute } from "../../flow/getPreviousRoute"
import { useUserStore } from "../../store/userStore"
import type { KioskRoute } from "../../flow/routes"
import { colors } from "../../styles/GlobalStyles"

interface Props {
 label?: string
}

export default function BackButton({ label = "Back" }: Props) {
 const router = useRouter()
 const pathname = usePathname()
 const state = useUserStore()
 const { reset } = state

 const backRoute = getPreviousRoute(pathname as KioskRoute, state)

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
