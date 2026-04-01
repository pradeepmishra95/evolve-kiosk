import type { ProgramPlan } from "../types/domain"

export const adultPlans: ProgramPlan[] = [

{
 id:1,
 name:"Group Batches",
 days:"Mon – Fri",

 pricing:[
  {duration:"1 Day",price:500},
  {duration:"Monthly",price:4999},
  {duration:"Quarterly",price:11999},
  {duration:"Half Yearly",price:19999}
 ]
},

{
 id:2,
 name:"Athlete Training",
 days:"Mon, Wed, Fri",

 pricing:[
  {duration:"1 Day",price:500},
  {duration:"Monthly",price:3999},
  {duration:"Quarterly",price:9999},
  {duration:"Half Yearly",price:18999}
 ]
},

{
 id:3,
 name:"Self Training",
 days:"Mon – Fri",

 pricing:[
  {duration:"1 Day",price:500},
  {duration:"Monthly",price:2999},
  {duration:"Quarterly",price:6999},
  {duration:"Half Yearly",price:11999}
 ]
},

{
 id:4,
 name:"Personal Training",
 type:"personal"
}

]
