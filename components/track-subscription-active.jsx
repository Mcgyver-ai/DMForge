'use client'
import { useEffect } from 'react'
import { track } from '@/lib/analytics'

export function TrackSubscriptionActive({ planKey }) {
  useEffect(() => {
    if (planKey) track('subscription_active', { planKey })
  }, [planKey])
  return null
}
