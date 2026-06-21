# VENDLUXE — Multi-Vendor E-Commerce Platform

A full-stack **React + TypeScript + Express + Prisma** multi-vendor e-commerce app.  
Vendors can list products, customers can browse and purchase, and the backend handles orders, payments, and email queues.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS, Redux Toolkit, React Router |
| Backend | Node.js, Express 5, TypeScript, Prisma ORM |
| Database | PostgreSQL |
| Cache / Queue | Redis + BullMQ |
| File Storage | Cloudinary |
| Payments | Paystack |
| Email | Nodemailer (SMTP) |

---

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or higher
- [npm](https://www.npmjs.com/) v9 or higher
- [Git](https://git-scm.com/)
- A **PostgreSQL** database (local or hosted — e.g. [Neon](https://neon.tech), Supabase)
- A **Redis** instance (local or hosted — e.g. [Upstash](https://upstash.com))
- A [Cloudinary](https://cloudinary.com/) account (free tier works)
- A [Paystack](https://paystack.com/) account for payments

---

## 1. Clone the Repository

```bash
git clone https://github.com/okoye-peter/multi-vendor-ecommerce-app.git
cd multi-vendor-ecommerce-app
```

---

## 2. Backend Setup

### Install dependencies

```bash
cd backend
npm install
```

### Configure environment variables

```bash
cp .env.example .env
```

Open `backend/.env` and fill in every value:

```env
PORT=5004
NODE_ENV=development

# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@host:5432/dbname?sslmode=require

# Generate with: openssl rand -base64 32
JWT_SECRET_KEY=

# SMTP (e.g. Mailtrap for dev, Resend / SendGrid for prod)
MAIL_SMTP_HOST=smtp.mailtrap.io
MAIL_SMTP_PORT=2525
MAIL_SMTP_USERNAME=
MAIL_SMTP_PASSWORD=
MAIL_SENDER_EMAIL=you@example.com

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_TLS=false

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Paystack
PAYSTACK_SECRET_KEY=

# Google OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_CALLBACK_URL=

# Facebook OAuth (optional)
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_CALLBACK_URL=
```

### Run database migrations

```bash
npm run prisma:migrate
```

### (Optional) Seed the database

```bash
npm run prisma:seed
```

### Start the backend dev server

```bash
npm run dev
```

The API will be available at `http://localhost:5004`.

---

## 3. Frontend Setup

```bash
cd ../frontend
npm install
```

### Configure environment variables

```bash
cp .env.example .env
```

Open `frontend/.env` and set:

```env
# Points to your backend API in development
VITE_API_URL=http://localhost:5004/api/
```

### Start the frontend dev server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Running Both Together (from project root)

From the project root you can build the full app in one command:

```bash
npm run build   # builds backend (TypeScript) + frontend (Vite)
npm run start   # starts the backend which also serves the built frontend
```

The backend serves the compiled React app as static files in production, so a single process handles everything.

---

## Available Scripts

### Backend (`backend/`)

| Script | Description |
|---|---|
| `npm run dev` | Start backend with hot-reload (tsx watch) |
| `npm run build` | Compile TypeScript → `dist/` |
| `npm run start` | Run the compiled production server |
| `npm run prisma:migrate` | Create and apply a new migration |
| `npm run prisma:deploy` | Apply pending migrations (used in CI/prod) |
| `npm run prisma:seed` | Seed the database with initial data |
| `npm run prisma:push` | Push schema changes without a migration file |

### Frontend (`frontend/`)

| Script | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Build for production → `dist/` |
| `npm run preview` | Preview the production build locally |

---

## Deployment (Render)

The project includes a `render.yaml` for one-click deployment on [Render](https://render.com).

1. Push the repo to GitHub.
2. Connect the repo in the Render dashboard and select **New → Blueprint**.
3. Render will detect `render.yaml` and create the service automatically.
4. Go to the service's **Environment** tab and add all the secret values from the backend `.env` section above.
5. Trigger a deploy — Render will:
   - Install all dependencies
   - Compile the backend TypeScript
   - Build the React frontend
   - Run Prisma migrations
   - Start the Express server, which serves both the API and the React app

> **Note:** You do not need a separate static site service. The Express backend serves the built React app directly.

---

## Project Structure

```
multi_vendor_app/
├── backend/
│   ├── prisma/           # Schema files and migrations
│   ├── src/
│   │   ├── config/       # App configuration
│   │   ├── controllers/  # Route handlers
│   │   ├── middleware/   # Auth, error handling, etc.
│   │   ├── queues/       # BullMQ job queues (email, reports)
│   │   ├── routers/      # Express route definitions
│   │   ├── service/      # Business logic layer
│   │   ├── workers/      # BullMQ queue workers
│   │   └── server.ts     # App entry point
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page-level components
│   │   ├── store/        # Redux store + RTK Query API slices
│   │   ├── libs/         # Axios instance, utility helpers
│   │   └── types/        # Shared TypeScript types
│   ├── .env.example
│   └── .env.production   # Production env (VITE_API_URL=/api/)
├── package.json          # Root build + start scripts
└── render.yaml           # Render deployment config
```
