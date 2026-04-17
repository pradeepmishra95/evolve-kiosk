import { collection, onSnapshot, type DocumentData, type QueryDocumentSnapshot } from "firebase/firestore"
import { db } from "@/firebase/firebase"
import { normalizeLabel } from "../utils/labelMatch"
import { normalizeDurationLabel } from "../utils/planSchedule"
import type { PersonalTrainingCoach, PlanPricing, ProgramPlan } from "../types/domain"

export interface CatalogBenefitItem {
 id: string
 name: string
 benefits: string[]
 order?: number
}

export interface CatalogTrainingType extends CatalogBenefitItem {
 bestFor: string
 summary: string
 description: string
 exercises: string[]
 planNames?: string[]
 planCount?: number
 disabled?: boolean
 availabilityLabel?: string
}

export interface CatalogPersonalTrainingCoach extends PersonalTrainingCoach {
 id: string
 order?: number
}

export interface PlanCatalogData {
 trainingTypes: CatalogTrainingType[]
 programs: CatalogBenefitItem[]
 adultPlans: ProgramPlan[]
 kidsPlans: ProgramPlan[]
 personalTraining: CatalogPersonalTrainingCoach[]
}

type PlanCatalogBucket = "trainingTypes" | "programs" | "plans" | "adultPlans" | "kidsPlans" | "personalTraining" | null

const getString = (value: unknown) => (typeof value === "string" ? value.trim() : "")

const getBoolean = (value: unknown) => {
 if (typeof value === "boolean") {
  return value
 }

 if (typeof value === "string") {
  const normalized = value.trim().toLowerCase()

  return normalized === "true" || normalized === "yes" || normalized === "1"
 }

 return false
}

const getNumber = (value: unknown) => {
 if (typeof value === "number" && Number.isFinite(value)) {
  return value
 }

 if (typeof value === "string" && value.trim()) {
  const parsed = Number(value)

  if (Number.isFinite(parsed)) {
   return parsed
  }

  const cleanedValue = value.replace(/[^0-9.-]+/g, "")
  const cleanedParsed = Number(cleanedValue)

  return Number.isFinite(cleanedParsed) ? cleanedParsed : null
 }

 return null
}

const getStringArray = (value: unknown) => {
 if (typeof value === "string") {
  return value
   .split(/[\n,|/]+/)
   .map((item) => getString(item))
   .filter((item) => Boolean(item))
 }

 if (!Array.isArray(value)) {
  return []
 }

 return value
  .map((item) => getString(item))
  .filter((item) => Boolean(item))
}

const getPricingArray = (value: unknown): PlanPricing[] => {
 const parsePricingObject = (pricingObject: Record<string, unknown>) => {
  const parsedPricing: PlanPricing[] = []

  Object.entries(pricingObject).forEach(([durationKey, rawValue]) => {
   if (rawValue === null || rawValue === undefined) {
    return
   }

   if (typeof rawValue === "number" || typeof rawValue === "string") {
    const price = getNumber(rawValue)

    if (price !== null && durationKey.trim()) {
     parsedPricing.push({
      duration: normalizeDurationLabel(durationKey) as PlanPricing["duration"],
      price
     })
    }

    return
   }

   if (typeof rawValue === "object" && !Array.isArray(rawValue)) {
    const raw = rawValue as Record<string, unknown>
    const durationValue = getString(raw.duration ?? raw.name ?? raw.label) || durationKey
    const duration = durationValue ? normalizeDurationLabel(durationValue) : ""
    const price = getNumber(raw.price ?? raw.basePrice ?? raw.amount ?? raw.value ?? raw.cost)

    if (!duration || price === null) {
     return
    }

    const pricing: PlanPricing = {
     duration: duration as PlanPricing["duration"],
     price
    }
    const originalPrice = getNumber(
     raw.originalPrice ?? raw.baseOriginalPrice ?? raw.mrp ?? raw.regularPrice
    )

    if (originalPrice !== null) {
     pricing.originalPrice = originalPrice
    }

    parsedPricing.push(pricing)
   }
  })

  return parsedPricing
 }

 if (!Array.isArray(value) && !getObject(value)) {
  return []
 }

 const rawPricingItems = Array.isArray(value)
  ? value
  : parsePricingObject(value as Record<string, unknown>)

 return dedupePricingByDuration(
  rawPricingItems
   .map((item) => {
    if (!item || typeof item !== "object") {
     return null
    }

    const raw = item as Record<string, unknown>
    const durationValue = getString(raw.duration ?? raw.name ?? raw.label ?? raw.plan)
    const duration = durationValue ? normalizeDurationLabel(durationValue) : ""
    const price = getNumber(raw.price ?? raw.basePrice ?? raw.amount ?? raw.value ?? raw.cost)

    if (!duration || price === null) {
     return null
    }

    const pricing: PlanPricing = {
     duration: duration as PlanPricing["duration"],
     price
    }
    const originalPrice = getNumber(
     raw.originalPrice ?? raw.baseOriginalPrice ?? raw.mrp ?? raw.regularPrice
    )

    if (originalPrice !== null) {
     pricing.originalPrice = originalPrice
    }

    return pricing
   })
   .filter((item): item is PlanPricing => item !== null)
 )
}

