import { useEffect, useState } from "react"
import { collection, getDocs } from "firebase/firestore"
import { db } from "../../firebase/firebase"
import type { CSSProperties } from "react"
import type { MemberRecord } from "../../types/domain"
import { colors } from "../../styles/GlobalStyles"

export default function MembersTable({
 onDataLoaded
}:{
 onDataLoaded?: (data: MemberRecord[]) => void
}){

 const [members,setMembers] = useState<MemberRecord[]>([])
 const [loading,setLoading] = useState(true)

 useEffect(()=>{

  const fetchMembers = async()=>{

   try{

   const snapshot = await getDocs(collection(db,"users"))

    const list: MemberRecord[] = snapshot.docs
     .filter((memberDoc) => {
      const data = memberDoc.data()
      return data.status === "member" || data.status === "trial"
     })
     .map((memberDoc) => {

     const data = memberDoc.data()

     return{
      id: memberDoc.id,
      name: String(data.name || ""),
      phone: String(data.phone || ""),
      age: Number(data.age || 0),
      program: String(data.program || ""),
      duration: (String(data.duration || "") as MemberRecord["duration"]),
      batch: String(data.batchType || ""),
      time: String(data.batchTime || ""),
      price: Number(data.price || 0)
     }

    })

    setMembers(list)

    onDataLoaded?.(list)

   }catch(error){
    console.error(error)
   }

   setLoading(false)

  }

  fetchMembers()

 }, [onDataLoaded])

 if(loading) return <p style={{ color: colors.textSecondary }}>Loading members...</p>

 return(
  <div style={styles.wrapper}>
   <table style={styles.table}>

    <thead style={styles.thead}>
     <tr>
      <th style={styles.th}>Name</th>
      <th style={styles.th}>Phone</th>
      <th style={styles.th}>Age</th>
      <th style={styles.th}>Program</th>
      <th style={styles.th}>Plan</th>
      <th style={styles.th}>Batch</th>
      <th style={styles.th}>Time</th>
      <th style={styles.th}>Price</th>
     </tr>
    </thead>

    <tbody>

     {members.map(member=>(
      <tr key={member.id} style={styles.row}>
       <td style={styles.td}>{member.name}</td>
       <td style={styles.td}>{member.phone}</td>
       <td style={styles.td}>{member.age}</td>
       <td style={styles.td}>{member.program}</td>
       <td style={styles.td}>{member.duration}</td>
       <td style={styles.td}>{member.batch}</td>
       <td style={styles.td}>{member.time}</td>
       <td style={styles.td}>₹{member.price}</td>
      </tr>
     ))}

    </tbody>

   </table>
  </div>

 )

}

const styles:{
 wrapper:CSSProperties
 table:CSSProperties
 thead:CSSProperties
 th:CSSProperties
 td:CSSProperties
 row:CSSProperties
}={

 wrapper:{
  width:"100%",
  overflowX:"auto",
  WebkitOverflowScrolling:"touch"
 },

 table:{
  width:"100%",
  minWidth:"760px",
  borderCollapse:"separate",
  borderSpacing:"0 10px"
 },

 thead:{
  color:colors.textSecondary
 },

 th:{
  textAlign:"left",
  padding:"0 12px 8px",
  fontSize:"12px",
  letterSpacing:"0.16em",
  textTransform:"uppercase",
  fontWeight:700
 },

 td:{
  textAlign:"left",
  padding:"16px 12px",
  background:"rgba(255,255,255,0.03)"
 },

 row:{
  color:colors.textPrimary
 }

}
