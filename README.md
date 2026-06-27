<h1 align="center">Talkarox</h1>

<p align="center">
  <strong>AI-Powered Real-Time School Communication Platform</strong><br/>
  Secure communication between teachers, parents, students, and school administrators —<br/>
  without anyone ever sharing a personal phone number.
</p>

<p align="center">
  <a href="https://talkarox.vercel.app"><img src="https://img.shields.io/badge/Live%20Demo-talkarox.vercel.app-2563EB?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo" /></a>
</p>

<p align="center">
  <a href="https://react.dev/"><img src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white" /></a>
  <a href="https://vitejs.dev/"><img src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white" /></a>
  <a href="https://tailwindcss.com/"><img src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white" /></a>
  <a href="https://nodejs.org/"><img src="https://img.shields.io/badge/Node.js-22-339933?logo=node.js&logoColor=white" /></a>
  <a href="https://expressjs.com/"><img src="https://img.shields.io/badge/Express-5-000000?logo=express" /></a>
  <a href="https://supabase.com/"><img src="https://img.shields.io/badge/PostgreSQL-Supabase-4169E1?logo=postgresql&logoColor=white" /></a>
  <a href="https://socket.io/"><img src="https://img.shields.io/badge/Socket.IO-Real--Time-010101?logo=socketdotio" /></a>
  <a href="https://firebase.google.com/"><img src="https://img.shields.io/badge/Firebase-Cloud%20Messaging-FFCA28?logo=firebase&logoColor=black" /></a>
  <a href="https://render.com/"><img src="https://img.shields.io/badge/Backend-Render-46E3B7" /></a>
  <a href="https://vercel.com/"><img src="https://img.shields.io/badge/Frontend-Vercel-000000?logo=vercel" /></a>
</p>

---

## 🌐 Live Links

| Service | URL |
|---|---|
| 🚀 Frontend | https://talkarox.vercel.app |
| ⚙️ Backend API | https://talkarox-backend.onrender.com |
| ❤️ Health Check | https://talkarox-backend.onrender.com/health |

---

## 📖 What is Talkarox?

Talkarox is a modern, AI-powered communication platform designed specifically for educational institutions. Unlike WhatsApp groups or traditional messaging apps, it lets teachers, parents, students, and admins communicate professionally **without exposing personal phone numbers**.

It combines real-time messaging, AI assistance, school announcements, appointment scheduling, collaborative whiteboards, instant translation, and push notifications into one unified platform — and every screen and endpoint is fully implemented and wired end-to-end. No placeholders, no stubbed-out TODOs.

> **Zero cost to run.** Supabase (database), Brevo (email — no domain required), Hugging Face (AI, optional), Vercel + Render (hosting) all have free tiers sufficient for an MVP.

---

## ✨ Features

### 🔐 Authentication
- Email/password and Google Sign-In
- JWT access + refresh tokens
- Email verification & password reset
- Secure bcrypt password hashing

### 💬 Real-Time Messaging
- Socket.IO powered live chat
- Breathing presence indicators (online/offline)
- Typing indicators & read receipts
- AI message categorization
- Emoji support & conversation search
- Instant message translation

### 🏫 School Management
- School registration & role-based access control
- Dashboards for Admin, Teacher, Parent, and Student roles
- Authorization boundaries enforced at the API level *(parents can't post school-wide announcements; only admins can trigger emergency broadcasts)*

### 📢 Announcements
- School-wide and emergency broadcast announcements
- Rich text support & scheduled delivery
- Announcement feed per role

### 📅 Appointment Scheduling
- Parent–teacher meetings with smart availability
- Auto-generated video meeting links
- Office-hours-aware messaging
- Appointment history

### 🤖 AI Features
- Smart message classification & auto-summaries
- AI assistant for teachers and parents
- Language translation
- Smart reply suggestions

### 🎨 Collaborative Whiteboard
- Real-time drawing synchronization
- Image support for classroom sketching

### 📱 Fully Responsive
- Mobile-first with bottom tab bar navigation
- Full sidebar layout on desktop
- Tested across mobile, tablet, and desktop

### 🔔 Push Notifications
- Firebase Cloud Messaging
- Browser + push notifications

### 📊 Dashboards & Extras
- School statistics, user counts, activity monitoring
- Friendly (non-shaming) leaderboard
- Student-threaded conversations
- Weekly digests
- Original SVG illustrations — nothing from a stock icon library

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, Vite, Tailwind CSS v4, Framer Motion, Zustand, React Router, React Hook Form, Zod, Axios, Socket.IO Client, Firebase |
| **Backend** | Node.js 22, Express 5, PostgreSQL, Supabase, Socket.IO, JWT, bcrypt, Nodemailer, Google OAuth, Firebase Admin SDK |
| **Deployment** | Vercel (frontend), Render (backend), Supabase PostgreSQL (database), Brevo (email), Firebase Cloud Messaging (push) |

---

## 📂 Project Structure

```text
talkarox/
│
├── frontend/
│   ├── public/          # SVG logo, favicons
│   ├── src/             # React components, pages, stores, hooks
│   └── package.json
│
├── backend/
│   ├── src/             # Routes, controllers, middleware, sockets
│   └── package.json
│
├── README.md
└── SETUP_GUIDE.md       ← Start here (~25 min setup)
```

---

## ⚡ Quick Start

### 1. Clone

```bash
git clone https://github.com/Nitesh-N-D/Talkarox.git
cd Talkarox
```

### 2. Backend

```bash
cd backend
npm install
npm run migrate
npm run seed
npm run dev
```

### 3. Frontend *(new terminal)*

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

> **Before running**, read **`SETUP_GUIDE.md`** — it walks through the ~25 minutes of free account setup (Supabase, Google OAuth, Firebase, Brevo) and exactly what to paste into your `.env` files.

---

## 📘 Setup Guide

➡️ **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** covers:

- Supabase database setup & migrations
- Google OAuth configuration
- Firebase Cloud Messaging
- Brevo transactional email (no custom domain required)
- All environment variables
- Deploying to Render + Vercel
- Push notification setup

---https://www.linkedin.com/in/nitesh-n-d-249ab6325

## 🔒 Security

- JWT access + refresh token flow
- bcrypt password hashing
- Rate limiting & Helmet headers
- CORS protection
- Input validation (Zod)
- SQL injection protection via parameterized queries
- Secure environment variable handling

---

## 👨‍💻 Author

**Nitesh N D**

[![GitHub](https://img.shields.io/badge/GitHub-Nitesh--N--D-181717?logo=github)](https://github.com/Nitesh-N-D)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?logo=linkedin)](https://www.linkedin.com/in/nitesh-n-d-249ab6325)

---

## ⭐ Support

If you found this useful, give the repo a ⭐ and share it with others building school tech!
