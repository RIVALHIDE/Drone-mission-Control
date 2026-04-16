"""
Drone Mission Control — YOLO Detection Backend

Runs YOLOv8 on drone video streams and sends real-time detections
to the React frontend via Socket.IO.

Usage:
  1. pip install -r requirements.txt
  2. python app.py                          # start server (no auto-detection)
  3. python app.py --source 0               # auto-start webcam detection
  4. python app.py --source video.mp4       # auto-start with video file

Connect drones from the React UI (Live YOLO tab → Connect button):
  - Webcam: enter "0" as stream URL
  - RTSP: enter "rtsp://drone-ip:554/live"
  - HTTP: enter "http://drone-ip:8080/video"
  - Video file: enter the file path

The React frontend connects to http://localhost:5000 via Socket.IO.
"""

import argparse
import time
import threading
import uuid

from flask import Flask, jsonify, request, Response
from flask_cors import CORS
from flask_socketio import SocketIO

app = Flask(__name__)
CORS(app)
socketio = SocketIO(app, cors_allowed_origins="*", async_mode="threading")

# --- YOLO model (lazy loaded) ---
yolo_model = None
yolo_lock = threading.Lock()


def get_model():
    """Lazy-load YOLOv8 model on first use."""
    global yolo_model
    if yolo_model is None:
        with yolo_lock:
            if yolo_model is None:
                try:
                    from ultralytics import YOLO
                    print("[YOLO] Loading model yolov8n.pt ...")
                    yolo_model = YOLO("yolov8n.pt")
                    print("[YOLO] Model loaded successfully.")
                except ImportError:
                    print("[ERROR] ultralytics not installed. Run: pip install ultralytics")
                    return None
    return yolo_model


# --- Drone connections ---
drone_connections = {}  # drone_id -> DroneConnection
drone_lock = threading.Lock()


class DroneConnection:
    def __init__(self, drone_id, name, stream_url, telemetry_url=None, confidence=0.5,
                 lat=None, lng=None, altitude=0, heading=0, speed=0):
        self.drone_id = drone_id
        self.name = name
        self.stream_url = stream_url
        self.telemetry_url = telemetry_url
        self.confidence = confidence
        self.active = False
        self.thread = None
        self.status = "connecting"
        self.fps = 0
        self.total_detections = 0
        self.error = None
        self.latest_frame = None  # Latest JPEG-encoded frame with YOLO annotations
        self.frame_lock = threading.Lock()
        # GPS telemetry
        self.lat = lat
        self.lng = lng
        self.altitude = altitude
        self.heading = heading
        self.speed = speed

    def to_dict(self):
        return {
            "drone_id": self.drone_id,
            "name": self.name,
            "stream_url": self.stream_url,
            "telemetry_url": self.telemetry_url,
            "status": self.status,
            "fps": self.fps,
            "total_detections": self.total_detections,
            "error": self.error,
            "lat": self.lat,
            "lng": self.lng,
            "altitude": self.altitude,
            "heading": self.heading,
            "speed": self.speed,
        }

    def start(self):
        self.active = True
        self.thread = threading.Thread(target=self._run, daemon=True)
        self.thread.start()

    def stop(self):
        self.active = False
        if self.thread:
            self.thread.join(timeout=5)

    def _run(self):
        try:
            import cv2
        except ImportError:
            self.status = "error"
            self.error = "opencv-python not installed"
            socketio.emit("drone_error", {"drone_id": self.drone_id, "error": self.error})
            return

        model = get_model()
        if model is None:
            self.status = "error"
            self.error = "YOLO model failed to load"
            socketio.emit("drone_error", {"drone_id": self.drone_id, "error": self.error})
            return

        # Open video source
        try:
            source = int(self.stream_url)
        except (ValueError, TypeError):
            source = self.stream_url

        cap = cv2.VideoCapture(source)
        if not cap.isOpened():
            self.status = "error"
            self.error = f"Cannot open: {self.stream_url}"
            socketio.emit("drone_error", {"drone_id": self.drone_id, "error": self.error})
            return

        self.status = "active"
        socketio.emit("drone_connected", self.to_dict())
        print(f"[DRONE {self.drone_id}] Stream active: {self.stream_url}")

        frame_count = 0
        start_time = time.time()

        while self.active:
            ret, frame = cap.read()
            if not ret:
                # Try looping video files
                cap.set(cv2.CAP_PROP_POS_FRAMES, 0)
                ret, frame = cap.read()
                if not ret:
                    break

            # YOLO inference
            results = model(frame, verbose=False, conf=self.confidence)
            annotated = frame.copy()

            for result in results:
                for box in result.boxes:
                    class_id = int(box.cls)
                    class_name = result.names[class_id]
                    conf = float(box.conf)

                    alert_info = map_class(class_name)

                    # Draw bounding box on annotated frame
                    x1, y1, x2, y2 = map(int, box.xyxy[0].tolist())
                    color_hex = alert_info["color"].lstrip("#")
                    color_bgr = tuple(int(color_hex[i:i+2], 16) for i in (4, 2, 0))
                    cv2.rectangle(annotated, (x1, y1), (x2, y2), color_bgr, 2)
                    label = f"{class_name} {conf:.0%}"
                    (tw, th), _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 1)
                    cv2.rectangle(annotated, (x1, y1 - th - 6), (x1 + tw + 4, y1), color_bgr, -1)
                    cv2.putText(annotated, label, (x1 + 2, y1 - 4),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)

                    detection = {
                        "type": alert_info["type"],
                        "color": alert_info["color"],
                        "class_name": class_name,
                        "confidence": round(conf, 3),
                        "timestamp": int(time.time() * 1000),
                        "bbox": box.xyxy[0].tolist(),
                        "drone_id": self.drone_id,
                        "drone_name": self.name,
                    }

                    socketio.emit("detection", detection)
                    self.total_detections += 1

            # Encode annotated frame as JPEG and store for MJPEG stream
            _, jpeg = cv2.imencode(".jpg", annotated, [cv2.IMWRITE_JPEG_QUALITY, 70])
            with self.frame_lock:
                self.latest_frame = jpeg.tobytes()

            frame_count += 1
            elapsed = time.time() - start_time
            if elapsed > 0:
                self.fps = round(frame_count / elapsed, 1)

            # Emit GPS telemetry update every 5 frames (~0.5s)
            if self.lat is not None and frame_count % 5 == 0:
                socketio.emit("telemetry_update", {
                    "drone_id": self.drone_id,
                    "lat": self.lat,
                    "lng": self.lng,
                    "altitude": self.altitude,
                    "heading": self.heading,
                    "speed": self.speed,
                })

            # Throttle to ~10 FPS
            time.sleep(0.1)

        cap.release()
        self.status = "disconnected"
        print(f"[DRONE {self.drone_id}] Stream stopped.")


