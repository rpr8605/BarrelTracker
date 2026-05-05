import Stripe from 'stripe'

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' })
  : null

export const PLANS = {
  core: {
    name: 'Core',
    price: 99,
    priceId: process.env.STRIPE_PRICE_CORE || '',
    features: ['Unlimited barrels', 'Voice logging', 'AI tag extraction', 'TTB compliance reports', 'Multi-distillery'],
  },
  story: {
    name: 'Story',
    price: 199,
    priceId: process.env.STRIPE_PRICE_STORY || '',
    features: ['Everything in Core', 'Public distillery profile', 'Barrel adoption portal', 'Story Mode QR pages', 'Drop events', 'Release notifications'],
  },
  trail: {
    name: 'Trail',
    price: 349,
    priceId: process.env.STRIPE_PRICE_TRAIL || '',
    features: ['Everything in Story', 'Veterans Whiskey Trail', 'Trail leaderboard', 'Badge system', 'Consumer social layer', 'Flight builder'],
  },
} as const

export type PlanKey = keyof typeof PLANS
