# Evolve Kiosk

Kiosk application for paid trial bookings and memberships.

## Run

```bash
npm install
npm run dev
```

## Staff Login

The kiosk now uses Firebase Authentication with email and password for staff access.

Flow:

1. Logged-out staff land on the login screen at `/`.
2. Logged-in staff land on the `Let's Begin` welcome screen.
3. Signup is available directly on the login screen for creating a new staff account.
4. Trial, enrollment, and enquiry records are saved with the logged-in staff user's email and uid.

## Firestore Plan Schema (`plans` collection)

The kiosk now reads plan data directly from Firestore (`collection: plans`) with no local fallback.

Minimum fields for a plan doc:

1. `name` (string) e.g. `Regular Batch`
2. `program` (string) e.g. `Calisthenics`
3. Pricing via either:
   - `pricing` array: `[{ duration: "Monthly", price: 4999 }]`
   - `pricing` object: `{ Monthly: 4999, Quarterly: 11999 }`
   - or single `duration` + `price`

Recommended fields:

1. `kind: "plans"` (or `section/category/group` variants supported by parser)
2. `audience: "adult" | "kids"`
3. `timings: string[]` (e.g. `["7:00 AM", "7:00 PM"]`)
4. `schedule.days: string[]` or `days: string[]`
5. `experienceLevels: string[]` (normalized to Beginner/Intermediate/Advance)
6. `order` (number)
7. `active` (boolean), `hidden` (boolean), `archived` (boolean)

Notes:

1. Plans are grouped by `name + program + audience`, so same-name plans across programs (for example `Regular Batch` in MMA and Calisthenics) stay separate.
2. `experienceLevels` values like `regular/all/general` are treated as open-for-all and will not hide plans.
3. Numeric price parsing accepts Firestore numbers and common strings like `4999`, `4,999`, `₹4,999`.

Example Calisthenics regular plan doc:

```json
{
  "kind": "plans",
  "name": "Regular Batch",
  "program": "Calisthenics",
  "audience": "adult",
  "experienceLevels": ["regular"],
  "schedule": {
    "days": ["Mon", "Wed", "Fri"]
  },
  "timings": ["7:00 AM", "7:00 PM"],
  "pricing": [
    { "duration": "Monthly", "price": 4999 },
    { "duration": "Quarterly", "price": 11999 }
  ],
  "order": 1,
  "active": true
}
```

Optional training type doc (for `/exercise-type` cards):

```json
{
  "kind": "trainingTypes",
  "name": "Calisthenics",
  "bestFor": "Strength, mobility, body control",
  "summary": "Bodyweight progression training",
  "description": "Structured calisthenics coaching plan",
  "benefits": ["Strength", "Mobility", "Control"],
  "exercises": ["Pull-up", "Dip", "Push-up"],
  "order": 1,
  "active": true
}
```

## Consent Step

The kiosk includes a dedicated consent step at `/consent` after payment and before final confirmation.

Current behavior:

1. Terms and waiver are shown with a full-view modal.
2. User must check acceptance before continuing.
3. If age is under 18, guardian details are required.
4. Drawn signature is optional supplementary evidence.
5. No external signing provider or signing service is used.

## WhatsApp Backend

This project now includes a server route at `app/api/whatsapp/confirmation/route.ts` for sending WhatsApp confirmations with Meta Cloud API after a trial booking or enrollment succeeds.

Create a local `.env` from `.env.example` and fill these values:

```bash
FIREBASE_PROJECT_ID=evolve-kiosk
FIREBASE_STORAGE_BUCKET=evolve-kiosk.firebasestorage.app
FIREBASE_SERVICE_ACCOUNT_JSON=

WHATSAPP_ACCESS_TOKEN=your_meta_access_token
WHATSAPP_PHONE_NUMBER_ID=your_meta_phone_number_id
WHATSAPP_API_VERSION=v23.0
WHATSAPP_TEMPLATE_LANGUAGE_CODE=en_US
WHATSAPP_TRIAL_TEMPLATE_NAME=your_trial_template_name
WHATSAPP_ENROLL_TEMPLATE_NAME=your_enroll_template_name
```

Expected WhatsApp template body variable order:

1. Customer name
2. Program name
3. Duration
4. Batch time
