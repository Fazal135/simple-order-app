Render deployment & Gmail SMTP checklist

Follow these exact steps to make sure your Render service sends OTP emails and runs correctly.

1) Render service settings (Root dir & commands)
- Repository root: your GitHub repo `simple-order-app`
- Create Web Service in Render with:
  - Root Directory: `backend`
  - Environment: `Node`
  - Build Command: `npm install`
  - Start Command: `npm start`
  - Instance Type: Free

2) Required environment variables (set these in Render → Service → Settings → Environment)
- `EMAIL_USER` = your Gmail address (e.g., your@gmail.com)
- `EMAIL_PASS` = 16-character Gmail App Password (see below)
- `SHOP_OWNER_EMAIL` = shopowner@gmail.com (or your shop email)
- `SESSION_SECRET` = any random string (e.g., `verysecret_123`)

3) How to create a Gmail App Password (exact steps)
- Go to https://myaccount.google.com/security
- Under "Signing in to Google" enable 2-Step Verification (if not already). Follow Google prompts.
- After enabling 2FA click "App passwords" → Select App: Mail → Select Device: Other (enter "Render") → Generate.
- Copy the 16-character password and paste it into `EMAIL_PASS` on Render. Do NOT share it.

4) Redeploy after setting env vars
- On Render service page click "Deploys" → "Manual Deploy" (or "Deploy Latest Commit"). Wait for build to finish.
- Check Logs for:
  - "Connected to SQLite database."
  - "Server running at http://localhost:3000"
  - If you see SMTP errors (authentication, TLS), copy the error lines and ask me.

5) Temporary testing without real email
- If you want to test immediately, clear `EMAIL_USER` and `EMAIL_PASS` (set to empty) on Render and redeploy. OTPs will be printed in the Render logs.

6) Notes about SQLite on Render
- The `backend/database.sqlite` file is stored on the instance disk. It can persist across deploys on the same instance, but Render may replace instances on redeploys — do NOT rely on SQLite for durable production data.
- For production use, migrate to a managed DB (Render Postgres or Supabase). I can help migrate later.
