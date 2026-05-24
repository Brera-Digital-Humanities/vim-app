# VIM — La valigia immateriale
## Setup tecnico, sviluppo e deploy in produzione

Documento di onboarding per chi prende in mano il progetto la prima volta.
Copre: setup ambiente, workflow di sviluppo, generazione dell'app, deploy.

### Indice della documentazione

| Documento | Per chi |
|---|---|
| **questo file (`SETUP.md`)** | Sviluppatore che lavora sul progetto: setup, build, workflow, deploy |
| [`src/README.md`](src/README.md) | Reference tecnica del form: sezioni, campi, lingue, mapping Kobo → JS |

---

## 1. Cos'è VIM

App web per la raccolta di patrimonio culturale immateriale palestinese.
Form digitale multilingua (Italiano, English, العربية con RTL) che simula
l'interfaccia di KoBoCollect su schermo mobile.

- **Backend dati:** KoboToolbox (server `eu.kobotoolbox.org`, UID form `<FORM-UID>`)
- **Definizione form:** presa da Kobo via `npm run sync` (rigenera `data.js`)
- **Target:** app web statica, PWA installabile su iPhone/Android (offline in sviluppo)

---

## 2. Struttura del progetto

```
vim-enketo/
├── src/                         ◄── SORGENTE (fonte di verità) — modulare
│   ├── build.order                   Ordine di concatenazione ([html],[js],[scss])
│   ├── app.html                      Guscio PWA a tutto schermo (body.app)
│   ├── demo.html                     Guscio demo con skin telefono (body.demo)
│   ├── partials/app-bar.html         Barra app condivisa dalle due pagine
│   ├── data.js                       PAGES + CHOICES + placeholder credenziali
│   ├── api.js                        Submit a KoboToolbox (doSubmit)
│   ├── manifest.json                 PWA manifest
│   ├── assets/logo.svg               Logo del brand (inline a build)
│   ├── i18n/                         Una lingua per file (it/en/ar + index)
│   ├── core/                         Logica condivisa (state, router, relevant…)
│   ├── screens/                      Una cartella per schermata (html + js + scss)
│   ├── styles/                       Design system condiviso (scss)
│   ├── pwa/                          service-worker.js + icons/
│   └── README.md                     Doc tecnica + come aggiungere una lingua
│
├── dist/                        ◄── GENERATO — la PWA reale (a tutto schermo)
│   └── index.html + manifest.json + service-worker.js + icons/
├── test/index.html              ◄── GENERATO — demo con skin telefono
│
├── enketo/                           Tutto ciò che riguarda Enketo Express
│   ├── package-template/config/      config.json
│   └── theme/theme.scss              tema Enketo (dormiente)
│
├── scripts/sync-kobo-form.js         Sync form da Kobo → src/data.js
├── scripts/build-app.sh              ◄── SCRIPT: src/ → dist/ + test/
└── SETUP.md                          questo file
```

### Principio fondamentale

**Si modifica SOLO `src/`.** Le cartelle `dist/` (PWA) e `test/` (demo) sono
**artefatti generati** da `scripts/build-app.sh` (gitignored). Modificarli a
mano significa perdere le modifiche al prossimo build.

---

## 3. Setup ambiente (una tantum)

### 3.1 Requisiti

| Tool | Versione minima | Note |
|---|---|---|
| `node` | 18+ | consigliato v22 LTS |
| `npm` | 9+ | viene con node |
| `bash` | 4+ | preinstallato su Linux/macOS, su Windows usare WSL |
| `git` | qualsiasi | per cloning |

> Tutte le **librerie di build** (`sass`, `http-server`) sono dichiarate in
> `package.json` e si installano localmente con `npm install`.
> **Nessuna installazione globale richiesta.**

### 3.2 Installazione su Linux/macOS

```bash
# 1. Node via nvm (se non già presente)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
# riapri il terminale, poi:
nvm install 22
nvm use 22
nvm alias default 22

# 2. Verifica
node --version    # v22.x.x
npm --version     # 10.x.x o 11.x.x
```

### 3.3 Installazione su Windows

