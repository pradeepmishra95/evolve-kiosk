import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import Grid from "../../layout/Grid"
import ChoiceCard from "../../components/cards/ChoiceCard"
import TrainingTypeCard from "../../components/cards/TrainingTypeCard"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import DobSelector from "../../components/datetime/DobSelector"
import SelectInput from "../../components/inputs/SelectInput"
import TextInput from "../../components/inputs/TextInput"
import { usePlanCatalog } from "../../hooks/usePlanCatalog"
import type { CatalogTrainingType } from "../../services/planCatalog"
import { useDevice } from "../../hooks/useDevice"
import { useUserStore } from "../../store/userStore"
import { useToastStore } from "../../store/toastStore"
import type { UserGender } from "../../types/domain"
import { getExperienceClassification } from "../../utils/experience"
import {
 fallbackActivityOptions,
 experienceDurationOptions,
 lastExerciseTimeOptions,
} from "../../utils/experienceOptions"
import { matchesLabel } from "../../utils/labelMatch"
import { calculateAgeFromDateOfBirth, getDateOfBirthBounds, validateDateOfBirth } from "../../utils/dateOfBirth"
import { colors, radius, spacing, typography } from "../../styles/GlobalStyles"
import { validateInjuryDetails, validateName } from "../../utils/validation"

const referenceOptions = [
 { value: "Walk In", label: "Walk In" },
 { value: "Website", label: "Website" },
 { value: "Google Business Page", label: "Google Business Page" },
 { value: "Facebook", label: "Facebook" },
 { value: "Instagram", label: "Instagram" },
 { value: "YouTube", label: "YouTube" },
 { value: "Friend", label: "Friend" },
 { value: "Family", label: "Family" }
]

const lookingForOptions = [
 { value: "Self", label: "Self" },
 { value: "Daughter", label: "Daughter" },
 { value: "Son", label: "Son" },
 { value: "Family", label: "Family" },
 { value: "Relative", label: "Relative" },
 { value: "Friend", label: "Friend" },
 { value: "Others", label: "Others" }
]

const genderOptions = [
 { value: "male", label: "Male" },
 { value: "female", label: "Female" },
 { value: "other", label: "Other" }
]

const getPurposeLabel = (purpose: string) => {
 if (purpose === "trial") return "Trial"
 if (purpose === "enroll") return "Enroll"
 if (purpose === "renew") return "Renew"
 if (purpose === "enquiry") return "Enquiry"
 return ""
}

const dedupeOptions = (options: Array<{ label: string; value: string }>) =>
 options.filter((option, index, list) => list.findIndex((candidate) => matchesLabel(candidate.value, option.value)) === index)

interface TrainingTypeKnowMoreContent {
 overview: string
 bestFor: string
 highlights: string[]
 focusAreas: string[]
 sessionFlow: string[]
 coachingStyle: string
 beginnerNote: string
 progressPath: string
}

const getDefaultKnowMoreContent = (trainingType: CatalogTrainingType): TrainingTypeKnowMoreContent => ({
 overview:
  trainingType.description ||
  trainingType.summary ||
  `${trainingType.name} is a coach-led training program focused on steady progression and safe form.`,
 bestFor: trainingType.bestFor || `${trainingType.name} focused members`,
 highlights:
  trainingType.benefits.length > 0
   ? trainingType.benefits.slice(0, 4)
   : [
      "Structured progression under coach guidance",
      "Skill + strength focus with measurable improvement",
      "Safe movement quality and consistency"
     ],
 focusAreas:
  trainingType.benefits.length > 0
   ? trainingType.benefits.slice(0, 5)
   : [
      "Movement quality and body control",
      "Strength and endurance progression",
      "Confidence with proper technique",
      "Consistency through coach-led sessions"
     ],
 sessionFlow:
  trainingType.exercises.length > 0
   ? trainingType.exercises.slice(0, 6)
   : ["Warm-up", "Skill block", "Strength block", "Conditioning", "Cool down"],
 coachingStyle:
  "Sessions are structured and coach-led, with close attention to form, safety, and gradual progression so members can improve without feeling rushed.",
 beginnerNote:
  "Beginners are welcome. Coaches usually scale drills and intensity based on the member's current level, comfort, and mobility.",
 progressPath:
  `With consistent attendance, ${trainingType.name} usually helps members improve technique, fitness, confidence, and training consistency over time.`
})

