import { useState } from "react"
import MembersTable from "./MembersTable"
import EnquiriesTable from "./EnquiriesTable"
import PaymentsTable from "./PaymentsTable"
import type { CSSProperties } from "react"
import type { EnquiryRecord, MemberRecord, PaymentRecord } from "../../types/domain"
import { colors, radius, shadow, spacing, typography } from "../../styles/GlobalStyles"
import { useDevice } from "../../hooks/useDevice"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import TextInput from "../../components/inputs/TextInput"

export default function AdminDashboard() {
 const { isCompactHeight, isMobile } = useDevice()

 const [members,setMembers] = useState<MemberRecord[]>([])
 const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([])
 const [payments, setPayments] = useState<PaymentRecord[]>([])
 const [pin, setPin] = useState("")
 const [pinError, setPinError] = useState("")
 const [isUnlocked, setIsUnlocked] = useState(() => {
  if (typeof window === "undefined") {
   return false
  }

  return window.sessionStorage.getItem("adminUnlocked") === "1"
 })

 const adminPin = (process.env.NEXT_PUBLIC_ADMIN_PIN || "2580").trim()

 const totalClients = members.length
 const totalEnquiries = enquiries.length
 const adultClients = members.filter(m=>m.age >= 15).length
 const kidsClients = members.filter(m=>m.age < 15).length
 const totalRevenue = members.reduce((sum,m)=> sum + m.price ,0)
 const pendingPayments = payments.filter(
  (payment) => payment.paymentStatus === "cash_pending" || payment.paymentStatus === "upi_pending"
 )
 const pendingAmount = pendingPayments.reduce((sum, payment) => sum + payment.amount, 0)

 const batchStats = members.reduce<Record<string, number>>((acc, member) => {
  acc[member.batch] = (acc[member.batch] || 0) + 1
  return acc
 },{})

 const programStats = members.reduce<Record<string, number>>((acc, member) => {
  acc[member.program] = (acc[member.program] || 0) + 1
  return acc
 },{})

 const planStats = members.reduce<Record<string, number>>((acc, member) => {
  acc[member.duration] = (acc[member.duration] || 0) + 1
  return acc
 },{})

 const handleUnlock = () => {
  if (pin.trim() !== adminPin) {
   setPinError("Invalid admin PIN.")
   return
  }

  window.sessionStorage.setItem("adminUnlocked", "1")
  setIsUnlocked(true)
  setPin("")
  setPinError("")
 }

 const handleLock = () => {
  window.sessionStorage.removeItem("adminUnlocked")
  setIsUnlocked(false)
  setPin("")
  setPinError("")
 }

 if (!isUnlocked) {
  return (
   <div style={styles.page(isMobile)}>
    <div style={styles.lockCard}>
     <p style={styles.eyebrow}>Protected Area</p>
     <h1 style={styles.title(isMobile)}>Admin Access</h1>
     <p style={styles.lockBody}>
      Enter the admin PIN to view members, enquiries, and revenue details.
     </p>

     <TextInput
      label="Admin PIN"
      type="password"
      inputMode="numeric"
      value={pin}
      placeholder="Enter admin PIN"
      onChange={(value) => {
       setPin(value)
       setPinError("")
      }}
      error={pinError}
     />

     <PrimaryButton
      title="Unlock Admin"
      onClick={handleUnlock}
     />
    </div>
   </div>
  )
 }

 return (

  <div style={styles.page(isMobile)}>

   <div style={styles.header(isCompactHeight)}>
    <p style={styles.eyebrow}>Operations</p>
    <div style={styles.headerRow(isMobile)}>
     <h1 style={styles.title(isMobile)}>Members Dashboard</h1>

     <button
      type="button"
      onClick={handleLock}
      style={styles.lockButton}
     >
      Lock Admin
     </button>
    </div>
   </div>

   <div style={styles.statsRow}>

    <div style={styles.statCard}>
     <p style={styles.statLabel}>Total Clients</p>
     <h2 style={styles.statValue}>{totalClients}</h2>
    </div>

    <div style={styles.statCard}>
     <p style={styles.statLabel}>Adults</p>
     <h2 style={styles.statValue}>{adultClients}</h2>
    </div>

    <div style={styles.statCard}>
     <p style={styles.statLabel}>Kids</p>
     <h2 style={styles.statValue}>{kidsClients}</h2>
    </div>

    <div style={styles.statCard}>
     <p style={styles.statLabel}>Total Revenue</p>
     <h2 style={styles.statValue}>₹{totalRevenue}</h2>
    </div>

   <div style={styles.statCard}>
     <p style={styles.statLabel}>Enquiries</p>
     <h2 style={styles.statValue}>{totalEnquiries}</h2>
    </div>

    <div style={styles.statCard}>
     <p style={styles.statLabel}>Pending Payments</p>
     <h2 style={styles.statValue}>{pendingPayments.length}</h2>
    </div>

    <div style={styles.statCard}>
     <p style={styles.statLabel}>Pending Amount</p>
     <h2 style={styles.statValue}>₹{pendingAmount}</h2>
    </div>

   </div>

   <div style={styles.statsRow}>

    <div style={styles.statCard}>
     <b style={styles.panelTitle}>Batch Wise</b>
     {Object.entries(batchStats).map(([key,val])=>(
      <p key={key}>{key} : {String(val)}</p>
     ))}
    </div>

    <div style={styles.statCard}>
     <b style={styles.panelTitle}>Program Wise</b>
     {Object.entries(programStats).map(([key,val])=>(
      <p key={key}>{key} : {String(val)}</p>
     ))}
    </div>

    <div style={styles.statCard}>
     <b style={styles.panelTitle}>Plan Wise</b>
     {Object.entries(planStats).map(([key,val])=>(
      <p key={key}>{key} : {String(val)}</p>
     ))}
    </div>

   </div>

   <div style={styles.card}>
    <MembersTable onDataLoaded={setMembers}/>
   </div>

   <div style={styles.card}>
    <div style={styles.sectionHeader}>
     <p style={styles.eyebrow}>Collections</p>
     <h2 style={styles.sectionTitle}>Payments</h2>
    </div>
    <PaymentsTable onDataLoaded={setPayments} />
   </div>

   <div style={styles.card}>
    <div style={styles.sectionHeader}>
     <p style={styles.eyebrow}>Leads</p>
     <h2 style={styles.sectionTitle}>Enquiries</h2>
    </div>
    <EnquiriesTable onDataLoaded={setEnquiries} />
   </div>

  </div>

 )
}

