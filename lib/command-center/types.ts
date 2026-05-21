export type Priority = 'low' | 'medium' | 'high' | 'urgent'

export type OpportunityStage = 'discovery' | 'proposal' | 'negotiation' | 'closed-won' | 'closed-lost'

export interface Account {
  id: string
  name: string
  industry?: string
  website?: string
  status: 'active' | 'inactive' | 'lead'
}

export interface Opportunity {
  id: string
  accountId: string
  accountName: string
  name: string
  stage: OpportunityStage
  value: number
  probability: number
  priority: Priority
  owner: string
  nextAction?: string
  expectedCloseDate?: string
}

export interface Contact {
  id: string
  accountId: string
  accountName: string
  name: string
  role: string
  email: string
  lastContacted?: string
}

export interface Task {
  id: string
  title: string
  description?: string
  status: 'todo' | 'in-progress' | 'done'
  priority: Priority
  assignee: 'Ryan' | 'Nancy' | 'Gareth'
  dueDate?: string
  category: 'ops' | 'sales' | 'product' | 'network'
}

export interface Pilot {
  id: string
  name: string
  stage: 'setup' | 'active' | 'offboarding'
  health: 'healthy' | 'at-risk' | 'stalled'
  blockers?: string[]
  revenueImpact: number
}

export interface NetworkIntro {
  id: string
  name: string
  source: string
  target: string
  status: 'pending' | 'connected' | 'archived'
  notes?: string
}

export interface MetricCard {
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'neutral'
}
