# New Flow Barbershop

**Repository:** https://github.com/Mimosquera/New-Flow-Salon
**Production:** [newflowbarbershop.com](https://newflowbarbershop.com)

Full-stack appointment management system for a barbershop. React frontend, Node/Express backend, PostgreSQL database. Deployed on Heroku — the Express server builds and serves the React client as static files.

---

## Stack

**Frontend:** React 18.3.1, Vite 6.4.1, React Router 7.12.0, Bootstrap 5.3.8, Framer Motion, Axios
**Backend:** Node.js, Express 4.22.1, PostgreSQL 12+, Sequelize 6.37.7
**External services:** Cloudinary (media uploads), MyMemory API (auto-translation), Nodemailer (email), Twilio (SMS), Google Places API (reviews)

All dependency versions are pinned exactly — no `^` or `~` ranges.

---

## Project Structure

```
new_flow_0.2/
├── client/
│   └── src/
│       ├── components/     # Shared UI components (navbar, carousel, modals)
│       ├── data/           # Static fallback data (reviews.js)
│       ├── hooks/          # useTranslation, useTranslateItems, useForm
│       ├── pages/          # Route-level components
│       ├── services/       # Axios API client (api.js)
│       ├── translations/   # EN/ES string tables
│       └── utils/          # Language detection, date helpers, haptics
│
├── server/
│   ├── config/             # Database, Cloudinary, upload config
│   ├── middleware/         # JWT auth, validation
│   ├── models/             # Sequelize models
│   ├── routes/             # Express routers
│   └── scripts/            # DB init, seed, admin creation
│
├── Procfile                # Heroku: `web: node server/index.js`
└── DOCS/
```

---

## Environment Variables

Both `client/.env.example` and `server/.env.example` document required variables.

**Server:** database credentials, `JWT_SECRET_KEY`, `CLIENT_URL`, Cloudinary keys, SMTP credentials, Twilio credentials, `VITE_SEED_EMPLOYEE_EMAIL`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`
**Client:** `VITE_API_URL` (dev) / `VITE_API_URL_PROD` (production)

---

## Database Schema

- `users` — employee accounts (bcrypt passwords, `isEmployee` flag)
- `services` — service offerings with price ranges and a `language` field (`'en'` or `'es'`)
- `appointments` — customer requests with status (`pending`, `accepted`, `declined`, `cancelled`)
- `availabilities` — employee weekly schedules (day + time range)
- `blocked_dates` — explicit date/time blocks for employee unavailability
- `updates` — announcement posts with optional Cloudinary media

---

## Authentication

JWT via `jwt-simple`. The token is stored in `localStorage` under the key `'token'` and sent as `Bearer <token>` in the `Authorization` header. Admin is identified by matching the user's email against the `VITE_SEED_EMPLOYEE_EMAIL` env var — there's no separate role column.

---

## Translation

User-generated content (services, updates) stores its source language in the database. On the frontend, the `useTranslateItems` hook compares the stored language against the current UI language and calls the MyMemory API for any mismatch. Static UI strings are handled by `useTranslation`, which looks up keys in `client/src/translations/translations.js`.

---

## Google Reviews

`server/routes/reviews.js` fetches the business's rating, total review count, and latest reviews from the Google Places Details API. Results are held in memory for 24 hours before the next fetch. If `GOOGLE_PLACES_API_KEY` or `GOOGLE_PLACE_ID` are not set, the route returns 503 immediately. The frontend renders static reviews from `client/src/data/reviews.js` on first paint and silently replaces them with live data once the fetch completes.

---

**Last Updated:** March 2026
**License:** Private — All rights reserved