# --- YOLO class mapping ---
ALERT_MAP = {
    "person": {"type": "Person Detected", "color": "#eab308"},
    "car": {"type": "Vehicle Detected", "color": "#3b82f6"},
    "truck": {"type": "Vehicle Detected", "color": "#3b82f6"},
    "bus": {"type": "Vehicle Detected", "color": "#3b82f6"},
    "motorcycle": {"type": "Vehicle Detected", "color": "#3b82f6"},
    "bicycle": {"type": "Vehicle Detected", "color": "#3b82f6"},
    "train": {"type": "Vehicle Detected", "color": "#3b82f6"},
    "boat": {"type": "Vehicle Detected", "color": "#3b82f6"},
    "airplane": {"type": "Vehicle Detected", "color": "#3b82f6"},
    "knife": {"type": "Unauthorized Entry", "color": "#ef4444"},
    "scissors": {"type": "Unauthorized Entry", "color": "#ef4444"},
}
DEFAULT_ALERT = {"type": "Anomalous Object", "color": "#a855f7"}


def map_class(class_name):
    return ALERT_MAP.get(class_name.lower(), DEFAULT_ALERT)


# --- HTTP endpoints ---

@app.route("/")
def index():
    with drone_lock:
        drones = [d.to_dict() for d in drone_connections.values()]
    return jsonify({
        "service": "Drone Mission Control — YOLO Backend",
        "status": "running",
        "connected_drones": len(drones),
        "drones": drones,
    })


@app.route("/connect-drone", methods=["POST"])
def connect_drone():
    data = request.json or {}
    name = data.get("name", "Unnamed Drone")
    stream_url = data.get("stream_url")
    telemetry_url = data.get("telemetry_url")
    confidence = data.get("confidence", 0.5)
    lat = data.get("lat")
    lng = data.get("lng")

    # Convert lat/lng to float if provided
    try:
        lat = float(lat) if lat is not None and lat != "" else None
        lng = float(lng) if lng is not None and lng != "" else None
    except (ValueError, TypeError):
        lat, lng = None, None

    if not stream_url:
        return jsonify({"error": "stream_url is required"}), 400

    drone_id = f"LIVE-{uuid.uuid4().hex[:6].upper()}"

    conn = DroneConnection(
        drone_id=drone_id,
        name=name,
        stream_url=stream_url,
        telemetry_url=telemetry_url,
        confidence=confidence,
        lat=lat,
        lng=lng,
    )

    with drone_lock:
        drone_connections[drone_id] = conn

    conn.start()

    print(f"[API] Drone connected: {drone_id} ({name}) -> {stream_url}")
    return jsonify({"drone_id": drone_id, "status": "connecting", "name": name})


