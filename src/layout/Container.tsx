import type { ReactNode } from "react"
import logo from "../assets/image/logo.png"
import { colors, shadow } from "../styles/GlobalStyles"

export default function Container({ children }: { children: ReactNode }) {
 return(

  <div
   style={{
    minHeight:"var(--app-height, 100vh)",
    height:"var(--app-height, 100vh)",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    justifyContent:"center",
    padding:"clamp(10px, 2.8vh, 32px) clamp(10px, 3vw, 20px)",
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
     width:"clamp(220px, 22vw, 320px)",
     height:"clamp(220px, 22vw, 320px)",
     borderRadius:"50%",
     background:"radial-gradient(circle, rgba(106,166,154,0.18), transparent 70%)",
     filter:"blur(10px)"
    }}
   />

   <div
   style={{
     position:"absolute",
     inset:"8% -6% auto auto",
     width:"clamp(240px, 24vw, 360px)",
     height:"clamp(240px, 24vw, 360px)",
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
     padding:"clamp(14px, 3vw, 28px)",
     borderRadius:"clamp(28px, 5vw, 40px)",
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
      marginBottom:"clamp(10px, 3vh, 28px)",
      flexShrink:0
     }}
    >
     <img
      src={logo.src}
      alt="logo"
      style={{
       width:"clamp(96px, 18vw, 210px)",
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
