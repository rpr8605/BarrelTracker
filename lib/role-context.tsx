'use client'
import { createContext, useContext } from 'react'

export type UserRole = 'owner' | 'full_access' | 'read_only'

const RoleContext = createContext<UserRole>('read_only')

export function RoleProvider({ role, children }: { role: UserRole; children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
}

export function useRole(): UserRole {
  return useContext(RoleContext)
}

export function useCanWrite(): boolean {
  const role = useRole()
  return role === 'owner' || role === 'full_access'
}
