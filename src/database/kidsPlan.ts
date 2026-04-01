import type { ProgramPlan } from "../types/domain"

export const kidsPlans: ProgramPlan[] = [

{
 id:1,
 name:"3 Day Group Batch",
 days:"Tue, Thu, Sat",

 pricing:[
  {duration:"Monthly",price:4999},
  {duration:"Quarterly",price:11999},
  {duration:"Half Yearly",price:19999}
 ]
},

{
 id:2,
 name:"4 Day Group Batch",
 days:"Tue, Thu, Sat, Sun",

 pricing:[
  {duration:"Monthly",price:5999},
  {duration:"Quarterly",price:14999},
  {duration:"Half Yearly",price:24999}
 ]
},

{
 id:3,
 name:"Weekend Batch",
 days:"Sat, Sun",

 pricing:[
  {duration:"Monthly",price:3999},
  {duration:"Quarterly",price:9999},
  {duration:"Half Yearly",price:17999}
 ]
},

{
 id:4,
 name:"Personal Training",
 days:"12 Sessions",
 type:"personal"
}

]
