# Tech Escalations Amazon

A simple, professional Shadowfax page for Amazon operations to submit tech escalations. Every submission is fixed to issue type **"Incomplete Order"**. This is **not** a dashboard or table — it's a single centered submission form: City → Store → Rider ID → Upload Evidence → Submit.

Built with Next.js 14 (App Router) + TypeScript + Tailwind CSS. **Google Sheets** is the backend for both the standard City/Store list and escalation submissions. **Vercel Blob** stores the photo/video evidence.

---

## ⚠️ Read this first — two things I need from you

1. **I still can't open your Google Sheet.** The link you shared returns an access-denied response — it isn't shared publicly and I have no Google login. Share it with the service-account email from section 2 below (Editor access) so the app can read/write it.
2. **This version requires a "Master" tab you provide** with your standard City/Store list (see section 2c). Without it, the form has nothing to populate City/Store with — the page will show a clear error telling you exactly what's missing, rather than falling back to free-text entry (per your instruction not to allow uncontrolled values).

---

## 1. Project Setup

```bash
npm install
cp .env.example .env.local
# fill in .env.local with real values — see sections 2–3 below
npm run dev
```

Visit `http://localhost:3000`.

---

## 2. Google Sheets Setup

### a) Get the Spreadsheet ID
From your sheet's URL:
```
https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit
```
Copy `SPREADSHEET_ID` into `GOOGLE_SHEET_ID`.

