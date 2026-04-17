"use client"

import type { ReactNode } from "react"
import { useLayoutEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import logo from "../assets/image/logo.png"
import { colors, shadow } from "../styles/GlobalStyles"
import BackButton from "../components/buttons/BackButton"
import FlowProgress, { getFlowProgress } from "../components/feedback/FlowProgress"
import { useUserStore } from "../store/userStore"

export default function Container({
 children,
 scrollable = false,
 centerContent = false,
 showBackButton = true
}: {
 children: ReactNode
 scrollable?: boolean
 centerContent?: boolean
 showBackButton?: boolean
}) {
 const pathname = usePathname()
 const purpose = useUserStore((state) => state.purpose)
 const status = useUserStore((state) => state.status)
 const injury = useUserStore((state) => state.injury)
 const program = useUserStore((state) => state.program)
 const exerciseType = useUserStore((state) => state.exerciseType)
 const age = useUserStore((state) => state.age)
 const flowState = { purpose, status, injury, program, exerciseType, age }
 const flowProgress = getFlowProgress(pathname, flowState)
 const shouldShowBackButton = showBackButton && pathname !== "/"
 const viewportRef = useRef<HTMLDivElement | null>(null)
 const contentRef = useRef<HTMLDivElement | null>(null)
 const [fitScale, setFitScale] = useState(1)
 const [topOffset, setTopOffset] = useState(0)

 useLayoutEffect(() => {
  const viewport = viewportRef.current
  const content = contentRef.current

  if (!viewport || !content) {
   return
  }

  if (scrollable || centerContent) {
   return
  }

  let frameId = 0

  const updateFit = () => {
   frameId = 0

   if (!viewportRef.current || !contentRef.current) {
    return
   }

   const viewportWidth = viewportRef.current.clientWidth
   const viewportHeight = viewportRef.current.clientHeight
   const contentWidth = contentRef.current.scrollWidth
   const contentHeight = contentRef.current.scrollHeight

   if (!viewportWidth || !viewportHeight || !contentWidth || !contentHeight) {
    return
   }

   const nextScale = Math.min(1, viewportWidth / contentWidth, viewportHeight / contentHeight)
   const resolvedScale = Number.isFinite(nextScale) && nextScale > 0 ? nextScale : 1
   const scaledHeight = contentHeight * resolvedScale
   const nextTopOffset = Math.max(0, (viewportHeight - scaledHeight) / 2)

   setFitScale((current) => (Math.abs(current - resolvedScale) < 0.001 ? current : resolvedScale))
   setTopOffset((current) => (Math.abs(current - nextTopOffset) < 1 ? current : nextTopOffset))
  }

  const scheduleUpdate = () => {
   if (frameId) {
    cancelAnimationFrame(frameId)
   }

   frameId = window.requestAnimationFrame(updateFit)
  }

  scheduleUpdate()

  const observer = new ResizeObserver(() => {
   scheduleUpdate()
  })

  observer.observe(viewport)
  observer.observe(content)
  window.addEventListener("resize", scheduleUpdate)
  window.addEventListener("orientationchange", scheduleUpdate)
  window.visualViewport?.addEventListener("resize", scheduleUpdate)

  return () => {
   if (frameId) {
    cancelAnimationFrame(frameId)
   }

   observer.disconnect()
   window.removeEventListener("resize", scheduleUpdate)
   window.removeEventListener("orientationchange", scheduleUpdate)
   window.visualViewport?.removeEventListener("resize", scheduleUpdate)
  }
 }, [pathname, children, scrollable, centerContent])

 return(

  <div
   style={{
    minHeight:"var(--app-height, 100vh)",
    height:"var(--app-height, 100vh)",
    display:"flex",
    flexDirection:"column",
    alignItems:"center",
    justifyContent:"center",
    padding:"clamp(6px, 1.6vh, 18px) clamp(8px, 2vw, 16px)",
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
     maxWidth:"860px",
     height:"100%",
     maxHeight:"100%",
     padding:"clamp(12px, 2.2vh, 22px)",
     borderRadius:"clamp(22px, 4vw, 34px)",
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
      marginBottom:"clamp(6px, 1.8vh, 16px)",
      flexShrink:0
     }}
    >
     <img
      src={logo.src}
      alt="logo"
      style={{
       width:"clamp(78px, 14vw, 160px)",
       filter:"drop-shadow(0 16px 30px rgba(0,0,0,0.28))"
      }}
     />
    </div>

    {flowProgress && (
     <FlowProgress progress={flowProgress} />
    )}

    <div
     ref={viewportRef}
     style={{
     width:"100%",
     maxWidth:"720px",
     margin:"0 auto",
     flex:1,
     minHeight:0,
      overflowY: scrollable || centerContent ? "auto" : "hidden",
      overflowX:"hidden",
      overscrollBehavior:"contain",
      WebkitOverflowScrolling:"touch",
      scrollbarGutter: scrollable || centerContent ? "stable" : "auto",
      paddingRight: scrollable || centerContent ? "4px" : 0,
      paddingBottom: scrollable || centerContent ? "8px" : 0,
      position:"relative",
      boxSizing:"border-box"
     }}
    >
     {scrollable ? (
      <div
       style={{
        width:"100%",
        maxWidth:"720px",
        margin:"0 auto",
        boxSizing:"border-box"
       }}
      >
       {children}
      </div>
     ) : centerContent ? (
      <div
       style={{
        width: "100%",
        maxWidth: "720px",
        minHeight: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center"
       }}
      >
       {children}
      </div>
     ) : (
      <div
       ref={contentRef}
       style={{
        width:"100%",
        maxWidth:"720px",
        position:"absolute",
        top: topOffset,
        left:"50%",
        transform:`translateX(-50%) scale(${fitScale})`,
        transformOrigin:"top center",
        boxSizing:"border-box"
       }}
      >
       {children}
      </div>
     )}
   </div>

    {shouldShowBackButton && (
     <div
      style={{
       display: "flex",
       justifyContent: "flex-start",
       alignSelf: "stretch",
       paddingTop: "clamp(10px, 1.8vh, 16px)",
       flexShrink: 0
      }}
     >
      <BackButton />
     </div>
    )}
  </div>

  </div>

 )

}
