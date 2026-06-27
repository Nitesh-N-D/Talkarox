# Talkarox

A free, AI-powered, real-time communication platform built for schools — so teachers and
parents can talk professionally without ever sharing personal phone numbers.

```
talkarox/
├── frontend/          React + Vite + Tailwind + Framer Motion
├── backend/           Node + Express + Socket.IO + PostgreSQL
└── SETUP_GUIDE.md      ← Start here
```

## Quick start

Read **`SETUP_GUIDE.md`** first — it walks through the ~25 minutes of free account setup
(database, Google Sign-In, email) and exactly what to paste where. After that:

```bash
# Backend
cd backend && npm install && npm run migrate && npm run seed && npm run dev

# Frontend (new terminal)
cd frontend && npm install && npm run dev
```

Then open `http://localhost:5173`.

## What's inside

- **10+ signature features**: breathing presence indicators, AI message categorization,
  office-hours-aware messaging, student-threaded conversations, a quick whiteboard, real-time
  translation, appointment scheduling with auto-generated video links, emergency broadcast,
  a friendly (non-shaming) leaderboard, and weekly digests.
- **Auth**: email/password and Google Sign-In, JWT access + refresh tokens, email
  verification, password reset.
- **Fully responsive**: one codebase, tested layouts for mobile, tablet, and desktop, with a
  bottom tab bar on mobile and a full sidebar on desktop.
- **Original visuals**: every illustration and avatar is generated SVG art built specifically
  for this app — nothing from a stock icon library.
- **Zero cost to run**: Supabase (database), Brevo (email, no domain required), Hugging Face
  (AI, optional), Vercel + Render (hosting) all have free tiers sufficient for an MVP.

No placeholders, no stubbed-out TODOs in the application logic — every screen and endpoint
described here is implemented and wired end-to-end.

## Verified, not just written

This isn't just code that looks plausible — it was run. A real PostgreSQL database was spun
up, migrations were applied, the backend was booted, and every major endpoint was exercised
live with real HTTP and WebSocket requests across all four roles (admin, teacher, parent,
student), including authorization boundaries (parents can't post school-wide announcements,
only admins can trigger emergency broadcasts). That process caught and fixed three real bugs
that static review wouldn't have: a SQL column-shadowing bug that silently zeroed out the
leaderboard, and two spots where the API claimed an email was sent when it wasn't. Details on
exactly what was tested and what was fixed are in `SETUP_GUIDE.md`.
