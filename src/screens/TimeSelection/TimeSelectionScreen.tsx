import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import OptionCard from "../../components/cards/OptionCard"
import { useUserStore } from "../../store/userStore"

import { batches } from "../../database/batches"

import { typography, spacing } from "../../styles/GlobalStyles"

export default function TimeSelectionScreen(){

 const navigate = useNavigate()

 const { batchType, age } = useUserStore()

 const setData = useUserStore(state => state.setData)

 const isKids = age !== null && age >= 7 && age <= 12

 const filteredBatches = batches.filter(batch => {

  if(isKids){
   return batch.level === "kids"
  }

  return batch.type === batchType && batch.level !== "kids"

 })

 const selectTime = (time:string) => {

  setData({ batchTime: time })

  navigate("/review")

 }

 return(

  <Container>

   <h2
    style={{
     textAlign:"center",
     fontSize: typography.subtitle.fontSize,
     marginBottom: spacing.lg
    }}
   >
    Select Time
   </h2>

   <Grid>

    {filteredBatches.map(batch => (

     <OptionCard
      key={batch.id}
      title={batch.time}
      subtitle={`${batch.current}/${batch.capacity} seats`}
      onClick={() => selectTime(batch.time)}
     />

    ))}

   </Grid>

  </Container>

 )

}
