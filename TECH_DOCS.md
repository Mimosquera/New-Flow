# New Flow - Technical Documentation

## System Architecture

### Frontend Stack
- **Framework:** React 18.3.1
- **Build Tool:** Vite 6.4.1
- **Routing:** React Router DOM 7.12.0
- **Styling:** Bootstrap 5.3.8
- **HTTP Client:** Axios 1.13.2
- **Language:** JavaScript (ES6+)

### Backend Stack
- **Runtime:** Node.js 16+
- **Framework:** Express 4.22.1
- **Database:** PostgreSQL 12+
- **ORM:** Sequelize 6.37.7
- **Authentication:** JWT (jwt-simple)
- **Email:** Nodemailer 7.0.13
- **SMS:** Twilio 5.12.0

---

## Database Schema

### Tables
1. **users** - Employee accounts
2. **services** - Service offerings
3. **appointments** - Customer appointment requests
4. **availabilities** - Recurring employee schedules
5. **blocked_dates** - Date/time blocks
6. **updates** - Posts/announcements

### Key Relationships
- Appointments → Users (employee)
- Appointments → Services
- Availabilities → Users
- Blocked Dates → Users
- Updates → Users

---

## API Endpoints

### Public Endpoints
- `GET /api/data/employees` - List employees
- `GET /api/services` - List services
- `POST /api/appointments` - Create appointment
- `GET /api/availability/times/:date` - Available times
- `GET /api/updates` - Public updates

### Protected Endpoints (Require Auth)
- `POST /api/auth/login` - Employee login
- `GET /api/appointments` - Manage appointments
- `PUT /api/appointments/:id/accept` - Accept appointment
- `PUT /api/appointments/:id/decline` - Decline appointment
- `POST /api/services` - Create service
- `PUT /api/services/:id` - Update service
- `DELETE /api/services/:id` - Delete service
- `POST /api/availability` - Create availability
- `PUT /api/availability/:id` - Update availability
- `DELETE /api/availability/:id` - Delete availability
- `POST /api/blocked-dates` - Block dates
- `DELETE /api/blocked-dates/:id` - Unblock date
- `POST /api/updates` - Create update/post
- `DELETE /api/updates/:id` - Delete update

---

## Environment Variables

### Server (.env)
```
DATABASE_URL=postgres://user:pass@host:5432/dbname
JWT_SECRET=your-secret-key
EMAIL_USER=smtp@email.com
EMAIL_PASS=smtp-password
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
TWILIO_PHONE=+1234567890
NODE_ENV=production
PORT=3001
```

### Client
- API endpoint configured in `src/constants.js`

---

## Features List

### Customer Features
- ✅ View services with prices
- ✅ View latest updates/posts
- ✅ Request appointment
- ✅ Select preferred employee or "no preference"
- ✅ View available time slots
- ✅ Add notes to appointment
- ✅ Cancel appointment via email link
- ✅ Language toggle (English/Spanish)

### Employee Features
- ✅ Secure login
- ✅ View all appointment requests
- ✅ Accept/decline appointments
- ✅ Add notes when declining
- ✅ Filter by status (pending/accepted/declined/cancelled)
- ✅ Create/edit/delete services
- ✅ Set recurring weekly availability
- ✅ Block specific dates/times
- ✅ View grouped blocked dates
- ✅ Post updates with photos/videos
- ✅ Delete updates
- ✅ Mobile responsive dashboard

### Admin Features
- ✅ All employee features
- ✅ View all employees' schedules
- ✅ Filter availability by employee
- ✅ Filter blocked dates by employee

---

## File Structure

```
new_flow_0.2/
├── client/                  # Frontend React app
│   ├── src/
│   │   ├── assets/         # Images, videos
│   │   ├── components/     # Reusable components
│   │   ├── contexts/       # React contexts
│   │   ├── hooks/          # Custom hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── styles/         # CSS files
│   │   ├── translations/   # i18n translations
│   │   ├── utils/          # Helper functions
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   ├── package.json
│   └── vite.config.js
│
├── server/                  # Backend Express app
│   ├── config/             # Configuration
│   ├── middleware/         # Express middleware
│   ├── models/             # Sequelize models
│   ├── routes/             # API routes
│   ├── services/           # Business logic
│   ├── uploads/            # User uploaded files
│   ├── utils/              # Helper functions
│   ├── index.js            # Server entry point
│   ├── init-db.js          # Database setup
│   ├── seeds.js            # Sample data
│   └── package.json
│
├── MAINTENANCE.md           # Maintenance guide
└── TECH_DOCS.md            # This file
```

---

## Key Components

### Frontend Components
- `AppointmentsManager` - Manage appointment requests
- `AvailabilityManager` - Set recurring schedules
- `BlockedDatesManager` - Block specific dates
- `ServiceManager` - CRUD for services
- `UpdatePoster` - Create posts/updates
- `LanguageToggle` - Switch languages
- `FormInput` - Reusable form component

### Backend Models
- `User` - Employee accounts
- `Service` - Services offered
- `Appointment` - Customer appointments
- `Availability` - Recurring schedules
- `BlockedDate` - Date/time blocks
- `Update` - Posts/announcements

---

## Authentication Flow

1. Employee enters email/password
2. Server validates credentials
3. Server generates JWT token
4. Token stored in localStorage
5. Token sent in Authorization header for protected routes
6. Middleware validates token on each request
7. Token decoded to get user info