const getOrder = (data: Record<string, unknown>, fallbackOrder: number) => {
 const order = getNumber(data.order ?? data.sortOrder ?? data.position ?? data.priority)

 return order === null ? fallbackOrder : order
}

const getAudience = (data: Record<string, unknown>, name = "", tags: string[] = []) => {
 const explicit = getString(
  data.audience ?? data.ageGroup ?? data.targetAudience ?? data.segment ?? data.forAge ?? data.forGroup
 ).toLowerCase()

 if (explicit.includes("kid") || explicit.includes("child") || explicit.includes("junior")) {
  return "kids" as const
 }

 if (explicit.includes("adult") || explicit.includes("teen") || explicit.includes("all")) {
  return "adult" as const
 }

 const inferredFromName = inferAudienceFromName(name)

 if (inferredFromName) {
  return inferredFromName
 }

 const inferredFromTags = inferAudienceFromTags(tags)

 if (inferredFromTags) {
  return inferredFromTags
 }

 const minAge = getNumber(data.minAge ?? data.ageMin ?? data.minimumAge)
 const maxAge = getNumber(data.maxAge ?? data.ageMax ?? data.maximumAge)

 if (maxAge !== null && maxAge <= 12) {
  return "kids" as const
 }

 if (minAge !== null && minAge > 12) {
  return "adult" as const
 }

 return null
}

const hasPersonalTrainingFields = (data: Record<string, unknown>) =>
 data.perSession !== undefined ||
 data.sessionPrice !== undefined ||
 data.pricePerSession !== undefined ||
 data.packageSessions !== undefined ||
 data.packagePrice !== undefined ||
 data.bundlePrice !== undefined

const hasPlanFields = (data: Record<string, unknown>) =>
 Array.isArray(data.pricing) ||
 data.days !== undefined ||
 data.schedule !== undefined ||
 data.experienceLevels !== undefined ||
 data.allowedExperienceLevels !== undefined

const hasTrainingTypeFields = (data: Record<string, unknown>) =>
 data.bestFor !== undefined ||
 data.summary !== undefined ||
 data.description !== undefined ||
 data.exercises !== undefined

const hasProgramFields = (data: Record<string, unknown>) =>
 data.benefits !== undefined || data.highlights !== undefined || data.points !== undefined

const normalizeBucketHint = (value: unknown) => getString(value).toLowerCase().replace(/[^a-z0-9]+/g, "")

const getObject = (value: unknown) =>
 value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null

const isExplicitlyInactive = (data: Record<string, unknown>) =>
 data.active !== undefined && !getBoolean(data.active)

const getScheduleDays = (data: Record<string, unknown>) => {
 const schedule = getObject(data.schedule)

 return getStringArray(schedule?.days ?? data.days)
}

