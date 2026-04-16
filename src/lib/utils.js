/**
 * Linear interpolation between two values
 */
export function lerp(a, b, t) {
  return a + (b - a) * t
}

/**
 * Interpolate between two lat/lng points
 */
export function interpolatePosition(from, to, t) {
  return {
    lat: lerp(from.lat, to.lat, t),
    lng: lerp(from.lng, to.lng, t),
  }
}

/**
 * Calculate bearing (heading) between two lat/lng points in degrees
 */
export function calculateBearing(from, to) {
  const dLng = to.lng - from.lng
  const dLat = to.lat - from.lat
  const angle = Math.atan2(dLng, dLat) * (180 / Math.PI)
  return (angle + 360) % 360
}

/**
 * Format elapsed seconds as HH:MM:SS
 */
export function formatMissionTime(seconds) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  return [h, m, s].map(v => String(v).padStart(2, '0')).join(':')
}

/**
 * Format a Date as HH:MM:SS UTC
 */
export function formatUTC(date) {
  return date.toISOString().slice(11, 19) + ' UTC'
}

/**
 * Format a coordinate value with fixed decimals
 */
export function formatCoord(value) {
  return value.toFixed(6)
}

/**
 * Get status color based on threshold
 */
export function getStatusColor(value, warningThreshold, criticalThreshold) {
  if (value <= criticalThreshold) return '#ef4444' // red
  if (value <= warningThreshold) return '#f59e0b'  // amber
  return '#22c55e' // green
}

/**
 * Format relative time (seconds ago)
 */
export function formatTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 5) return 'just now'
  if (seconds < 60) return `${seconds}s ago`
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  return `${Math.floor(minutes / 60)}h ago`
}

/**
 * Haversine distance between two lat/lng points in kilometers
 */
export function haversineDistance(a, b) {
  const R = 6371 // Earth radius in km
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const sinLat = Math.sin(dLat / 2)
  const sinLng = Math.sin(dLng / 2)
  const h = sinLat * sinLat +
    Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * sinLng * sinLng
  return 2 * R * Math.asin(Math.sqrt(h))
}

/**
 * Group drones by proximity. Drones within thresholdKm of each other
 * are placed in the same group. Returns array of groups.
 */
export function groupByProximity(drones, thresholdKm = 5) {
  if (drones.length === 0) return []

  const assigned = new Set()
  const groups = []

  for (let i = 0; i < drones.length; i++) {
    if (assigned.has(i)) continue

    const group = [drones[i]]
    assigned.add(i)

    // Find all drones near this one (transitive clustering)
    for (let g = 0; g < group.length; g++) {
      for (let j = 0; j < drones.length; j++) {
        if (assigned.has(j)) continue
        const dist = haversineDistance(group[g], drones[j])
        if (dist <= thresholdKm) {
          group.push(drones[j])
          assigned.add(j)
        }
      }
    }

    // Compute center of the group
    const center = {
      lat: group.reduce((s, d) => s + d.lat, 0) / group.length,
      lng: group.reduce((s, d) => s + d.lng, 0) / group.length,
    }

    const label = group.length === 1
      ? (group[0].name || group[0].id)
      : `${group[0].name || group[0].id} +${group.length - 1}`

    groups.push({
      id: `group-${groups.length}`,
      label,
      drones: group,
      droneIds: new Set(group.map(d => d.id || d.drone_id)),
      center,
    })
  }

  return groups
}
