export interface ExperienceQuestionnaireData {
 priorExerciseExperience: string
 priorExerciseActivity: string[]
 priorExerciseDuration: string
 lastExerciseTime: string
}

export const hasCompletedExperienceQuestionnaire = (
 data: ExperienceQuestionnaireData
) =>
data.priorExerciseExperience === "no" ||
 (data.priorExerciseExperience === "yes" &&
  data.priorExerciseActivity.length > 0 &&
  Boolean(data.priorExerciseDuration) &&
  Boolean(data.lastExerciseTime))

export const getExperienceClassification = ({
 selectedTrainingType,
 priorExerciseExperience,
 priorExerciseActivity,
 priorExerciseDuration
}: ExperienceQuestionnaireData & {
 selectedTrainingType: string
}) => {
 if (priorExerciseExperience === "no") {
  return "Beginner"
 }

 if (
  priorExerciseExperience !== "yes" ||
  !selectedTrainingType ||
  priorExerciseActivity.length === 0 ||
  !priorExerciseDuration
 ) {
  return ""
 }

 if (!priorExerciseActivity.includes(selectedTrainingType)) {
  return "Beginner"
 }

 if (priorExerciseDuration === "2+ years") {
  return "Advance"
 }

 if (priorExerciseDuration === "6 months to 2 years") {
  return "Intermediate"
 }

 return "Beginner"
}
