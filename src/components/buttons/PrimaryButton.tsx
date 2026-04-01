import { colors, radius } from "../../styles/GlobalStyles"

interface Props {
 title: string
 onClick: () => void | Promise<void>
 disabled?: boolean
}

export default function PrimaryButton({ title, onClick, disabled }: Props) {

 return (

  <button
   onClick={onClick}
   disabled={disabled}
   style={{
    padding: "16px 40px",
    fontSize: "18px",
    background: disabled ? "#cbd5e1" : colors.primary,
    color: "#fff",
    border: "none",
    borderRadius: radius.md,
    cursor: disabled ? "not-allowed" : "pointer",
    marginTop: "30px",
    transition: "0.15s",
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
