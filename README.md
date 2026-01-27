# Simple Order App (Local)

This project is a minimal order-taking website (local) built with:

- Frontend: HTML + CSS + Vanilla JavaScript
- Backend: Node.js + Express
- Database: SQLite (local file)
- Email: Nodemailer (Gmail SMTP) — optional but recommended

Folder structure:

- simple-order-app/
  - backend/
    - server.js
    - package.json
    - .env.example
    - database.sqlite (created automatically)
  - frontend/
    - index.html
    - app.js
    - styles.css

Quick start (Windows):

1. Install Node.js (version 18 or later) from https://nodejs.org/ if you don't have it.
2. Open PowerShell and run:

```powershell
cd "C:/Users/fazal/OneDrive/Desktop/shah/simple-order-app/backend"
npm install
# Copy .env.example to .env and edit values (EMAIL_USER, EMAIL_PASS, SHOP_OWNER_EMAIL)
copy .env.example .env
# Edit .env in a text editor and set EMAIL_USER and EMAIL_PASS (Gmail app password recommended)
npm start
```

3. Open the app in your browser: http://localhost:3000/

Important notes & common problems:

- Email sending requires Gmail credentials. Create an app password for your Google account (recommended). If `EMAIL_USER`/`EMAIL_PASS` are not set, emails will be logged to the server console instead of being sent.
- SQLite database file `database.sqlite` will be created automatically in `backend/`.
- OTPs are stored in memory and expire after 5 minutes. If the server restarts, pending OTPs are lost.
- This is a minimal local app for learning and prototyping. Do not use in production without security hardening.