Usare **WSL2** (Ubuntu) e poi seguire la sezione Linux/macOS.

```powershell
# In PowerShell come amministratore:
wsl --install -d Ubuntu
# Riavvia, apri Ubuntu, poi segui 3.2
```

### 3.4 Clone del progetto + installazione dipendenze

```bash
# Se è su Git
git clone <url-del-repo> vim-enketo
cd vim-enketo

# Oppure copia la cartella esistente
cp -r /percorso/sorgente/vim-enketo .
cd vim-enketo

# Installa le dipendenze (sass, http-server) in ./node_modules
npm install
```

### 3.5 Configurazione credenziali (.env) — **OBBLIGATORIO**

Le credenziali KoboToolbox (token API, UID del form, URL del server) **non sono
hardcoded** nel codice — sono in un file `.env` locale che è gitignored.

```bash
cp .env.example .env
nano .env       # → inserisci i tuoi valori reali
```

Variabili richieste:

| Variabile | Cosa | Dove la trovi |
|---|---|---|
| `VIM_KOBO_TOKEN` | Token API personale | KoboToolbox → Account → Security → API Token |
| `VIM_KOBO_UID` | UID del form | URL del form: `https://eu.kobotoolbox.org/#/forms/<UID>/` |
| `VIM_KOBO_BASE` | URL server | `https://eu.kobotoolbox.org` (server EU) o `.org` (US) |

> ⚠️ **Sicurezza:** il file `.env` non finisce mai su Git. Se vuoi condividere
> il progetto, condividi `.env.example` (placeholder) — chi clona dovrà
> crearsi il proprio `.env` con i propri valori.
>
> Se il tuo TOKEN è mai stato esposto (chat, commit, file `.bak`),
> **rigeneralo subito** su KoboToolbox: il vecchio diventa invalido all'istante.

### 3.6 Verifica installazione

```bash
npm run check
# Dovrebbe stampare: OK src/data.js (e gli altri .js)

npm run build
# Dovrebbe finire con:
#   ▸ Built: dist/index.html  (~140 KB)
```

Se entrambi i comandi terminano senza errori, l'ambiente è pronto.

---

## 4. Workflow di sviluppo

### 4.1 Ciclo tipico

```
   (se il form è cambiato su Kobo)
        ┌──────────────────────────┐
        │ npm run sync              │ ◄─── aggiorna data.js da Kobo
        └──────────┬───────────────┘
                   │
        ┌──────────▼───────────────┐
        │   modifica src/      │ ◄─── edit qui (codice/stile/lingue)
        └──────────┬───────────────┘
                   │
        ┌──────────▼───────────────┐
        │ npm run build             │ ◄─── rigenera l'app
        └──────────┬───────────────┘
                   │
        ┌──────────▼───────────────┐
        │ npm start                 │ ◄─── apre browser su :8765
        └──────────┬───────────────┘
                   │
                ok? ──► no ──► torna su
                   │
                  sì ──► deploy (sez. 6)
```

> `npm run build` esegue `build:app` con `npm run check` (syntax check
> sui .js) come pre-hook automatico.

### 4.2 Cosa modificare per quale tipo di cambiamento