---

## Appointment Workflow

1. **Customer requests appointment**
   - Selects service, employee (optional), date, time
   - Adds optional notes
   - Appointment created with status "pending"

2. **Employee reviews request**
   - Sees appointment in dashboard
   - Can accept or decline
   - Must provide note if declining

3. **If accepted:**
   - Status changes to "accepted"
   - Customer receives confirmation email
   - Appointment shows in employee's schedule

4. **If declined:**
   - Status changes to "declined"
   - Customer receives email with reason
   - Time slot becomes available again

5. **Cancellation:**
   - Customer can cancel via email link
   - Status changes to "cancelled"
   - Employee notified
   - Time slot becomes available

---

## Translation System

### Structure
- Centralized in `client/src/translations/translations.js`
- Two languages: English (en), Spanish (es)
- Keys accessed via `useTranslation()` hook

### Usage
```javascript
const { t, language } = useTranslation();
return <h1>{t('welcome')}</h1>;
```

### Adding New Translations
1. Add key to both `en` and `es` objects
2. Use `t('keyName')` in components
3. No hardcoded strings in JSX

---

## Date/Time Handling

### Database Format
- Dates: `YYYY-MM-DD` (e.g., "2026-02-04")
- Times: `HH:MM:SS` (24-hour, e.g., "14:30:00")
- Timezone: Stored in UTC, displayed in local

### Display Format
- Dates: Localized based on language
  - English: "Feb 4, 2026"
  - Spanish: "4 feb 2026"
- Times: 12-hour format with AM/PM
  - "2:30 PM" / "2:30 p. m."

---

## Security Features

- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Rate limiting on login endpoint
- ✅ Helmet.js security headers
- ✅ CORS configured
- ✅ SQL injection prevention (Sequelize ORM)
- ✅ XSS protection (React auto-escaping)
- ✅ Environment variables for secrets

---

## Performance Optimizations

- ✅ React memoization (useMemo, useCallback)
- ✅ Lazy loading images
- ✅ Minified production build
- ✅ Database indexes on foreign keys
- ✅ Efficient queries (minimal N+1 issues)
- ✅ Client-side caching where appropriate

---

## Testing Checklist

### Manual Testing
- [ ] Create appointment as customer
- [ ] Accept appointment as employee
- [ ] Decline appointment with note
- [ ] Cancel appointment
- [ ] Create/edit/delete service
- [ ] Set weekly availability
- [ ] Block specific dates
- [ ] Post update with media
- [ ] Switch language (EN/ES)
- [ ] Test on mobile device
- [ ] Verify email notifications
- [ ] Verify SMS notifications (if enabled)

### Code Quality
```bash
cd client && npm run lint
cd server && npm run lint (if configured)
```

---

## Deployment Notes

### Production Checklist
1. Set `NODE_ENV=production` in server .env
2. Update `DATABASE_URL` to production database
3. Set strong `JWT_SECRET`
4. Configure SMTP for email
5. Configure Twilio for SMS
6. Build client: `cd client && npm run build`
7. Serve client build from server or separate host
8. Set up HTTPS/SSL
9. Configure domain DNS
10. Set up database backups

### Hosting Requirements
- Node.js 16+ runtime
- PostgreSQL 12+ database
- Storage for uploaded media files
- SSL certificate for HTTPS

---

## Common Issues & Solutions

### Issue: "Token expired"
**Solution:** User needs to log in again. Token TTL can be adjusted in auth middleware.

### Issue: "No times available"
**Solution:** Employee needs to set availability for that day/time.

### Issue: "Email not sending"
**Solution:** Check SMTP credentials in .env file.

### Issue: "Database connection failed"
**Solution:** Verify DATABASE_URL in .env and database is running.

---

## Browser Compatibility

### Supported Browsers
- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers (iOS Safari, Chrome Android)

### Not Supported
- ❌ Internet Explorer
- ❌ Very old browser versions (3+ years old)

---

## Accessibility Features

- ✅ Semantic HTML
- ✅ ARIA labels where needed
- ✅ Keyboard navigation support
- ✅ Form labels associated with inputs
- ✅ Proper heading hierarchy
- ✅ Sufficient color contrast
- ✅ Responsive touch targets (44x44px minimum)

---

## Dependencies Reference

### Why Each Package?

**Frontend:**
- `react` - UI framework (industry standard)
- `react-router-dom` - Client-side routing
- `axios` - HTTP requests (better than fetch)
- `bootstrap` - Quick, responsive styling
- `jwt-decode` - Parse JWT tokens
- `prop-types` - Runtime type checking

**Backend:**
- `express` - Web server framework
- `sequelize` - SQL ORM (prevents SQL injection)
- `pg` - PostgreSQL driver
- `bcryptjs` - Password hashing
- `jwt-simple` - JWT token generation
- `nodemailer` - Send emails
- `twilio` - Send SMS
- `cors` - Allow cross-origin requests
- `helmet` - Security headers
- `express-rate-limit` - Prevent brute force
- `multer` - File uploads
- `dotenv` - Environment variables

---

## Support & Maintenance

For questions about this codebase:
1. Review this documentation
2. Check MAINTENANCE.md for update procedures
3. Review inline code comments
4. Check package documentation links

---

*Last updated: February 4, 2026*
