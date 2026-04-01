import { useEffect, useState } from "react"
import { collection, doc, getDocs, serverTimestamp, updateDoc } from "firebase/firestore"
import { db } from "../../firebase/firebase"
import type { CSSProperties } from "react"
import type { EnquiryRecord, EnquirySource, EnquiryStatus } from "../../types/domain"
import { colors, radius } from "../../styles/GlobalStyles"

const isEnquiryStatus = (value: unknown): value is EnquiryStatus =>
 value === "new" ||
 value === "contacted" ||
 value === "trial_booked" ||
 value === "ready_for_enrollment" ||
 value === "converted"

const isEnquirySource = (value: unknown): value is EnquirySource =>
 value === "website" ||
 value === "instagram" ||
 value === "walk_in" ||
 value === "other" ||
 value === "kiosk"

const hasEnquiryRecord = (data: Record<string, unknown>) =>
 isEnquiryStatus(data.enquiryStatus) ||
 data.status === "enquiry" ||
 data.purpose === "enquiry"

const toDateLabel = (value: unknown) => {
 const dateValue = value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
  ? value.toDate()
  : value instanceof Date
   ? value
   : null

 return dateValue ? dateValue.toLocaleString() : ""
}

const toTimeValue = (value: unknown) => {
 if (value instanceof Date) {
  return value.getTime()
 }

 if (
  value &&
  typeof value === "object" &&
  "toMillis" in value &&
  typeof value.toMillis === "function"
 ) {
  return value.toMillis()
 }

 return 0
}

export default function EnquiriesTable({
 onDataLoaded
}: {
 onDataLoaded?: (data: EnquiryRecord[]) => void
}) {
 const [enquiries, setEnquiries] = useState<EnquiryRecord[]>([])
 const [loading, setLoading] = useState(true)
 const [updatingId, setUpdatingId] = useState("")

 useEffect(() => {
  const fetchEnquiries = async () => {
   try {
    const snapshot = await getDocs(collection(db, "users"))

    const list: EnquiryRecord[] = snapshot.docs
     .map((enquiryDoc) => ({
      id: enquiryDoc.id,
      data: enquiryDoc.data() as Record<string, unknown>
     }))
     .filter(({ data }) => hasEnquiryRecord(data))
     .sort((left, right) => {
      const rightTime = Math.max(
       toTimeValue(right.data.updatedAt),
       toTimeValue(right.data.enquiryCreatedAt),
       toTimeValue(right.data.createdAt)
      )
      const leftTime = Math.max(
       toTimeValue(left.data.updatedAt),
       toTimeValue(left.data.enquiryCreatedAt),
       toTimeValue(left.data.createdAt)
      )

      return rightTime - leftTime
     })
     .map(({ id, data }) => ({
      id,
      name: String(data.name || ""),
      phone: String(data.phone || ""),
      primaryGoal: String(data.primaryGoal || ""),
      message: String(data.enquiryMessage || ""),
      status: isEnquiryStatus(data.enquiryStatus) ? data.enquiryStatus : "new",
      source: isEnquirySource(data.enquirySource) ? data.enquirySource : "kiosk",
      createdAt: toDateLabel(data.enquiryCreatedAt) || toDateLabel(data.createdAt)
     }))

    setEnquiries(list)
    onDataLoaded?.(list)
   } catch (error) {
    console.error(error)
   } finally {
    setLoading(false)
   }
  }

  void fetchEnquiries()
 }, [onDataLoaded])

 const updateEnquiryStatus = async (enquiryId: string, status: EnquiryStatus) => {
  try {
   setUpdatingId(enquiryId)

   await updateDoc(doc(db, "users", enquiryId), {
    enquiryStatus: status,
    updatedAt: serverTimestamp()
   })

   setEnquiries((current) => {
    const updated = current.map((enquiry) =>
     enquiry.id === enquiryId
      ? { ...enquiry, status }
      : enquiry
    )

    onDataLoaded?.(updated)
    return updated
   })
  } catch (error) {
   console.error(error)
  } finally {
   setUpdatingId("")
  }
 }

 if (loading) {
  return <p style={{ color: colors.textSecondary }}>Loading enquiries...</p>
 }

 return (
  <div style={styles.wrapper}>
   <table style={styles.table}>
    <thead style={styles.thead}>
     <tr>
      <th style={styles.th}>Name</th>
      <th style={styles.th}>Phone</th>
      <th style={styles.th}>Source</th>
      <th style={styles.th}>Stage</th>
      <th style={styles.th}>Goal</th>
      <th style={styles.th}>Message</th>
      <th style={styles.th}>Created</th>
      <th style={styles.th}>Actions</th>
     </tr>
    </thead>
    <tbody>
     {enquiries.map((enquiry) => (
      <tr key={enquiry.id} style={styles.row}>
       <td style={styles.td}>{enquiry.name}</td>
       <td style={styles.td}>{enquiry.phone}</td>
       <td style={styles.td}>{formatLabel(enquiry.source)}</td>
       <td style={styles.td}>
        <span style={styles.statusBadge(enquiry.status)}>
         {formatLabel(enquiry.status)}
        </span>
       </td>
       <td style={styles.td}>{enquiry.primaryGoal || "-"}</td>
       <td style={styles.td}>{enquiry.message || "-"}</td>
       <td style={styles.td}>{enquiry.createdAt || "-"}</td>
       <td style={styles.td}>
        <div style={styles.actionGroup}>
         <button
          type="button"
          style={styles.actionButton}
          onClick={() => {
           void updateEnquiryStatus(enquiry.id, "contacted")
          }}
          disabled={updatingId === enquiry.id}
         >
          Contacted
         </button>
         <button
          type="button"
          style={styles.actionButton}
          onClick={() => {
           void updateEnquiryStatus(enquiry.id, "trial_booked")
          }}
          disabled={updatingId === enquiry.id}
         >
          Trial Booked
         </button>
         <button
          type="button"
          style={styles.actionButton}
          onClick={() => {
           void updateEnquiryStatus(enquiry.id, "ready_for_enrollment")
          }}
          disabled={updatingId === enquiry.id}
         >
          Ready for Counter
         </button>
         <button
          type="button"
          style={styles.actionButton}
          onClick={() => {
           void updateEnquiryStatus(enquiry.id, "converted")
          }}
          disabled={updatingId === enquiry.id}
         >
          Converted
         </button>
        </div>
       </td>
      </tr>
     ))}
    </tbody>
   </table>
  </div>
 )
}

