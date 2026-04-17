"use client"

import { useNavigate } from "@/navigation/useAppNavigation"
import { colors } from "../../styles/GlobalStyles"

interface Props {
 label?: string
 fallbackHref?: string
 className?: string
}

export default function BackButton({
 label = "Back",
 fallbackHref = "/",
 className
}: Props) {
 const navigate = useNavigate()

 const handleBack = () => {
  if (typeof window !== "undefined" && window.history.length > 1) {
   navigate(-1)
   return
  }

  navigate(fallbackHref, { replace: true })
 }

 return (
  <button
   type="button"
   onClick={handleBack}
   aria-label={label}
   className={className}
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
   <span>{label}</span>
  </button>
 )
}
