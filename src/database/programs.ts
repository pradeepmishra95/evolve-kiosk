interface ProgramDefinition {
 id: number
 name: string
 benefits: string[]
}

export const programs: ProgramDefinition[] = [

{
 id:1,
 name:"Calisthenics",
 benefits:[
  "Build strength",
  "Improve mobility",
  "Body control"
 ]
},

{
 id:2,
 name:"MMA",
 benefits:[
  "Self defence",
  "Combat skills",
  "High intensity training"
 ]
},

{
 id:3,
 name:"Calisthenics + MMA",
 benefits:[
  "Strength",
  "Fat loss",
  "Fighting skills"
 ]
}

]