const getTrainingTypeKnowMoreContent = (trainingType: CatalogTrainingType): TrainingTypeKnowMoreContent => {
 if (matchesLabel(trainingType.name, "calisthenics")) {
  return {
   overview:
    "Calisthenics focuses on bodyweight strength, mobility, control, and skill development. Instead of depending mainly on machines, it teaches the body to move better through progressive pulling, pushing, hanging, core, and balance work. It is a great option for members who want visible strength gains along with better posture, coordination, and movement quality.",
   bestFor:
    trainingType.bestFor ||
    "Members who want lean strength, better posture, mobility, and skill-based progress without depending heavily on machines or random workouts.",
   highlights: [
    "Build relative strength using bodyweight movement progressions",
    "Improve joint mobility, stability, and core control",
    "Track skill milestones like pull-ups, dips, rows, and handstand progressions",
    "Develop better posture, shoulder stability, and full-body awareness",
    "Train in a way that feels athletic, engaging, and highly measurable"
   ],
   focusAreas: [
    "Foundational strength in pull, push, hang, and core patterns",
    "Shoulder, wrist, hip, and spine mobility for safer movement",
    "Technique progressions for pull-ups, dips, rows, support holds, and hand balances",
    "Core control and body tension that transfer into everyday movement",
    "Conditioning that supports strength without sacrificing form"
   ],
   sessionFlow: [
    "Mobility + activation warm-up",
    "Movement prep for wrists, shoulders, hips, and core",
    "Push / pull / core strength sets",
    "Skill progression drills with scaled variations",
    "Short conditioning or endurance finisher",
    "Cool down + recovery guidance"
   ],
   coachingStyle:
    "Coaches usually break skills into levels, so members do not jump straight into advanced moves. The focus stays on clean technique, smart regressions, and repeatable strength gains rather than ego-based training.",
   beginnerNote:
    "A beginner does not need to already know pull-ups, dips, or handstands to start. Sessions can begin with assisted variations, holds, and foundational strength work until the member builds enough control for harder progressions.",
   progressPath:
    "Over time, members usually notice stronger upper body development, improved posture, better mobility, stronger grip and core, and clear milestones they can work toward week after week."
  }
 }

 if (matchesLabel(trainingType.name, "mma") || matchesLabel(trainingType.name, "mixed martial arts")) {
  return {
   overview:
    "MMA training combines striking fundamentals, movement, coordination, conditioning, and combat-based drills in a structured coaching environment. It is not only about fighting. It is also one of the most engaging ways to build stamina, discipline, confidence, and full-body athleticism while learning practical movement patterns.",
   bestFor:
    trainingType.bestFor ||
    "Members who want high-intensity conditioning, practical combat movement, improved coordination, and a training style that feels energetic and skill-driven.",
   highlights: [
    "Develop speed, coordination, and explosive power",
    "Learn striking fundamentals, stance, and movement control",
    "Build endurance and mental toughness through coached drills",
    "Improve focus, discipline, and confidence in a structured setting",
    "Get a strong full-body workout that does not feel repetitive"
   ],
   focusAreas: [
    "Stance, footwork, balance, and movement awareness",
    "Basic striking mechanics such as punches, defense, and combinations",
    "Conditioning rounds that build stamina and work capacity",
    "Reaction speed, timing, and coordination under coaching",
    "Mental sharpness, discipline, and confidence through structured repetition"
   ],
   sessionFlow: [
    "Dynamic warm-up + footwork",
    "Mobility and fight-movement preparation",
    "Technique block covering stance, guard, and striking fundamentals",
    "Pad, bag, or controlled partner drills",
    "Conditioning rounds",
    "Mobility cool down"
   ],
   coachingStyle:
    "Training is typically coached in a step-by-step format so members first learn movement, stance, and mechanics before intensity increases. The goal is controlled learning, safe execution, and confidence through repetition.",
   beginnerNote:
    "Beginners can start without any fight background. Sessions can be scaled for fitness-first members as well as people who want to learn technique, so the emphasis stays on form, control, and coach guidance rather than going too hard too soon.",
   progressPath:
    "With regular training, members often see better stamina, quicker reflexes, stronger movement, improved body composition, and a noticeable jump in confidence and training discipline."
  }
 }

 return getDefaultKnowMoreContent(trainingType)
}

