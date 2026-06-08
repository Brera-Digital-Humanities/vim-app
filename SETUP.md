# VIM — La valigia immateriale
## Setup, development and deployment

Onboarding for developers. Source and form details are in
[`src/README.md`](src/README.md).

---

## 1. What VIM is

A multilingual PWA (Italian, English, Arabic/RTL) for collecting Palestinian
intangible cultural heritage. It shows a digital form — one question per screen,
KoBoCollect-style — and submits the data through the **VIM backend**, which
forwards it to KoboToolbox.

- **Form definition:** lives on KoboToolbox, pulled into `data.js` with `npm run sync`.
- **Submissions & login:** go through the VIM backend (server-side Kobo token);
  the client never holds the Kobo API token.
- **Delivery:** a self-contained static PWA, installable on iPhone/Android, works offline.

---

## 2. Project structure

```
vim-app/
├── src/                  SOURCE — the only thing you edit (see src/README.md)
├── dist/                 GENERATED — the PWA (index.html + manifest + service-worker + icons)
├── demo-desktop/         GENERATED — the demo with the iPhone skin (index.html)
├── scripts/              build-app.sh · watch.js · sync-kobo-form.js
├── tests/                unit (node:test) + DOM (jsdom) tests
├── package.json
└── SETUP.md
```

**Edit only `src/`.** `dist/` and `demo-desktop/` are build artifacts
(gitignored) — regenerate them, never edit by hand.

---

## 3. Environment setup (once)

**Requirements:** Node 18+ (v22 LTS recommended), npm, bash, git. All build
libraries (`sass`, `http-server`, `jsdom`) install locally — no global installs.

```bash
# Node via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 22 && nvm use 22

git clone <repo-url> vim-app && cd vim-app
npm install
```

On Windows use WSL2 (Ubuntu), then follow the steps above.

### Configuration (`.env`) — required

```bash
cp .env.example .env   # then fill in the values
```

| Variable | Used for | Notes |
|---|---|---|
| `VIM_KOBO_UID` | injected into the PWA (which form) | from the Kobo form URL |
| `VIM_SERVICES_URL` | injected into the PWA (backend base URL) | e.g. `http://localhost:8085/api/v1` |
| `VIM_KOBO_TOKEN` | **only** for `npm run sync` | not injected into the PWA build |
| `VIM_KOBO_BASE` | **only** for `npm run sync` | `https://eu.kobotoolbox.org` |

`.env` is gitignored; share only `.env.example`. The Kobo API token used for
real submissions lives server-side in the backend, never in the PWA.

### Verify

```bash
npm run check    # syntax-check every src/*.js
npm test         # unit + DOM tests
npm run build    # should end with "Built: dist/index.html …"
```

---

## 4. Development

```bash
npm run watch    # rebuild on every change in src/ (keep it running)
npm start        # serve dist/ (the PWA) on http://localhost:8765
npm run demo     # serve demo-desktop/ (phone-skin demo) on http://localhost:8766
```

Edit `src/` → the watcher rebuilds → refresh the browser. Don't open the files
via `file://` (service worker, cache and API calls need a static server).

> The PWA's service worker is network-first for the HTML, so a rebuilt page
> loads on the next online refresh. If a stale one sticks, unregister the
> service worker once (DevTools → Application).

### Where to change what

| To change… | Edit | Note |
|---|---|---|
| Colors, fonts, tokens | `src/styles/tokens.scss` | CSS variables only |
| A screen's style / markup / logic | `src/screens/<screen>/` | e.g. `form`, `outbox`, `drafts`, `sent` |
| Shared list/card styles | `src/styles/screens-base.scss` | `.list`, `.list-card`, `.card-*` |
| Navigation | `src/core/router.js` | `showScreen`, `goHome`… |
| Field rendering / completion gate | `src/screens/form/form.js` | `renderPage`, `updateCompleteBtn` |
| Conditional fields | `RELEVANT` in `data.js` (from Kobo) + `core/relevant.js` | |
| Submission target/format | `src/api.js` | XML build + POST to the backend |
| Offline queue / auto-send | `src/screens/outbox/outbox.js` + `core/storage.js` | see §6 |
| UI texts / new language | `src/i18n/` | see `src/README.md` |
| Form fields/order/choices | **on Kobo**, then `npm run sync` | never edit `data.js` by hand |

