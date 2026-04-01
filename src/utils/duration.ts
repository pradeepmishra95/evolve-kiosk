import type { MembershipDuration } from "../types/domain"

const durationToDays: Partial<Record<MembershipDuration, number>> = {
 "1 Day": 1,
 "1 Session": 1,
 "Free Trial": 1,
 Monthly: 30,
 Quarterly: 90,
 "Half Yearly": 180,
 Yearly: 365,
 "12 Sessions": 30
}

export const getDurationDays = (duration: MembershipDuration) => {
 return durationToDays[duration] ?? 30
}