const getTrainingTypeCardSummary = (trainingType: CatalogTrainingType) =>
 trainingType.summary || trainingType.description || trainingType.bestFor

export default function UserDetailsScreen() {
 const navigate = useNavigate()
 const { isMobile } = useDevice()
 const { trainingTypes, loading } = usePlanCatalog()
 const showToast = useToastStore((state) => state.showToast)

 const {
  name,
  phone,
  gender,
  dateOfBirth,
  lookingFor,
  referenceSource,
  injury,
  injuryAnswered,
  injuryDetails,
  priorExerciseExperience,
  priorExerciseActivity,
  priorExerciseDuration,
 lastExerciseTime,
 exerciseType,
 profilePhotoUrl,
 profilePhotoStoragePath,
 purpose,
 setData
 } = useUserStore()

 const purposeLabel = getPurposeLabel(purpose)
 const dobBounds = getDateOfBirthBounds()
 const [errors, setErrors] = useState({
  name: "",
  dateOfBirth: "",
  lookingFor: "",
  referenceSource: "",
  gender: "",
  injury: "",
  injuryDetails: "",
  priorExerciseExperience: "",
  priorExerciseActivity: "",
  priorExerciseDuration: "",
  lastExerciseTime: "",
  exerciseType: ""
 })
 const [activeKnowMoreType, setActiveKnowMoreType] = useState<CatalogTrainingType | null>(null)

 useEffect(() => {
  if (phone) {
   return
  }

  navigate("/phone", { replace: true })
 }, [navigate, phone])

 const availableActivities = useMemo(
  () =>
   dedupeOptions([
    ...trainingTypes.map((item) => ({
     label: item.name,
     value: item.name
    })),
    ...fallbackActivityOptions
   ]),
  [trainingTypes]
 )

 const selectedTrainingType = trainingTypes.find((item) => matchesLabel(item.name, exerciseType))
 const activeKnowMoreContent = useMemo(
  () => (activeKnowMoreType ? getTrainingTypeKnowMoreContent(activeKnowMoreType) : null),
  [activeKnowMoreType]
 )

 const resolveExperience = ({
  nextTrainingType = exerciseType,
  nextPriorExerciseExperience = priorExerciseExperience,
  nextPriorExerciseActivity = priorExerciseActivity,
  nextPriorExerciseDuration = priorExerciseDuration,
  nextLastExerciseTime = lastExerciseTime
 }: {
  nextTrainingType?: string
  nextPriorExerciseExperience?: string
  nextPriorExerciseActivity?: string[]
  nextPriorExerciseDuration?: string
  nextLastExerciseTime?: string
 } = {}) => {
  const classification = getExperienceClassification({
   selectedTrainingType: nextTrainingType,
   priorExerciseExperience: nextPriorExerciseExperience,
   priorExerciseActivity: nextPriorExerciseActivity,
   priorExerciseDuration: nextPriorExerciseDuration,
   lastExerciseTime: nextLastExerciseTime
  })

  if (classification) {
   return classification
  }

  if (nextPriorExerciseExperience === "no") {
   return "Beginner"
  }

  return ""
 }

 const updateErrors = (field: keyof typeof errors, value = "") => {
  setErrors((current) => ({
   ...current,
   [field]: value
  }))
 }

 const handleNameChange = (value: string) => {
  setData({ name: value })
  updateErrors("name")
 }

 const handleDateOfBirthChange = (value: string) => {
  setData({
   dateOfBirth: value,
   age: calculateAgeFromDateOfBirth(value)
  })
  updateErrors("dateOfBirth")
 }

 const handleGenderChange = (value: string) => {
  setData({ gender: value as UserGender })
  updateErrors("gender")
 }

 const handleReferenceSourceChange = (value: string) => {
  setData({ referenceSource: value })
  updateErrors("referenceSource")
 }

 const handleInjuryChange = (value: boolean) => {
  setData({
   injury: value,
   injuryAnswered: true,
   injuryDetails: value ? injuryDetails : ""
  })
  updateErrors("injury")
  updateErrors("injuryDetails")
 }

 const handlePriorExperienceChange = (value: string) => {
  const nextExperience = value

  setData({
   priorExerciseExperience: nextExperience,
   priorExerciseActivity: [],
   priorExerciseDuration: "",
   lastExerciseTime: "",
   experience: resolveExperience({
    nextPriorExerciseExperience: nextExperience,
    nextPriorExerciseActivity: [],
    nextPriorExerciseDuration: "",
    nextLastExerciseTime: ""
   })
  })

  updateErrors("priorExerciseExperience")
  updateErrors("priorExerciseActivity")
  updateErrors("priorExerciseDuration")
  updateErrors("lastExerciseTime")
 }

 const handleActivityToggle = (value: string) => {
  const nextActivities = priorExerciseActivity.includes(value)
   ? priorExerciseActivity.filter((activity) => activity !== value)
   : [...priorExerciseActivity, value]

  setData({
   priorExerciseActivity: nextActivities,
   experience: resolveExperience({
    nextPriorExerciseActivity: nextActivities
   })
  })

  updateErrors("priorExerciseActivity")
 }

 const handleDurationChange = (value: string) => {
  setData({
   priorExerciseDuration: value,
   experience: resolveExperience({
    nextPriorExerciseDuration: value
   })
  })

  updateErrors("priorExerciseDuration")
 }

 const handleLastExerciseTimeChange = (value: string) => {
  setData({
   lastExerciseTime: value,
   experience: resolveExperience({
    nextLastExerciseTime: value
   })
  })

  updateErrors("lastExerciseTime")
 }

 const handleTrainingTypeChange = (value: string) => {
  setData({
   exerciseType: value,
   experience: resolveExperience({
    nextTrainingType: value
   })
  })

  updateErrors("exerciseType")
 }

 const handleNext = () => {
  const nameValidation = validateName(name)
  const dateOfBirthValidation = validateDateOfBirth(dateOfBirth)
  const injuryDetailsValidation = injury ? validateInjuryDetails(injuryDetails) : { isValid: true, error: "" }

  const nextErrors = {
   name: nameValidation.isValid ? "" : nameValidation.error,
   dateOfBirth: dateOfBirthValidation.isValid ? "" : dateOfBirthValidation.error,
   lookingFor: lookingFor ? "" : "Please select whom the member is looking for.",
   referenceSource: referenceSource ? "" : "Please select where you heard about us.",
   gender: gender ? "" : "Please select a gender.",
   injury: injuryAnswered ? "" : "Please tell us if you have any injury or pain.",
   injuryDetails: injury ? (injuryDetailsValidation.isValid ? "" : injuryDetailsValidation.error) : "",
   priorExerciseExperience: priorExerciseExperience ? "" : "Please tell us if you have trained before.",
   priorExerciseActivity:
    priorExerciseExperience === "yes" && priorExerciseActivity.length === 0
     ? "Please select at least one previous exercise or sport."
     : "",
   priorExerciseDuration:
    priorExerciseExperience === "yes" && !priorExerciseDuration
     ? "Please select the experience duration."
     : "",
   lastExerciseTime:
    priorExerciseExperience === "yes" && !lastExerciseTime
     ? "Please select when the user last exercised."
     : "",
   exerciseType: exerciseType ? "" : "Please choose a training type."
  }

  setErrors(nextErrors)

  if (Object.values(nextErrors).some(Boolean)) {
   showToast("Kindly fill all required fields before proceeding", "error")
   return
  }

  setData({
   name: nameValidation.trimmedName,
   dateOfBirth: dateOfBirthValidation.normalizedDateOfBirth,
   age: dateOfBirthValidation.age,
   lookingFor: lookingFor.trim(),
   referenceSource: referenceSource.trim(),
   injury,
   injuryAnswered: true,
   injuryDetails:
    injury && "trimmedDetails" in injuryDetailsValidation ? injuryDetailsValidation.trimmedDetails : "",
   priorExerciseExperience,
   priorExerciseActivity,
   priorExerciseDuration,
   lastExerciseTime,
   exerciseType,
   experience: resolveExperience()
  })

  if (purpose === "enquiry") {
   navigate("/program")
   return
  }

  if (profilePhotoUrl || profilePhotoStoragePath) {
   navigate("/program")
   return
  }

  navigate("/profile-photo")
 }

 const renderTrainingInfoModal = () => {
  if (!activeKnowMoreType || !activeKnowMoreContent) {
   return null
  }

  return (
   <div
    style={styles.trainingInfoOverlay}
    role="dialog"
    aria-modal="true"
    aria-label={`${activeKnowMoreType.name} details`}
    onClick={(event) => {
     if (event.target === event.currentTarget) {
      setActiveKnowMoreType(null)
     }
    }}
   >
    <div style={styles.trainingInfoModalCard}>
     <div style={styles.trainingInfoHeader}>
      <p style={styles.trainingInfoEyebrow}>Training Insights</p>
      <button
       type="button"
       className="kiosk-focus-ring"
       style={styles.trainingInfoCloseButton}
       onClick={() => setActiveKnowMoreType(null)}
      >
       Close
      </button>
     </div>

     <div style={styles.trainingInfoModalBody}>
      <h4 style={styles.trainingInfoTitle}>{activeKnowMoreType.name}</h4>
      <p style={styles.trainingInfoText}>{activeKnowMoreContent.overview}</p>

      <p style={styles.trainingInfoLabel}>Best for</p>
      <p style={styles.trainingInfoText}>{activeKnowMoreContent.bestFor}</p>

     <p style={styles.trainingInfoLabel}>Key highlights</p>
      <ul style={styles.trainingInfoList}>
       {activeKnowMoreContent.highlights.map((item, index) => (
        <li key={`${item}-${index}`} style={styles.trainingInfoListItem}>
         {item}
        </li>
       ))}
      </ul>

      <p style={styles.trainingInfoLabel}>What members work on</p>
      <ul style={styles.trainingInfoList}>
       {activeKnowMoreContent.focusAreas.map((item, index) => (
        <li key={`${item}-${index}`} style={styles.trainingInfoListItem}>
         {item}
        </li>
       ))}
      </ul>

      <p style={styles.trainingInfoLabel}>Coaching style</p>
      <p style={styles.trainingInfoText}>{activeKnowMoreContent.coachingStyle}</p>

      <p style={styles.trainingInfoLabel}>Typical session flow</p>
      <div style={styles.trainingFlowWrap}>
       {activeKnowMoreContent.sessionFlow.map((item, index) => (
        <span key={`${item}-${index}`} style={styles.trainingFlowChip}>
         {item}
        </span>
       ))}
      </div>

      <p style={styles.trainingInfoLabel}>Beginner expectations</p>
      <p style={styles.trainingInfoText}>{activeKnowMoreContent.beginnerNote}</p>

      <p style={styles.trainingInfoLabel}>Progress over time</p>
      <p style={styles.trainingInfoText}>{activeKnowMoreContent.progressPath}</p>
     </div>
    </div>
   </div>
  )
 }

 return (
  <Container scrollable>
   <div style={styles.wrapper}>
    <div style={styles.surface}>
     <div style={styles.header}>
      <div>
       <h2 style={styles.heading}>Tell us a little about you</h2>
      </div>

      {purposeLabel && (
       <span style={styles.purposePill}>
        Selected: {purposeLabel}
       </span>
      )}
     </div>

     <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
       <div>
        <h3 style={styles.sectionTitle}>Basic Info</h3>
       </div>
     </div>

      <div
       style={{
        width: "100%",
        marginBottom: spacing.md,
        display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.35fr) minmax(0, 0.85fr)",
        gap: spacing.md,
        alignItems: "start"
       }}
      >
       <TextInput
        compact
        label="Full Name"
        value={name}
        placeholder="Enter your name"
        onChange={handleNameChange}
        error={errors.name}
       />

       <SelectInput
        compact
        label="Gender"
        value={gender}
        placeholder="Select gender"
        onChange={handleGenderChange}
        error={errors.gender}
        options={genderOptions}
       />
      </div>

      <div
       style={{
        ...styles.inlineBlock,
        maxWidth: isMobile ? "100%" : "380px"
       }}
      >
       <DobSelector
        compact
        label="Date of Birth"
        value={dateOfBirth}
        onChange={handleDateOfBirthChange}
        error={errors.dateOfBirth}
        min={dobBounds.min}
        max={dobBounds.max}
        emptyLabel="Select DOB (Year, Month, Day)"
       />
      </div>

      <div style={styles.inlineBlock}>
       <SelectInput
        compact
        label="Whom are you looking for?"
        value={lookingFor}
        placeholder="Select one"
        onChange={(value) => {
         setData({ lookingFor: value })
         updateErrors("lookingFor")
        }}
        error={errors.lookingFor}
        options={lookingForOptions}
       />
      </div>

      <div style={styles.inlineBlock}>
       <SelectInput
        compact
        label="How did you know about us?"
        value={referenceSource}
        placeholder="Select a source"
        onChange={handleReferenceSourceChange}
        error={errors.referenceSource}
        options={referenceOptions}
       />
      </div>
     </div>

     <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
       <div>
        <h3 style={styles.sectionTitle}>Injury Check</h3>
       </div>
       <span style={styles.optionalPill}>Required</span>
      </div>

      <Grid
       style={{
        marginTop: 0,
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))"
       }}
      >
       <ChoiceCard
        title="No Injury"
        subtitle="No current pain or restriction."
        selected={injuryAnswered && injury === false}
        showBadge={false}
        centered
        onClick={() => handleInjuryChange(false)}
       />

       <ChoiceCard
        title="Yes, I have one"
        subtitle="We will ask for a quick note."
        selected={injuryAnswered && injury === true}
        showBadge={false}
        centered
        onClick={() => handleInjuryChange(true)}
       />
      </Grid>

      {errors.injury && (
       <p style={styles.errorText}>
        {errors.injury}
       </p>
      )}

      {injury && (
       <div style={styles.inlineBlock}>
        <TextInput
         label="Describe your injury"
         value={injuryDetails}
         placeholder="Example: left knee pain, lower back stiffness"
         onChange={(value) => {
          setData({ injuryDetails: value })
          updateErrors("injuryDetails")
         }}
         error={errors.injuryDetails}
        />
       </div>
      )}
     </div>

     <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
       <div>
        <h3 style={styles.sectionTitle}>Training Background</h3>
       </div>
       <span style={styles.optionalPill}>Required</span>
      </div>

      <Grid
       style={{
        marginTop: 0,
        gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))"
       }}
      >
       <ChoiceCard
        title="Trained before"
        subtitle="Select if the user has done structured exercise before."
        selected={priorExerciseExperience === "yes"}
        showBadge={false}
        centered
        onClick={() => handlePriorExperienceChange("yes")}
      />

       <ChoiceCard
        title="First timer"
        subtitle="Choose this if they are just starting out."
        selected={priorExerciseExperience === "no"}
        showBadge={false}
        centered
        onClick={() => handlePriorExperienceChange("no")}
       />
      </Grid>

      {errors.priorExerciseExperience && (
       <p style={styles.errorText}>
        {errors.priorExerciseExperience}
       </p>
      )}

      {priorExerciseExperience === "yes" && (
       <div style={styles.subSection}>
        <p style={styles.subSectionTitle}>Past activity</p>
        <Grid
         style={{
          marginTop: 0,
          gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))"
         }}
        >
         {availableActivities.map((option) => {
          const isSelected = priorExerciseActivity.includes(option.value)

          return (
           <ChoiceCard
            key={option.value}
            title={option.label}
            subtitle={isSelected ? "Included" : "Tap to add"}
            selected={isSelected}
            badgeLabel={isSelected ? "Added" : "Add"}
            centered={false}
            onClick={() => handleActivityToggle(option.value)}
           />
          )
         })}
        </Grid>
        {errors.priorExerciseActivity && (
         <p style={styles.errorText}>
          {errors.priorExerciseActivity}
         </p>
        )}

        <div style={styles.selectRow(isMobile)}>
         <SelectInput
          compact
          label="Experience span"
          value={priorExerciseDuration}
          options={experienceDurationOptions}
          onChange={handleDurationChange}
          error={errors.priorExerciseDuration}
          placeholder="Choose duration"
        />

         <SelectInput
          compact
          label="Last active"
          value={lastExerciseTime}
          options={lastExerciseTimeOptions}
          onChange={handleLastExerciseTimeChange}
          error={errors.lastExerciseTime}
          placeholder="Choose duration"
         />
        </div>
       </div>
      )}
     </div>

     <div style={styles.sectionCard}>
      <div style={styles.sectionHeader}>
       <div>
        <h3 style={styles.sectionTitle}>Training Type</h3>
       </div>
       <span style={styles.optionalPill}>Required</span>
      </div>

      {loading && trainingTypes.length === 0 ? (
       <p style={styles.loadingText}>Loading training options...</p>
      ) : trainingTypes.length === 0 ? (
       <p style={styles.loadingText}>
        No training types are available right now.
       </p>
      ) : (
       <Grid
        style={{
         marginTop: 0,
         gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))"
        }}
       >
        {trainingTypes.map((trainingType) => (
         <TrainingTypeCard
          key={trainingType.id || trainingType.name}
          name={trainingType.name}
          summary={getTrainingTypeCardSummary(trainingType)}
          bestFor={trainingType.bestFor}
          selected={matchesLabel(trainingType.name, exerciseType)}
          disabled={trainingType.disabled}
          availabilityLabel={trainingType.availabilityLabel}
          onKnowMore={() => setActiveKnowMoreType(trainingType)}
          onSelect={() => {
           if (trainingType.disabled) {
            return
           }

           handleTrainingTypeChange(trainingType.name)
          }}
         />
        ))}
       </Grid>
      )}

      {errors.exerciseType && (
       <p style={styles.errorText}>
        {errors.exerciseType}
       </p>
      )}

      {selectedTrainingType && (
       <p style={styles.selectionHint}>
        Selected training type: <b>{selectedTrainingType.name}</b>
       </p>
      )}
     </div>

     <div style={styles.actions}>
     <PrimaryButton title="Continue" onClick={handleNext} fullWidth />
     </div>
    </div>
   </div>

   {renderTrainingInfoModal()}
  </Container>
 )
}

