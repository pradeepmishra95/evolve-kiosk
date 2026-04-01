export const normalizePhoneNumber = (value: string) => {
 const digits = value.replace(/\D/g, "")

 if (digits.length === 12 && digits.startsWith("91")) {
  return digits.slice(2)
 }

 if (digits.length === 11 && digits.startsWith("0")) {
  return digits.slice(1)
 }

 return digits
}

export const validatePhoneNumber = (value: string) => {
 const normalizedPhone = normalizePhoneNumber(value)

 if (!normalizedPhone) {
  return {
   isValid: false,
   normalizedPhone,
   error: "Phone number is required."
  }
 }

 if (!/^\d{10}$/.test(normalizedPhone)) {
  return {
   isValid: false,
   normalizedPhone,
   error: "Enter a valid 10-digit phone number."
  }
 }

 return {
  isValid: true,
  normalizedPhone,
  error: ""
 }
}

export const validateName = (value: string) => {
 const trimmedName = value.trim()

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
