# 🌀 DayFlow Enterprise (Kinetix)
### Next-Generation ERP & Workforce Management System

**DayFlow** is a premium, institutional-grade Human Resource Management system designed to bridge the gap between complex enterprise logic and intuitive user experience. Built with a high-end "Aero-Glass" aesthetic, it provides real-time precision in tracking attendance, payroll, and team performance.

---

## 🚀 Key Features

* **Aero-Glass Dashboard**: A sophisticated, dark-themed UI featuring glassmorphism and real-time data visualization.
* **Verified Onboarding**: Automated email verification system powered by **Nodemailer** to ensure institutional security.
* **Media-Ready Profiles**: High-fidelity profile picture and document uploads handled via **Cloudinary** CDN integration.
* **Strategic Attendance Monitor**: Real-time clock-in/out system with "Late" flags and automated work hour calculations.
* **Enterprise Payroll**: Comprehensive payroll configuration including HRA, allowances, and deductions.
* **Dynamic Time Off Management**: Multi-status leave tracking (Paid, Sick, Unpaid) with automated duration calculation.
* **Universal Password Security**: Integrated password strength validator requiring institutional-grade security before registration.

---

## 🛠 Tech Stack

### Frontend
* **React.js**: Functional components with Hooks architecture.
* **Tailwind CSS**: Custom "Aero-Glass" styling using backdrop blurs and slate-based palettes.
* **Lucide React**: Premium iconography for professional visual hierarchy.
* **React Hot Toast**: Real-time notification system for status updates.

### Backend
* **Node.js & Express**: High-performance RESTful API architecture.
* **Prisma ORM**: Type-safe database access and automated migrations.
* **Cloudinary SDK**: Cloud-based image management for employee media.
* **Nodemailer**: SMTP integration for secure email verification and system notifications.
* **PostgreSQL**: Relational database for institutional data integrity.
* **JWT (JSON Web Tokens)**: Secure, role-based access control (RBAC).

---

## 📂 Folder Structure

```text
DayFlow/
├── client/                 # Frontend (React + Tailwind)
│   ├── src/
│   │   ├── components/     # Reusable UI (Navbar, StatCards, Modals)
│   │   ├── context/        # Auth & State Management
│   │   ├── pages/          # Dashboard, Attendance, TimeOff, About
│   │   ├── utils/          # API Axios configurations
│   │   └── App.jsx         # Routing & Main Entry
├── server/                 # Backend (Node + Express)
│   ├── controllers/        # Business Logic (Leave, Attendance, User)
│   ├── middlewares/        # Auth/Admin Guards
│   ├── utils/              # Cloudinary & Mailer helper functions
│   └── prisma/
│       ├── schema.prisma   # Database Models & Relations
│       └── seed.js         # Enterprise Dummy Data Script
├── .env                    # Environment Variables
└── package.json
```
### 🗄 Database Schema (Prisma)
* The system utilizes a relational model designed for high-integrity HR data:

* User: Core personnel data including Employee ID, Role (ADMIN/EMPLOYEE), and Bank Details.

* Attendance: Tracks entry/exit, "Late" status, and work hours.

* Leave: Handles requests, types, and approval status.

* Salary: Stores financial identity and net salary calculations.

* AuditLog: Records system-wide actions for security auditing.

## 🏁 Getting Started
### 1. Prerequisites
* Node.js (v16+)

* PostgreSQL Instance

* Cloudinary API Credentials

* SMTP Credentials (Gmail/SendGrid/etc.)

## 2. Environment Setup
Configure your server/.env with the following:
```
DATABASE_URL="postgresql://user:password@localhost:5432/dayflow"
JWT_SECRET="your_secret_key"

# Cloudinary Config
CLOUDINARY_CLOUD_NAME="your_name"
CLOUDINARY_API_KEY="your_key"
CLOUDINARY_API_SECRET="your_secret"

# Nodemailer Config
EMAIL_HOST="smtp.gmail.com"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

3. Installation & Database Sync
```

# Install dependencies
cd client && npm install
cd ../server && npm install

# Sync database and run enterprise seeder
npx prisma migrate dev --name init
npx prisma db seed
```
4. Running the App
```

# Start Server
cd server && npm run dev

# Start Client
cd client && npm run dev
```
  
**🛡 Security & Media Protocol**

* Identity Verification: Account activation is gated by a Nodemailer verification process.

* Encrypted Media: Profile images are stored in Cloudinary using secure URL delivery.

* Password Complexity: Users must meet "Strong" criteria (uppercase, numbers, symbols, 8+ characters) before account creation.

* Auditability: Every leave approval or late check-in generates an automated Audit Log.

### 📄 License
© 2026 DayFlow Inc. (Kinetix). Built for the modern workforce.