const styles: {
 page: (isMobile: boolean) => CSSProperties
 header: (isCompactHeight: boolean) => CSSProperties
 headerRow: (isMobile: boolean) => CSSProperties
 eyebrow: CSSProperties
 title: (isMobile: boolean) => CSSProperties
 statsRow: CSSProperties
 statCard: CSSProperties
 card: CSSProperties
 statLabel: CSSProperties
 statValue: CSSProperties
 panelTitle: CSSProperties
 sectionHeader: CSSProperties
 sectionTitle: CSSProperties
 lockCard: CSSProperties
 lockBody: CSSProperties
 lockButton: CSSProperties
} = {

 page:(isMobile)=>({
 padding:isMobile ? 18 : 40,
  background:
   "radial-gradient(circle at top left, rgba(106,166,154,0.16), transparent 28%), linear-gradient(145deg, #040b10, #071117)",
  minHeight:"var(--app-height, 100vh)",
  height:"auto",
  color:colors.textPrimary,
  display:"flex",
  flexDirection:"column",
  overflowY:"visible",
  overflowX:"hidden",
  boxSizing:"border-box"
 }),

 header:(isCompactHeight)=>({
  marginBottom:isCompactHeight ? 18 : 36,
  flexShrink:0
 }),

 headerRow:(isMobile)=>({
  display:"flex",
  alignItems:isMobile ? "flex-start" : "center",
  justifyContent:"space-between",
  gap:16,
  flexDirection:isMobile ? "column" : "row"
 }),

 eyebrow:{
  color:colors.secondary,
  textTransform:"uppercase",
  letterSpacing:"0.26em",
  fontSize:"13px",
  marginBottom:"12px",
  fontWeight:700
 },

 title:(isMobile)=>({
  ...typography.title,
  fontSize:isMobile ? "40px" : "64px",
  lineHeight:isMobile ? 1 : 0.95
 }),

 statsRow:{
  display:"flex",
  gap:20,
  marginBottom:24,
  flexWrap:"wrap",
  flexShrink:0
 },

 statCard:{
  background:"linear-gradient(160deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
  padding:"22px",
  borderRadius:radius.lg,
  boxShadow:shadow.card,
  border:`1px solid ${colors.border}`,
  minWidth:"220px",
  flex:"1 1 220px"
 },

 card:{
  background:"linear-gradient(160deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
  borderRadius:radius.lg,
  padding:spacing.lg,
  boxShadow:shadow.card,
  border:`1px solid ${colors.border}`,
  flex:1,
  minHeight:"fit-content",
  overflow:"visible",
  display:"flex",
  flexDirection:"column",
  gap:spacing.md
 },

 statLabel:{
  color:colors.textSecondary,
  textTransform:"uppercase",
  letterSpacing:"0.16em",
  fontSize:"12px",
  marginBottom:"12px",
  fontWeight:700
 },

 statValue:{
  ...typography.subtitle,
  fontSize:"44px",
  color:colors.primaryLight
 },

 panelTitle:{
  display:"inline-block",
  marginBottom:"14px",
  color:colors.primaryLight,
  letterSpacing:"0.08em"
 },

 sectionHeader:{
  display:"flex",
  justifyContent:"space-between",
  alignItems:"baseline",
  gap:12,
  flexWrap:"wrap"
 },

 sectionTitle:{
  ...typography.subtitle,
  fontSize:"36px"
 },

 lockCard:{
  width:"100%",
  maxWidth:"520px",
  margin:"auto",
  padding:spacing.xl,
  borderRadius:radius.xl,
  border:`1px solid ${colors.border}`,
  background:"linear-gradient(160deg, rgba(255,255,255,0.035), rgba(255,255,255,0.01))",
  boxShadow:shadow.card
 },

 lockBody:{
  color:colors.textSecondary,
  margin:"12px 0 24px"
 },

 lockButton:{
  alignSelf:"flex-start",
  minWidth:"160px",
  borderRadius:"999px",
  border:`1px solid ${colors.borderStrong}`,
  background:"transparent",
  color:colors.primaryLight,
  padding:"12px 18px",
  cursor:"pointer",
  letterSpacing:"0.12em",
  textTransform:"uppercase",
  fontSize:"12px",
  fontWeight:700
 }

}