@app.route("/disconnect-drone", methods=["POST"])
def disconnect_drone():
    data = request.json or {}
    drone_id = data.get("drone_id")

    if not drone_id:
        return jsonify({"error": "drone_id is required"}), 400

    with drone_lock:
        conn = drone_connections.pop(drone_id, None)

    if conn is None:
        return jsonify({"error": f"Drone {drone_id} not found"}), 404

    conn.stop()
    socketio.emit("drone_disconnected", {"drone_id": drone_id})
    print(f"[API] Drone disconnected: {drone_id}")
    return jsonify({"drone_id": drone_id, "status": "disconnected"})


@app.route("/drones", methods=["GET"])
def list_drones():
    with drone_lock:
        drones = [d.to_dict() for d in drone_connections.values()]
    return jsonify({"drones": drones})


# --- Telemetry endpoint (for external systems: MAVLink bridges, ground stations) ---

@app.route("/telemetry", methods=["POST"])
def update_telemetry():
    data = request.json or {}
    drone_id = data.get("drone_id")

    if not drone_id:
        return jsonify({"error": "drone_id is required"}), 400

    with drone_lock:
        conn = drone_connections.get(drone_id)

    if conn is None:
        return jsonify({"error": f"Drone {drone_id} not found"}), 404

    # Update GPS fields
    if "lat" in data:
        conn.lat = float(data["lat"])
    if "lng" in data:
        conn.lng = float(data["lng"])
    if "altitude" in data:
        conn.altitude = float(data["altitude"])
    if "heading" in data:
        conn.heading = float(data["heading"])
    if "speed" in data:
        conn.speed = float(data["speed"])

    telemetry_data = {
        "drone_id": drone_id,
        "lat": conn.lat,
        "lng": conn.lng,
        "altitude": conn.altitude,
        "heading": conn.heading,
        "speed": conn.speed,
    }
    socketio.emit("telemetry_update", telemetry_data)

    return jsonify(telemetry_data)


# --- MJPEG video stream ---

def generate_mjpeg(drone_id):
    """Generator that yields MJPEG frames for a given drone."""
    while True:
        with drone_lock:
            conn = drone_connections.get(drone_id)
        if conn is None or not conn.active:
            break

        with conn.frame_lock:
            frame = conn.latest_frame

        if frame is not None:
            yield (
                b"--frame\r\n"
                b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
            )
        time.sleep(0.1)


@app.route("/video-feed/<drone_id>")
def video_feed(drone_id):
    """MJPEG stream endpoint for a specific drone's camera feed."""
    with drone_lock:
        conn = drone_connections.get(drone_id)
    if conn is None:
        return jsonify({"error": f"Drone {drone_id} not found"}), 404
    if conn.status != "active":
        return jsonify({"error": f"Drone {drone_id} is not active"}), 400

    return Response(
        generate_mjpeg(drone_id),
        mimetype="multipart/x-mixed-replace; boundary=frame",
    )


# --- Socket.IO events ---

@socketio.on("connect")
def handle_connect():
    print("[WS] Client connected")
    with drone_lock:
        drones = [d.to_dict() for d in drone_connections.values()]
    socketio.emit("drone_status", {"drones": drones})


@socketio.on("disconnect")
def handle_disconnect():
    print("[WS] Client disconnected")


# --- Main ---

def main():
    parser = argparse.ArgumentParser(description="YOLO Detection Backend for Drone Mission Control")
    parser.add_argument("--source", default=None, help="Auto-start source: webcam index (0) or file path")
    parser.add_argument("--conf", type=float, default=0.5, help="YOLO confidence threshold (0-1)")
    parser.add_argument("--port", type=int, default=5000, help="Server port")
    args = parser.parse_args()

    # Auto-start a stream if --source is provided
    if args.source is not None:
        drone_id = "UAV-AUTO"
        conn = DroneConnection(
            drone_id=drone_id,
            name="Auto-Start",
            stream_url=args.source,
            confidence=args.conf,
        )
        drone_connections[drone_id] = conn
        conn.start()

    print(f"\n{'='*55}")
    print(f"  Drone Mission Control — YOLO Backend")
    print(f"  http://localhost:{args.port}")
    print(f"")
    print(f"  Connect drones from the React UI (Live YOLO tab)")
    print(f"  or via API: POST /connect-drone")
    if args.source:
        print(f"  Auto-started stream: {args.source}")
    print(f"{'='*55}\n")

    socketio.run(app, host="0.0.0.0", port=args.port, debug=False, allow_unsafe_werkzeug=True)


if __name__ == "__main__":
    main()
