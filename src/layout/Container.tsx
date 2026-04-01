import type { ReactNode } from "react"
import logo from "../assets/image/logo.png"
import { useDevice } from "../hooks/useDevice"
import { colors, radius, shadow } from "../styles/GlobalStyles"

export default function Container({ children }: { children: ReactNode }) {
 const { isCompactHeight, isMobile, isShortHeight } = useDevice()

 return(

  <div
   style={{
    minHeight:"var(--app-height, 100vh)",
    height:"var(--app-height, 100vh)",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    justifyContent:"center",
    padding:
     isCompactHeight
      ? "10px 10px"
      : isShortHeight
       ? "14px 12px"
       : "clamp(18px, 4vw, 32px) clamp(14px, 3vw, 20px)",
    background: colors.background,
    color: colors.textPrimary,
    position:"relative",
    overflow:"hidden",
    boxSizing:"border-box"
   }}
  >

   <div
    style={{
     position:"absolute",
     inset:"auto auto 72% -8%",
     width:isCompactHeight ? "220px" : "320px",
     height:isCompactHeight ? "220px" : "320px",
     borderRadius:"50%",
     background:"radial-gradient(circle, rgba(106,166,154,0.18), transparent 70%)",
     filter:"blur(10px)"
    }}
   />

   <div
    style={{
     position:"absolute",
     inset:"8% -6% auto auto",
     width:isCompactHeight ? "240px" : "360px",
     height:isCompactHeight ? "240px" : "360px",
     borderRadius:"50%",
     background:"radial-gradient(circle, rgba(243,224,182,0.12), transparent 72%)",
     filter:"blur(12px)"
    }}
   />

   <div
    style={{
     width:"100%",
     maxWidth:"720px",
     height:"100%",
     maxHeight:"100%",
     padding:isCompactHeight ? "14px" : "clamp(16px, 3vw, 28px)",
     borderRadius:isMobile ? radius.lg : radius.xl,
     border:`1px solid ${colors.border}`,
     background:"linear-gradient(160deg, rgba(17,28,35,0.92), rgba(8,15,20,0.9))",
     boxShadow:shadow.modal,
     backdropFilter:"blur(24px)",
     position:"relative",
     display:"flex",
     flexDirection:"column",
     overflow:"hidden",
     boxSizing:"border-box"
    }}
   >

    <div
     style={{
      display:"flex",
      justifyContent:"center",
      marginBottom:isCompactHeight ? "10px" : "clamp(18px, 3vw, 28px)",
      flexShrink:0
     }}
    >
     <img
      src={logo.src}
      alt="logo"
      style={{
       width:
        isCompactHeight
         ? "96px"
         : isShortHeight
          ? "112px"
          : "clamp(130px, 18vw, 210px)",
       filter:"drop-shadow(0 16px 30px rgba(0,0,0,0.28))"
      }}
     />
    </div>

    <div
     style={{
      width:"100%",
      maxWidth:"600px",
      margin:"0 auto",
      flex:1,
      minHeight:0,
      overflowY:"auto",
      overflowX:"hidden",
      paddingRight:"4px",
      boxSizing:"border-box"
     }}
    >
     {children}
    </div>
   </div>

  </div>

 )

}
