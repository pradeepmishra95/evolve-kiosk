export interface PhoneCountryCodeOption {
 value: string
 label: string
 flag: string
 countryName: string
 dialCodeDigits: string
 minLength: number
 maxLength: number
}

export interface PhoneValidationResult {
 isValid: boolean
 normalizedPhone: string
 error: string
 countryCode: string
 countryName: string
 dialCodeDigits: string
 phoneWithCountryCode: string
 formattedPhoneNumber: string
}

export const PHONE_COUNTRY_CODE_OPTIONS = [
 {
  value: "+91",
  label: "+91",
  flag: "🇮🇳",
  countryName: "India",
  dialCodeDigits: "91",
  minLength: 10,
  maxLength: 10
 }
] as const satisfies readonly PhoneCountryCodeOption[]

const INDIA_MOBILE_NUMBER_PATTERN = /^[6-9]\d{9}$/

export const DEFAULT_PHONE_COUNTRY_CODE = PHONE_COUNTRY_CODE_OPTIONS[0].value

export const normalizeCountryCode = (value?: string) => {
 const digits = value?.trim().replace(/\D/g, "") ?? ""

 if (!digits) {
  return DEFAULT_PHONE_COUNTRY_CODE
 }

 const normalized = `+${digits}`

 return PHONE_COUNTRY_CODE_OPTIONS.some((option) => option.value === normalized)
  ? normalized
  : DEFAULT_PHONE_COUNTRY_CODE
}

export const getPhoneCountryCodeOption = (countryCode?: string) =>
 PHONE_COUNTRY_CODE_OPTIONS.find((option) => option.value === normalizeCountryCode(countryCode)) ??
 PHONE_COUNTRY_CODE_OPTIONS[0]

export const detectPhoneCountryCode = (value: string) => {
 const trimmed = value.trim()

 if (!trimmed.startsWith("+") && !trimmed.startsWith("00")) {
  return null
 }

 const internationalDigits = trimmed.startsWith("+")
  ? trimmed.slice(1).replace(/\D/g, "")
  : trimmed.slice(2).replace(/\D/g, "")

 if (!internationalDigits) {
  return null
 }

 const match = [...PHONE_COUNTRY_CODE_OPTIONS]
  .sort((a, b) => b.dialCodeDigits.length - a.dialCodeDigits.length)
  .find((option) => internationalDigits.startsWith(option.dialCodeDigits))

 return match?.value ?? null
}

export const normalizePhoneNumber = (value: string, countryCode: string = DEFAULT_PHONE_COUNTRY_CODE) => {
 const trimmed = value.trim()

 if (!trimmed) {
  return ""
 }

 const digits = trimmed.replace(/\D/g, "")

 if (!digits) {
  return ""
 }

 const detectedCountryCode = detectPhoneCountryCode(trimmed)
 const phoneCountryCode = getPhoneCountryCodeOption(detectedCountryCode ?? countryCode)

 if (trimmed.startsWith("+") || trimmed.startsWith("00")) {
  const internationalDigits = trimmed.startsWith("+")
   ? trimmed.slice(1).replace(/\D/g, "")
   : trimmed.slice(2).replace(/\D/g, "")

  if (internationalDigits.startsWith(phoneCountryCode.dialCodeDigits)) {
   return internationalDigits.slice(phoneCountryCode.dialCodeDigits.length)
  }

  return internationalDigits
 }

 if (phoneCountryCode.value === DEFAULT_PHONE_COUNTRY_CODE && digits.length === 11 && digits.startsWith("0")) {
  return digits.slice(1)
 }

 return digits
}

