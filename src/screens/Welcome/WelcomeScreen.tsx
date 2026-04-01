import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import { colors, typography } from "../../styles/GlobalStyles"

export default function WelcomeScreen(){

 const navigate = useNavigate()

 return(

  <Container>

   <div
    style={{
     width:"min(100%, 560px)",
     padding:"clamp(4px, 0.8vh, 10px) clamp(4px, 1vw, 10px) clamp(10px, 1.6vh, 18px)",
     textAlign:"center"
    }}
   >

    <p
     style={{
      color: colors.secondary,
      fontSize: "clamp(12px, 1.5vw, 13px)",
      letterSpacing: "0.28em",
      textTransform: "uppercase",
      marginBottom: "clamp(14px, 2vh, 18px)",
      fontWeight: 700
     }}
    >
     Evolve Performance Kiosk
    </p>

    <h1
     style={{
      ...typography.title,
      fontSize:"clamp(36px, 6.2vw, 64px)",
      color: colors.textPrimary,
      lineHeight:"0.94",
      marginBottom:"12px"
     }}
    >
     Sculpt Strength.
     <br />
     Train With Intent.
    </h1>

    <p
     style={{
      color: colors.textSecondary,
      fontSize:"clamp(14px, 1.7vw, 17px)",
      maxWidth: "460px",
      margin: "0 auto clamp(20px, 3vh, 28px)"
     }}
    >
     A guided premium sign-up flow for trials, memberships, and enquiries in under a minute.
    </p>

    <button
     onClick={() => navigate("/phone")}
     style={{
      width:"100%",
      padding:"clamp(14px, 2vh, 18px)",
      borderRadius:"999px",
      border:"none",
      fontSize:"clamp(14px, 1.8vw, 15px)",
      fontWeight:800,
      letterSpacing:"0.22em",
      textTransform:"uppercase",
      background:"linear-gradient(135deg, #c8a96c 0%, #f3e0b6 45%, #d7b57a 100%)",
      color:colors.textOnAccent,
      cursor:"pointer",
      boxShadow:"0 20px 44px rgba(200,169,108,0.26)"
     }}
     className="touch-feedback"
    >
     Begin Your Journey
    </button>

    <div
     style={{
      display: "flex",
      justifyContent: "center",
      gap: "clamp(12px, 2vw, 18px)",
      flexWrap: "wrap",
      marginTop:"clamp(14px, 2vh, 18px)",
      color:colors.textMuted,
      fontSize:"clamp(12px, 1.5vw, 13px)",
      letterSpacing: "0.08em",
      textTransform: "uppercase"
     }}
    >
     <span>30 second flow</span>
     <span>Trial and membership</span>
     <span>Premium onboarding</span>
    </div>

   </div>

  </Container>

 )
}
