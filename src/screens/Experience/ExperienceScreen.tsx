import { useEffect, useRef, useState } from "react"
import { useNavigate } from "@/navigation/useAppNavigation"
import Container from "../../layout/Container"
import PrimaryButton from "../../components/buttons/PrimaryButton"
import { useDevice } from "../../hooks/useDevice"
import { usePlanCatalog } from "../../hooks/usePlanCatalog"
import { useUserStore } from "../../store/userStore"
import { colors, radius, spacing } from "../../styles/GlobalStyles"
import { matchesLabel } from "../../utils/labelMatch"

const priorExperienceOptions = [
 { label: "Choose", value: "" },
 { label: "Yes", value: "yes" },
 { label: "No", value: "no" }
]

const fallbackActivityOptions = [
 { label: "Gym / Strength Training", value: "Gym / Strength Training" },
 { label: "Running", value: "Running" },
 { label: "Swimming", value: "Swimming" },
 { label: "Football", value: "Football" },
 { label: "Cricket", value: "Cricket" },
 { label: "Dance", value: "Dance" },
 { label: "Other exercise or sport", value: "Other exercise or sport" }
]

const experienceDurationOptions = [
 { label: "Choose duration", value: "" },
 { label: "0 to 6 months", value: "0 to 6 months" },
 { label: "6 months to 1 year", value: "6 months to 1 year" },
  { label: "1 year to 2 years", value: "1 year to 2 years" },
 { label: "2+ years", value: "2+ years" }
]

const lastExerciseTimeOptions = [
  { label: "Choose duration", value: "" },
 { label: "0 to 6 months", value: "0 to 6 months" },
 { label: "6 months to 1 year", value: "6 months to 1 year" },
  { label: "1 year to 2 years", value: "1 year to 2 years" },
 { label: "2+ years", value: "2+ years" }
]

export default function ExperienceScreen() {

 const navigate = useNavigate()
 const { isMobile } = useDevice()
 const { trainingTypes, loading } = usePlanCatalog()
 const {
  priorExerciseExperience,
  priorExerciseActivity,
  priorExerciseDuration,
  lastExerciseTime
 } = useUserStore()
 const setData = useUserStore(state => state.setData)
 const [errors, setErrors] = useState({
  priorExerciseExperience: "",
  priorExerciseActivity: "",
  priorExerciseDuration: "",
  lastExerciseTime: ""
 })
 const screenHeading = "Training Background"
 const hasPriorExperience = priorExerciseExperience === "yes"
 const priorActivityOptions = [
  ...trainingTypes.map((item) => ({
   label: item.name,
   value: item.name
  })),
  ...fallbackActivityOptions
 ].filter((option, index, list) => list.findIndex((candidate) => matchesLabel(candidate.value, option.value)) === index)

 if (loading && trainingTypes.length === 0) {
  return (
   <Container>
    <div
     style={{
      minHeight: "45vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: colors.textSecondary,
      textAlign: "center",
      letterSpacing: "0.08em"
     }}
    >
     Loading training background options...
    </div>
   </Container>
  )
 }

 const clearError = (field: keyof typeof errors) => {
  setErrors((current) => ({ ...current, [field]: "" }))
 }

 const handlePriorExperienceChange = (value: string) => {
  setData({
   priorExerciseExperience: value,
   priorExerciseActivity: [],
   priorExerciseDuration: "",
   lastExerciseTime: "",
   exerciseType: "",
   experience: ""
  })

  setErrors({
   priorExerciseExperience: "",
   priorExerciseActivity: "",
   priorExerciseDuration: "",
   lastExerciseTime: ""
  })
 }

 const handlePriorActivityChange = (value: string) => {
  const nextActivities = priorExerciseActivity.includes(value)
   ? priorExerciseActivity.filter((activity) => activity !== value)
   : [...priorExerciseActivity, value]

  setData({
   priorExerciseActivity: nextActivities,
   exerciseType: "",
   experience: ""
  })
  clearError("priorExerciseActivity")
 }

 const handlePriorDurationChange = (value: string) => {
  setData({
   priorExerciseDuration: value,
   exerciseType: "",
   experience: ""
  })
  clearError("priorExerciseDuration")
 }

 const handleLastExerciseTimeChange = (value: string) => {
  setData({
   lastExerciseTime: value,
   exerciseType: "",
   experience: ""
  })
  clearError("lastExerciseTime")
 }

 const handleContinue = () => {
  const nextErrors = {
   priorExerciseExperience: "",
   priorExerciseActivity: "",
   priorExerciseDuration: "",
   lastExerciseTime: ""
  }

  if (!priorExerciseExperience) {
   nextErrors.priorExerciseExperience = "Please select yes or no."
  }

  if (priorExerciseExperience === "yes") {
   if (priorExerciseActivity.length === 0) {
    nextErrors.priorExerciseActivity = "Please select at least one previous exercise or sport."
   }

   if (!priorExerciseDuration) {
    nextErrors.priorExerciseDuration = "Please select the experience duration."
   }

   if (!lastExerciseTime) {
    nextErrors.lastExerciseTime = "Please select when the user last exercised."
   }
  }

  setErrors(nextErrors)

  if (Object.values(nextErrors).some(Boolean)) {
   return
  }

  setData({
   exerciseType: "",
   experience: priorExerciseExperience === "no" ? "Beginner" : ""
  })
  navigate("/exercise-type")
 }

 return (

  <Container>

   <div style={styles.wrapper}>

   <h2
     style={{
      textAlign: "center",
      fontSize: "clamp(28px, 3.6vh, 36px)",
      marginBottom: "10px"
     }}
    >
     {screenHeading}
    </h2>

    <p
     style={{
      textAlign: "center",
      color: colors.textSecondary,
      marginBottom: spacing.md,
      lineHeight: 1.5,
      fontSize: "14px"
     }}
    >
     A few quick answers. Final level comes after training type.
    </p>

    <div style={styles.card}>
     <div style={styles.formGrid(isMobile)}>
      <SelectField
       label="Trained before?"
       value={priorExerciseExperience}
       options={priorExperienceOptions}
       onChange={handlePriorExperienceChange}
       error={errors.priorExerciseExperience}
      />

      <MultiSelectField
       label="Past activity"
       selectedValues={priorExerciseActivity}
       options={priorActivityOptions}
       onToggle={handlePriorActivityChange}
       error={errors.priorExerciseActivity}
       disabled={!hasPriorExperience}
       placeholder="Select activities"
      />

      <SelectField
       label="Experience span"
       value={priorExerciseDuration}
       options={experienceDurationOptions}
       onChange={handlePriorDurationChange}
       error={errors.priorExerciseDuration}
       disabled={!hasPriorExperience}
      />

      <SelectField
       label="Last active"
       value={lastExerciseTime}
       options={lastExerciseTimeOptions}
       onChange={handleLastExerciseTimeChange}
       error={errors.lastExerciseTime}
       disabled={!hasPriorExperience}
      />
     </div>

     <div style={styles.buttonRow}>
      <PrimaryButton
       title="Continue"
       onClick={handleContinue}
      />
     </div>
    </div>
   </div>

  </Container>

 )
}

