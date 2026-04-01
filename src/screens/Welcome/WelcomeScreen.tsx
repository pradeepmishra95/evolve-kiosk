import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import { useDevice } from "../../hooks/useDevice"
import { colors, typography } from "../../styles/GlobalStyles"

export default function WelcomeScreen(){

 const navigate = useNavigate()
 const { isCompactHeight, isMobile, isTablet } = useDevice()

 const cardWidth = isMobile ? "90%" : isTablet ? "500px" : "600px"

 return(

  <Container>

   <div
    style={{
     width:cardWidth,
     padding:isCompactHeight ? "2px 2px 10px" : isMobile ? "8px 4px 16px" : "12px 10px 20px",
     textAlign:"center"
    }}
   >

    <p
     style={{
      color: colors.secondary,
      fontSize: isMobile ? "12px" : "13px",
      letterSpacing: "0.28em",
      textTransform: "uppercase",
      marginBottom: "18px",
      fontWeight: 700
     }}
    >
     Evolve Performance Kiosk
    </p>

    <h1
     style={{
      ...typography.title,
      fontSize:isCompactHeight ? "42px" : isMobile ? "52px" : "74px",
      color: colors.textPrimary,
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
      fontSize:isCompactHeight ? "14px" : isMobile ? "15px" : "18px",
      maxWidth: "460px",
      margin: isCompactHeight ? "0 auto 22px" : "0 auto 34px"
     }}
    >
     A guided premium sign-up flow for trials, memberships, and enquiries in under a minute.
    </p>

    <button
     onClick={() => navigate("/phone")}
     style={{
      width:"100%",
      padding:isCompactHeight ? "14px" : isMobile ? "16px" : "20px",
      borderRadius:"999px",
      border:"none",
      fontSize:isMobile ? "14px" : "15px",
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
      gap: isMobile ? "12px" : "18px",
      flexWrap: "wrap",
      marginTop:isCompactHeight ? "14px" : "18px",
      color:colors.textMuted,
      fontSize:isMobile ? "12px" : "13px",
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