const styles = {
 wrapper: {
  width: "min(100%, 760px)",
  margin: "0 auto"
 },
 surface: {
  padding: "clamp(18px, 2.4vh, 30px)",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  background:
   "linear-gradient(160deg, rgba(255,255,255,0.06), rgba(255,255,255,0.018)), radial-gradient(circle at top right, rgba(200,169,108,0.08), transparent 34%), radial-gradient(circle at bottom left, rgba(106,166,154,0.08), transparent 30%)",
  boxShadow: "0 20px 60px rgba(0,0,0,0.22)",
  backdropFilter: "blur(14px)"
 },
 header: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: spacing.md,
  flexWrap: "wrap" as const,
  marginBottom: spacing.lg
 },
 kicker: {
  color: colors.primaryLight,
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  fontSize: "12px",
  fontWeight: 700,
  marginBottom: spacing.xs
 },
 heading: {
  ...typography.subtitle,
  fontSize: "clamp(28px, 3.4vh, 36px)",
  margin: 0
 },
 description: {
  color: colors.textSecondary,
  lineHeight: 1.6,
  marginTop: spacing.sm,
  maxWidth: "46ch"
 },
 purposePill: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.primaryLight,
  fontSize: "12px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const
 },
 sectionCard: {
  marginBottom: spacing.lg,
  padding: spacing.lg,
  borderRadius: radius.lg,
  border: `1px solid ${colors.border}`,
  background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.018))"
 },
 sectionHeader: {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: spacing.md,
  flexWrap: "wrap" as const,
  marginBottom: spacing.md
 },
 sectionTitle: {
  ...typography.subtitle,
  fontSize: "24px",
  marginBottom: "4px"
 },
 sectionHint: {
  color: colors.textSecondary,
  lineHeight: 1.5,
  fontSize: "13px",
  maxWidth: "54ch"
 },
 optionalPill: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "8px 12px",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textMuted,
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const
 },
 inlineBlock: {
  width: "100%",
  marginBottom: spacing.md
 },
 ageText: {
  color: colors.textSecondary,
  fontSize: "13px",
  marginTop: "8px"
 },
 errorText: {
  marginTop: spacing.sm,
  fontSize: "14px",
  color: "#F1A596",
  lineHeight: 1.5
 },
 subSection: {
  marginTop: spacing.lg,
  paddingTop: spacing.lg,
  borderTop: `1px solid ${colors.border}`
 },
 subSectionTitle: {
  color: colors.primaryLight,
  fontSize: "13px",
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const,
  fontWeight: 700,
  marginBottom: spacing.sm
 },
 selectRow: (isMobile: boolean) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
  gap: spacing.md,
  marginTop: spacing.md
 }),
 trainingInfoOverlay: {
  position: "fixed" as const,
  inset: 0,
  zIndex: 120,
  background: "rgba(5,12,16,0.84)",
  backdropFilter: "blur(8px)",
  display: "flex",
  justifyContent: "center",
  alignItems: "flex-start",
  padding: "clamp(20px, 6vh, 56px) clamp(14px, 2vw, 22px)"
 },
 trainingInfoModalCard: {
  width: "min(100%, 760px)",
  maxHeight: "min(84vh, 780px)",
  overflow: "hidden",
  borderRadius: radius.lg,
  border: `1px solid ${colors.borderStrong}`,
  background: "linear-gradient(165deg, rgba(20,32,40,0.98), rgba(10,18,25,0.98))",
  boxShadow: "0 24px 70px rgba(0,0,0,0.36)"
 },
 trainingInfoHeader: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: spacing.md,
  marginBottom: 0,
  padding: "14px 16px",
  borderBottom: `1px solid ${colors.border}`
 },
 trainingInfoEyebrow: {
  color: colors.primaryLight,
  fontSize: "11px",
  fontWeight: 800,
  letterSpacing: "0.16em",
  textTransform: "uppercase" as const
 },
 trainingInfoCloseButton: {
  borderRadius: "999px",
  border: `1px solid ${colors.border}`,
  background: "rgba(255,255,255,0.03)",
  color: colors.textSecondary,
  padding: "8px 12px",
  cursor: "pointer",
  fontSize: "11px",
  fontWeight: 700,
  letterSpacing: "0.12em",
  textTransform: "uppercase" as const
 },
 trainingInfoModalBody: {
  maxHeight: "calc(84vh - 70px)",
  overflowY: "auto" as const,
  padding: "16px"
 },
 trainingInfoTitle: {
  ...typography.subtitle,
  fontSize: "24px",
  marginBottom: spacing.xs
 },
 trainingInfoText: {
  color: colors.textSecondary,
  fontSize: "14px",
  lineHeight: 1.6,
  marginBottom: spacing.sm
 },
 trainingInfoLabel: {
  color: colors.primaryLight,
  fontSize: "12px",
  fontWeight: 800,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  marginTop: spacing.sm,
  marginBottom: "6px"
 },
 trainingInfoList: {
  margin: 0,
  paddingLeft: "18px",
  display: "grid",
  gap: "6px"
 },
 trainingInfoListItem: {
  color: colors.textSecondary,
  fontSize: "13px",
  lineHeight: 1.55
 },
 trainingFlowWrap: {
  display: "flex",
  flexWrap: "wrap" as const,
  gap: "8px",
  marginTop: "2px"
 },
 trainingFlowChip: {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  borderRadius: "999px",
  border: `1px solid ${colors.borderStrong}`,
  background: "rgba(255,255,255,0.04)",
  color: colors.textPrimary,
  padding: "6px 10px",
  fontSize: "12px",
  lineHeight: 1.1
 },
 selectionHint: {
  marginTop: spacing.sm,
  color: colors.textSecondary,
  fontSize: "13px"
 },
 loadingText: {
  color: colors.textSecondary,
  fontSize: "14px",
  lineHeight: 1.5
 },
 actions: {
  marginTop: spacing.lg,
  display: "flex",
  justifyContent: "center"
 }
}
