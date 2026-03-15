# Technical Reference

## Architecture

The Express server serves the React client as static files from `server/public/`. Vite builds the client into that directory. All API routes are prefixed with `/api`. Framer Motion handles page transitions and scroll-triggered section animations. CSS Modules are used for component and page-level styles; global utilities live in `index.css`.

**Frontend:** React 18.3.1, Vite 6.4.1, React Router 7.12.0, Bootstrap 5.3.8, Framer Motion, Axios 1.13.2
**Backend:** Node.js, Express 4.22.1, PostgreSQL 12+, Sequelize 6.37.7
**External:** Cloudinary (media), MyMemory API (translation), Nodemailer (email), Twilio (SMS), Google Places API (reviews)

---

## Database Schema

**users** — `id, name, email, password, isEmployee`
**services** — `id, name, description, price, price_max, language`
**appointments** — `id, customerName, customerEmail, customerPhone, serviceId, employeeId, date, time, status, notes`
**availabilities** — `id, userId, dayOfWeek, startTime, endTime`
**blocked_dates** — `id, userId, startDate, endDate, startTime, endTime, reason`
**updates** — `id, title, content, author, date, media_url, media_type, cloudinary_id, user_id, language`

Foreign keys: `appointments.employeeId → users`, `appointments.serviceId → services`, `availabilities.userId → users`, `blocked_dates.userId → users`, `updates.user_id → users`.

Dates are stored as PostgreSQL `DATEONLY`. Times are `TIME` in 24-hour format; the frontend converts to 12-hour for display.

---

## API Endpoints

### Public

```
GET  /api/data/employees
GET  /api/services
POST /api/appointments
GET  /api/availability/available-times/:date
GET  /api/updates
GET  /api/reviews
```

### Protected (JWT required)

```
POST /api/auth/employee-login
GET  /api/auth/verify
POST /api/auth/forgot-password
POST /api/auth/reset-password

GET  /api/appointments
PUT  /api/appointments/:id/accept
PUT  /api/appointments/:id/decline
PUT  /api/appointments/:id/cancel-by-employee

POST   /api/services
PUT    /api/services/:id
DELETE /api/services/:id

POST   /api/availability
PUT    /api/availability/:id
DELETE /api/availability/:id

POST   /api/blocked-dates
DELETE /api/blocked-dates/:id

POST   /api/updates
DELETE /api/updates/:id

POST   /api/auth/create-employee     (admin only)
DELETE /api/auth/employee/:id        (admin only)
```

---

## Authentication

JWT via `jwt-simple`. Token stored in `localStorage` as `'token'`, sent as `Bearer <token>`. The `verifyToken` middleware validates the token on every protected route. Admin status is determined by comparing `req.user.email` against `process.env.VITE_SEED_EMPLOYEE_EMAIL` — there's no `isAdmin` column.

Passwords are hashed with bcrypt. Rate limiting is applied on the auth login endpoint.

---

## Google Reviews

`server/routes/reviews.js` fetches from the Google Places Details API (`place/details/json`) using `GOOGLE_PLACES_API_KEY` and `GOOGLE_PLACE_ID`. The response is cached in memory with a 24-hour TTL. If either env var is absent, the route returns 503 immediately without attempting a fetch.

The `ReviewsCarousel` component (`client/src/components/ReviewsCarousel.jsx`) renders static data from `client/src/data/reviews.js` on mount, then calls `reviewsService.get()` and replaces the data if the live fetch succeeds. Failures are silently swallowed so static reviews always display.

The carousel is a CSS marquee: reviews are doubled (`[...reviews, ...reviews]`) and animated with `translateX(0) → translateX(-50%)`, which loops seamlessly. An `IntersectionObserver` toggles a `.trackOffscreen` class to pause the animation when the component is off-screen. Hover pause is handled entirely in CSS (`@media (hover: hover)` → `animation-play-state: paused`) so no JavaScript state interferes with it. A `mini` prop switches to compact sizing for the appointments page.

