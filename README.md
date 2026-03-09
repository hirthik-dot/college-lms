# College LMS — Learning Management System

A full-stack Learning Management System built for colleges, featuring role-based dashboards for **Students**, **Staff**, and **Heads of Department (HOD)**.

---

## Tech Stack

| Layer    | Technologies                                                        |
| -------- | ------------------------------------------------------------------- |
| Frontend | React 18, React Router v6, TanStack Query v5, Axios, Tailwind CSS  |
| Backend  | Node.js, Express.js, PostgreSQL (pg), JWT, bcryptjs                 |
| Security | Helmet, CORS, express-rate-limit, role-based access control         |

---

## Prerequisites

- **Node.js** ≥ 18.x
- **npm** ≥ 9.x
- **PostgreSQL** ≥ 14.x

---

## Project Structure

```
college-lms/
├── client/          # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI (common + layout)
│   │   ├── pages/        # Route-level pages (auth, student, staff, hod)
│   │   ├── context/      # React context providers
│   │   ├── hooks/        # Custom hooks
│   │   ├── utils/        # Axios instance, helpers
│   │   └── styles/       # Global CSS, design tokens
│   └── public/
├── server/          # Express API
│   ├── src/
│   │   ├── routes/       # Express route definitions
│   │   ├── controllers/  # Request handlers
│   │   ├── middleware/   # Auth, roles, error handling
│   │   ├── models/       # Database queries & pool
│   │   ├── utils/        # JWT, bcrypt, validators
│   │   └── config/       # DB config, constants
│   └── server.js
└── README.md
```

---

## Getting Started

### 1. Clone & Install

```bash
git clone <repository-url>
cd college-lms

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Environment

```bash
# In the server/ directory
cp .env.example .env
```

Edit `server/.env` with your PostgreSQL credentials and a strong JWT secret:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/college_lms
JWT_SECRET=your-secure-secret-key-min-32-chars
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:5173
```

### 3. Set Up the Database

Create the PostgreSQL database:

```sql
CREATE DATABASE college_lms;
```

Run the schema migration (see `server/src/models/` for table definitions).

### 4. Start Development Servers

```bash
# Terminal 1 — Backend (from server/)
npm run dev

# Terminal 2 — Frontend (from client/)
npm run dev
```

| Service  | URL                     |
| -------- | -------------------
---- |
| Frontend | http://localhost:5173   |
| Backend  | http://localhost:5000   |
| API Docs | http://localhost:5000/api/health |

---

## User Roles

| Role      | Capabilities                                                                 |
| --------- | ---------------------------------------------------------------------------- |
| `student` | View attendance, assignments, marks, content, announcements                  |
| `staff`   | Take attendance, upload content, manage assignments, grade, request leave     |
| `hod`     | Manage staff & students, view reports, approve leaves, department management  |

---

## API Endpoints Overview

| Prefix               | Description              |
| --------------------- | ------------------------ |
| `POST /api/auth`      | Login & token refresh    |
| `GET /api/students`   | Student operations       |
| `GET /api/staff`      | Staff operations         |
| `GET /api/hod`        | HOD operations           |
| `GET /api/subjects`   | Subject management       |
| `GET /api/attendance` | Attendance tracking      |
| `GET /api/assignments`| Assignment management    |
| `GET /api/marks`      | Marks & grading          |
| `GET /api/announcements` | Announcements         |
| `GET /api/leaves`     | Leave requests           |

---

## Scripts

### Server

| Command          | Description                    |
| ---------------- | ------------------------------ |
| `npm run dev`    | Start with nodemon (hot reload)|
| `npm start`      | Start production server        |
| `npm run lint`   | Run ESLint                     |

### Client

| Command          | Description                    |
| ---------------- | ------------------------------ |
| `npm run dev`    | Start Vite dev server          |
| `npm run build`  | Production build               |
| `npm run preview`| Preview production build       |
| `npm run lint`   | Run ESLint                     |

---

## Environment Variables

See [`server/.env.example`](server/.env.example) for all required and optional variables.

---

## License

MIT
