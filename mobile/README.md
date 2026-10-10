# MantraAI Mobile — Android Health Connect Bridge (POC)

A focused Android React Native / Expo mobile proof-of-concept for establishing and verifying end-to-end synchronization between Android Health Connect and the MantraAI platform.

> **Important Privacy Notice:**
> Health Connect is currently **read-only** in MantraAI. MantraAI never requests WRITE permissions, does not modify on-device health records, and uses health data solely to personalize your daily wellness experience.

---

## 1. Architecture Flow

```
Android Device / Wearable Sync
           ↓
 Android Health Connect (SDK)
           ↓
 MantraAI Mobile Health Bridge
 (read → normalize → preview)
           ↓
  FastAPI Backend (/api/v1/health/sync)
           ↓
 PostgreSQL (health_daily_metrics)
           ↓
 MantraAI Web Dashboard / My Progress
```

---

## 2. Requirements & Prerequisites

- **Node.js**: `v20.x` or `v22.x`
- **Package Manager**: `npm`
- **Expo SDK**: `~57.0.x`
- **React Native**: `0.86.x`
- **Android SDK & Build Tools**: Android Studio with Android SDK Platform 34+
- **JDK**: Java 17+

---

## 3. Android Version Requirements

- **Android 14+ (API 34+)**: Health Connect is integrated directly into the core Android OS framework. No separate app install is required.
- **Android 9 to 13 (API 28-33)**: Requires installing the official **Google Health Connect** app from Google Play Store (`com.google.android.apps.healthdata`).
- **Android 8 and below**: Not supported by Health Connect SDK.

---

## 4. Why Expo Go Is Not Used For This Integration

Android Health Connect requires native Android manifest declarations (`<uses-permission android:name="android.permission.health.*" />`), native intent filters (`androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE`), and direct Java/Kotlin SDK bindings.

Because standard Expo Go does not contain these custom native health manifests or the `react-native-health-connect` native module, this integration **requires an Expo Development Build** (`npx expo run:android` or EAS Build).

---

## 5. Health Connect Setup & Permissions

MantraAI requests **READ-ONLY** access for the following minimum aggregate metrics:

| Record Type | Metric | Description |
| :--- | :--- | :--- |
| `Steps` | Daily Steps | Daily step count and cadence |
| `ExerciseSession` | Active & Workout Minutes | Active movement and structured exercise duration |
| `SleepSession` | Sleep Duration | Total sleep duration in minutes |
| `RestingHeartRate` | Resting Heart Rate | Baseline heart rate in BPM |
| `ActiveCaloriesBurned` | Active Calories | Movement energy expended in kcal |

MantraAI never asks for Write permissions (`WRITE_STEPS`, `WRITE_SLEEP`, etc.).

---

## 6. Environment Variables & Backend URL Configuration

The mobile client communicates with the MantraAI FastAPI backend (`/api/v1`).

Configuration is handled in `mobile/src/services/api.js`:

- **Android Emulator**: `http://10.0.2.2:8000` (automatically detected)
- **Physical Android Phone**: Use your computer's local Wi-Fi / LAN IP address:
  ```env
  EXPO_PUBLIC_API_BASE_URL=http://192.168.x.x:8000
  ```
- **Custom URL / Tunnel**: Set `EXPO_PUBLIC_API_BASE_URL` in your `.env` or run command.

---

## 7. Permission Handshake & Sync Flow

1. User opens **MantraAI Mobile** $\to$ Navigates to **Health Bridge** (`/health-connect`).
2. App checks Health Connect availability (`checkHealthConnectAvailability()`).
3. User taps **[ Connect Health Data ]**.
4. Official Android Health Connect permission dialog appears.
5. User grants desired permissions.
6. App queries today's aggregated records via `HealthConnectManager`.
7. `healthNormalizer.js` transforms raw records into canonical schema, **strictly preserving `null` for missing metrics (no zero coercion)**.
8. User reviews preview and taps **[ Sync to MantraAI ]**.
9. Payload is sent to `POST /api/v1/health/sync`.
10. Backend idempotently upserts the record into `health_daily_metrics`.
11. Web dashboard immediately reflects `Source: Health Connect`.

