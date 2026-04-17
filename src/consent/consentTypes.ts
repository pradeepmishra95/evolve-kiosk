export type ConsentSigningStatus =
  | "draft"
  | "pending"
  | "redirected"
  | "signed"
  | "failed"
  | "cancelled"

export type ConsentSignerType = "member" | "guardian"
