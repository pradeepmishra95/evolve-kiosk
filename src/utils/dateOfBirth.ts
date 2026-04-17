import { toDateInputValue } from "./dateTimeSelector"

const DOB_INPUT_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const MIN_DATE_OF_BIRTH = new Date(1945, 0, 1)
const DEFAULT_MINIMUM_AGE = 5

export const calculateAgeFromDateOfBirth = (value: string, referenceDate = new Date()) => {
 if (!value || !DOB_INPUT_PATTERN.test(value)) {
  return null
 }

 const dateOfBirth = new Date(`${value}T00:00:00`)

 if (Number.isNaN(dateOfBirth.getTime())) {
  return null
 }

 let age = referenceDate.getFullYear() - dateOfBirth.getFullYear()
 const monthDifference = referenceDate.getMonth() - dateOfBirth.getMonth()

 if (
  monthDifference < 0 ||
  (monthDifference === 0 && referenceDate.getDate() < dateOfBirth.getDate())
 ) {
  age -= 1
 }

 return age
}

const getMaximumDateOfBirth = (referenceDate = new Date(), minimumAge = DEFAULT_MINIMUM_AGE) => {
 const maxDate = new Date(referenceDate)
 maxDate.setHours(0, 0, 0, 0)
 maxDate.setFullYear(maxDate.getFullYear() - minimumAge)

 return maxDate
}

export const validateDateOfBirth = (value: string, referenceDate = new Date()) => {
 const normalizedDateOfBirth = value.trim()

 if (!normalizedDateOfBirth) {
  return {
   isValid: false,
   normalizedDateOfBirth,
   age: null,
   error: "Date of birth is required."
  }
 }

 const age = calculateAgeFromDateOfBirth(normalizedDateOfBirth)

 if (age === null) {
  return {
   isValid: false,
   normalizedDateOfBirth,
   age: null,
   error: "Enter a valid date of birth."
  }
 }

 const dateOfBirth = new Date(`${normalizedDateOfBirth}T00:00:00`)
 const minimumDate = new Date(MIN_DATE_OF_BIRTH)
 minimumDate.setHours(0, 0, 0, 0)
 const maximumDate = getMaximumDateOfBirth(referenceDate)

 if (dateOfBirth < minimumDate || dateOfBirth > maximumDate) {
  return {
   isValid: false,
   normalizedDateOfBirth,
   age,
   error: "Select a valid date of birth from 1 Jan 1945 to 5 years ago."
  }
 }

 return {
  isValid: true,
  normalizedDateOfBirth,
  age,
  error: ""
 }
}

export const getDateOfBirthBounds = (referenceDate = new Date()) => {
 const minDate = new Date(MIN_DATE_OF_BIRTH)
 minDate.setHours(0, 0, 0, 0)
 const maxDate = getMaximumDateOfBirth(referenceDate)

 return {
  min: toDateInputValue(minDate),
  max: toDateInputValue(maxDate)
 }
}

export const formatDateOfBirth = (value: string) => {
 if (!value) {
  return "-"
 }

 const date = new Date(`${value}T00:00:00`)

 if (Number.isNaN(date.getTime())) {
  return value
 }

 return new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric"
 }).format(date)
}
