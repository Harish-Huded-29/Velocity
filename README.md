# ⚡ VELOCITY — Fast Google Drive Downloader

> Direct CDN downloads via parallel range requests. OAuth token handed to the browser — file bytes never touch the server.

![Velocity UI](screenshot.png)

---

## 🧠 What Is This?

**Velocity** is a Google Apps Script web app that lets you download Google Drive files **significantly faster** than the standard Drive download method.

### The Problem
Traditional Google Drive downloads are single-threaded — your browser fetches the file as one continuous stream, which never fully saturates your internet bandwidth.

### The Solution
Velocity splits the file into **10 MB chunks** and downloads **5 chunks simultaneously** using HTTP `Range` headers, hitting Google's CDN directly from your browser. The chunks are then assembled in memory and saved with the original filename.

### Key Benefits
- 🚀 **Up to 5× faster** than standard Drive downloads
- 🔒 **Zero server involvement** — your file bytes go straight from Google's CDN to your browser
- 📊 **Real-time metrics** — live speed (MB/s), ETA, chunk map, and terminal log
- 🔁 **Auto-retry** — failed chunks retry up to 3 times automatically

---

## 📁 Project Structure

```
velocity/
├── Code.gs       ← Apps Script backend (server-side)
├── Index.html    ← Frontend UI (dark theme, served by doGet())
└── appsscript.json ← Manifest with OAuth scopes
```

---

## 🚀 How to Deploy

### Step 1 — Create a New Apps Script Project

1. Go to [script.google.com](https://script.google.com)
2. Click **New Project**
3. Rename the project to `Velocity` (optional)

### Step 2 — Add the Files

**`Code.gs`** — Paste the backend code (replace the default `myFunction` content)

**`Index.html`** — Create a new HTML file:
- Click the **+** next to Files → **HTML**
- Name it exactly `Index` (no `.html` extension needed)
- Paste the frontend UI code

**`appsscript.json`** — Enable the manifest:
- Go to **Project Settings** (⚙️ gear icon)
- Check **"Show `appsscript.json` manifest file in editor"**
- Replace its contents with:

```json
{
  "timeZone": "America/New_York",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  },
  "oauthScopes": [
    "https://www.googleapis.com/auth/drive.readonly",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

### Step 3 — Deploy as Web App

1. Click **Deploy** → **New deployment**
2. Click the gear icon ⚙️ next to **Type** → Select **Web App**
3. Configure:
   - **Description:** `Velocity v1`
   - **Execute as:** `Me`
   - **Who has access:** `Anyone` (or `Anyone with Google account`)
4. Click **Deploy**
5. **Copy the `/exec` URL** — this is your app URL

### Step 4 — Authorize the Script

1. Open the `/exec` URL in your browser
2. Google will prompt you to **authorize the script**
3. Click **Allow** to grant Drive read access
4. The Velocity UI will now load

> ⚠️ **Important:** Always use the `/exec` URL, NOT the `/dev` URL. The `/dev` URL re-requests authorization every time and will break the flow.

---

## 📖 How to Use

1. **Open** your deployed `/exec` URL in the browser
2. **Go to Google Drive** → right-click your file → **Share** → set to `Anyone with the link`
3. **Copy the Drive link** (e.g. `https://drive.google.com/file/d/YOUR_FILE_ID/view`)
4. **Paste** the link into the Velocity input field
5. Click **Analyze** — it will show the filename, size, and chunk count
6. Click **⚡ Start Download** — watch the parallel chunk map and live speed stats
7. The file saves automatically to your browser's Downloads folder

---

## ⚙️ Configuration (Optional)

You can tweak these constants at the top of the `<script>` section in `Index.html`:

| Constant | Default | Description |
|---|---|---|
| `CHUNK_SIZE` | `10 MB` | Size of each parallel chunk |
| `MAX_PARALLEL` | `5` | Number of simultaneous streams |
| `MAX_RETRIES` | `3` | Retry attempts per failed chunk |
| `RETRY_DELAY` | `1200ms` | Wait time between retries |

---

## 🐛 Troubleshooting

### "No response" when clicking Analyze
- Make sure you opened the **`/exec` URL**, not the `/dev` URL
- Re-open the `/exec` URL and complete the **Google authorization** flow
- Check that the file sharing is set to **"Anyone with the link"**

### "File not found" error
- The file sharing must be set to **"Anyone with the link can view"** — private files cannot be accessed

### "This is a Google Workspace file" error
- Google Docs, Sheets, and Slides cannot be downloaded directly
- Export them first from Drive: **File → Download → PDF / XLSX / etc.**
- Then share the exported file and use that link

### "Authorization error"
- Open the `/exec` URL fresh in your browser
- Complete the Google authorization dialog
- Try Analyzing again

### Download stuck or very slow
- Try reducing `MAX_PARALLEL` to `3` if you're hitting rate limits
- Large files (1 GB+) may take time to assemble in browser memory

---

## 🔐 Privacy & Security

- The Apps Script backend **only reads file metadata** (name, size, MIME type) and returns a **short-lived OAuth token**
- Your **file bytes never pass through the server** — they go directly from Google's CDN to your browser
- The OAuth token expires automatically and is scoped to **read-only Drive access**

---

## 📋 Requirements

- A **Google Account**
- The target file must be on **Google Drive**
- File must be shared as **"Anyone with the link"**
- Works with any binary file: `.mp4`, `.zip`, `.pdf`, `.mkv`, etc.
- Does **not** work with Google Docs/Sheets/Slides (export them first)

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Backend | Google Apps Script (V8 runtime) |
| Frontend | Vanilla HTML + CSS + JavaScript |
| Auth | Google OAuth 2.0 (via `ScriptApp.getOAuthToken()`) |
| Download | Fetch API with `Range` headers → Google Drive CDN |
| Assembly | `Uint8Array` merge → `Blob` → `URL.createObjectURL` |

---

## 📜 License

MIT — free to use, modify, and distribute.

---

*Built to solve the frustration of slow Google Drive downloads. If it helped you, give it a ⭐!*
