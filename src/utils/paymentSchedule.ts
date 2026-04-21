export interface PaymentInstallmentRecord {
 amount: number
 dueDate: string
}

export function calcScheduleTotals(
 payNow: number,
 futureRows: PaymentInstallmentRecord[],
 finalPayable: number
): { futureTotal: number; totalScheduled: number; remaining: number; overScheduled: boolean } {
 const futureTotal = futureRows.reduce((sum, r) => sum + r.amount, 0)
 const totalScheduled = payNow + futureTotal
 const remaining = Math.max(0, finalPayable - totalScheduled)
 return { futureTotal, totalScheduled, remaining, overScheduled: totalScheduled > finalPayable }
}
