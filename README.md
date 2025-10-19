# 🚀 Multi-Vendor App — Full Stack (React + TypeScript + Express + Prisma)

A full-stack **React + TypeScript + Express + Prisma** application for building a multi-vendor platform.  
This guide covers **everything** you need to set up and run the app locally.

---

## 📦 Prerequisites

Before you begin, make sure you have the following installed:

- [Node.js](https://nodejs.org/) (version **18** or higher)
- [npm](https://www.npmjs.com/) (version **9** or higher)
- [PostgreSQL](https://www.postgresql.org/download/)
- [Git](https://git-scm.com/)
- [Prisma CLI](https://www.prisma.io/docs/getting-started) *(installed automatically with dependencies)*

---

## 🧱 1. Clone the Repository

```bash
# 1. Clone project
git clone https://github.com/okoye-peter/multi-vendor-ecommerce-app.git
cd multi-vendor-ecommerce-app

# 2. Setup Backend
cd backend
npm install
cp .env.example .env
npm run db:migrate
npm run db:generate
npm run dev

# 3. Setup Frontend
cd ../frontend
npm install
cp .env.example .env
npm run dev