| Vuoi cambiare... | Modifica | Note |
|---|---|---|
| Colori, font, design tokens | `src/styles/tokens.scss` | usare CSS variables `var(--accent)`, mai hex diretti |
| Stile di una schermata | `src/screens/<schermata>/<schermata>.scss` | es. `screens/form/form.scss` |
| Stili condivisi (bottoni, modal, RTL…) | `src/styles/*.scss` | buttons, modal, feedback, rtl, responsive |
| Markup di una schermata | `src/screens/<schermata>/<schermata>.html` | es. `screens/form/form.html` |
| Guscio PWA / demo | `src/app.html` (full-screen) · `src/demo.html` (skin telefono) | schermi al marker `<!-- @screens -->`; app-bar via `<!-- @file:partials/app-bar.html -->` |
| Testi UI / aggiungere una lingua | `src/i18n/<lingua>.js` + `i18n/index.js` | vedi `src/README.md` → "Aggiungere una lingua" |
| Logica di una schermata | `src/screens/<schermata>/<schermata>.js` | es. form, outbox, drafts, lang |
| Navigazione tra schermate | `src/core/router.js` | showScreen, goHome… |
| Rendering campi, bozze, completamento | `src/screens/form/form.js` | renderPage, nextField, updateCompleteBtn (required+visibili) |
| Campi condizionali | `RELEVANT` in `data.js` (da Kobo); logica in `core/relevant.js` | sintassi XLSForm: `${campo}='valore'` |
| Endpoint o formato submit | `src/api.js` → `doSubmit` | invio diretto a KoboToolbox (vedi nodo token, sez. 8) |
| Definizione form (campi, ordine, scelte) | **su Kobo**, poi `npm run sync` | NON si edita `data.js` a mano |
| Aggiungere/togliere campi del form | `src/data.js` → `PAGES` e `CHOICES` | meglio rigenerare da XLSForm aggiornato |
| Nome/icone PWA | `src/manifest.json` | |
| Ordine di concatenazione / nuovo file | `src/build.order` | aggiungi il path nella sezione `[js]` o `[scss]` |

### 4.3 Test locale (PWA + demo)

```bash
npm run build:app    # rigenera dist/index.html (PWA) e test/index.html (demo)
npm start            # serve dist/ (la PWA) su :8765 e apre il browser
npm run demo         # serve test/ (la demo con skin telefono) su :8766
```

In alternativa, se preferisci scegliere quale file aprire manualmente:

```bash
npm run serve             # http-server senza auto-apertura, su http://localhost:8765
```

> ⚠️ **NON** aprire il file con `file://` — i fetch verso KoboToolbox
> vengono bloccati per CORS. Serve sempre un server statico (`npm start`).

### 4.4 Convenzioni di codice

- **Nessun framework, nessuna dipendenza npm a runtime.** Vanilla JS ES6+.
- **CSS variables sempre:** `var(--accent)`, mai `#c4763a`.
- **Animazioni standard:** `slideIn`/`slideBack` per transizioni di campo,
  `fadeIn`/`slideUp` per modal.
- **Modal:** sempre append dentro `.phone-shell` (per restare nella cornice).
- **RTL:** testare ogni modifica anche con la lingua araba (`isRTL = !!UI_LANGS[currentLangIdx].rtl`).
- **Syntax check obbligatorio** prima di ogni commit. Lo script di build
  lo fa automaticamente con `node --check`.

---

## 5. Generazione dell'app

Dallo stesso sorgente `src/` si genera l'app completa in un singolo file.

```bash
npm run sync     # scarica il form da Kobo → rigenera src/data.js
npm run build    # genera dist/index.html (app completa)
npm start        # http-server :8765 + apre l'app nel browser
npm run serve    # http-server senza auto-apertura
npm run check    # syntax check su tutti i .js
npm run clean    # rimuove le cartelle generate (dist/ e test/)
```

`scripts/build-app.sh` concatena gli SCSS (per `build.order`) e li compila
in-line; concatena `data.js` + i frammenti JS + `api.js`; espande gli schermi
e l'app-bar condivisa in `app.html` e `demo.html`; inietta le credenziali dal
`.env` e il logo `assets/logo.svg` come data-URI. Produce due file autonomi:
`dist/index.html` (PWA a tutto schermo) e `test/index.html` (demo con skin).

> Nota storica: il progetto aveva anche una pipeline per generare un tema
> Enketo Express (`build_enketo_package.sh` + Docker). È stata rimossa per
> concentrarsi sull'app custom; resta recuperabile dalla storia git, e tutto
> il materiale Enketo (config + tema) è ora raccolto in `enketo/`.

---

## 6. Deploy

L'app è un **sito statico**: un file HTML autocontenuto, nessun backend di
rendering. Deployarla significa **servire il file su un host HTTPS**.

- **Dove:** qualsiasi hosting statico (Netlify, GitHub Pages, Cloudflare
  Pages) o un web server (nginx/Apache) che serve `dist/index.html`.
- **HTTPS obbligatorio** per: installazione come PWA e accesso
  fotocamera/microfono su iOS (non funziona su `http://` da remoto).
