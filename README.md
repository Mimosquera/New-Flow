# New Flow - Appointment Management System

**Repository:** https://github.com/Mimosquera/New-Flow-Salon  
**Domain:** newflowbarbershop.com

Professional barbershop and hair salon appointment management system with bilingual support (English/Spanish).

**Status:** ✅ Production Ready (February 2026)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 16+ 
- PostgreSQL 12+
- npm or yarn

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Mimosquera/New-Flow-Salon.git
cd New-Flow-Salon

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

2. **Set up database:**
```bash
cd server
cp .env.example .env
# Edit .env with your database credentials
npm run init-db
```

3. **Start development servers:**
```bash
# Terminal 1 - Start backend (from server folder)
npm run dev

# Terminal 2 - Start frontend (from client folder)
npm run dev
```

4. **Access the application:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

---

## 📚 Documentation

See **[TECH_DOCS.md](TECH_DOCS.md)** for complete technical documentation including:
- Architecture overview
- API endpoints
- Database schema
- Authentication & security
- Translation system
- Deployment guide

---

## ✨ Features

### Customer Features
- View services and pricing
- Request appointments online
- Select preferred barber/stylist or "no preference"
- View real-time available time slots
- Add special requests/notes
- Cancel appointments via email
- Bilingual interface (English/Spanish)

### Employee Features
- Secure dashboard login
- View and manage appointment requests
- Accept or decline appointments
- Add notes when declining
- Filter appointments by status
- Create/edit/delete services
- Set recurring weekly availability
- Block specific dates/times for vacation, etc.
- Post updates with photos/videos
- Mobile-responsive interface

### Admin Features
- All employee features
- View all employees' schedules
- Manage availability across team
- Filter by employee

---

## 🏗️ Tech Stack

### Frontend
- React 18.3.1
- React Router 7.12.0
- Bootstrap 5.3.8
- Axios 1.13.2
- Vite 6.4.1

### Backend
- Node.js / Express 4.22.1
- PostgreSQL / Sequelize 6.37.7
- JWT Authentication
- Nodemailer (Email)
- Twilio (SMS)

**All dependencies locked to exact versions for stability.**

---

## 📁 Project Structure

```
new_flow_0.2/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── translations/  # i18n (EN/ES)
│   │   └── ...
│   └── package.json
│
├── server/                 # Express backend
│   ├── models/            # Database models
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth, validation
│   ├── config/            # Configuration
│   ├── scripts/           # Utility scripts (setup/maintenance)
│   └── package.json
│
├── MAINTENANCE.md          # Maintenance guide ⭐
├── TECH_DOCS.md           # Technical docs ⭐
└── README.md              # This file
```

---

## 🔐 Environment Variables

### Server (.env)
```env
DATABASE_URL=postgres://user:password@localhost:5432/new_flow_db
JWT_SECRET=your-secret-key-here
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-email-password
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_PHONE=+1234567890
NODE_ENV=development
PORT=3001
```

### Client
- API URL configured in `src/constants.js`

---

## 🧪 Testing

```bash
# Run linter
cd client
npm run lint

# Build production
cd client
npm run build
```

---

## 📦 Production Build

```bash
# Build frontend
cd client
npm run build

# Frontend build output in client/dist/
# Serve with Express or static file host

# Backend runs as-is
cd server
npm start
```

---

## 🛡️ Security Features

- JWT authentication for employee access
- Password hashing with bcrypt
- Rate limiting on login endpoint
- Helmet.js security headers
- CORS protection
- SQL injection prevention via ORM
- XSS protection via React
- Environment variables for secrets

---

## 🌍 Internationalization

Bilingual support built-in:
- English (en)
- Spanish (es)

Toggle available in UI. All text, dates, and times localized.

To add new language:
1. Add translations to `client/src/translations/translations.js`
2. Update `LanguageContext.jsx` with new language option

---

## 📱 Browser Support

- ✅ Chrome, Firefox, Safari, Edge (last 2 versions)
- ✅ iOS Safari 14+
- ✅ Chrome Android 90+
- ✅ Fully responsive (mobile-first design)

---

## 🔧 Key Scripts

### Server
```bash
npm start          # Start production server
npm run dev        # Start with nodemon (auto-reload)
npm run init-db    # Initialize database
npm run seed       # Seed with sample data
```

### Client
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run lint       # Run ESLint
```

---

## 📊 Database Schema

### Tables
- `users` - Employee accounts
- `services` - Services offered
- `appointments` - Customer appointments
- `availabilities` - Recurring employee schedules
- `blocked_dates` - Blocked date/time ranges
- `updates` - Posts/announcements

See [TECH_DOCS.md](TECH_DOCS.md) for detailed schema.

---

## 🔄 Workflow

1. **Customer requests appointment** → System checks availability → Creates pending request
2. **Employee reviews** → Accept (confirms appointment) or Decline (with reason)
3. **Notifications sent** → Email to customer with confirmation or decline reason
4. **Customer can cancel** → Via link in email at any time

---

## ⚡ Performance

- React memoization for optimal re-renders
- Efficient database queries with indexes
- Lazy loading for images
- Minified production builds
- Client-side caching where appropriate

---

## 🛠️ Troubleshooting

### Can't connect to database
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Ensure database exists: `createdb new_flow_db`

### API requests failing
- Verify server is running on port 3001
- Check CORS settings in server/index.js
- Verify API URL in client/src/constants.js

### Email not sending
- Verify EMAIL_USER and EMAIL_PASS in .env
- Check SMTP settings for your email provider
- Gmail may require "App Password"

### SMS not sending
- Verify Twilio credentials in .env
- Check Twilio account status
- Ensure phone number is verified

---

## 🎯 Future-Proof Design

✅ **All dependency versions locked** - No surprise breaking changes  
✅ **Stable, mature packages** - Not experimental tech  
✅ **Comprehensive documentation** - Easy to maintain  
✅ **Clear upgrade paths** - When needed in future  
✅ **Rollback procedures** - Quick recovery if issues  

**See [MAINTENANCE.md](MAINTENANCE.md) for complete future-proofing strategy.**

---

## 📞 Support

1. Review [TECH_DOCS.md](TECH_DOCS.md) for technical details
2. Check [MAINTENANCE.md](MAINTENANCE.md) for updates and maintenance
3. Review inline code comments
4. Check package documentation for specific libraries

---

## 📝 License

Private - All rights reserved

---

## 🎉 Credits

Built with modern web technologies for reliability and maintainability.

**Version:** 1.0.0  
**Last Updated:** February 2026  
**Status:** Production Ready ✅

---

## 🔒 Stability Guarantee

This application is built for **long-term stability**:

- No automatic updates (all versions locked)
- Will continue working as-is for 3-5+ years
- Only update for critical security issues
- Full documentation for any future maintenance
- Comprehensive testing checklist provided
- Backup and rollback procedures documented

**You can deploy this today and it will still work in 2030.** 🚀