const getScheduleTimings = (data: Record<string, unknown>) => {
 const schedule = getObject(data.schedule)

 return getStringArray(schedule?.timings ?? data.timings)
}

const getPlanOfferPrice = (data: Record<string, unknown>) =>
 getNumber(data.price ?? data.basePrice ?? data.amount ?? data.value ?? data.cost)

const getPlanOriginalPrice = (data: Record<string, unknown>) =>
 getNumber(data.originalPrice ?? data.baseOriginalPrice ?? data.mrp ?? data.regularPrice)

const getTags = (data: Record<string, unknown>) => getStringArray(data.tags)

const formatProgramLabel = (program: string) => {
 const slug = normalizeLabel(program)

 switch (slug) {
  case "mma":
  case "mixedmartialart":
  case "mixedmartialarts":
   return "MMA"
  case "calisthenics":
   return "Calisthenics"
  case "parkour":
   return "Parkour"
  case "yoga":
   return "Yoga"
  case "zumba":
   return "Zumba"
  default:
   return program
    .trim()
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ")
 }
}

const inferAudienceFromTags = (tags: string[]) => {
 const normalizedTags = tags.map((tag) => normalizeLabel(tag))

 if (normalizedTags.some((tag) => tag.includes("kid") || tag.includes("child") || tag.includes("junior"))) {
  return "kids" as const
 }

 if (normalizedTags.some((tag) => tag.includes("adult") || tag.includes("teen"))) {
  return "adult" as const
 }

 return null
}

const inferAudienceFromName = (name: string) => {
 const normalized = normalizeLabel(name)

 if (normalized.includes("kid") || normalized.includes("child") || normalized.includes("junior")) {
  return "kids" as const
 }

 if (normalized.includes("adult") || normalized.includes("teen")) {
  return "adult" as const
 }

 return null
}

const inferTypeFromTags = (tags: string[], name: string) => {
 const normalized = [...tags, name].map((value) => normalizeLabel(value))

 if (normalized.some((item) => item.includes("personal"))) {
  return "personal" as const
 }

 return undefined
}

const inferExperienceLevelsFromTags = (tags: string[]) => {
 const normalizedTags = tags.map((tag) => normalizeLabel(tag))
 const levels = [
  normalizedTags.some((tag) => tag.includes("beginner")) ? "Beginner" : null,
  normalizedTags.some((tag) => tag.includes("intermediate")) ? "Intermediate" : null,
  normalizedTags.some((tag) => tag.includes("advance") || tag.includes("advanced")) ? "Advance" : null
 ]

 return levels.filter((level): level is string => Boolean(level))
}

const normalizeExperienceLevel = (value: string): string | null => {
 const normalized = normalizeLabel(value)

 if (!normalized) {
  return null
 }

 if (normalized.includes("all") || normalized.includes("regular") || normalized.includes("general")) {
  return "all"
 }

 if (normalized.includes("begin")) {
  return "Beginner"
 }

 if (normalized.includes("inter")) {
  return "Intermediate"
 }

 if (normalized.includes("advance") || normalized.includes("expert")) {
  return "Advance"
 }

 return null
}

const getExperienceLevels = (data: Record<string, unknown>) => {
 const rawLevels = [
  ...getStringArray(data.experienceLevels ?? data.allowedExperienceLevels ?? data.levels),
  getString(data.level ?? data.batchLevel ?? data.difficulty)
 ].filter(Boolean)
 const normalizedLevels = joinUnique(
  rawLevels
   .map((item) => normalizeExperienceLevel(item))
   .filter((item): item is string => Boolean(item))
 )

 if (normalizedLevels.includes("all")) {
  return []
 }

 return normalizedLevels
}

const rankDuration = (duration: string) => {
 const normalized = normalizeLabel(normalizeDurationLabel(duration))
 const order = [
  "1day",
  "1session",
  "freetrial",
  "monthly",
  "quarterly",
  "halfyearly",
  "yearly"
 ]
 const index = order.findIndex((item) => normalized.includes(item))

 return index === -1 ? order.length : index
}

