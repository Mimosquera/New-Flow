# Technical Reference

## System Architecture

**Frontend:** React 18.3.1, Vite 6.4.1, React Router 7.12.0, Bootstrap 5.3.8, Axios 1.13.2
**Backend:** Node.js, Express 4.22.1, PostgreSQL 12+, Sequelize 6.37.7
**Services:** Cloudinary (media), LibreTranslate (translation), Nodemailer (email), Twilio (SMS)

---

## Database Schema

### Tables

**users** - Employee accounts (id, name, email, password, isEmployee)
**services** - Service offerings (id, name, description, price, price_max, language)
**appointments** - Customer requests (id, customerName, customerEmail, customerPhone, serviceId, employeeId, date, time, status, notes)
**availabilities** - Employee schedules (id, userId, dayOfWeek, startTime, endTime)
**blocked_dates** - Date/time blocks (id, userId, startDate, endDate, startTime, endTime, reason)
**updates** - Posts/announcements (id, title, content, author, date, media_url, media_type, cloudinary_id, user_id, language)

### Relationships

- appointments.employeeId → users.id
- appointments.serviceId → services.id
- availabilities.userId → users.id
- blocked_dates.userId → users.id
- updates.user_id → users.id

---

## API Endpoints

### Public
- `GET /api/data/employees` - List employees
- `GET /api/services` - List services
- `POST /api/appointments` - Create appointment request
- `GET /api/availability/available-times/:date` - Get available time slots
- `GET /api/updates` - List public updates

### Protected (JWT Required)
- `POST /api/auth/employee-login` - Employee authentication
- `GET /api/auth/verify` - Verify JWT token
- `GET /api/appointments` - List appointments (with filters)
- `PUT /api/appointments/:id/accept` - Accept appointment
- `PUT /api/appointments/:id/decline` - Decline appointment
- `PUT /api/appointments/:id/cancel-by-employee` - Cancel appointment
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `POST /api/availability` - Create availability
- `PUT /api/availability/:id` - Update availability
- `DELETE /api/availability/:id` - Delete availability
- `POST /api/blocked-dates` - Create blocked date range
- `DELETE /api/blocked-dates/:id` - Delete blocked date
- `POST /api/updates` - Create update/post (multipart for media)
- `DELETE /api/updates/:id` - Delete update
- `POST /api/auth/create-employee` - Create employee account (admin only)
- `DELETE /api/auth/employee/:id` - Delete employee (admin only)

---

## Translation System

### Language Detection

File: `client/src/utils/languageDetection.js`

Detects language using Spanish word patterns and special characters (áéíóúñü¿¡). Returns `'en'` or `'es'`.

### Auto-Translation Flow

1. Backend detects and stores language when creating services/updates
2. Frontend fetches content with language field
3. If UI language differs from content language, translates via LibreTranslate API
4. Translation cached on frontend for performance

Implementation:
- `UpdatePoster.jsx` - Lines 58-84 (translation effect)
- `ServiceManager.jsx` - Lines 73-98 (translation effect)
- Language field stored in database for services and updates tables

---

## Authentication

**Method:** JWT (jwt-simple)
**Token Storage:** localStorage (key: `'token'`)
**Token Format:** `Bearer <token>`
**Expiration:** Configured in `server/config/constants.js`

**Password Hashing:** bcrypt with salt rounds
**Protected Routes:** Require `verifyToken` middleware
**Employee Verification:** `requireEmployee` middleware checks `isEmployee` flag

---

## File Upload (Cloudinary)

**Implementation:** `server/config/upload.js`
**Middleware:** Multer with memory storage
**Accepted Types:** Images (JPEG, PNG, GIF, WebP), Videos (MP4, MOV, AVI, WMV, WebM)
**Size Limit:** 50MB
**Storage:** Cloudinary with folder `newflow-updates`

Update model stores: `media_url`, `media_type`, `cloudinary_id`

---

## Environment Variables

### Server

See `server/.env.example` for complete list. Required variables:

- Database: `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_NAME`, `DB_PASSWORD`
- Security: `JWT_SECRET_KEY`, `CLIENT_URL`
- Cloudinary: `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- Email: `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`
- SMS (optional): `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`

### Client

- Development: `VITE_API_URL`
- Production: `VITE_API_URL_PROD` (in `.env.production`)

---

## Security Features

- JWT authentication with token verification
- bcrypt password hashing
- Rate limiting (15 min window, configurable)
- Helmet.js security headers
- CORS with origin whitelist
- SQL injection prevention via Sequelize ORM
- XSS protection via React
- All secrets in environment variables

---

## Key Code Locations

**Frontend:**
- API client: `client/src/services/api.js`
- Language detection: `client/src/utils/languageDetection.js`
- Translations: `client/src/translations/translations.js`
- Auth utils: `client/src/utils/tokenUtils.js`

**Backend:**
- Models: `server/models/`
- Routes: `server/routes/`
- Auth middleware: `server/middleware/auth.js`
- Validation middleware: `server/middleware/validation.js`
- Database config: `server/config/database.js`
- Upload config: `server/config/upload.js`

---

## Date/Time Handling

**Storage:** PostgreSQL DATEONLY for dates, TIME for times
**Format:** Database uses 24-hour format (HH:MM:SS)
**Display:** Frontend converts to 12-hour format (h:MM AM/PM)
**Conversion:** `convertTo24Hour()` in AppointmentsPage.jsx

---

## Dependencies (Locked Versions)

All package versions locked to prevent breaking changes. Key dependencies:
- React 18.3.1
- Express 4.22.1
- Sequelize 6.37.7
- React Router 7.12.0
- Bootstrap 5.3.8
- Cloudinary 2.5.1
- jwt-simple 0.5.6
- bcrypt 5.1.1

---

## Browser Support

- Chrome, Firefox, Safari, Edge (last 2 versions)
- iOS Safari 14+
- Chrome Android 90+
- Mobile responsive (Bootstrap grid)

---

**Last Updated:** February 17, 2026