const formatLabel = (value: string) =>
 value
  .replaceAll("_", " ")
  .replace(/\b\w/g, (char) => char.toUpperCase())

const styles: {
 wrapper: CSSProperties
 table: CSSProperties
 thead: CSSProperties
 th: CSSProperties
 td: CSSProperties
 row: CSSProperties
 actionGroup: CSSProperties
 actionButton: CSSProperties
 statusBadge: (status: EnquiryStatus) => CSSProperties
} = {
 wrapper: {
  width: "100%",
  overflowX: "auto",
  WebkitOverflowScrolling: "touch"
 },

 table: {
  width: "100%",
  minWidth: "1160px",
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

 actionGroup: {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap"
 },

 actionButton: {
  minHeight: "34px",
  padding: "8px 12px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "transparent",
  color: colors.primaryLight,
  cursor: "pointer",
  fontSize: "11px",
  letterSpacing: "0.08em",
  textTransform: "uppercase"
 },

 statusBadge: (status) => ({
  display: "inline-flex",
  alignItems: "center",
  minHeight: "32px",
  padding: "6px 12px",
  borderRadius: radius.md,
  border: `1px solid ${colors.borderStrong}`,
  background:
   status === "converted"
    ? "rgba(106,166,154,0.18)"
    : status === "ready_for_enrollment"
     ? "rgba(200,169,108,0.14)"
     : "rgba(255,255,255,0.06)",
  color: status === "contacted" ? colors.textSecondary : colors.primaryLight,
  fontSize: "12px",
  letterSpacing: "0.08em",
  textTransform: "uppercase"
 })
}
