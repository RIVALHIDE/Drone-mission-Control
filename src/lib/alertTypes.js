import { User, Car, ShieldAlert, CircleAlert } from 'lucide-react'

export const ALERT_TYPES = [
  { type: 'Person Detected', weight: 0.40, icon: User, color: '#eab308' },
  { type: 'Vehicle Detected', weight: 0.30, icon: Car, color: '#3b82f6' },
  { type: 'Unauthorized Entry', weight: 0.15, icon: ShieldAlert, color: '#ef4444' },
  { type: 'Anomalous Object', weight: 0.15, icon: CircleAlert, color: '#a855f7' },
]

export const MAX_ALERTS = 50
export const ALERT_INTERVAL_MIN = 3000
export const ALERT_INTERVAL_MAX = 8000

export function pickAlertType() {
  const rand = Math.random()
  let cumulative = 0
  for (const alertType of ALERT_TYPES) {
    cumulative += alertType.weight
    if (rand <= cumulative) return alertType
  }
  return ALERT_TYPES[0]
}

export function getConfidenceColor(confidence) {
  if (confidence >= 0.9) return '#22c55e'
  if (confidence >= 0.75) return '#f59e0b'
  return '#ef4444'
}