---

## 7.1 Development-Only Demo Health Data Writer

To facilitate integration testing without requiring a physical smartwatch (e.g. Noise / Wear OS), the mobile POC includes a **Development-Only Demo Data Writer** (`src/health/demoHealthWriter.js`).

### Synthetic Dataset
- **Steps**: `6,842`
- **Active Calories**: `412 kcal`
- **Exercise / Workout**: `32 min`
- **Sleep Duration**: `7h 12m` (`432 min`)
- **Resting Heart Rate**: `68 bpm`

### Idempotency & Targeted Deletion
Each synthetic record uses a deterministic `clientRecordId` (e.g. `mantraai-demo-steps-YYYY-MM-DD`). Prior demo records for that date are cleared before insertion, preventing duplicate aggregation. Deletion targets only these IDs, ensuring real user health records are never touched.

### 10-Step Verification Sequence
1. **Health Connect Baseline**: Open Health Connect app $\to$ observe `"No data"`.
2. **Open Diagnostics**: In MantraAI Mobile, open **Health Connect Test** (`/health-test`).
3. **Grant Dev Permissions**: If prompted, grant development write permissions.
4. **Populate Data**: Tap **[ Populate Today's Demo Data ]**.
5. **Verify in OS**: Open Health Connect app $\to$ confirm Steps (6,842), Calories (412), Exercise (32m), Sleep (7h 12m), and Resting HR (68 bpm) appear.
6. **Return to App**: Tap **[ Check Health Connect ]**.
7. **Read Permissions**: Tap **[ Request Permissions (Read) ]**.
8. **Read from SDK**: Tap **[ Read Today's Data ]** $\to$ confirm MantraAI reader retrieves the exact metrics.
9. **Sync to Backend**: Tap **[ Sync to MantraAI ]** $\to$ calls `POST /api/v1/health/sync`.
10. **Verify Web Dashboard**: Open **My Progress** on web dashboard $\to$ confirms `Source: Health Connect` with today's metrics.

---

## 8. Running the Mobile Application

### Installing Dependencies
```bash
cd mobile
npm install --legacy-peer-deps
```

### Running Automated Tests
```bash
npm test
```

### Generating Native Android Project & Prebuild
```bash
npx expo prebuild --platform android
```

### Running on Android Emulator / Physical Device
```bash
# Make sure Android emulator or USB-connected Android phone with USB debugging is active
npx expo run:android
```

---

## 9. Testing on a Physical Android Phone

1. Connect your Android phone to the same Wi-Fi network as your development computer.
2. Ensure Developer Options and USB Debugging are enabled.
3. Start the backend:
   ```bash
   cd backend
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```
4. Find your computer's LAN IP (e.g. `192.168.1.100` via `ipconfig` or `ifconfig`).
5. Launch the development build on your device:
   ```bash
   cd mobile
   npx expo run:android
   ```
6. Open the **Health Connect Test** diagnostic screen (`/health-test`) to run step-by-step checks:
   - Tap **Check Health Connect**
   - Tap **Request Permissions**
   - Tap **Read Today's Data**
   - Tap **Sync to MantraAI**
   - Tap **Sync Last 7 Days (Dev)**

---

## 10. Known Limitations & Future Scope

- **Continuous sensor streams / GPS**: Not implemented in this POC. Only daily aggregates are captured.
- **Background auto-sync / WorkManager**: Scheduled for future release once user consent and battery optimization profiles are tuned.
- **Apple HealthKit / iOS**: Not supported in this Android-first phase.
- **Wear OS / Smartwatch SDKs**: Data is retrieved from Health Connect after the watch syncs to the phone; no direct watch connection is needed.

---

## 11. Security & Privacy Safeguards

- **No Health Data in Logs**: Health metrics are never printed to console logs or error traces.
- **Strict Idempotency**: Repeated syncs update existing daily records without creating duplicates.
- **Explicit Consent**: Sync only occurs upon user consent.
- **Non-Clinical Disclaimer**: Health data is used strictly for daily lifestyle recommendations and adaptive goal calibration.