const joinUnique = (items: string[]) => [...new Set(items.map((item) => item.trim()).filter(Boolean))]

const dedupePricingByDuration = (pricing: PlanPricing[]) => {
 const seen = new Set<string>()

 return pricing.filter((item) => {
  const durationKey = normalizeLabel(item.duration)

  if (seen.has(durationKey)) {
   return false
  }

  seen.add(durationKey)
  return true
 })
}

interface RawPlanEntry {
 id: string
 name: string
 program: string
 duration: string
 price: number
 originalPrice?: number
 days: string[]
 timings: string[]
 tags: string[]
 audience: "adult" | "kids" | null
 order: number
}

const parseRawPlanEntry = (data: Record<string, unknown>, id: string, order: number): RawPlanEntry | null => {
 if (isExplicitlyInactive(data)) {
  return null
 }

 const name = getString(data.name ?? data.title ?? data.label)
 const program = getString(data.program ?? data.slug ?? data.type ?? data.category)
 const pricing = getPricingArray(data.pricing ?? data.packages ?? data.options)
 const durationValue = getString(data.duration) || pricing[0]?.duration || ""
 const price = getPlanOfferPrice(data) ?? pricing[0]?.price ?? null
 const tags = getTags(data)
 const audience = getAudience(data, name, tags)

 if (!name || !program || !durationValue || price === null) {
  return null
 }

 return {
  id,
  name,
  program,
  duration: normalizeDurationLabel(durationValue),
  price,
  originalPrice: getPlanOriginalPrice(data) ?? undefined,
  days: getScheduleDays(data),
  timings: getScheduleTimings(data),
  tags,
  audience,
  order
 }
}

const getPlanAudience = (entry: RawPlanEntry) => entry.audience ?? inferAudienceFromTags(entry.tags)

