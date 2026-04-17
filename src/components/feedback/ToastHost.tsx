"use client"

import { useEffect } from "react"
import { colors, radius, shadow } from "../../styles/GlobalStyles"
import { useToastStore } from "../../store/toastStore"

const accentByVariant = {
 success: "#6AA69A",
 error: "#D97C6C",
 info: colors.primaryLight
} as const

export default function ToastHost() {
 const { isVisible, message, variant, durationMs, hideToast } = useToastStore()

 useEffect(() => {
  if (!isVisible) {
   return
  }

  const timeoutId = window.setTimeout(() => {
   hideToast()
  }, durationMs)

  return () => {
   window.clearTimeout(timeoutId)
  }
 }, [durationMs, hideToast, isVisible])

 if (!isVisible || !message) {
  return null
 }

 return (
  <div style={styles.viewport}>
   <div
    style={{
     ...styles.toast,
     borderColor: accentByVariant[variant],
     boxShadow: `0 22px 44px rgba(0,0,0,0.22), 0 0 0 1px ${accentByVariant[variant]}26`
    }}
   >
    <span
     style={{
      ...styles.dot,
      background: accentByVariant[variant]
     }}
    />
    <p style={styles.message}>{message}</p>
   </div>
  </div>
 )
}

const styles = {
 viewport: {
  position: "fixed" as const,
  top: "18px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 9999,
  width: "min(calc(100vw - 24px), 460px)",
  pointerEvents: "none" as const
 },
 toast: {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "14px 16px",
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(7,17,23,0.94)",
  color: colors.textPrimary,
  backdropFilter: "blur(14px)",
  boxShadow: shadow.card
 },
 dot: {
  width: "10px",
  height: "10px",
  borderRadius: "999px",
  flexShrink: 0
 },
 message: {
  margin: 0,
  fontSize: "14px",
  fontWeight: 700,
  lineHeight: 1.45
 }
}
