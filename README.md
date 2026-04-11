# CodeNova
Team E4 's Project
# Code Nova — Citizen Portal

> **One Identity. Every Service. Zero Hassle.**
> A unified digital citizen portal for India — built to eliminate the friction between citizens and government services.

---

## What is Code Nova?

Code Nova is a web-based civic technology platform that lets Indian citizens store their identity documents once, auto-fill any government application in seconds, and track every application in real time — all from a single secure dashboard.

Built as a hackathon MVP, Code Nova demonstrates how a modern, lightweight frontend combined with a production-ready backend can transform the citizen experience of government services without replacing any existing infrastructure.

---

## Features

### Secure Document Vault
Store Aadhaar, PAN, Passport, Driving License, caste and income certificates in one encrypted place. Documents are always ready — never re-uploaded.

### Intelligent Auto-Fill
Select any government service and watch every field in the application form populate instantly from your profile. Name, date of birth, address, Aadhaar, PAN — filled in under three seconds. You review and submit.

### Real-Time Application Tracking
Every application has a live step-by-step progress tracker — Submitted → Documents Verified → Under Review → Approved → Dispatched — with status visible at a glance from the dashboard.

### Smart Compliance Alerts
The platform monitors document expiry dates and upcoming deadlines (license renewals, tax filings, passport expiry) and surfaces advance alerts so citizens never pay a fine for missing a deadline.

### 12+ Government Services Supported
Aadhaar Services, PAN Card, Passport, Driving License, Income Certificate, Caste Certificate, Domicile Certificate, Voter ID, Birth Certificate, Marriage Certificate, Land Records, GST Registration.

### 22 Official Indian Language Support
Every screen and form is designed to support all 22 official Indian languages.

### DigiLocker Integration (roadmap)
Document vault is architected for full DigiLocker API sync via MeitY's Open API Policy and API Setu platform.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend / Database | [Supabase](https://supabase.com) (PostgreSQL) |
| Authentication | Supabase Auth (JWT) |
| Real-time | Supabase Realtime subscriptions |
| Fonts | Syne, DM Sans, DM Mono (Google Fonts) |
| Icons | Material Symbols Outlined |

---

## Project Structure

```
code-nova/
├── index.html       # All pages and views (home, app, modals)
├── script.js        # Auth, profile state, form engine, Supabase calls
├── styles.css       # Full design system — dark theme, components, layout
└── db.sql           # Database schema trigger and backfill migration
```

---

## Database Setup

The project uses a single `citizens` table in Supabase with a PostgreSQL trigger that automatically creates a citizen profile row the instant a new auth user signs up. This avoids the RLS race condition that causes "profile save failed" errors in most Supabase apps.

Run `db.sql` in your Supabase SQL Editor in this order:

1. Creates the `handle_new_user()` trigger function (security definer — runs as superuser, bypasses RLS)
2. Attaches the trigger to `auth.users` on insert
3. Backfills any existing auth users who are missing a `citizens` row
4. Runs a verification query to confirm all users have a matching profile

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/code-nova.git
cd code-nova
```

### 2. Set up Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the full contents of `db.sql`
3. Go to **Project Settings → API** and copy your:
   - Project URL
   - `anon` public API key

### 3. Configure credentials

Open `script.js` and replace the placeholders at the top:

```js
const SUPABASE_URL      = 'https://your-project-id.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-public-key-here';
```

### 4. Run locally

No build step needed. Open `index.html` directly in a browser, or serve with any static file server:

```bash
npx serve .
# or
python3 -m http.server 8080
```

---

## Supabase Table Schema

The `citizens` table stores all citizen profile data. Minimum required columns:

```sql
create table public.citizens (
  id            uuid primary key references auth.users(id),
  email         text,
  first_name    text,
  last_name     text,
  dob           date,
  gender        text,
  mobile        text,
  aadhaar       text,
  pan           text,
  father        text,
  mother        text,
  address       text,
  city          text,
  state         text,
  pin           text,
  nationality   text default 'Indian',
  religion      text,
  caste         text,
  income        text,
  occupation    text,
  created_at    timestamptz default now()
);

-- Enable Row Level Security
alter table public.citizens enable row level security;

-- Citizens can only read and update their own row
create policy "Citizens can view own profile"
  on citizens for select using (auth.uid() = id);

create policy "Citizens can update own profile"
  on citizens for update using (auth.uid() = id);
```

---

## Environment Variables (for deployment)

If deploying to Vercel, Netlify, or similar, set these as environment variables and inject them at build time rather than hardcoding in `script.js`:

```
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-public-key
```

> **Important:** The `anon` key is safe to expose in frontend code — Supabase Row Level Security policies protect the actual data. Never expose your `service_role` key.

---

## Known Limitations (MVP)

- Form submissions are saved to Supabase but do not connect to real government portals — this is a pre-fill and preparation layer, not a submission gateway.
- Application tracking statuses are currently static/demo data.
- DigiLocker API integration is mocked; full integration requires MeitY partner onboarding via [API Setu](https://apisetu.gov.in).
- No file upload storage — document vault UI is present but S3/Supabase Storage integration is pending.

---

## Roadmap

**Phase 1 — Current (Hackathon MVP)**
- Core citizen portal with auth, profile, document vault
- Auto-fill engine for 12 government services
- Application tracking dashboard
- Compliance alert system

**Phase 2 — 3 Months**
- Native Android app (mobile-first for 3G users)
- Offline document caching
- Push notifications in all 22 languages
- State government pilot integration

**Phase 3 — 12 Months**
- Live DigiLocker API integration via API Setu
- AI-assisted form completion for complex multi-page applications
- White-label portal for state/municipal governments
- Expansion to 50+ services (health, education, land records, taxation)

---

## Architecture Note — The API Strategy

Code Nova is designed as a **preparation and bridge layer**, not a replacement for government portals. The integration model follows India's official Open API Policy:

- **DigiLocker Open RESTful API** (MeitY) — for verified document access with citizen consent
- **API Setu** (MeitY) — India's official open API platform with 4,200+ published government APIs and 1,800+ registered partners, designed explicitly for private apps to integrate with government data

Citizens always submit final applications through the official government portal. Code Nova ensures they arrive there with everything already filled in.

---

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m "feat: add your feature description"`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## License

[MIT](LICENSE) — free to use, modify, and distribute.

---

## Built At

Code Nova was built as a hackathon project demonstrating how civic tech can close the gap between India's digital governance ambition and the everyday citizen experience.

> *"1.4 billion people deserve to interact with their government without friction, without confusion, and without losing half a day to paperwork."*

