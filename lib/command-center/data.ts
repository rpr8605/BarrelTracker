import { 
  Account, 
  Opportunity, 
  Contact, 
  Task, 
  Pilot, 
  NetworkIntro, 
  MetricCard 
} from './types'

// TODO: Replace these mock functions with Supabase calls filtering by workspace_id

export async function getMetrics(): Promise<MetricCard[]> {
  return [
    { label: 'Active Pilots', value: 12, change: 2, trend: 'up' },
    { label: 'Pipeline Value', value: '$420,000', change: 15, trend: 'up' },
    { label: 'Open Tasks', value: 24, change: -4, trend: 'down' },
    { label: 'Network Intros (MTD)', value: 8, change: 0, trend: 'neutral' },
  ]
}

export async function getPipeline(): Promise<Opportunity[]> {
  return [
    {
      id: '1',
      accountId: 'acc1',
      accountName: 'Highland Distillers',
      name: 'Full Stack Implementation',
      stage: 'negotiation',
      value: 85000,
      probability: 0.8,
      priority: 'high',
      owner: 'Ryan',
      nextAction: 'Finalize SLA',
      expectedCloseDate: '2026-06-15',
    },
    {
      id: '2',
      accountId: 'acc2',
      accountName: 'Blue Ridge Spirits',
      name: 'NFC Tag Rollout',
      stage: 'proposal',
      value: 45000,
      probability: 0.6,
      priority: 'medium',
      owner: 'Gareth',
      nextAction: 'Send hardware quote',
      expectedCloseDate: '2026-07-01',
    },
    {
      id: '3',
      accountId: 'acc3',
      accountName: 'Canyon Peak Bourbon',
      name: 'Analytics Dashboard',
      stage: 'discovery',
      value: 25000,
      probability: 0.3,
      priority: 'low',
      owner: 'Nancy',
      nextAction: 'Discovery call scheduled',
      expectedCloseDate: '2026-08-20',
    },
    {
      id: '4',
      accountId: 'acc4',
      accountName: 'Copper Still Co',
      name: 'Compliance Module',
      stage: 'closed-won',
      value: 12000,
      probability: 1.0,
      priority: 'medium',
      owner: 'Ryan',
      nextAction: 'Kickoff meeting',
    }
  ]
}

export async function getTasks(): Promise<Task[]> {
  return [
    {
      id: 't1',
      title: 'Review Highland SLA',
      status: 'todo',
      priority: 'urgent',
      assignee: 'Ryan',
      category: 'sales',
      dueDate: '2026-05-21',
    },
    {
      id: 't2',
      title: 'Update Pilot Roadmap',
      status: 'in-progress',
      priority: 'high',
      assignee: 'Nancy',
      category: 'ops',
      dueDate: '2026-05-22',
    },
    {
      id: 't3',
      title: 'V3 NFC Specs Review',
      status: 'todo',
      priority: 'medium',
      assignee: 'Gareth',
      category: 'product',
      dueDate: '2026-05-25',
    },
    {
      id: 't4',
      title: 'Investor Update Q2',
      status: 'todo',
      priority: 'high',
      assignee: 'Ryan',
      category: 'network',
      dueDate: '2026-06-01',
    }
  ]
}

export async function getPilots(): Promise<Pilot[]> {
  return [
    {
      id: 'p1',
      name: 'Silver Oak Distillery',
      stage: 'active',
      health: 'healthy',
      revenueImpact: 15000,
    },
    {
      id: 'p2',
      name: 'Desert Sun Rum',
      stage: 'setup',
      health: 'at-risk',
      blockers: ['Hardware delivery delay'],
      revenueImpact: 8000,
    },
    {
      id: 'p3',
      name: 'Emerald Isle Spirits',
      stage: 'active',
      health: 'stalled',
      blockers: ['Legal review of Terms'],
      revenueImpact: 22000,
    }
  ]
}

export async function getNetwork(): Promise<NetworkIntro[]> {
  return [
    {
      id: 'n1',
      name: 'Strategic Partnership: GlassCo',
      source: 'Ryan',
      target: 'CEO of GlassCo',
      status: 'connected',
      notes: 'Potential supply chain integration',
    },
    {
      id: 'n2',
      name: 'Investor: Venture Spirits',
      source: 'Warm Intro from Mark',
      target: 'Sarah (GP)',
      status: 'pending',
      notes: 'Sent deck, waiting for follow-up',
    }
  ]
}
