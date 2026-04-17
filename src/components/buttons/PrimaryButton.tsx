import { colors, radius } from "../../styles/GlobalStyles"

interface Props {
 title: string
 onClick: () => void | Promise<void>
 disabled?: boolean
 fullWidth?: boolean
}

export default function PrimaryButton({ title, onClick, disabled, fullWidth = false }: Props) {

 return (

  <button
   onClick={onClick}
   disabled={disabled}
   style={{
    padding: "clamp(12px, 1.6vh, 16px) clamp(22px, 3vw, 34px)",
    fontSize: "clamp(15px, 1.9vw, 17px)",
    background: disabled
     ? "rgba(200,169,108,0.28)"
     : "linear-gradient(135deg, rgba(200,169,108,0.98), rgba(195,160,93,0.96))",
    color: colors.textOnAccent,
    border: "none",
    borderRadius: radius.md,
    cursor: disabled ? "not-allowed" : "pointer",
    marginTop: "16px",
    transition: "0.15s",
    minHeight: "46px",
    lineHeight: 1.1,
    width: fullWidth ? "100%" : "auto",
    boxShadow: disabled ? "none" : "0 18px 40px rgba(200,169,108,0.22)",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase"
   }}
   onMouseDown={(e)=>{
    e.currentTarget.style.transform="scale(0.96)"
   }}
   onMouseUp={(e)=>{
    e.currentTarget.style.transform="scale(1)"
   }}
  >

   {title}

  </button>

 )

}
