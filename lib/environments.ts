export interface AppEnvironment {
  id: string
  label: string
  passwordless: boolean
  distilleryName?: string  // used to auto-switch active distillery after login
  decoy?: boolean          // shown in UI but no accounts exist — looks full
}

export const ENVIRONMENTS: AppEnvironment[] = [
  {
    id: 'demo',
    label: 'Demo — Explore the app',
    passwordless: true,
  },
  {
    id: 'francis',
    label: 'Francis Distillery',
    passwordless: false,
    distilleryName: 'Francis Distillery',
  },
  {
    id: 'magnolia',
    label: 'Magnolia Barrel House',
    passwordless: false,
    distilleryName: 'Magnolia Barrel House',
  },
  {
    id: 'russells',
    label: "Russell's Reserve",
    passwordless: false,
    decoy: true,
  },
  {
    id: 'bbvirginia',
    label: 'Blue Ridge Virginia',
    passwordless: false,
    decoy: true,
  },
]

export const DEFAULT_ENV = ENVIRONMENTS[0]
