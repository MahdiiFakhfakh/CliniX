# CliniX Mobile

Expo Router + TypeScript mobile app for Patients, Doctors, and Nurses, with role-based navigation, offline-friendly data, messaging, and Clinix AI chat.

## Deliverables Included

- Working Expo app (Expo Router)
- Auth flow: splash -> login -> role-based app
- Role routing guards (patient/doctor/nurse)
- List and detail screens (appointments, results, prescriptions, patients)
- Messaging UI (patient-doctor secure chat)
- AI chat UI (patient explanation + doctor drafting support)
- README + environment setup

## Tech Stack

- React Native (Expo) + TypeScript (`strict: true`)
- Expo Router
- TanStack React Query + persisted cache
- Zustand (auth/preferences/toasts)
- React Hook Form + Zod
- Axios API client + interceptors
- `expo-secure-store` for auth session
- `expo-notifications` for local reminders
- Offline banner + pull-to-refresh + skeleton loaders + empty states + error toasts

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create environment file from example:

```bash
cp .env.example .env
```

PowerShell (Windows):

```powershell
copy .env.example .env
```

3. Run app:

```bash
npm run start
```

4. Type check:

```bash
npm run typecheck
```

## Environment Variables

Use `mobile/.env`:

```env
EXPO_PUBLIC_API_BASE_URL=http://localhost:5000/api
EXPO_PUBLIC_ENABLE_MOCK_SERVER=false
EXPO_PUBLIC_ENABLE_MOCK_FALLBACK=false
```

- `EXPO_PUBLIC_ENABLE_MOCK_SERVER=false`: call live backend API by default.
- `EXPO_PUBLIC_ENABLE_MOCK_FALLBACK=false`: do not silently fallback to local mocks unless explicitly enabled.
- On a physical device, replace `localhost` with your machine LAN IP (example: `http://192.168.1.20:5000/api`).

## Demo Credentials

- Doctor: `dr.james.smith@clinix.com` / `password123`
- Admin (doctor access in mobile): `admin@clinix.com` / `password123`
- Patient: any seeded patient email / `password123`

## Project Structure

```text
app/
src/
  components/
  api/
  store/
  types/
  utils/
  theme/
  features/
    appointments/
    patients/
    results/
    prescriptions/
    messaging/
    ai/
```

Additional internal folders used for scale:

- `src/core/`: domain constants, navigation paths, base tokens/types
- `src/providers/`: app-level providers (React Query persistence, network status)
- `src/services/`: lower-level integrations (API implementation, notifications, secure storage)
- `src/shared/`: shared UI primitives and hooks
- `src/mocks/`: mock server data and fallback generators

## Quality Rules Applied

- Strict TypeScript enabled
- No `any` used in app source
- Reusable shared components
- Consistent medical UI theme
- Scalable feature-first architecture with role-specific routing