- **Invii:** l'app invia i dati a KoboToolbox. La gestione del token è il
  punto da curare — vedi sez. 8 (Sicurezza).
- **Offline / PWA installabile:** già attivi — service worker (`src/pwa/`,
  cachea l'app shell) + IndexedDB (bozze/outbox/login persistenti). Su HTTPS
  l'app si installa su iPhone/Android ("Aggiungi a schermata Home") e si apre
  senza rete.
---

## 7. Troubleshooting

| Problema | Diagnosi | Soluzione |
|---|---|---|
| `sass: command not found` | `node_modules/` mancante | `npm install` nella root del progetto |
| `node` v13 o inferiore | versione obsoleta | `nvm install 22 && nvm use 22` |
| `npm install` fallisce con `EACCES` | permessi sbagliati su `node_modules/` | `rm -rf node_modules && npm install` (mai con `sudo`) |
| `npm start` dice `EADDRINUSE: 0.0.0.0:8765` | un altro server gira sulla porta | trova porta libera con `ss -tln \| grep LISTEN`, poi `npx http-server dist -p <PORTA> -c-1 -o /index.html` (oppure modifica `package.json` → `scripts.start`) |
| Build fallisce con `ERRORE: src/XX mancante` | file sorgente eliminato | controllare `src/`, ripristinare dal backup |
| Browser mostra pagina vuota | CORS bloccato | usare server statico, NON `file://` |
| Submit fallisce con 401 | token Kobo errato/scaduto | rigenera token su Kobo, aggiorna `.env` |
| Submit fallisce con CORS | dominio non autorizzato | KoboToolbox → Account → Security → API CORS Origins → aggiungere dominio |
| iOS non chiede camera/microfono | HTTP non HTTPS | servire su HTTPS |
| `npm run sync` fallisce | token/UID errati o niente rete | controlla `.env`; il form dev'essere deployato su Kobo |

---

## 8. Sicurezza e produzione

### 8.1 Credenziali nel repo

- **TOKEN API KoboToolbox:** vive **solo** in `.env` (gitignored). I sorgenti
  in `src/data.js` usano i placeholder `__VIM_KOBO_TOKEN__` ecc., che
  vengono sostituiti a build-time. Quindi i sorgenti sono **safe da committare
  su un repo pubblico**.
- **Artefatto con credenziali dentro:** `dist/index.html` contiene il
  TOKEN dopo il build, perché serve al fetch verso Kobo. È **gitignored** — non
  finisce mai su Git. Stessa cosa per i `.bak`.
- **Nodo invii (token nel client):** poiché l'app è statica e chiama Kobo dal
  browser, il token finisce nell'HTML servito. Per un uso pubblico va risolto:
  (a) un mini-proxy che tiene il token server-side, (b) o usare un backend che
  inoltra gli invii. Per un uso interno/fidato + CORS configurato può bastare.

### 8.2 In produzione

- **HTTPS obbligatorio** per accesso camera/microfono da iOS e per
  installazione PWA.
- **Limiti upload media:** se servi tramite un proxy/web server, alza il
  limite di dimensione del body (es. `client_max_body_size 100M` in nginx)
  per audio/video lunghi.

---

## 9. Aggiornare il form

Il form vive su KoboToolbox ed è la fonte di verità della sua struttura.

1. Modifica il form su KoboToolbox (campi, ordine, traduzioni, condizioni,
   obbligatorietà)
2. **Salva e ridistribuisci** (Redeploy) su Kobo
3. `npm run sync` → rigenera `src/data.js` (PAGES + CHOICES + RELEVANT)
4. `npm run build` → rigenera l'app

Non si edita `data.js` a mano. La grafica VIM si applica automaticamente ai
campi aggiornati. (Limite: tipi di campo nuovi non ancora supportati dal
rendering custom vanno aggiunti una volta — vedi `src/README.md`.)

---

## 10. Risorse

- **Documentazione tecnica dettagliata:** `src/README.md`
- **KoboToolbox API v2:** https://kobo.kobotoolbox.org/api/v2/
- **KoboToolbox API v2:** https://kobo.kobotoolbox.org/api/v2/