const buildTrainingCatalogFromRawEntries = (entries: RawPlanEntry[]) => {
 const groupedByProgram = new Map<string, RawPlanEntry[]>()

 entries.forEach((entry) => {
  const programKey = normalizeLabel(entry.program)
  const list = groupedByProgram.get(programKey) || []
  list.push(entry)
  groupedByProgram.set(programKey, list)
 })

 const trainingTypes = [...groupedByProgram.entries()].map(([programKey, programEntries], index) => {
  const label = formatProgramLabel(programEntries[0]?.program || programKey)
  const planNames = joinUnique(programEntries.map((item) => item.name))
  const tags = joinUnique(programEntries.flatMap((item) => item.tags))
  const sessionCount = programEntries.length
  const summary = `${label} is a structured training program focused on guided practice and steady progression.`
  const description = `${label} program overview with coaching focus, skill development, and progression.`
  const benefits = [
   `${label} builds strength, confidence, and movement quality`,
   `Supports steady progression with guided coaching`,
   `Helps members develop consistency and body control`
  ]

  return {
   id: programKey || `program-${index + 1}`,
   name: label,
   bestFor: `${label} program`,
   summary,
   description,
   benefits,
   exercises: tags.length > 0 ? tags : [label],
   planNames,
   planCount: sessionCount,
   disabled: false,
   availabilityLabel: "",
   order: programEntries[0]?.order ?? index + 1
  }
  })

 const programs = trainingTypes.map((item) => ({
  id: item.id,
  name: item.name,
  benefits: item.benefits,
  order: item.order
 }))

 const groupedByPlan = new Map<string, RawPlanEntry[]>()

 entries.forEach((entry) => {
  const audienceKey = entry.audience ?? "unknown"
  const planKey = `${normalizeLabel(entry.name)}::${normalizeLabel(entry.program)}::${audienceKey}`
  const list = groupedByPlan.get(planKey) || []
  list.push(entry)
  groupedByPlan.set(planKey, list)
 })

 const plans = [...groupedByPlan.entries()].map(([, planEntries], index) => {
  const name = planEntries[0]?.name || `Plan ${index + 1}`
  const pricing = dedupePricingByDuration(
   planEntries
    .slice()
    .sort((left, right) => rankDuration(left.duration) - rankDuration(right.duration))
    .map((item) => ({
     duration: normalizeDurationLabel(item.duration) as PlanPricing["duration"],
     price: item.price,
     originalPrice: item.originalPrice
    }))
  )

  const scheduleDays = joinUnique(planEntries.flatMap((item) => item.days))
  const timings = joinUnique(planEntries.flatMap((item) => item.timings))
  const tags = joinUnique(planEntries.flatMap((item) => item.tags))
  const planType = inferTypeFromTags(tags, name)
  const audience =
   planEntries.some((entry) => entry.audience === "kids")
    ? "kids"
    : planEntries.some((entry) => entry.audience === "adult")
     ? "adult"
     : getPlanAudience(planEntries[0])
  const experienceLevels = inferExperienceLevelsFromTags(tags)
  const program = planEntries[0]?.program || ""

  return {
   id: planEntries[0]?.id || `plan-${index + 1}`,
   name,
   days: scheduleDays.length > 0 ? scheduleDays.join(", ") : "",
   scheduleDays: scheduleDays.length > 0 ? scheduleDays : undefined,
   timings: timings.length > 0 ? timings : undefined,
   pricing: pricing.length > 0 ? pricing : undefined,
   type: planType,
   audience: audience ?? undefined,
   experienceLevels: experienceLevels.length > 0 ? experienceLevels : undefined,
   order: planEntries[0]?.order ?? index + 1,
   program,
   tags,
   active: true
  } satisfies ProgramPlan
 })

 const adultPlans = plans.filter((plan) => plan.audience !== "kids")
 const kidsPlans = plans.filter((plan) => plan.audience === "kids")
 const personalTraining = plans
  .filter((plan) => normalizeLabel(plan.name).includes("personal") || plan.type === "personal")
  .map((plan, index) => ({
   id: plan.id,
   coach: plan.name,
   perSession: plan.pricing?.[0]?.price || 0,
   packageSessions: 12,
   packagePrice: plan.pricing?.[0]?.price || 0,
   order: plan.order ?? index + 1
  }))

 return {
  trainingTypes: sortByOrder(trainingTypes, (item) => item.name),
  programs: sortByOrder(programs, (item) => item.name),
  adultPlans: sortByOrder(adultPlans, (item) => item.name),
  kidsPlans: sortByOrder(kidsPlans, (item) => item.name),
  personalTraining: sortByOrder(personalTraining, (item) => item.coach)
 }
}

const resolveBucket = (data: Record<string, unknown>): PlanCatalogBucket => {
 if (getBoolean(data.hidden) || getBoolean(data.archived)) {
  return null
 }

 const bucketHint = normalizeBucketHint(
  data.kind ?? data.section ?? data.category ?? data.collectionType ?? data.bucket ?? data.group
 )

 if (
  bucketHint === "trainingtype" ||
  bucketHint === "trainingtypes" ||
  bucketHint === "exercisetype" ||
  bucketHint === "exercise"
 ) {
  return "trainingTypes"
 }

 if (
  bucketHint === "program" ||
  bucketHint === "programs" ||
  bucketHint === "programbenefit" ||
  bucketHint === "programbenefits"
 ) {
  return "programs"
 }

 if (
  bucketHint === "adultplan" ||
  bucketHint === "adultplans" ||
  bucketHint === "adultbatch" ||
  bucketHint === "adultbatches"
 ) {
  return "adultPlans"
 }

 if (
  bucketHint === "kidsplan" ||
  bucketHint === "kidsplans" ||
  bucketHint === "kidsbatch" ||
  bucketHint === "kidsbatches"
 ) {
  return "kidsPlans"
 }

 if (
  bucketHint === "personaltraining" ||
  bucketHint === "personaltrainer" ||
  bucketHint === "coach" ||
  bucketHint === "personalcoaching"
 ) {
  return "personalTraining"
 }

 if (bucketHint === "plan" || bucketHint === "plans" || bucketHint === "batch" || bucketHint === "membership") {
  return "plans"
 }

 if (hasPersonalTrainingFields(data)) {
  return "personalTraining"
 }

 if (hasPlanFields(data)) {
  return "plans"
 }

 if (hasTrainingTypeFields(data)) {
  return "trainingTypes"
 }

 if (hasProgramFields(data)) {
  return "programs"
 }

 return null
}