### b) Service account (one-time)
1. [Google Cloud Console](https://console.cloud.google.com/) → create/select a project.
2. **APIs & Services → Library** → enable **Google Sheets API**.
3. **APIs & Services → Credentials → Create Credentials → Service Account**.
4. Open it → **Keys → Add Key → Create new key → JSON** → download it (keep private, never commit).
5. From that JSON: `client_email` → `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `private_key` → `GOOGLE_PRIVATE_KEY`.
6. **Share your Google Sheet** with `client_email` as **Editor**.

### c) The "Master" tab — your standard City/Store list (you provide this)
Create a tab named **`Master`** (configurable via `GOOGLE_MASTER_SHEET_TAB`) with exactly these column headers in row 1:

```
City | Store
```

One row per store, e.g.:

| City | Store |
|---|---|
| Bengaluru | Whitefield DS |
| Bengaluru | Koramangala DS |
| Mumbai | Andheri DS |

- The **City** dropdown is built from the unique values in this column.
- The **Store** dropdown only shows stores whose City matches the one selected — so pick City first.
- The app **only reads** this tab, never writes to it. Update it any time in Google Sheets directly and the form picks up the change on next page load.
- No free-text entry is allowed for City or Store — only values present in this tab can be selected, per your requirement.

### d) The "Escalations" tab — submissions (auto-created)
The app writes submissions to a tab named **`Escalations`** (configurable via `GOOGLE_SHEET_TAB`), creating it automatically with these headers if it doesn't exist yet:

```
Record ID | Created At | City | Store | Rider ID | Issue | Media Type | Media URL
```

Existing data in this or any other tab is never deleted or overwritten — new submissions are only ever appended.

### e) Verify the connection
```bash
npm run setup-sheet
```
or, once deployed, open `https://your-app.vercel.app/api/setup`. It checks both tabs and reports city/store/record counts without exposing secrets.

---

## 3. Media Storage (Vercel Blob)

Google Sheets stores only the **URL** of each photo/video; the file itself goes to Vercel Blob.

1. Vercel project dashboard → **Storage** tab → **Create Database → Blob**.
2. Vercel injects `BLOB_READ_WRITE_TOKEN` into your deployment automatically.
3. For **local dev only**: `vercel link` then `vercel env pull .env.local`, or copy the token manually from the Blob store's settings page.

---

## 4. Environment Variables

| Variable | Notes |
|---|---|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | From the service account JSON |
| `GOOGLE_PRIVATE_KEY` | From the service account JSON — see note below |
| `GOOGLE_SHEET_ID` | From the sheet URL |
| `GOOGLE_SHEET_TAB` | Defaults to `Escalations` |
| `GOOGLE_MASTER_SHEET_TAB` | Defaults to `Master` |
| `BLOB_READ_WRITE_TOKEN` | Auto-set by Vercel's Blob integration |

**On the private key:** it contains real newlines. Paste it as-is into Vercel's dashboard (newlines are preserved there). In a local `.env.local` file, wrap it in quotes with `\n` escapes instead — `lib/googleSheets.ts` converts `\n` back to real newlines automatically.

None of these are ever referenced in a client component — only inside `app/api/*/route.ts` and `lib/*.ts`, which run exclusively on the server.

---

## 5. Local Development

```bash
npm run dev            # http://localhost:3000
npm run build           # production build (also type-checks)
npm run start            # run the production build locally
npm run setup-sheet   # verify both Sheets tabs from the CLI
```

---

## 6. GitHub Deployment

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<your-org>/tech-escalations-amazon.git
git push -u origin main
```

`.env.local` and real secrets are excluded via `.gitignore` — only `.env.example` (blank values) is committed.

---

## 7. Vercel Deployment

1. [vercel.com/new](https://vercel.com/new) → import the GitHub repo.
2. **Project Settings → Environment Variables** → add the 6 variables above (add the Blob storage integration first so `BLOB_READ_WRITE_TOKEN` is set automatically).
3. Deploy.
4. Visit `/api/setup` once to confirm both Sheets tabs are reachable.

---

## 8. Architecture

```
Browser (single form page)
        │  fetch()
        ▼
Vercel API Routes                      ← secrets live only here
  /api/master      (GET)  ─────────────► Google Sheets "Master" tab (read-only)
  /api/upload       (POST) ────────────► Vercel Blob (media file)
  /api/escalations (POST) ─────────────► Google Sheets "Escalations" tab (append-only)
```

1. On page load, the browser calls `/api/master` to populate the City dropdown (and the per-city Store lists) from your Master tab.
2. On submit, the browser first calls `/api/upload` with the file, getting back a public URL.
3. Then it calls `/api/escalations` with City/Store/Rider ID + that URL, which appends one row to the Escalations tab.
4. The form clears and shows "Escalation submitted successfully."

---

## 9. Testing Checklist

- [ ] Page loads → City dropdown is populated from the Master tab
- [ ] Selecting a City filters the Store dropdown to that city's stores only
- [ ] Store dropdown is disabled with a "Select a city first" hint until a City is chosen
- [ ] Typing in City/Store search only filters existing options — there's no way to add an uncontrolled value
- [ ] Submitting with any field empty (or no media) shows inline validation and does not submit
- [ ] Attaching a JPG/PNG/WEBP shows an image preview before submit
- [ ] Attaching an MP4/MOV shows a video preview before submit
- [ ] A `.txt`/`.pdf` or an oversized file (>50MB) is rejected with a clear message
- [ ] Successful submit shows "Escalation submitted successfully" and clears the form
- [ ] A new row appears in the Escalations tab in Google Sheets with the correct data
- [ ] Temporarily breaking `GOOGLE_MASTER_SHEET_TAB` shows a friendly error with Retry, not a raw stack trace
- [ ] Mobile width: form remains centered, spacious, and easy to use; upload still works

---

## 10. Project Structure

```
tech-escalations-amazon/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                 # renders <EscalationPage />
│   ├── globals.css
│   └── api/
│       ├── master/route.ts      # GET — City/Store options from the Master tab
│       ├── escalations/route.ts # POST — append a submission
│       ├── upload/route.ts      # POST — media upload
│       └── setup/route.ts       # health check for both tabs
├── components/
│   ├── EscalationPage.tsx  # loads master data, renders header + form, toasts
│   ├── Header.tsx           # logo + title + subtitle
│   ├── EscalationForm.tsx  # the submission card itself
│   ├── StrictSelect.tsx     # searchable dropdown limited to given options
│   ├── MediaUploader.tsx   # upload + inline preview
│   └── Toast.tsx
├── lib/
│   ├── googleSheets.ts   # only file that talks to Sheets
│   ├── storage.ts          # only file that talks to Blob
│   ├── types.ts
│   └── utils.ts
├── scripts/setup-sheet.ts   # `npm run setup-sheet`
├── public/shadowfax-logo.png
├── .env.example
└── .gitignore
```

---

## 11. What was removed in this version

Per your request, this app is no longer a dashboard. The following were fully removed (components, API logic, and types deleted — not just hidden):

- Summary/stat cards (Total, Today's, Cities, Stores)
- Search bar and all filters (City, Store, Rider ID, Date, Issue)
- The escalation table (Record ID, Date & Time, Media, Actions/View columns)
- The `GET /api/escalations` list endpoint and all dashboard-only types/helpers (`FilterState`, `computeStats`, `formatDateTime`, etc.)
- The "Add Tech Escalation" modal — the form is now the page itself
- The free-text/creatable City & Store combobox — replaced by `StrictSelect`, which only allows picking from your Master tab's values

Escalation data itself is still saved to Google Sheets with the same columns as before (Record ID, Created At, City, Store, Rider ID, Issue, Media Type, Media URL) — nothing about the storage format changed, only what the UI shows.

---

## 12. Troubleshooting

**Seeing "Something went wrong while loading City/Store options" on the live page?** This message is intentionally generic for unexpected errors (so nothing sensitive ever leaks to the browser), but the app now distinguishes two situations:

- **Config problems it can diagnose** (Master tab missing, or missing "City"/"Store" headers) are shown **directly on the page**, e.g. *"Master data tab 'Master' was not found... Tabs currently in this spreadsheet: Sheet1, Escalations."* — this tells you exactly what to fix without needing logs.
- **Everything else** (bad credentials, no sheet access, network issues) stays generic on the page — check `/api/setup` for the real cause, safely, without exposing secrets.

Also note: **tab names now match regardless of case or extra spaces** — `master`, `Master `, and `MASTER` all resolve to the same tab, so a small typo there is no longer a failure mode.

If you've just added environment variables in the Vercel dashboard, **redeploy** — Vercel does not apply new env vars to an already-built deployment automatically; trigger a new deployment (or use "Redeploy" on the latest one) after saving them.

| Symptom | Likely cause |
|---|---|
| Page shows the exact tab/header problem | Follow the message — it names the missing tab or headers directly |
| City dropdown is empty / generic error | Master tab missing, sheet not shared, or wrong `GOOGLE_SHEET_ID` — check `/api/setup` |
| Store dropdown stays disabled after picking a City | That city has no rows with a Store value yet in the Master tab |
| Env vars set but error persists | You likely need to **redeploy** on Vercel after saving new env vars |
| "Could not connect to Google Sheets" on `/api/setup` | Sheet not shared with the service account email (must be Editor), or wrong `GOOGLE_SHEET_ID` |
| `ERR_OSSL_UNSUPPORTED` in logs | `GOOGLE_PRIVATE_KEY` pasted without real newlines — see section 4 |
| Uploads fail | `BLOB_READ_WRITE_TOKEN` missing/expired, or Blob store not created in the Vercel project |