interface SelectFieldProps {
 label: string
 value: string
 options: Array<{ label: string; value: string }>
 onChange: (value: string) => void
 error?: string
 disabled?: boolean
}

interface MultiSelectFieldProps {
 label: string
 selectedValues: string[]
 options: Array<{ label: string; value: string }>
 onToggle: (value: string) => void
 error?: string
 disabled?: boolean
 placeholder?: string
}

function SelectField({
 label,
 value,
 options,
 onChange,
 error,
 disabled = false
}: SelectFieldProps) {
 return (
  <div style={{ marginBottom: spacing.md }}>
   <label style={styles.fieldLabel}>
    {label}
   </label>

   <select
    value={value}
    onChange={(event) => onChange(event.target.value)}
    disabled={disabled}
    style={{
     ...styles.select,
     border: `1px solid ${error ? "#D97C6C" : colors.border}`,
     opacity: disabled ? 0.55 : 1,
     cursor: disabled ? "not-allowed" : "pointer"
    }}
   >
    {options.map((option) => (
     <option
      key={option.value || option.label}
      value={option.value}
      style={{ color: "#111827" }}
     >
      {option.label}
     </option>
    ))}
   </select>

   {error && (
    <p style={styles.errorText}>
     {error}
    </p>
   )}
  </div>
 )
}

