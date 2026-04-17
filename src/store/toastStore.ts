import { create } from "zustand"

export type ToastVariant = "success" | "error" | "info"

interface ToastState {
 isVisible: boolean
 message: string
 variant: ToastVariant
 durationMs: number
 showToast: (message: string, variant?: ToastVariant, durationMs?: number) => void
 hideToast: () => void
}

export const useToastStore = create<ToastState>((set) => ({
 isVisible: false,
 message: "",
 variant: "info",
 durationMs: 2800,

 showToast: (message, variant = "info", durationMs = 2800) =>
  set({
   isVisible: true,
   message,
   variant,
   durationMs
  }),

 hideToast: () =>
  set({
   isVisible: false,
   message: "",
   variant: "info",
   durationMs: 2800
  })
}))
