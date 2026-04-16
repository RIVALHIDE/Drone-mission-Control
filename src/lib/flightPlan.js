// Racetrack patrol pattern over a simulated facility
// Located near India Gate, New Delhi for a recognizable map area
export const WAYPOINTS = [
  { lat: 28.6145, lng: 77.2280 },  // North
  { lat: 28.6138, lng: 77.2310 },  // Northeast
  { lat: 28.6125, lng: 77.2325 },  // East
  { lat: 28.6110, lng: 77.2310 },  // Southeast
  { lat: 28.6100, lng: 77.2280 },  // South
  { lat: 28.6095, lng: 77.2250 },  // Southwest
  { lat: 28.6105, lng: 77.2225 },  // West
  { lat: 28.6120, lng: 77.2215 },  // Northwest
  { lat: 28.6138, lng: 77.2230 },  // North-northwest
  { lat: 28.6148, lng: 77.2255 },  // North approach
]

export const MAP_CENTER = { lat: 28.6120, lng: 77.2270 }
export const MAP_ZOOM = 16

// Time in ms to traverse one segment
export const SEGMENT_DURATION = 5000
