# Talkarox — Setup Guide

Everything in `frontend/` and `backend/` is real, complete, working code — no placeholders,
no "TODO: implement this." The only things left for you to do are the parts that genuinely
require a human: creating free accounts on a few services and pasting the resulting keys
into two `.env` files. That's it. None of these cost money.

Total setup time: **~25–35 minutes**, once.

---

## 0. What you'll need accounts for (all free)

| Service | What it's for | Domain required? |
|---|---|---|
| [Supabase](https://supabase.com) | Postgres database | No |
| [Google Cloud Console](https://console.cloud.google.com) | Google Sign-In | No |
| [Brevo](https://www.brevo.com) | Sending emails (verification, password reset, alerts) | **No** — this is why we use Brevo instead of Resend |
| [Hugging Face](https://huggingface.co) (optional) | Better AI categorization/summarization | No |

If you skip Hugging Face, the app still works — message categorization falls back to a
keyword-based system that's less precise but fully functional.

---

## 1. Database — Supabase (5 minutes)

1. Go to [supabase.com](https://supabase.com) → sign up free → "New Project"
2. Pick any name, set a database password (save it somewhere), choose a region close to you
   (e.g. Singapore for India)
3. Once the project is ready: **Project Settings → Database → Connection string → URI**
4. Copy that string — it looks like `postgresql://postgres:[password]@[host]:5432/postgres`
5. Replace `[password]` with the actual password you set in step 2

Paste this into `backend/.env` as `DATABASE_URL`.

Then run the migration to create all the tables:

```bash
cd backend
npm install
npm run migrate
```

You should see each table being created in the terminal. Optionally seed demo data:

```bash
npm run seed
```

This creates a demo school with a teacher, parent, and student so you can log in and click
around immediately. Demo logins (password `password123` for all):
- `admin@demo.talkarox.app`
- `anita.teacher@demo.talkarox.app`
- `lakshmi.parent@demo.talkarox.app`

---

## 2. Google Sign-In (10 minutes)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → create a new project
   (any name, e.g. "Talkarox")
2. In the search bar, go to **"OAuth consent screen"**
   - User type: External
   - App name: Talkarox
   - Support email: your email
   - Save and continue through the rest with defaults
3. Go to **"Credentials" → "Create Credentials" → "OAuth client ID"**
   - Application type: **Web application**
   - Authorized JavaScript origins: add `http://localhost:5173` (and later your real domain)
   - Authorized redirect URIs: add `http://localhost:5173` as well
4. Copy the **Client ID** (you don't need the client secret for this flow)

Paste the same Client ID into **both**:
- `frontend/.env` → `VITE_GOOGLE_CLIENT_ID`
- `backend/.env` → `GOOGLE_CLIENT_ID`

---

## 3. Email — Brevo (5 minutes, no domain needed)

This is the key difference from the original plan: Resend requires you to own and verify a
domain via DNS records. Since you're building this without a paid domain, Brevo is the better
fit — it lets you send from your own personal email address (Gmail, Outlook, etc.) once
verified, no domain ownership required.

1. Go to [brevo.com](https://www.brevo.com) → sign up free
2. Go to **Senders, Domains & Dedicated IPs → Senders → Add a sender**
3. Add your own email address (e.g. your Gmail) — Brevo will email you a verification link
4. Click that link to verify
5. Go to **SMTP & API → API Keys → Generate a new API key**

Paste into `backend/.env`:
- `BREVO_API_KEY` = the key you just generated
- `SENDER_EMAIL` = the email address you verified in step 3

Free tier limit: 300 emails/day, which is generous for an MVP.

---

## 4. AI features — Hugging Face (optional, 3 minutes)

1. Go to [huggingface.co](https://huggingface.co) → sign up free
2. Go to **Settings → Access Tokens → New token** (read access is enough)
3. Copy the token into `backend/.env` as `HF_API_KEY`

Without this, message categorization and the homework helper's summarization step use a
built-in keyword fallback instead of the ML models — still functional, just less nuanced.
Translation does **not** depend on this key (it uses a separate free endpoint).

---

## 5. File storage — Supabase Storage (5 minutes, same project as your database)

This powers real avatar photos, message attachments, and saved whiteboard sketches.

1. In your existing Supabase project (from step 1): go to **Storage** in the left sidebar
2. Click **New bucket** three times, creating buckets named exactly: `avatars`, `attachments`,
   `whiteboards`
3. For each bucket, toggle **Public bucket** on when creating it (so uploaded files are
   viewable via a direct URL — required for this app to display them)
4. Go to **Project Settings → API**, and copy:
   - **Project URL** → paste into `backend/.env` as `SUPABASE_URL`
   - **service_role** key (under "Project API keys" — NOT the `anon` key) → paste into
     `backend/.env` as `SUPABASE_SERVICE_KEY`

The service role key bypasses Row Level Security, which is what lets the backend upload
files on a user's behalf. Never expose this key in frontend code — it only belongs in
`backend/.env`.

Without this configured, upload attempts return a clear error message in the UI rather than
silently failing or faking success.

---

## 6. Push notifications — Firebase Cloud Messaging (10 minutes)

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project**
   → name it anything (e.g. "Talkarox") → you can skip Google Analytics
2. Once created, click the **Web icon (`</>`)** to register a web app → name it → **Register app**
3. You'll see a `firebaseConfig` object. Copy each value into `frontend/.env`:
   - `apiKey` → `VITE_FIREBASE_API_KEY`
   - `projectId` → `VITE_FIREBASE_PROJECT_ID`
   - `messagingSenderId` → `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `appId` → `VITE_FIREBASE_APP_ID`
4. Go to **Project Settings (gear icon) → Cloud Messaging** tab → scroll to **Web Push
   certificates** → click **Generate key pair** → copy that into `frontend/.env` as
   `VITE_FIREBASE_VAPID_KEY`
5. **Open `frontend/public/firebase-messaging-sw.js`** and replace the four
   `REPLACE_WITH_...` placeholders with the same four values from step 3. This file can't
   read `.env` (service workers run outside your app bundle), so these need to be pasted in
   directly.
6. Back in Firebase Console: go to **Project Settings → Service Accounts** → **Generate new
   private key** → this downloads a JSON file. Open it and copy three fields into
   `backend/.env`:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and the `\n` characters exactly
     as they appear in the JSON file — don't convert them to real line breaks)

Once both sides are configured, the browser will prompt for notification permission right
after a person logs in. Granting it registers their device for pushes on new messages,
appointment confirmations, announcements, and emergency broadcasts. Declining (or skipping
this setup entirely) doesn't break anything else — the rest of the app works identically
either way, just without the OS-level notification.

---

## 7. Run it locally

**Backend:**
```bash
cd backend
cp .env.example .env   # then fill in the values from steps above
npm install
npm run migrate
npm run seed            # optional, creates demo accounts
npm run dev              # starts on http://localhost:3001
```

You should see:
```
Talkarox backend running on port 3001
Health check: http://localhost:3001/health
```

Confirm it's actually working (not just printed a message and silently failed) by opening
`http://localhost:3001/health` in a browser or running:
```bash
curl http://localhost:3001/health
# Expect: {"status":"ok","timestamp":"..."}
```

If `npm run migrate` fails with a connection error, double check `DATABASE_URL` in
`backend/.env` — that's the #1 cause of local setup trouble, almost always a copy-paste
mismatch on the password or host.

**Frontend (new terminal):**
```bash
cd frontend
cp .env.example .env    # defaults already point to localhost:3001
npm install
npm run dev               # starts on http://localhost:5173
```

Open `http://localhost:5173` — you should see the landing page. Sign in with one of the
seeded demo accounts (`anita.teacher@demo.talkarox.app` / `password123`, etc.), or register
a new one and create your own school.

**Quick sanity check that both sides are actually talking to each other:** after logging in,
open your browser's dev tools → Network tab → you should see requests to
`localhost:3001/api/...` returning `200`, and a WebSocket connection to `localhost:3001`
showing as "101 Switching Protocols" (this is the real-time chat connection). If you see CORS
errors in the console instead, `FRONTEND_URL` in `backend/.env` doesn't match the URL you're
actually opening in the browser.

---

## 8. Deploying for real (when you're ready)

This part isn't required to use the app locally, but when you want a real URL:

1. **Push your code to GitHub** (a private repo is fine) — both `frontend/` and `backend/`
   can live in the same repo; Vercel and Render each only build the folder you point them at.

2. **Backend → Render**:
   - New → Web Service → connect your repo → set **Root Directory** to `backend`
   - Build command: `npm install`
   - Start command: `npm start`
   - Add every variable from `backend/.env` in Render's Environment tab — paste real values,
     not the example placeholders
   - After first deploy succeeds, open a Render Shell (or run locally once against the
     production `DATABASE_URL`) and run `npm run migrate` — migrations don't run automatically
   - Free tier sleeps after 15 minutes of inactivity; the first request after sleep takes
     ~20–30 seconds to wake up. This is normal, not a bug.

3. **Frontend → Vercel**:
   - New Project → import your repo → set **Root Directory** to `frontend`
   - Framework preset: Vite (should auto-detect)
   - Add every variable from `frontend/.env` in Vercel's Environment Variables settings
   - Set `VITE_API_URL` and `VITE_SOCKET_URL` to your real Render backend URL (e.g.
     `https://talkarox-backend.onrender.com` and `https://talkarox-backend.onrender.com/api`
     — note the API one needs `/api` appended, the socket one doesn't)

4. **Go back and update cross-references** now that both URLs are real:
   - `backend/.env` on Render: set `FRONTEND_URL` to your real Vercel URL
   - Google Cloud Console → OAuth client → "Authorized JavaScript origins" → add your real
     Vercel URL (keep `localhost:5173` too if you still want local dev to work)
   - `frontend/public/firebase-messaging-sw.js` → if you're using push notifications, this
     file needs the real Firebase values hardcoded (see section 6) — redeploy after editing

5. **Redeploy both** after the environment variable changes — Render and Vercel don't pick up
   new env vars on already-running instances automatically.

---

## 9. Google Search Console & SEO

The frontend already ships with:
- `index.html` meta tags, Open Graph tags, and structured data (`SoftwareApplication` schema)
- `public/robots.txt` and `public/sitemap.xml`
- A placeholder `google-site-verification` meta tag in `index.html`

To finish SEO setup once you have a real domain:
1. Go to [Google Search Console](https://search.google.com/search-console) → add your domain
2. Choose the "HTML tag" verification method — it gives you a `content="..."` value
3. Paste that value into the `google-site-verification` meta tag in `frontend/index.html`
   (replacing `REPLACE_WITH_YOUR_VERIFICATION_CODE`), then redeploy
4. Back in Search Console, click verify
5. Submit your sitemap: `https://yourdomain.com/sitemap.xml`
6. Update the hardcoded `https://talkarox.app` URLs in `index.html`, `robots.txt`, and
   `sitemap.xml` to your actual domain

---

## What's genuinely complete vs. what scales later

**Fully built, wired, and live-verified against a real PostgreSQL database:**
- Email/password + Google OAuth, JWT access/refresh tokens, email verification, password reset
- Real-time Socket.IO messaging (verified live: JWT handshake, presence broadcast, typing
  indicators), read receipts
- AI message categorization (5 categories, keyword fallback verified), translation, homework
  helper, weekly digest
- Office hours, appointment booking with auto-generated video links, emergency broadcast
- Announcements, leaderboard, school admin panel (including staff invites via real email),
  full settings
- Real file storage (Supabase Storage): avatar photos, message attachments, whiteboard sketches
- Real push notifications (Firebase Cloud Messaging): new messages, appointment confirmations,
  announcements, and emergency broadcasts all trigger an OS-level notification, not just an
  in-app toast
- Every dashboard number (active chats, unread count, response time, leaderboard rankings) is
  computed live from actual message timestamps in the database — nothing is hardcoded or
  randomly generated
- Fully responsive across mobile/tablet/desktop, original SVG illustrations (no stock icons)

**Every "configured?" check fails loudly and honestly, never silently:** if Supabase Storage
or Firebase isn't set up, uploads return a real `503` with a message telling you exactly what
to configure — they never fake success. Same for email: if Brevo isn't configured, the
register/invite/forgot-password responses explicitly say so (`verificationEmailSent: false`,
`emailServiceConfigured: false`, `emailSent: false`) instead of claiming an email went out
when it didn't. The rest of the app works completely independently of whether storage, push,
or email are configured — only those specific features degrade, nothing else breaks.

**Verified during this build (real bugs found and fixed against a live database, not just
code review):**
- A SQL column-name collision (`messages.id` shadowing the intended `users.id` reference in a
  nested subquery) was silently making the leaderboard's "fastest responders" and teacher
  search's response-time field return empty/null for everyone. Fixed by requiring fully
  table-qualified references in the shared helper, with a runtime guard against reintroducing
  the bug.
- The staff invite endpoint, and the registration/forgot-password flows, were telling the user
  "email sent" even when the email service wasn't configured and nothing was actually sent.
  All three now check the real send result and report honestly either way.
- File uploads were returning a generic masked "Something went wrong" 500 instead of the
  specific, actionable "storage isn't configured yet" message — fixed by raising a proper
  `ApiError` with a real status code instead of a plain `Error`.

---

## 10. Production checklist (no errors, in both environments)

Before treating a deployment as "done," verify each of these — they're the differences
between local and production that most commonly cause something to silently break:

- [ ] `backend/.env` on Render (or wherever you deploy) has **every** variable from
      `backend/.env.example` filled in with real values — not the local Postgres URL, the
      real Supabase one
- [ ] `FRONTEND_URL` in the backend env points to your **deployed** frontend URL (not
      `localhost:5173`) — this drives CORS and the Socket.IO origin check
- [ ] `VITE_API_URL` and `VITE_SOCKET_URL` in the frontend env point to your **deployed**
      backend URL (not `localhost:3001`)
- [ ] Google Cloud Console → OAuth client → "Authorized JavaScript origins" includes your
      real deployed frontend URL, not just `localhost:5173`
- [ ] `frontend/public/firebase-messaging-sw.js` has the real Firebase values pasted in
      (not the `REPLACE_WITH_...` placeholders) — redeploy after editing this file
- [ ] Supabase Storage buckets (`avatars`, `attachments`, `whiteboards`) are marked **Public**
      — if they're private, uploads succeed but the resulting URLs return 403 when opened
- [ ] Ran `npm run migrate` against the **production** database at least once (migrations
      don't run automatically on deploy — you need to trigger this manually after first
      pointing `DATABASE_URL` at production)
- [ ] Visit `https://your-backend-url/health` after deploying — should return
      `{"status":"ok",...}`. If it 502s or times out, the backend isn't running correctly
- [ ] Visit `https://your-backend-url/api/uploads/status` and `/api/push/status` — both
      should return `{"configured": true}` once you've completed sections 5 and 6 above
- [ ] Open browser dev tools on the deployed frontend and check the Console for CORS errors
      on first load — these almost always mean `FRONTEND_URL` or `VITE_API_URL` is wrong
- [ ] Re-running `npm run migrate` against an already-migrated database is safe (every
      migration uses `IF NOT EXISTS` / `DROP ... IF EXISTS` patterns) — if your deploy
      pipeline re-runs it on every deploy, that's fine, not a bug
- [ ] Register a brand-new test account against production and check the response includes
      `"verificationEmailSent": true` — if it says `false`, your `BREVO_API_KEY` /
      `SENDER_EMAIL` env vars aren't being picked up correctly on the deployed backend
- [ ] As an admin, try **Settings → invite a teacher** and confirm the response says an email
      was sent (not "email sending isn't configured") — same underlying check as above, from
      the actual UI path a real admin would use
