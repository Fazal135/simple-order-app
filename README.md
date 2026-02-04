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
# Copy [.env.example](http://_vscodecontentref_/2) to .env and edit values (EMAIL_USER, EMAIL_PASS, SHOP_OWNER_EMAIL)
copy [.env.example](http://_vscodecontentref_/3) .env
# Edit .env in a text editor and set EMAIL_USER and EMAIL_PASS (Gmail app password recommended)
npm start