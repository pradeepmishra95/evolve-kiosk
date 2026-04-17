import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import { useUserStore } from "../../store/userStore"
import { colors, spacing, typography } from "../../styles/GlobalStyles"

export default function WelcomeScreen(){

 const navigate = useNavigate()
 const reset = useUserStore((state) => state.reset)
 const hasDraftFlow = useUserStore((state) =>
  Boolean(
   state.purpose ||
    state.name ||
    state.phone ||
    state.exerciseType ||
    state.program ||
    state.batchType ||
    state.batchTime ||
    state.batchDate ||
    state.paymentStatus
 )
 )

 return(

  <Container>

   <div
    style={{
     width:"min(100%, 640px)",
     height:"100%",
     minHeight:"100%",
     margin:"0 auto",
     padding:"clamp(2px, 0.6vh, 8px) 0 clamp(12px, 2vh, 20px)",
     display:"grid",
     gridTemplateRows:"auto 1fr",
     gap:spacing.lg
    }}
   >

    <div
     style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      minHeight: 0,
      padding: "clamp(8px, 2vh, 18px) 0"
     }}
    >
     <div
      style={{
       width: "100%",
       maxWidth: "560px",
       margin: "0 auto",
       textAlign: "center",
       display: "flex",
       flexDirection: "column",
       alignItems: "center"
      }}
     >
      <h1
       style={{
        ...typography.title,
        fontSize:"clamp(36px, 6vw, 64px)",
        color: colors.textPrimary,
        lineHeight:"0.94",
        marginBottom:"14px",
        textAlign: "center"
       }}
      >
       Sculpt Strength.
       <br />
       Train With Intent.
      </h1>

      <div
       style={{
        display: "flex",
        gap: "12px",
        flexWrap: "wrap",
        justifyContent: "center"
       }}
      >
      <button
       onClick={() => {
        reset()
        navigate("/phone")
       }}
	       style={{
         width:"min(100%, 360px)",
         padding:"clamp(14px, 2vh, 18px)",
        borderRadius:"999px",
        border:"none",
        fontSize:"clamp(14px, 1.8vw, 15px)",
        fontWeight:800,
        letterSpacing:"0.22em",
        textTransform:"uppercase",
        textAlign: "center",
        background:"linear-gradient(135deg, #c8a96c 0%, #f3e0b6 45%, #d7b57a 100%)",
        color:colors.textOnAccent,
        cursor:"pointer",
         boxShadow:"0 20px 44px rgba(200,169,108,0.26)"
        }}
        className="touch-feedback"
       >
        Begin Your Journey
       </button>

       {hasDraftFlow && (
        <button
         type="button"
         onClick={() => {
          navigate("/review")
         }}
         style={{
          minWidth: "220px",
          padding: "14px 20px",
          borderRadius: "999px",
          border: `1px solid ${colors.borderStrong}`,
          background: "transparent",
          color: colors.primaryLight,
          cursor: "pointer",
          fontSize: "13px",
          fontWeight: 800,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          textAlign: "center"
         }}
        >
         Resume Current Flow
        </button>
       )}

      </div>

   </div>

  </div>

  </div>

  </Container>

 )
}