const normalizeTrainingType = (
 data: Record<string, unknown>,
 id: string,
 fallbackOrder: number
): CatalogTrainingType | null => {
 const name = getString(data.name ?? data.title ?? data.label)

 if (!name) {
  return null
 }

 const disabled = getBoolean(data.disabled) || getBoolean(data.isDisabled) || getBoolean(data.available === false)
 const availabilityLabel = getString(
  data.availabilityLabel ?? data.statusLabel ?? data.labelText ?? (disabled ? "Coming Soon" : "")
 )
 const summary = getString(data.summary ?? data.overview ?? data.brief)
 const description = getString(data.description ?? data.details ?? data.info)

 return {
  id,
  name,
  bestFor: getString(data.bestFor ?? data.subtitle ?? data.keyPoint),
  summary:
   summary || `${name} is a structured training program focused on guided practice and steady progression.`,
  description:
   description || `${name} program overview with batch structure, coaching style, and session details.`,
  benefits: getStringArray(data.benefits ?? data.highlights ?? data.points),
  exercises: getStringArray(data.exercises ?? data.movements ?? data.workouts),
  planNames: getStringArray(data.planNames ?? data.planList),
  planCount: getNumber(data.planCount) ?? undefined,
  disabled,
  availabilityLabel: availabilityLabel || (disabled ? "Coming Soon" : ""),
  order: getOrder(data, fallbackOrder)
 }
}

const normalizeProgram = (data: Record<string, unknown>, id: string, fallbackOrder: number): CatalogBenefitItem | null => {
 const name = getString(data.name ?? data.title ?? data.label)

 if (!name) {
  return null
 }

 return {
  id,
  name,
  benefits: getStringArray(data.benefits ?? data.highlights ?? data.points),
  order: getOrder(data, fallbackOrder)
 }
}

const normalizePlan = (data: Record<string, unknown>, id: string, fallbackOrder: number): ProgramPlan | null => {
 const name = getString(data.name ?? data.title ?? data.label)

 if (!name) {
  return null
 }

 const pricing = getPricingArray(data.pricing ?? data.packages ?? data.options)
 const durationValue = getString(data.duration)
 const offerPrice = getPlanOfferPrice(data)
 const originalPrice = getPlanOriginalPrice(data)
 const type = getString(data.type).toLowerCase() === "personal" ? "personal" : undefined
 const tags = getTags(data)
 const audience = getAudience(data, name, tags)
 const normalizedExperienceLevels = getExperienceLevels(data)
 const scheduleDays = getScheduleDays(data)
 const timings = getScheduleTimings(data)
 const displayDays = scheduleDays.length > 0 ? scheduleDays.join(", ") : getString(data.days ?? data.scheduleDays ?? data.weekDays)

 if (pricing.length === 0 && type !== "personal" && durationValue && offerPrice !== null) {
  pricing.push({
   duration: normalizeDurationLabel(durationValue) as PlanPricing["duration"],
   price: offerPrice,
   ...(originalPrice !== null ? { originalPrice } : {})
  })
 }

 if (type !== "personal" && pricing.length === 0) {
  return null
 }

 return {
  id,
  name,
  days: displayDays,
  scheduleDays: scheduleDays.length > 0 ? scheduleDays : undefined,
  timings: timings.length > 0 ? timings : undefined,
  pricing: pricing.length > 0 ? pricing : undefined,
  type,
  audience: audience ?? undefined,
  experienceLevels: normalizedExperienceLevels.length > 0 ? normalizedExperienceLevels : undefined,
  program: getString(data.program ?? data.slug ?? data.category ?? data.type),
  tags,
  order: getOrder(data, fallbackOrder)
 }
}

