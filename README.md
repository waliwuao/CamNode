# CamNode

CamNode is a lightweight, remote-controlled camera node agent.

## Binding Process

1. Click the scan button (top-left).
2. Scan a QR code containing the PC server URL (e.g., `http://192.168.1.100:8000`).
3. The indicator (top-right) will turn green upon successful connection.

## WebSocket API (Control Plane)

### Supported Inbound Commands (PC -> Mobile)

Emit these commands to the `control` event.

| Type | Payload | Description |
| :--- | :--- | :--- |
| `SET_ZOOM` | `{ "value": 0.5 }` | Set zoom level (0.0 to 1.0) |
| `AUTO_FOCUS` | `none` | Trigger auto-focus action |
| `TAKE_PHOTO` | `{ "quality": 1 }` | Capture and upload high-res photo |

### Outbound Events (Mobile -> PC)

| Event | Payload | Description |
| :--- | :--- | :--- |
| `status_update` | `{ "status": "capturing" }` | Sent when device state changes |
| `error` | `{ "message": "..." }` | Sent when an error occurs |

## HTTP API (Data Plane)

Endpoint: `POST /upload`

- Triggered automatically after `TAKE_PHOTO` command.
- Payload: `multipart/form-data` containing the image file.
