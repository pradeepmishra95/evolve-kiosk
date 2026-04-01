import type { ReactNode } from "react"

export default function Grid({ children }: { children: ReactNode }) {

 return(

  <div
   style={{
    display:"grid",
    gridTemplateColumns:"repeat(auto-fit,minmax(min(100%, 220px),1fr))",
    gap:"clamp(16px, 2vw, 24px)",
    marginTop:"clamp(20px, 3vw, 30px)"
   }}
  >

   {children}

  </div>

 )

}