const normalizePersonalTraining = (
 data: Record<string, unknown>,
 id: string,
 fallbackOrder: number
): CatalogPersonalTrainingCoach | null => {
 const coach = getString(data.coach ?? data.name ?? data.title ?? data.label)
 const perSession = getNumber(data.perSession ?? data.sessionPrice ?? data.pricePerSession ?? data.rate)
 const packageSessions = getNumber(data.packageSessions ?? data.sessions ?? data.bundleSessions)
 const packagePrice = getNumber(data.packagePrice ?? data.bundlePrice ?? data.packageAmount ?? data.packageRate)

 if (!coach || perSession === null || packageSessions === null || packagePrice === null) {
  return null
 }

 return {
  id,
  coach,
  perSession,
  packageSessions,
  packagePrice,
  order: getOrder(data, fallbackOrder)
 }
}

const sortByOrder = <T extends { order?: number }>(items: T[], getLabel: (item: T) => string) =>
 [...items].sort((left, right) => {
  const leftOrder = left.order ?? Number.MAX_SAFE_INTEGER
  const rightOrder = right.order ?? Number.MAX_SAFE_INTEGER

  if (leftOrder !== rightOrder) {
   return leftOrder - rightOrder
  }

  return getLabel(left).localeCompare(getLabel(right))
 })

const mergeUniqueByKey = <T>(primary: T[], secondary: T[], getKey: (item: T) => string) => {
 const byKey = new Map<string, T>()

 primary.forEach((item) => {
  byKey.set(getKey(item), item)
 })

 secondary.forEach((item) => {
  const key = getKey(item)

  if (!byKey.has(key)) {
   byKey.set(key, item)
  }
 })

 return [...byKey.values()]
}

const getPlanMergeKey = (plan: ProgramPlan) =>
 `${normalizeLabel(plan.name)}::${normalizeLabel(plan.program || "")}::${plan.audience || "adult"}::${plan.type || "regular"}`

const mergeStringList = (primary?: string[], secondary?: string[]) => {
 const merged = joinUnique([...(primary ?? []), ...(secondary ?? [])])

 return merged.length > 0 ? merged : undefined
}

const mergePlanPricing = (primary?: PlanPricing[], secondary?: PlanPricing[]) => {
 const merged = dedupePricingByDuration([...(primary ?? []), ...(secondary ?? [])]).sort(
  (left, right) => rankDuration(left.duration) - rankDuration(right.duration)
 )

 return merged.length > 0 ? merged : undefined
}

const mergeExperienceLevels = (primary?: string[], secondary?: string[]) => {
 const merged = joinUnique(
  [...(primary ?? []), ...(secondary ?? [])]
   .map((level) => normalizeExperienceLevel(level) ?? level.trim())
   .filter(Boolean)
 )

 if (merged.some((level) => level === "all")) {
  return undefined
 }

 return merged.length > 0 ? merged : undefined
}

const mergePlansByKey = (primary: ProgramPlan[], secondary: ProgramPlan[]) => {
 const byKey = new Map<string, ProgramPlan>()

 primary.forEach((plan) => {
  byKey.set(getPlanMergeKey(plan), plan)
 })

 secondary.forEach((plan) => {
  const key = getPlanMergeKey(plan)
  const existing = byKey.get(key)

  if (!existing) {
   byKey.set(key, plan)
   return
  }

  byKey.set(key, {
   ...existing,
   program: existing.program || plan.program,
   audience: existing.audience ?? plan.audience,
   type: existing.type ?? plan.type,
   days: existing.days || plan.days,
   scheduleDays: mergeStringList(existing.scheduleDays, plan.scheduleDays),
   timings: mergeStringList(existing.timings, plan.timings),
   pricing: mergePlanPricing(existing.pricing, plan.pricing),
   experienceLevels: mergeExperienceLevels(existing.experienceLevels, plan.experienceLevels),
   tags: mergeStringList(existing.tags, plan.tags),
   order: existing.order ?? plan.order,
   active: existing.active ?? plan.active
  })
 })

 return [...byKey.values()]
}