---

## 5. Build

```bash
npm run build    # runs npm run check, then scripts/build-app.sh
```

`build-app.sh` compiles the SCSS, concatenates `data.js` + JS + `api.js`,
expands the screens and the shared app bar into `app.html` / `demo.html`,
inlines the logo as a data-URI, and injects the public config from `.env`
(`VIM_KOBO_UID`, `VIM_SERVICES_URL`). It produces two self-contained files:
`dist/index.html` (PWA) and `demo-desktop/index.html` (demo).

---

## 6. Offline, storage & sync

The PWA is built for field use without a connection. Local storage is a
**buffer**; KoboToolbox is the source of truth.

- **Open offline** — `src/pwa/service-worker.js` caches the app shell:
  network-first for the HTML (latest build when online, cache when offline),
  cache-first for static assets and Google Fonts. Needs HTTPS or `localhost`.
  The cache is versioned (`vim-vN`); bump the version to purge the old one.
- **Persistent data** — `src/core/storage.js` uses IndexedDB (one record per
  draft / queued form / sent form, plus auth and language). The app requests
  `navigator.storage.persist()` and warns on the home when storage is ~90% full.
- **Send & idempotency** — each form carries a stable `instanceID`, so re-sends
  are deduplicated server-side. `autoSync` flushes the queue when online, at
  startup and after completing a form (with retry); manual "Send" / "Send all"
  stay available. A send already in flight can't be triggered twice.

> On iOS, install the PWA to the Home screen and serve over HTTPS so the
> browser is less likely to evict stored data.

---

## 7. Deploy

The PWA is a **static site**: serve `dist/` over **HTTPS** (any static host or
web server). HTTPS is required for PWA install and camera/microphone on iOS.

Submissions and login go to the **VIM backend** (separate component): it holds
the Kobo API token server-side and forwards submissions to KoboToolbox. If you
proxy uploads, raise the body-size limit (e.g. `client_max_body_size 100M` in
nginx) for long audio/video.

---

## 8. Updating the form

1. Edit the form on KoboToolbox (fields, order, translations, conditions, required).
2. Save and **redeploy** on Kobo.
3. `npm run sync` → regenerates `src/data.js` (PAGES + CHOICES + RELEVANT).
4. `npm run build`.

The VIM styling applies automatically. A genuinely new field *type* may need
one-time rendering support in `src/screens/form/form.js`.

---

## 9. Troubleshooting

| Problem | Fix |
|---|---|
| `sass: command not found` | `npm install` in the project root |
| `node` v13 or older | `nvm install 22 && nvm use 22` |
| `EADDRINUSE: …:8765` | free the port, or `npx http-server dist -p <PORT> -c-1 -o /index.html` |
| Build: `ERROR: src/XX missing` | a source file was removed — restore it |
| Blank page | opened via `file://` or partial build — use a static server |
| Stale page after rebuild | unregister the service worker once (DevTools → Application) |
| Submit fails 401/403 | VIM session expired — log out/in; the queue stays local and retries |
| Submit fails 5xx | backend / Kobo token issue — check the backend (`KOBO_API_TOKEN`) |
| iOS won't ask for camera/mic | serve over HTTPS |
| `npm run sync` fails | check `.env` token/UID and that the form is deployed on Kobo |

---

## 10. References

- `src/README.md` — source & form reference
- KoboToolbox API: https://eu.kobotoolbox.org/api/v2/
- OpenRosa (XForm submission standard, used by the XML built in `api.js`): https://docs.getodk.org/openrosa/
- XLSForm: https://xlsform.org/
