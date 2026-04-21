"use client"

import { useUserStore } from "../../store/userStore"
import { colors } from "../../styles/GlobalStyles"

export default function CancelButton() {
 const reset = useUserStore((state) => state.reset)

 const handleCancel = () => {
  reset()
  window.location.replace("/")
 }

 return (
  <button
   type="button"
   onClick={handleCancel}
   aria-label="Cancel and return to welcome screen"
   style={{
    display: "inline-flex",
    alignItems: "center",
    padding: "10px 14px",
    borderRadius: "999px",
    border: `1px solid ${colors.borderStrong}`,
    background: "rgba(255,255,255,0.04)",
    color: colors.textMuted,
    cursor: "pointer",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    fontSize: "12px",
    fontWeight: 800,
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 24px rgba(0,0,0,0.18)"
   }}
  >
    Cancel
  </button>
 )
}