export const emptyPlanCatalog = (): PlanCatalogData => ({
 trainingTypes: [],
 programs: [],
 adultPlans: [],
 kidsPlans: [],
 personalTraining: []
})

export const normalizePlanCatalogDocs = (docs: QueryDocumentSnapshot<DocumentData>[]) => {
 const catalog = emptyPlanCatalog()
 const rawPlanEntries: RawPlanEntry[] = []

 docs.forEach((docSnapshot, index) => {
  const data = docSnapshot.data()
  const bucket = resolveBucket(data)
  const id = docSnapshot.id || `plan-${index + 1}`
  const fallbackOrder = index + 1

  const rawPlanEntry = parseRawPlanEntry(data, id, fallbackOrder)

  if (rawPlanEntry) {
   rawPlanEntries.push(rawPlanEntry)
  }

  switch (bucket) {
   case "trainingTypes": {
    const item = normalizeTrainingType(data, id, fallbackOrder)

    if (item) {
     catalog.trainingTypes.push(item)
    }
    break
   }
   case "programs": {
    const item = normalizeProgram(data, id, fallbackOrder)

    if (item) {
     catalog.programs.push(item)
    }
    break
   }
   case "adultPlans":
   case "kidsPlans":
   case "plans": {
    const item = normalizePlan(data, id, fallbackOrder)

    if (item) {
     const audience = item.audience ?? getAudience(data) ?? "adult"

     if (bucket === "kidsPlans" || audience === "kids") {
      catalog.kidsPlans.push({
       ...item,
       audience: "kids"
      })
     } else {
      catalog.adultPlans.push({
       ...item,
       audience: "adult"
      })
     }
    }
    break
   }
   case "personalTraining": {
    const item = normalizePersonalTraining(data, id, fallbackOrder)

    if (item) {
     catalog.personalTraining.push(item)
    }
    break
   }
   default:
    break
  }
 })

 if (rawPlanEntries.length > 0) {
  const derivedCatalog = buildTrainingCatalogFromRawEntries(rawPlanEntries)

  return {
   trainingTypes: sortByOrder(
    mergeUniqueByKey(catalog.trainingTypes, derivedCatalog.trainingTypes, (item) => normalizeLabel(item.name)),
    (item) => item.name
   ),
   programs: sortByOrder(
    mergeUniqueByKey(catalog.programs, derivedCatalog.programs, (item) => normalizeLabel(item.name)),
    (item) => item.name
   ),
   adultPlans: sortByOrder(
    mergePlansByKey(catalog.adultPlans, derivedCatalog.adultPlans),
    (item) => item.name
   ),
   kidsPlans: sortByOrder(
    mergePlansByKey(catalog.kidsPlans, derivedCatalog.kidsPlans),
    (item) => item.name
   ),
   personalTraining: sortByOrder(
    mergeUniqueByKey(catalog.personalTraining, derivedCatalog.personalTraining, (item) => normalizeLabel(item.coach)),
    (item) => item.coach
   )
  } satisfies PlanCatalogData
 }

 return {
  trainingTypes: sortByOrder(catalog.trainingTypes, (item) => item.name),
  programs: sortByOrder(catalog.programs, (item) => item.name),
  adultPlans: sortByOrder(catalog.adultPlans, (item) => item.name),
  kidsPlans: sortByOrder(catalog.kidsPlans, (item) => item.name),
  personalTraining: sortByOrder(catalog.personalTraining, (item) => item.coach)
 } satisfies PlanCatalogData
}

export const subscribePlanCatalog = (
 onData: (catalog: PlanCatalogData) => void,
 onError?: (error: Error) => void
) => {
 return onSnapshot(
  collection(db, "plans"),
  (snapshot) => {
   onData(normalizePlanCatalogDocs(snapshot.docs))
  },
  (error) => {
   console.error("Failed to load plan catalog:", error)
   onError?.(error)
  }
 )
}
