import { useEffect, useState } from "react"
import { collection, getDocs, orderBy, query } from "firebase/firestore"
import { db } from "../../firebase/firebase"
import type { CSSProperties } from "react"
import type { PaymentRecord } from "../../types/domain"
import { colors, radius } from "../../styles/GlobalStyles"

export default function PaymentsTable({
 onDataLoaded
}: {
 onDataLoaded?: (data: PaymentRecord[]) => void
}) {
 const [payments, setPayments] = useState<PaymentRecord[]>([])
 const [loading, setLoading] = useState(true)

 useEffect(() => {
  const fetchPayments = async () => {
   try {
    const snapshot = await getDocs(query(collection(db, "payments"), orderBy("createdAt", "desc")))

    const list: PaymentRecord[] = snapshot.docs.map((paymentDoc) => {
     const data = paymentDoc.data()
     const createdAt = data.createdAt?.toDate?.()
     const confirmedAt = data.confirmedAt?.toDate?.()

     return {
      id: paymentDoc.id,
      name: String(data.name || ""),
      phone: String(data.phone || ""),
      program: String(data.program || ""),
      duration: String(data.duration || "") as PaymentRecord["duration"],
      amount: Number(data.amount || 0),
      batchType: String(data.batchType || ""),
      batchTime: String(data.batchTime || ""),
      paymentMethod: data.paymentMethod === "cash" || data.paymentMethod === "upi" ? data.paymentMethod : "",
      paymentStatus:
       data.paymentStatus === "free" ||
       data.paymentStatus === "cash_pending" ||
       data.paymentStatus === "upi_pending" ||
       data.paymentStatus === "paid" ||
       data.paymentStatus === "cancelled"
        ? data.paymentStatus
        : "",
      purpose: data.purpose === "trial" || data.purpose === "enroll" || data.purpose === "enquiry" ? data.purpose : "",
      createdAt: createdAt ? createdAt.toLocaleString() : "",
      confirmedAt: confirmedAt ? confirmedAt.toLocaleString() : ""
     }
    })

    setPayments(list)
    onDataLoaded?.(list)
   } catch (error) {
    console.error(error)
   } finally {
    setLoading(false)
   }
  }

  void fetchPayments()
 }, [onDataLoaded])

 if (loading) {
  return <p style={{ color: colors.textSecondary }}>Loading payments...</p>
 }

 return (
  <div style={styles.wrapper}>
   <table style={styles.table}>
    <thead style={styles.thead}>
     <tr>
      <th style={styles.th}>Name</th>
      <th style={styles.th}>Phone</th>
      <th style={styles.th}>Program</th>
      <th style={styles.th}>Amount</th>
      <th style={styles.th}>Method</th>
      <th style={styles.th}>Status</th>
      <th style={styles.th}>Created</th>
      <th style={styles.th}>Confirmed</th>
     </tr>
    </thead>
    <tbody>
     {payments.map((payment) => (
      <tr key={payment.id} style={styles.row}>
       <td style={styles.td}>{payment.name}</td>
       <td style={styles.td}>{payment.phone}</td>
       <td style={styles.td}>
        <div>{payment.program}</div>
        <div style={styles.metaText}>{payment.duration || "-"}</div>
       </td>
       <td style={styles.td}>₹{payment.amount}</td>
       <td style={styles.td}>{payment.paymentMethod ? payment.paymentMethod.toUpperCase() : "-"}</td>
       <td style={styles.td}>
        <span style={styles.statusBadge(payment.paymentStatus)}>
         {payment.paymentStatus ? payment.paymentStatus.replace("_", " ").toUpperCase() : "-"}
        </span>
       </td>
       <td style={styles.td}>{payment.createdAt || "-"}</td>
       <td style={styles.td}>{payment.confirmedAt || "-"}</td>
      </tr>
     ))}
    </tbody>
   </table>
  </div>
 )
}

const styles: {
 wrapper: CSSProperties
 table: CSSProperties
 thead: CSSProperties
 th: CSSProperties
 td: CSSProperties
 row: CSSProperties
 metaText: CSSProperties
 statusBadge: (status: PaymentRecord["paymentStatus"]) => CSSProperties
} = {
 wrapper: {
  width: "100%",
  overflowX: "auto",
  WebkitOverflowScrolling: "touch"
 },

 table: {
  width: "100%",
  minWidth: "960px",
  borderCollapse: "separate",
  borderSpacing: "0 10px"
 },

 thead: {
  color: colors.textSecondary
 },

 th: {
  textAlign: "left",
  padding: "0 12px 8px",
  fontSize: "12px",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  fontWeight: 700
 },

 td: {
  textAlign: "left",
  padding: "16px 12px",
  background: "rgba(255,255,255,0.03)",
  verticalAlign: "top"
 },

 row: {
  color: colors.textPrimary
 },

 metaText: {
  color: colors.textSecondary,
  fontSize: "13px",
  marginTop: "4px"
 },

 statusBadge: (status) => ({
  display: "inline-flex",
  alignItems: "center",
  minHeight: "32px",
  padding: "6px 12px",
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background:
   status === "paid"
    ? "rgba(106,166,154,0.18)"
    : status === "cancelled"
     ? "rgba(217,124,108,0.12)"
     : "rgba(200,169,108,0.14)",
  color: status === "cancelled" ? "#F1A596" : colors.primaryLight,
  fontSize: "12px",
  letterSpacing: "0.08em",
  textTransform: "uppercase"
 })
}
