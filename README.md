# Drone Mission Control Dashboard

A real-time Ground Control Station (GCS) dashboard for monitoring drone fleets with AI-powered object detection. Built with React, Leaflet.js, and a Python/YOLOv8 backend.

![Tech Stack](https://img.shields.io/badge/React-19-blue) ![Tech Stack](https://img.shields.io/badge/Tailwind-3-blue) ![Tech Stack](https://img.shields.io/badge/Leaflet-1.9-green) ![Tech Stack](https://img.shields.io/badge/YOLOv8-Backend-orange)

---

## Features

### Glass Cockpit UI
- Dark tactical theme with frosted glass panels
- 3-column layout: Telemetry | Map | AI Alerts
- JetBrains Mono font, pulsing status indicators, glow effects

### Live Telemetry Gauges
- **Altitude** — vertical progress bar with tick marks
- **Battery** — circular SVG arc gauge (green → amber → red)
- **Signal Strength** — 5-bar stepped indicator with interference simulation
- **Velocity** — speed readout with trend arrows
- **Coordinates** — real-time LAT/LNG/HDG display

### Interactive Map (Leaflet + CartoDB Dark Tiles)
- Custom SVG drone icons that rotate based on heading
- Dashed flight trail polylines per drone
- Color-coded alert markers at detection locations
- HUD overlay showing ALT/SPD/HDG

### Multi-Drone Fleet
- Add up to 6 simulated drones (Alpha through Foxtrot)
- Each drone has a unique color and patrol route
- Select any drone to view its telemetry
- Connect real drones via video streams in Live mode

### Two Operating Modes

| Mode | Alert Source | Description |
|------|-------------|-------------|
| **Simulation** | `Math.random()` | Random AI alerts every 3-8s, simulated patrol routes |
| **Live YOLO** | Python backend | Real YOLOv8 detections from webcam/RTSP/video streams |

### AI Detection Feed
- Weighted random alerts: Person (40%), Vehicle (30%), Unauthorized Entry (15%), Anomalous Object (15%)
- Confidence scores with color-coded badges
- Slide-in animations, relative timestamps
- Summary stats by detection type

### Live Drone Connections (Live YOLO Tab)
- Connect real drone video streams (webcam, RTSP, HTTP)
- Set GPS coordinates — drone appears at real map location
- MJPEG video feed with YOLO bounding boxes shown in CAM panels
- Multiple simultaneous drone connections
- `POST /telemetry` API for MAVLink/ground station GPS updates

### Proximity-Based Map Tabs
- Drones auto-grouped by GPS proximity (5km threshold)
- Separate map tabs for drone clusters in different locations
- Click tab → map flies to that area, shows only that group's drones and camera feeds

### Simulated Camera Feed
- IR/thermal camera simulation with CSS scanline effects
- Sweeping scan line animation
- Crosshair overlay, REC indicator, coordinate readout

---

## Quick Start

### Frontend

```bash
cd "Survillance Dashboard"
npm install
npm run dev
```

Open **http://localhost:5173** in your browser.

### Backend (optional — for Live YOLO mode)

```bash
cd backend
pip install -r requirements.txt
python app.py
```

Options:
```bash
python app.py                        # server only, connect drones from UI
python app.py --source 0             # auto-start with webcam
python app.py --source video.mp4     # auto-start with video file
python app.py --conf 0.6             # higher confidence threshold
```

---

## Tech Stack

### Frontend
- **React 19** — component architecture
- **Tailwind CSS 3** — tactical dark theme with custom animations
- **Leaflet.js** via `react-leaflet` — dark CartoDB tiles, custom markers
- **Lucide React** — icon library
- **Socket.IO Client** — real-time WebSocket communication

### Backend
- **Flask** + **Flask-SocketIO** — WebSocket server
- **YOLOv8** (ultralytics) — real-time object detection
- **OpenCV** — video capture and frame processing
- **MJPEG streaming** — annotated video feeds to frontend

---

## Project Structure

```
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── favicon.svg
├── src/
│   ├── main.jsx                          # Entry point
│   ├── App.jsx                           # Root component
│   ├── index.css                         # Tailwind + custom CSS
│   ├── context/
│   │   └── MissionContext.jsx            # Global state provider
│   ├── hooks/
│   │   ├── useDroneFleet.js              # Multi-drone simulation engine
│   │   ├── useTelemetry.js               # Single-drone telemetry (legacy)
│   │   ├── useAlerts.js                  # Random alert generator
│   │   └── useWebSocketAlerts.js         # Live YOLO WebSocket alerts
│   ├── lib/
│   │   ├── flightPlan.js                 # Patrol waypoints
│   │   ├── alertTypes.js                 # Alert definitions & weights
│   │   └── utils.js                      # Interpolation, Haversine, formatters
│   └── components/
│       ├── layout/                       # DashboardShell, panels
│       ├── common/                       # Header, TabBar, DroneSelector, DroneConnect
│       ├── map/                          # MissionMap, DroneMarker, FlightTrail, CameraFeed, MapTabs
│       ├── telemetry/                    # AltitudeBar, BatteryGauge, SignalStrength
│       └── alerts/                       # AlertFeed, AlertCard, AlertStats
└── backend/
    ├── app.py                            # Flask + YOLOv8 server
    └── requirements.txt
```

---

## API Endpoints (Backend)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Server status + connected drones |
| `/connect-drone` | POST | Connect a video stream `{name, stream_url, lat, lng}` |
| `/disconnect-drone` | POST | Disconnect by `{drone_id}` |
| `/telemetry` | POST | Push GPS update `{drone_id, lat, lng, altitude, heading, speed}` |
| `/drones` | GET | List all connected drones |
| `/video-feed/<drone_id>` | GET | MJPEG video stream for a drone |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  React Frontend                  │
│                                                  │
│  ┌──────────┐  ┌──────────────┐  ┌───────────┐  │
│  │ Telemetry│  │   Leaflet    │  │   Alert   │  │
│  │  Gauges  │  │     Map      │  │   Feed    │  │
│  └────┬─────┘  └──────┬───────┘  └─────┬─────┘  │
│       └───────────┬───┘───────────────┘          │
│            MissionContext (state)                 │
│       ┌───────────┴───────────────┐              │
│  useDroneFleet    useWebSocketAlerts             │
│  (simulation)      (Socket.IO)                   │
└───────────────────────┬──────────────────────────┘
                        │ WebSocket
                        ▼
              ┌──────────────────┐
              │  Flask Backend   │
              │                  │
              │  YOLOv8 → detect │
              │  OpenCV → frames │
              │  SocketIO → push │
              └──────────────────┘
```

---

## License

MIT