---

## Translation System

Language detection: `client/src/utils/languageDetection.js` checks for Spanish-specific characters and common word patterns and returns `'en'` or `'es'`.

When an employee creates a service or post, the server detects the language and stores it in the `language` column. On the frontend, `useTranslateItems(items, fields, language)` checks each item's stored language against the active UI language and calls the MyMemory API for any that differ. Results are applied to the specified fields.

Static UI strings (`useTranslation`) are looked up in `client/src/translations/translations.js` by key. The hook returns `translations[lang]?.[key] ?? key` — if a key is missing, it falls back to the key string itself.

---

## Appointment Flow

Appointments go through three status states: `pending → accepted` or `pending → declined`. Employees can also cancel accepted appointments. Customers receive email (and optionally SMS) at each transition. The cancel email contains a tokenized URL pointing to `CancelAppointmentPage`, which allows the customer to cancel without an account.

The appointments page uses Framer Motion phase transitions — the form moves through `service → employee → date → time → details → confirm` steps, each phase animating as a directional slide.

---

## File Uploads

Cloudinary handles all media for updates/posts. The server uses Multer with memory storage to buffer the upload, then streams it to Cloudinary under the `newflow-updates` folder. Accepted types: JPEG, PNG, GIF, WebP, MP4, MOV, AVI, WMV, WebM. Size limit: 50MB. The `updates` model stores `media_url`, `media_type`, and `cloudinary_id`. On delete, the server removes the asset from Cloudinary before deleting the DB record.

---

## Animations and Motion

Page transitions are managed by `AnimatePresence mode="wait"` in `App.jsx`. Homepage sections use `whileInView` with `viewport={{ once: true }}` and a shared `sectionVariants` config. Service cards and news posts use `AnimatePresence` with `motion.div layout` for height-animated expand/collapse. Card stagger delay: `(idx % 4) * 0.07s`, easing `[0.4, 0, 0.2, 1]`.

`HeroParticles` returns `null` when `window.innerWidth < 768` to skip the compositor layer on mobile.

Web haptics (`client/src/utils/haptics.js`) is a singleton `new WebHaptics()`. Intensities: `hapticLight` → 12ms, `hapticMedium` → 22ms, `hapticSuccess` → `'success'`, `hapticWarning` → `'warning'`.

---

## Key File Locations

**Frontend**
- API client: `client/src/services/api.js`
- Translation strings: `client/src/translations/translations.js`
- Language detection: `client/src/utils/languageDetection.js`
- Auth utilities: `client/src/utils/tokenUtils.js`
- Static review data: `client/src/data/reviews.js`
- Reviews carousel: `client/src/components/ReviewsCarousel.jsx`
- Haptics: `client/src/utils/haptics.js`

**Backend**
- Models: `server/models/`
- Routes: `server/routes/`
- Auth middleware: `server/middleware/auth.js`
- Validation middleware: `server/middleware/validation.js`
- Database config: `server/config/database.js`
- Upload config: `server/config/upload.js`
- Reviews route: `server/routes/reviews.js`

---

## Environment Variables

### Server (`server/.env.example`)

- Database: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`, `DB_PASSWORD` (local) or `DATABASE_URL` (Heroku)
- Security: `JWT_SECRET_KEY`, `CLIENT_URL`
- Admin: `VITE_SEED_EMPLOYEE_EMAIL`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Email: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`
- SMS (optional): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`
- Reviews: `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`

### Client (`client/.env.example`)

- `VITE_API_URL` — used in development
- `VITE_API_URL_PROD` — used in production builds (`.env.production`)

---

## Security

- Helmet.js sets security headers
- CORS restricted to `CLIENT_URL` origin
- JWT verification on all protected routes via `verifyToken` middleware
- bcrypt for passwords
- Rate limiting on the auth login endpoint
- Sequelize ORM prevents SQL injection
- All secrets in environment variables

---

**Last Updated:** March 2026
