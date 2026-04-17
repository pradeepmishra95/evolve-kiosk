export const normalizeLabel = (value: string) =>
 value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "")

export const matchesLabel = (left: string, right: string) => {
 const normalizedLeft = normalizeLabel(left)
 const normalizedRight = normalizeLabel(right)

 if (!normalizedLeft || !normalizedRight) {
  return false
 }

 return (
  normalizedLeft === normalizedRight ||
  normalizedLeft.includes(normalizedRight) ||
  normalizedRight.includes(normalizedLeft)
 )
}

export const includesLabel = (value: string, target: string) => {
 const normalizedValue = normalizeLabel(value)
 const normalizedTarget = normalizeLabel(target)

 if (!normalizedValue || !normalizedTarget) {
  return false
 }

 return normalizedValue.includes(normalizedTarget)
}

export const isPersonalTrainingLabel = (value: string) =>
 includesLabel(value, "personaltraining")
