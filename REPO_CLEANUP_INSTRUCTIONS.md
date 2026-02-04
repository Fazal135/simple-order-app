Repository cleanup instructions (remove database.sqlite from GitHub)

If you committed `backend/database.sqlite` to GitHub, it is best to remove it and stop tracking it.

Option A — (recommended) Using local git (copy/paste into PowerShell in your repo folder):

1. Open PowerShell in the repo root:

```powershell
cd "C:/Users/fazal/OneDrive/Desktop/shah/simple-order-app"
```

2. Ensure .gitignore exists (this repository already has one added).

3. Remove the file from Git tracking and commit:

```powershell
git rm --cached backend/database.sqlite
git add .gitignore
git commit -m "Remove database.sqlite from repo and ignore it"
git push origin main
```

Notes:
- This removes the file from the repository but keeps your local copy at `backend/database.sqlite`.
- If you used a different branch name replace `main` with your branch.

Option B — Using GitHub web UI (if you don't use git locally):

1. Open your repo in the browser.
2. Go to `backend/database.sqlite` file page.
3. Click the trash icon to delete the file and commit the deletion.
4. Add a new file in the repo root named `.gitignore` containing the line `backend/database.sqlite` (Upload file or use Add file → Create new file).

After either option, the DB file will no longer be tracked.

If you want me to prepare commands to also rewrite Git history to fully purge the file, say so (this is more advanced and should be done carefully).
