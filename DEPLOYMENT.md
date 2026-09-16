# 🚀 BookHaven Deployment & Public Access Guide

This guide explains how to access BookHaven from any phone, laptop, or remote network worldwide.

---

## ⚡ 1. Instant Live Public Access (Active Right Now)

Your local full-stack server is currently connected to a secure public HTTPS tunnel:

👉 **`https://80571b78a4555f.lhr.life`**

### Mobile & Remote Access:
- You can open this link directly in Safari or Chrome on your **iPhone**, **Android**, or any device over **cellular data (5G/4G)** or a **different Wi-Fi network**.
- It bypasses `localhost` completely and routes through encrypted HTTPS directly to your BookHaven instance.

---

## ☁️ 2. Permanent Free Cloud Hosting (Recommended: Render)

To keep your website running 24/7 without needing your laptop powered on, deploy to **Render.com** (100% Free):

### Step-by-Step Deployment:
1. **Push your code to GitHub**:
   ```bash
   git init
   git add .
   git commit -m "Deploy BookHaven peer-to-peer marketplace"
   # Create a repository on GitHub, then push:
   git remote add origin https://github.com/<your-username>/bookhaven-marketplace.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy on Render**:
   - Go to [dashboard.render.com](https://dashboard.render.com/) and sign up / log in with GitHub.
   - Click **"New +"** ➔ **"Web Service"**.
   - Select your `bookhaven-marketplace` repository.
   - Configure:
     - **Name**: `bookhaven-marketplace` (or any name you choose)
     - **Region**: Choose the closest region (e.g., Singapore, Frankfurt, Oregon, Ohio)
     - **Branch**: `main`
     - **Root Directory**: Leave blank (root)
     - **Runtime**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm start`
     - **Instance Type**: `Free`
   - Click **"Create Web Service"**.

3. **That's it!** Render will automatically run the build and give you a permanent public URL:
   `https://bookhaven-marketplace.onrender.com`

---

## 🚂 3. Alternative: Railway.app

1. Go to [railway.app](https://railway.app) and sign in with GitHub.
2. Click **"New Project"** ➔ **"Deploy from GitHub repo"**.
3. Select your repository.
4. Railway automatically detects the `Procfile` and runs `npm start`.
5. Under Settings ➔ Networking, click **"Generate Domain"** to get your permanent public URL:
   `https://bookhaven-production.up.railway.app`

---

## 📐 Architecture Overview

```
+-------------------------------------------------------------+
|                Any Remote Device (iPhone / PC)              |
|                https://your-public-url.com                  |
+-------------------------------------------------------------+
                               |
                               v
+-------------------------------------------------------------+
|               Express Full-Stack Monolith                   |
|                      (Port: 5000 / $PORT)                   |
|                                                             |
|  1. Static Assets (dist/)   ==> Serves React SPA (HTML/JS)  |
|  2. REST API (/api/*)       ==> Auth, Products, Orders, Chat|
|  3. Uploads (/uploads/*)    ==> Statically serves QR/photos |
+-------------------------------------------------------------+
```

### Why this architecture?
- **Zero CORS friction**: Frontend and backend share the same origin, eliminating cross-domain blocking in Safari/iOS.
- **Single dyno / container**: Fits cleanly within free tiers on Render and Railway.
- **Relative `/api` path**: The frontend connects to `/api` without needing hardcoded hostnames or ports.
- **Configurable `VITE_API_URL`**: If you ever choose to host the frontend on Vercel and backend on Render separately, set `VITE_API_URL=https://your-backend.onrender.com` during the Vercel build.
