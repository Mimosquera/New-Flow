# New Flow - Appointment Management System

**Repository:** https://github.com/Mimosquera/New-Flow-Salon
**Domain:** [newflowbarbershop.com](https://newflowbarbershop.com)

Barbershop appointment management system with bilingual support (EN/ES).

**Status:** Production Ready (February 2026)

---

## Overview

Full-stack web application for managing barbershop appointments, employee schedules, and customer bookings. Built with React frontend and Node.js/Express backend.

### Key Features
- Customer appointment booking with real-time availability
- Employee dashboard for managing requests and schedules
- Bilingual support with automatic translation (English/Spanish)
- Service management with price ranges
- Media uploads via Cloudinary
- Email/SMS notifications

---

## Tech Stack

**Frontend:** React 18.3.1, Vite, Bootstrap, Axios
**Backend:** Node.js, Express 4.22.1, PostgreSQL, Sequelize
**Services:** Cloudinary (media), LibreTranslate (translation), Nodemailer (email), Twilio (SMS)

All dependencies locked to exact versions for stability.

---

## Project Structure

```
new_flow_0.2/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Route pages
│   │   ├── services/      # API client
│   │   ├── utils/         # Utilities (language detection, etc.)
│   │   └── translations/  # i18n files
│   └── .env.example
│
├── server/                 # Express backend
│   ├── models/            # Sequelize models
│   ├── routes/            # API routes
│   ├── middleware/        # Auth, validation
│   ├── config/            # Database, upload config
│   └── scripts/           # Setup scripts
│
└── README.md
```

---

## Environment Variables

Configuration via environment variables. See `.env.example` files for templates.

**Server:** Database credentials, JWT secret, Cloudinary API keys, SMTP/Twilio credentials
**Client:** API URL (development/production)

---

## Database Schema

**Tables:**
- `users` - Employee accounts (bcrypt passwords)
- `services` - Services with price ranges, language detection
- `appointments` - Customer requests with status tracking
- `availabilities` - Employee weekly schedules
- `blocked_dates` - Date/time blocks for vacations
- `updates` - Posts/announcements with media

All models include language fields (`'en'` or `'es'`) for auto-translation.

---

## Translation System

- Detects language of user-generated content (services, updates)
- Stores original language in database
- Auto-translates to UI language via LibreTranslate API
- Language detection uses word patterns and special characters
- See `client/src/utils/languageDetection.js`

---

## Authentication & Security

- JWT-based authentication (jwt-simple)
- bcrypt password hashing
- Rate limiting on auth endpoints
- Helmet.js security headers
- CORS protection
- Environment variables for all secrets

---

## Code Quality

- No duplicate code
- Centralized utilities
- No unused dependencies
- Clean CSS (no duplicates)
- No debug logging
- Professional code organization

---

## Recent Updates (Feb 2026)

- Code cleanup and deduplication
- Fixed translation system bugs
- Added Cloudinary media support
- Security audit completed
- Documentation updated

**Version:** 1.0.0
**Last Updated:** February 17, 2026

---

## License

Private - All rights reserved
