// ============================================================
//  VELOCITY — Fast Drive Downloader
//  Backend: Apps Script (Code.gs)
//
//  SETUP CHECKLIST:
//  1. In Apps Script editor, go to Project Settings → check
//     "Show 'appsscript.json' manifest file in editor"
//  2. In appsscript.json, ensure oauthScopes includes:
//       "https://www.googleapis.com/auth/drive.readonly"
//  3. Deploy → New deployment → Web App
//       Execute as: Me
//       Who has access: Anyone  (or "Anyone with Google account")
//  4. After deploying, open the /exec URL in your browser
//     and click through the Google authorization dialog.
//  5. Paste the /exec URL into your browser — NOT the /dev URL
//     (the /dev URL re-requests auth every time and can break).
// ============================================================

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Velocity — Fast Drive Downloader')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/**
 * Returns file metadata + a short-lived OAuth token.
 * The token lets the browser hit Google's CDN directly —
 * file bytes never pass through Apps Script.
 *
 * @param {string} input  Full Drive URL or bare file ID
 * @returns {{ success, fileId, name, size, mimeType, token } | { success, error }}
 */
function getFileInfo(input) {
  try {
    var raw = String(input || '').trim();
    if (!raw) {
      return { success: false, error: 'No input provided.' };
    }

    var fileId = extractFileId(raw);
    if (!fileId) {
      return {
        success: false,
        error: 'Could not find a valid Google Drive file ID in that link. ' +
               'Make sure you paste a full Drive URL or just the file ID.'
      };
    }

    // --- Explicitly call DriveApp so Apps Script requests the Drive scope ---
    var file;
    try {
      file = DriveApp.getFileById(fileId);
    } catch (driveErr) {
      var dmsg = driveErr.message || driveErr.toString();
      if (dmsg.indexOf('not found') !== -1 || dmsg.indexOf('404') !== -1) {
        return {
          success: false,
          error: 'File not found (ID: ' + fileId + '). ' +
                 'Check that the file exists and sharing is set to "Anyone with the link".'
        };
      }
      if (dmsg.indexOf('access') !== -1 || dmsg.indexOf('403') !== -1 ||
          dmsg.indexOf('permission') !== -1) {
        return {
          success: false,
          error: 'Access denied. Set the file sharing to "Anyone with the link can view".'
        };
      }
      throw driveErr; // re-throw unexpected errors
    }

    if (file.isTrashed()) {
      return { success: false, error: 'That file is in the trash.' };
    }

    // getSize() returns 0 for Google Docs/Sheets/Slides (non-binary files).
    // Those require export, not a direct download — warn the user.
    var size = file.getSize();
    var mime = file.getMimeType();

    if (mime && mime.indexOf('google-apps') !== -1) {
      return {
        success: false,
        error: 'This is a Google Workspace file (' + mime + '). ' +
               'Export it first (e.g. Download as PDF/XLSX from Drive) ' +
               'then share the exported file.'
      };
    }

    if (size === 0) {
      return { success: false, error: 'File appears to be empty (size = 0 bytes).' };
    }

    var token = ScriptApp.getOAuthToken();

    return {
      success:  true,
      fileId:   fileId,
      name:     file.getName(),
      size:     size,
      mimeType: mime,
      token:    token
    };

  } catch (e) {
    var msg = e.message || e.toString();

    // Surface authorization errors clearly
    if (msg.indexOf('Authorization') !== -1 || msg.indexOf('ScriptApp') !== -1) {
      msg = 'Authorization error. Open the deployed /exec URL in your browser and ' +
            'complete the Google authorization flow, then try again.';
    }

    return { success: false, error: msg };
  }
}

// ── extractFileId ────────────────────────────────────────────────────────────
/**
 * Extracts a Drive file ID from a URL or returns the input
 * directly if it already looks like a bare ID.
 *
 * Supported URL formats:
 *   https://drive.google.com/file/d/<id>/view
 *   https://drive.google.com/open?id=<id>
 *   https://drive.google.com/uc?id=<id>&export=download
 *   https://docs.google.com/…/d/<id>/…
 *   bare ID (25+ alphanumeric / dash / underscore chars)
 */
function extractFileId(input) {
  // Bare ID
  if (/^[a-zA-Z0-9_\-]{25,}$/.test(input)) return input;

  var patterns = [
    /\/file\/d\/([a-zA-Z0-9_\-]+)/,        // /file/d/<id>
    /\/d\/([a-zA-Z0-9_\-]{25,})/,          // /d/<id>   (Docs/Sheets/Slides share)
    /[?&]id=([a-zA-Z0-9_\-]+)/,            // ?id=<id>
    /\/open\?id=([a-zA-Z0-9_\-]+)/,        // /open?id=<id>
    /\/uc\?[^"]*id=([a-zA-Z0-9_\-]+)/      // /uc?...id=<id>
  ];

  for (var i = 0; i < patterns.length; i++) {
    var m = input.match(patterns[i]);
    if (m && m[1] && m[1].length >= 20) return m[1];
  }

  // Last resort: longest alphanumeric segment ≥ 25 chars
  var segments = input.split(/[/?&=#\s]/);
  for (var j = 0; j < segments.length; j++) {
    if (/^[a-zA-Z0-9_\-]{25,}$/.test(segments[j])) return segments[j];
  }

  return null;
}