export const validatePhoneNumber = (
 value: string,
 countryCode: string = DEFAULT_PHONE_COUNTRY_CODE
): PhoneValidationResult => {
 const detectedCountryCode = detectPhoneCountryCode(value)
 const countryCodeOption = getPhoneCountryCodeOption(detectedCountryCode ?? countryCode)
 const normalizedPhone = normalizePhoneNumber(value, countryCodeOption.value)
 const phoneWithCountryCode = normalizedPhone ? `${countryCodeOption.dialCodeDigits}${normalizedPhone}` : ""
 const formattedPhoneNumber = normalizedPhone ? `+${countryCodeOption.dialCodeDigits} ${normalizedPhone}` : ""

 if (!normalizedPhone) {
  return {
   isValid: false,
   normalizedPhone,
   error: "Please enter your mobile number.",
   countryCode: countryCodeOption.value,
   countryName: countryCodeOption.countryName,
   dialCodeDigits: countryCodeOption.dialCodeDigits,
   phoneWithCountryCode,
   formattedPhoneNumber
  }
 }

 if (!/^\d+$/.test(normalizedPhone)) {
  return {
   isValid: false,
   normalizedPhone,
   error: "Please enter a valid mobile number.",
   countryCode: countryCodeOption.value,
   countryName: countryCodeOption.countryName,
   dialCodeDigits: countryCodeOption.dialCodeDigits,
   phoneWithCountryCode,
   formattedPhoneNumber
  }
 }

 if (normalizedPhone.length < countryCodeOption.minLength || normalizedPhone.length > countryCodeOption.maxLength) {
  return {
   isValid: false,
   normalizedPhone,
   error: "Please enter a valid mobile number.",
   countryCode: countryCodeOption.value,
   countryName: countryCodeOption.countryName,
   dialCodeDigits: countryCodeOption.dialCodeDigits,
   phoneWithCountryCode,
   formattedPhoneNumber
  }
 }

 if (countryCodeOption.value === "+91" && !INDIA_MOBILE_NUMBER_PATTERN.test(normalizedPhone)) {
  return {
   isValid: false,
   normalizedPhone,
   error: "Please enter a valid mobile number.",
   countryCode: countryCodeOption.value,
   countryName: countryCodeOption.countryName,
   dialCodeDigits: countryCodeOption.dialCodeDigits,
   phoneWithCountryCode,
   formattedPhoneNumber
  }
 }

 return {
  isValid: true,
  normalizedPhone,
  error: "",
  countryCode: countryCodeOption.value,
  countryName: countryCodeOption.countryName,
  dialCodeDigits: countryCodeOption.dialCodeDigits,
  phoneWithCountryCode,
  formattedPhoneNumber
 }
}

export const getPhoneDocumentId = (phone: string, countryCode: string = DEFAULT_PHONE_COUNTRY_CODE) => {
 const validation = validatePhoneNumber(phone, countryCode)

 if (validation.countryCode === DEFAULT_PHONE_COUNTRY_CODE) {
  return validation.normalizedPhone
 }

 return validation.phoneWithCountryCode
}

export const formatPhoneNumber = (phone: string, countryCode: string = DEFAULT_PHONE_COUNTRY_CODE) => {
 const validation = validatePhoneNumber(phone, countryCode)

 return validation.formattedPhoneNumber
}

export const normalizeText = (value: string) => value.replace(/\s+/g, " ").trim()

export const validateName = (value: string) => {
 const trimmedName = normalizeText(value)

 if (!trimmedName) {
  return {
   isValid: false,
   trimmedName,
   error: "Full name is required."
  }
 }

 if (trimmedName.length < 2) {
  return {
   isValid: false,
   trimmedName,
   error: "Name must be at least 2 characters."
  }
 }

 if (!/^[A-Za-z]+(?:[ .'-][A-Za-z]+)*$/.test(trimmedName)) {
  return {
   isValid: false,
   trimmedName,
   error: "Enter a valid full name using letters only."
  }
 }

 return {
  isValid: true,
  trimmedName,
  error: ""
 }
}

export const validateOptionalGoal = (value: string) => {
 const trimmedGoal = normalizeText(value)

 if (!trimmedGoal) {
  return {
   isValid: true,
   trimmedGoal,
   error: ""
  }
 }

 if (trimmedGoal.length < 3) {
  return {
   isValid: false,
   trimmedGoal,
   error: "Goal must be at least 3 characters."
  }
 }

 return {
  isValid: true,
  trimmedGoal,
  error: ""
 }
}

export const validateOptionalMessage = (value: string) => {
 const trimmedMessage = normalizeText(value)

 if (!trimmedMessage) {
  return {
   isValid: true,
   trimmedMessage,
   error: ""
  }
 }

 if (trimmedMessage.length < 5) {
  return {
   isValid: false,
   trimmedMessage,
   error: "Message must be at least 5 characters."
  }
 }

 return {
  isValid: true,
  trimmedMessage,
  error: ""
 }
}

export const validateAge = (value: number | null) => {
 if (value === null || Number.isNaN(value)) {
  return {
   isValid: false,
   error: "Age is required."
  }
 }

 if (!Number.isInteger(value) || value < 5 || value > 100) {
  return {
   isValid: false,
   error: "Enter a valid age between 5 and 100."
  }
 }

 return {
  isValid: true,
  error: ""
 }
}

export const validateInjuryDetails = (value: string) => {
 const trimmedDetails = normalizeText(value)

 if (!trimmedDetails) {
  return {
   isValid: false,
   trimmedDetails,
   error: "Please describe the injury."
  }
 }

 if (trimmedDetails.length < 5) {
  return {
   isValid: false,
   trimmedDetails,
   error: "Please add a few more details about the injury."
  }
 }

 return {
  isValid: true,
  trimmedDetails,
  error: ""
 }
}
