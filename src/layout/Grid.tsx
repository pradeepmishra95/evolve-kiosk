import type { ReactNode } from "react"
import type { CSSProperties } from "react"

export default function Grid({
 children,
 style
}: {
 children: ReactNode
 style?: CSSProperties
}) {

 return(

  <div
   style={{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit,minmax(min(100%, 180px),1fr))",
    gap:"clamp(10px, 1.6vw, 18px)",
    marginTop:"clamp(12px, 2vh, 22px)",
    ...style
   }}
  >

   {children}

  </div>

 )

}
