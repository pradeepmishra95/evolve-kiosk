export interface Batch {

 id:number
 type:"morning" | "evening"
 level:"regular" | "advance" | "kids" | "Expert"
 time:string
 capacity:number
 current:number

}

export const batches:Batch[] = [

/* MORNING */

{
 id:1,
 type:"morning",
 level:"regular",
 time:"6:00 - 7:00",
 capacity:20,
 current:12
},

{
 id:2,
 type:"morning",
 level:"regular",
 time:"7:00 - 8:00",
 capacity:20,
 current:15
},

{
 id:3,
 type:"morning",
 level:"advance",
 time:"8:00 - 9:00",
 capacity:15,
 current:8
},

{
 id:4,
 type:"morning",
 level:"regular",
 time:"9:00 - 10:00",
 capacity:20,
 current:10
},

/* EVENING */

{
 id:5,
 type:"evening",
 level:"kids",
 time:"5:00 - 6:00",
 capacity:20,
 current:5
},

{
 id:6,
 type:"evening",
 level:"regular",
 time:"6:00 - 7:00",
 capacity:20,
 current:13
},

{
 id:7,
 type:"evening",
 level:"advance",
 time:"7:00 - 8:00",
 capacity:15,
 current:7
},

{
 id:8,
 type:"evening",
 level:"kids",
 time:"7:00 - 8:00",
 capacity:20,
 current:9
},

{
 id:9,
 type:"evening",
 level:"regular",
 time:"8:00 - 9:00",
 capacity:20,
 current:11
},

{
 id:10,
 type:"evening",
 level:"regular",
 time:"9:00 - 10:00",
 capacity:20,
 current:6
}

]