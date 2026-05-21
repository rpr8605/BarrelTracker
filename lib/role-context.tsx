'use client'
import { createContext, useContext } from 'react'

export type UserRole = 'owner' | 'admin' | 'production_manager' | 'compliance_reviewer' | 'finance_reviewer' | 'consultant' | 'read_only_stakeholder' | 'read_only' | 'full_access'

const RoleContext = createContext<UserRole>('read_only')

export function RoleProvider({ role, children }: { role: UserRole; children: React.ReactNode }) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>
}

export function useRole(): UserRole {
  return useContext(RoleContext)
}

export function useCanWrite(): boolean {
  const role = useRole()
  const writeRoles: UserRole[] = ['owner', 'admin', 'production_manager', 'full_access']
  return writeRoles.includes(role)
}
