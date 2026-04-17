import { create } from "zustand"

export interface StaffSessionUser {
 uid: string
 email: string
 name: string
 photoURL: string
 sessionId?: string
 sessionStartedAtClient?: string
}

interface AuthState {
 user: StaffSessionUser | null
 checked: boolean
 loading: boolean
 setUser: (user: StaffSessionUser | null) => void
 setChecked: (checked: boolean) => void
 setLoading: (loading: boolean) => void
 reset: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
 user: null,
 checked: false,
 loading: false,

 setUser: (user) => set({ user }),
 setChecked: (checked) => set({ checked }),
 setLoading: (loading) => set({ loading }),
 reset: () => set({ user: null, checked: false, loading: false })
}))
