import type { PaymentMethod, PaymentStatus } from "../types/domain"

export interface PaymentMethodOption {
 value: Exclude<PaymentMethod, "">
 title: string
 subtitle: string
 category: "upi" | "offline"
 detailTitle: string
 detailActionLabel: string
 detailHint: string
}

export const CARD_AND_EMI_SURCHARGE_RATE = 0.02

export const PAYMENT_METHOD_OPTIONS: PaymentMethodOption[] = [
 {
  value: "cash",
  title: "Cash",
  subtitle: "Collect the amount at the counter.",
  category: "offline",
  detailTitle: "Cash Collection",
  detailActionLabel: "Collect Cash",
  detailHint: "Confirm cash has been collected before finishing."
 },
 {
  value: "credit_card",
  title: "Credit Card",
  subtitle: "Complete payment using a credit card machine.",
  category: "offline",
  detailTitle: "Credit Card Payment",
  detailActionLabel: "Process Credit Card",
  detailHint: "Swipe, tap, or insert the credit card and confirm the payment."
 },
 {
  value: "debit_card",
  title: "Debit Card",
  subtitle: "Complete payment using a debit card machine.",
  category: "offline",
  detailTitle: "Debit Card Payment",
  detailActionLabel: "Process Debit Card",
  detailHint: "Swipe, tap, or insert the debit card and confirm the payment."
 },
 {
  value: "upi",
  title: "UPI",
  subtitle: "Scan the QR and finish instantly.",
  category: "upi",
  detailTitle: "UPI Payment",
  detailActionLabel: "Pay with UPI",
  detailHint: "Use any UPI app to complete the payment."
 },
 {
  value: "emi",
  title: "EMI",
  subtitle: "Mark the payment under EMI or financing.",
  category: "offline",
  detailTitle: "EMI Payment",
  detailActionLabel: "Confirm EMI",
  detailHint: "Complete the financing step and confirm the installment payment."
 },
 {
  value: "cheque",
  title: "Cheque",
  subtitle: "Accept payment through cheque.",
  category: "offline",
  detailTitle: "Cheque Collection",
  detailActionLabel: "Collect Cheque",
  detailHint: "Verify cheque details before completing the payment."
 }
]

export const getPaymentMethodOption = (method: PaymentMethod) =>
 PAYMENT_METHOD_OPTIONS.find((option) => option.value === method) || null

export const getPaymentMethodLabel = (method: PaymentMethod) =>
 getPaymentMethodOption(method)?.title || (method ? method.replace(/_/g, " ").toUpperCase() : "Payment")

export const getSplitPaymentMethodLabel = (method1: PaymentMethod, method2: PaymentMethod) => {
 const label1 = getPaymentMethodLabel(method1)
 const label2 = getPaymentMethodLabel(method2)

 if (!method1 && !method2) {
  return "Payment"
 }

 if (!method2 || method1 === method2) {
  return label1
 }

 if (!method1) {
  return label2
 }

 return `${label1} + ${label2}`
}

export const getPendingPaymentStatus = (method: PaymentMethod): PaymentStatus =>
 method === "upi" ? "upi_pending" : "payment_pending"

export const isUpiPaymentMethod = (method: PaymentMethod) => method === "upi"

export const isSurchargePaymentMethod = (method: PaymentMethod) =>
 method === "credit_card" || method === "debit_card" || method === "emi"

export const getPaymentSurchargeAmount = (baseAmount: number, method: PaymentMethod) =>
 isSurchargePaymentMethod(method) ? Math.max(0, Math.round(baseAmount * CARD_AND_EMI_SURCHARGE_RATE)) : 0

export const getResolvedPaymentSurchargeAmount = (
 baseAmount: number,
 method: PaymentMethod,
 lockedSurchargeAmount = 0
) => Math.max(lockedSurchargeAmount, getPaymentSurchargeAmount(baseAmount, method))

export const getPaymentTotalAmount = (
 baseAmount: number,
 method: PaymentMethod,
 lockedSurchargeAmount = 0
) => Math.max(0, baseAmount + getResolvedPaymentSurchargeAmount(baseAmount, method, lockedSurchargeAmount))

interface PaymentCollectionAmountInput {
 baseAmount: number
 method: PaymentMethod
 isPartialPayment?: boolean
 firstInstallmentAmount?: number
 paymentCollectionStep?: 1 | 2
 lockedSurchargeAmount?: number
}

export const getPaymentCollectionAmount = ({
 baseAmount,
 method,
 isPartialPayment = false,
 firstInstallmentAmount = 0,
 paymentCollectionStep = 1,
 lockedSurchargeAmount = 0
}: PaymentCollectionAmountInput) => {
 const totalAmount = getPaymentTotalAmount(baseAmount, method, lockedSurchargeAmount)

 if (!isPartialPayment) {
  return totalAmount
 }

 if (paymentCollectionStep === 2) {
  return Math.max(0, totalAmount - firstInstallmentAmount)
 }

 return Math.max(0, Math.min(firstInstallmentAmount, totalAmount))
}

export const getRemainingPaymentAmount = (
 baseAmount: number,
 firstInstallmentAmount: number,
 method: PaymentMethod,
 lockedSurchargeAmount = 0
) => Math.max(0, getPaymentTotalAmount(baseAmount, method, lockedSurchargeAmount) - firstInstallmentAmount)
