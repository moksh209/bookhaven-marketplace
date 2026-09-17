# 🚀 BookHaven Marketplace - Vercel & Supabase Deployment Guide

This guide walks you through deploying BookHaven to **Vercel** with **Supabase Storage** and **Supabase Auth / Identity** integration.

---

## 🌟 Architecture Overview

```
                                  +-----------------------+
                                  |   User Web Browser    |
                                  +-----------------------+
                                              |
                     +------------------------+------------------------+
                     | (Static Assets / HTML)                          | (/api/*)
                     v                                                 v
         +-----------------------+                         +-----------------------+
         |      Vercel CDN       |                         |   Vercel Serverless   |
         |    (Vite React SPA)   |                         |      (api/index.js)   |
         +-----------------------+                         +-----------------------+
                                                                       |
                                         +-----------------------------+
                                         |                             |
                                         v                             v
                             +-----------------------+     +-----------------------+
                             |   Supabase Storage    |     |  Supabase Auth / ID   |
                             |  (Book Photos & QRs)  |     |  (User UUID & Verification)
                             +-----------------------+     +-----------------------+
```

---

## 🗄️ Step 1: Set Up Supabase

### 1. Create a Free Supabase Project
1. Go to [supabase.com](https://supabase.com) and sign in or create an account.
2. Click **"New Project"**.
3. Choose your project name (e.g. `bookhaven-marketplace`), set a database password, and pick the region closest to your users.
4. Wait 1–2 minutes for the project to initialize.

### 2. Create the Storage Bucket for Images & Payment QRs
1. In the Supabase dashboard sidebar, click **"Storage"**.
2. Click **"New Bucket"**.
3. Set the Name to: `bookhaven`.
4. ⚠️ **IMPORTANT**: Turn **ON** the switch for **"Public bucket"** (this allows book photos and payment QR codes to be viewed by students).
5. Click **"Save"**.

#### Storage Policies (If prompted for permissions):
- In Supabase Storage ➔ **Policies** ➔ `bookhaven` bucket:
  - Add policy for **SELECT** (Read): allow all users (`anon` and `authenticated`).
  - Add policy for **INSERT** (Upload): allow all users (`anon` and `authenticated`).

### 3. Retrieve Your API Keys
1. In the Supabase sidebar, go to **Project Settings** (gear icon) ➔ **API**.
2. Copy the following values:
   - **Project URL** (e.g. `https://xyzprojectref.supabase.co`)
   - **Project API Keys ➔ `anon` `public`**
   - **Project API Keys ➔ `service_role` `secret`**

---

## ☁️ Step 2: Deploy to Vercel

### 1. Push Your Code to GitHub
Make sure all your changes are committed and pushed to your GitHub repository:
```bash
git add .
git commit -m "Configure Vercel serverless functions, Supabase storage, and login captcha"
git push origin <your-branch-name>
```

### 2. Import into Vercel
1. Log in to [vercel.com](https://vercel.com).
2. Click **"Add New..."** ➔ **"Project"**.
3. Select your GitHub repository (`bookhaven-marketplace`).

### 3. Configure Build Settings
Vercel should automatically detect **Vite**:
- **Framework Preset**: `Vite`
- **Root Directory**: `./` (leave default)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### 4. Add Environment Variables in Vercel
Expand the **"Environment Variables"** section in Vercel and add the following:

| Variable Name | Description | Example Value |
| :--- | :--- | :--- |
| `SUPABASE_URL` | Your Supabase Project URL | `https://yourproject.supabase.co` |
| `SUPABASE_ANON_KEY` | Supabase Anon Key | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY`| Supabase Service Role Key | `eyJhbGciOi...` |
| `SUPABASE_STORAGE_BUCKET` | Supabase bucket name | `bookhaven` |
| `CAPTCHA_SECRET` | Secret key for anti-bot HMAC tokens | Any random 32+ character string |
| `NODE_ENV` | Production environment flag | `production` |

### 5. Click "Deploy"
Vercel will compile the Vite frontend, package the serverless backend (`api/index.js`), and give you a permanent live URL:
👉 `https://your-project.vercel.app`

---

## 🛡️ Features & Edge Cases Handled

### 1. Anti-Bot CAPTCHA for Online Usage (Login & Signup)
- **Both Login and Signup** now require solving a human verification challenge before submitting.
- Each challenge is cryptographically signed using an HMAC token (`CAPTCHA_SECRET`) with a 10-minute expiration.
- Protects your live Vercel deployment from credential stuffing, brute-force bots, and spam registrations.

### 2. Email Verification Rate Limiting & Cooldowns
- **Cooldown**: Minimum 60-second cooldown between consecutive verification email requests for any single email.
- **Max Limit**: Maximum 3 verification attempts per 15-minute rolling window per email.
- If a user triggers the limit, an HTTP 429 error with the exact remaining countdown seconds is returned to prevent email provider quotas from exhausting.
- Resend Verification link is built directly into the login modal with live countdown timer.

### 3. Cloud Storage vs Local Read-Only Filesystems
- On Vercel, the local filesystem is read-only (`EROFS`).
- Book cover photos, additional images, seller payment QR codes, and chat attachments are automatically uploaded directly to your public **Supabase Storage** bucket.
- A resilient memory/base64 fallback is maintained so local testing and development never crash.

### 4. Canonical User ID System
- When Supabase is configured, user accounts sync with Supabase Auth UUIDs, ensuring persistent cross-device identity for listings, private chats, and orders.

---

## 🧪 Step 3: Verification & Health Check

After deployment completes:

1. **Test API Health**:
   Visit: `https://your-project.vercel.app/api/health`
   You should see:
   ```json
   {
     "status": "ok",
     "time": "2026-...",
     "env": "vercel-serverless"
   }
   ```

2. **Test Anti-Bot CAPTCHA**:
   - Open the web app on your phone or laptop.
   - Click **"Sign In"** ➔ verify the anti-bot question appears and can be answered.
   - Switch to **"Create a Free Account"** ➔ verify registration with CAPTCHA works.

3. **Test Image Upload to Supabase**:
   - Log in and navigate to **"Sell a Book"**.
   - Upload a book cover picture.
   - Inspect the uploaded image URL: it will begin with `https://<your-project>.supabase.co/storage/v1/object/public/bookhaven/...`.

---

## 💻 Local Development

To run the full stack locally:
```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env
# (Fill in your Supabase credentials in .env)

# 3. Start frontend and backend concurrently
npm run dev
```
- Frontend: `http://localhost:5173`
- Backend API: `http://localhost:5000/api`
