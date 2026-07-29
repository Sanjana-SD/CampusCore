# CampusCore — ESP8266 / ESP32 Hardware Integration Contract

This document provides a clean, self-contained specifications sheet for engineering real ESP8266 or ESP32 microcontrollers to communicate check-in data with the CampusCore gate backend server.

---

## 1. Network Requirements
- **Protocol**: HTTP or HTTPS.
- **Port**: Defaults to `5000` (or `80` / `443` in production).
- **Endpoint**: `/api/attendance/scan`
- **Method**: `POST`
- **Headers**:
  - `Content-Type: application/json`

---

## 2. Ingestion Request Format
The reader payload MUST match the following JSON contract exactly:

```json
POST /api/attendance/scan
{
  "rfid_uid": "string",
  "timestamp": "ISO8601",
  "device_id": "string"
}
```

### Parameter Reference:
- `rfid_uid` (String): The unique tag identifier read from the RC522 RFID reader card (e.g., `"83A2C51B"`).
- `timestamp` (String): ISO8601 formatted datetime representation of the read event (e.g., `"2026-07-17T23:55:00.000Z"`).
- `device_id` (String): Unique identifier of the gate reader node (e.g., `"MAIN_GATE_01"`).

---

## 3. Backend Response Format
The backend returns a JSON payload driving local feedback nodes (relays, buzzers, status LEDs):

```json
{
  "result": "IN" | "OUT" | "DUPLICATE" | "UNRECOGNIZED",
  "student_name": "string | null",
  "message": "string"
}
```

### How to Drive Edge Hardware (Firmware Logic)

Based on the value of `result`, the microcontroller should trigger the following behaviors:

| `result` | Interpretation | Recommended Buzzer Feedback | Recommended LED Feedback | Recommended Relay Action |
|---|---|---|---|---|
| `IN` | Student checked in successfully. | 1 short beep (150ms) | Green LED blinks once | Trigger relay to open gate lock |
| `OUT` | Student checked out successfully. | 2 short beeps (100ms each) | Green LED blinks twice | Trigger relay to open gate lock |
| `DUPLICATE` | Double-tap ignored by debounce filter (within 5 seconds). | No beep | Yellow LED brief flash | Do not trigger gate lock |
| `UNRECOGNIZED` | Invalid card, suspended student, or database missing card. | 1 long beep (1.5 seconds) | Red LED remains ON for 1.5s | Do not trigger gate lock |

---

## 4. Example HTTP Transaction

### Request:
```http
POST /api/attendance/scan HTTP/1.1
Host: campuscore.local:5000
Content-Type: application/json
Content-Length: 104

{
  "rfid_uid": "83A2C51B",
  "timestamp": "2026-07-17T18:40:00.000Z",
  "device_id": "GATE_READER_01"
}
```

### Response:
```http
HTTP/1.1 200 OK
Content-Type: application/json
Content-Length: 95

{
  "result": "IN",
  "student_name": "Mohammed Taha Shariff",
  "message": "Checked IN successfully."
}
```
