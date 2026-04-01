"use client"

import { useRouter } from "next/navigation"

interface NavigateOptions {
 replace?: boolean
}

type NavigateTarget = string | number

export function useNavigate() {
 const router = useRouter()

 return (target: NavigateTarget, options?: NavigateOptions) => {
  if (typeof target === "number") {
   if (target < 0) {
    router.back()
   }

   return
  }

  if (options?.replace) {
   router.replace(target)
   return
  }

  router.push(target)
 }
}