function MultiSelectField({
 label,
 selectedValues,
 options,
 onToggle,
 error,
 disabled = false,
 placeholder = "Select"
}: MultiSelectFieldProps) {
 const [open, setOpen] = useState(false)
 const fieldRef = useRef<HTMLDivElement | null>(null)

 useEffect(() => {
  const handlePointerDown = (event: PointerEvent) => {
   if (!(event.target instanceof Node)) {
    return
   }

   if (fieldRef.current && !fieldRef.current.contains(event.target)) {
    setOpen(false)
   }
  }

  document.addEventListener("pointerdown", handlePointerDown)

  return () => {
   document.removeEventListener("pointerdown", handlePointerDown)
  }
 }, [])

 const summaryText = selectedValues.length > 0 ? selectedValues.join(", ") : placeholder

 return (
  <div
   ref={fieldRef}
   style={{
    marginBottom: spacing.md,
    position: "relative"
   }}
  >
   <label style={styles.fieldLabel}>
    {label}
   </label>

   <button
    type="button"
    onClick={() => {
     if (disabled) {
      return
     }

     setOpen((current) => !current)
    }}
    disabled={disabled}
    style={{
     ...styles.select,
     ...styles.dropdownTrigger,
     border: `1px solid ${error ? "#D97C6C" : colors.border}`,
     opacity: disabled ? 0.55 : 1,
     cursor: disabled ? "not-allowed" : "pointer"
    }}
   >
    <span
     style={{
      ...styles.dropdownValue,
      color: selectedValues.length > 0 ? colors.textPrimary : colors.textMuted
     }}
    >
     {summaryText}
    </span>

    <svg
     aria-hidden="true"
     viewBox="0 0 24 24"
     fill="none"
     stroke="currentColor"
     strokeWidth="1.8"
     strokeLinecap="round"
     strokeLinejoin="round"
     style={{
      width: "16px",
      height: "16px",
      color: colors.textSecondary,
      transform: open ? "rotate(180deg)" : "rotate(0deg)",
      transition: "transform 0.18s ease"
     }}
    >
     <path d="M6 9l6 6 6-6" />
    </svg>
   </button>

   {open && !disabled && (
    <div style={styles.dropdownMenu}>
     {options.map((option) => {
      const isSelected = selectedValues.includes(option.value)

      return (
       <button
        key={option.value}
        type="button"
        onClick={() => {
         onToggle(option.value)
        }}
        style={{
         ...styles.dropdownOption,
         background: isSelected ? "rgba(200,169,108,0.14)" : "transparent",
         color: colors.textPrimary
        }}
       >
        <span style={{ flex: 1, textAlign: "left" }}>
         {option.label}
        </span>
        <span
         aria-hidden="true"
         style={{
          width: "18px",
          textAlign: "center",
          color: isSelected ? colors.primaryLight : "transparent",
          fontWeight: 700
         }}
        >
         ✓
        </span>
       </button>
      )
     })}
    </div>
   )}

   {error && (
    <p style={styles.errorText}>
     {error}
    </p>
   )}
  </div>
 )
}

const styles = {
 wrapper: {
  width: "min(100%, 720px)",
  margin: "0 auto"
 },
 card: {
  padding: "20px",
  border: `1px solid ${colors.border}`,
  borderRadius: radius.lg,
  background: "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))"
 },
 formGrid: (isMobile: boolean) => ({
  display: "grid",
  gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
  columnGap: spacing.md,
  rowGap: "2px"
 }),
 fieldLabel: {
  display: "block",
  marginBottom: "6px",
  color: colors.textSecondary,
  letterSpacing: "0.14em",
  textTransform: "uppercase" as const,
  fontWeight: 700,
  fontSize: "12px",
  lineHeight: 1.4
 },
 select: {
  width: "100%",
  padding: "13px 14px",
  borderRadius: radius.md,
  outline: "none",
  background: "linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))",
  color: colors.textPrimary,
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.04)",
  fontSize: "15px"
 },
 dropdownTrigger: {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "12px",
  textAlign: "left" as const
 },
 dropdownValue: {
  flex: 1,
  minWidth: 0,
  fontSize: "15px",
  lineHeight: 1.45,
  whiteSpace: "normal" as const,
  wordBreak: "break-word" as const
 },
 dropdownMenu: {
  position: "absolute" as const,
  top: "calc(100% + 8px)",
  left: 0,
  right: 0,
  zIndex: 20,
  padding: "8px",
  borderRadius: radius.md,
  border: `1px solid ${colors.border}`,
  background: "linear-gradient(180deg, rgba(13,23,29,0.98), rgba(10,17,23,0.98))",
  boxShadow: "0 18px 36px rgba(0,0,0,0.26)",
  maxHeight: "240px",
  overflowY: "auto" as const
 },
 dropdownOption: {
  width: "100%",
  minHeight: "44px",
  padding: "10px 12px",
  borderRadius: radius.sm,
  border: "none",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  textAlign: "left" as const,
  fontSize: "13px",
  fontWeight: 700,
  lineHeight: 1.4,
  cursor: "pointer"
 },
 errorText: {
  marginTop: "6px",
  fontSize: "12px",
  color: "#F1A596",
  lineHeight: 1.5
 },
 buttonRow: {
  display: "flex",
  justifyContent: "center" as const
 }
}
