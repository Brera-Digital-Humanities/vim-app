# VIM — La valigia immateriale
## Setup tecnico, sviluppo e deploy in produzione

Documento di onboarding per chi prende in mano il progetto la prima volta.
Copre: setup ambiente, workflow di sviluppo, generazione pacchetto,
installazione su Enketo Express self-hosted in produzione.

### Indice della documentazione

| Documento | Per chi |
|---|---|
| **questo file (`SETUP.md`)** | Sviluppatore che lavora sul progetto: setup, build, workflow, deploy completo |
| [`vim_docs/README.md`](vim_docs/README.md) | Reference tecnica del form: sezioni, campi, lingue, mapping XLSForm → JS |
| [`enketo_package/INSTALL.md`](enketo_package/INSTALL.md) | Sysadmin che riceve solo il pacchetto pre-buildato e deve installarlo su un'istanza Enketo esistente |

---

## 1. Cos'è VIM

App web per la raccolta di patrimonio culturale immateriale palestinese.
Form digitale multilingua (Italiano, English, العربية con RTL) che simula
l'interfaccia di KoBoCollect su schermo mobile.

- **Backend dati:** KoboToolbox (server `eu.kobotoolbox.org`, UID form `<FORM-UID>`)
- **Form pubblico Kobo:** https://ee-eu.kobotoolbox.org/x/<ENKETO-ID>
- **Target produzione:** Enketo Express self-hosted + PWA installabile su iPhone/Android

---

## 2. Struttura del progetto

```
vim-enketo/
├── vim_docs/                         ◄── SORGENTE (fonte di verità) — modulare
│   ├── build.order                   Ordine di concatenazione ([html],[js],[scss])
│   ├── template.html                 Guscio HTML + marker <!-- @screens -->
│   ├── data.js                       PAGES + CHOICES + placeholder credenziali
│   ├── api.js                        Submit (KoboToolbox / Enketo)
│   ├── manifest.json                 PWA manifest
│   ├── i18n/                         Una lingua per file (it/en/ar + index)
│   ├── core/                         Logica condivisa (state, router, relevant…)
│   ├── screens/                      Una cartella per schermata (html + js + scss)
│   ├── styles/                       Design system condiviso (scss)
│   └── README.md                     Doc tecnica + come aggiungere una lingua
│
├── valigia_immateriale.html          ◄── GENERATO da build_monolith.sh
│                                         File singolo per test locale browser
│
├── enketo_package/                   ◄── GENERATO da build_enketo_package.sh
│   ├── public/css/theme-vim.css      Pacchetto pronto da iniettare
│   ├── public/js/vim.{data,navigation,api}.js   in un'istanza Enketo Express
│   ├── public/manifest.json
│   ├── app/views/surveys/webform.pug
│   ├── config/config.json.example
│   └── INSTALL.md                    Guida deploy su Enketo
│
├── enketo_package_template/          File hand-written (INSTALL.md, config)
│                                     che build_enketo_package.sh preserva
│
├── build_monolith.sh                 ◄── SCRIPT: vim_docs/ → monolite
├── build_enketo_package.sh           ◄── SCRIPT: vim_docs/ → enketo_package/
└── SETUP.md                          questo file
```

### Principio fondamentale

**Si modifica SOLO `vim_docs/`.** Il monolite `valigia_immateriale.html` e
la cartella `enketo_package/` sono **artefatti generati** dagli script di
build. Modificarli a mano significa perdere le modifiche al prossimo build.

---

## 3. Setup ambiente (una tantum)

### 3.1 Requisiti

| Tool | Versione minima | Note |
|---|---|---|
| `node` | 18+ | consigliato v22 LTS |
| `npm` | 9+ | viene con node |
| `bash` | 4+ | preinstallato su Linux/macOS, su Windows usare WSL |
| `git` | qualsiasi | per cloning |

> Tutte le **librerie di build** (`sass`, `html2pug`, `http-server`) sono
> dichiarate in `package.json` e si installano localmente con `npm install`.
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

# Installa le dipendenze (sass, html2pug, http-server) in ./node_modules
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
# Dovrebbe stampare: OK vim_docs/data.js (e gli altri .js)

npm run build
# Dovrebbe finire con:
#   ▸ Generato: .../valigia_immateriale.html (143 KB)
#   ✓ Build completata. Vedi enketo_package/INSTALL.md per il deploy.
```

Se entrambi i comandi terminano senza errori, l'ambiente è pronto.

---

## 4. Workflow di sviluppo

### 4.1 Ciclo tipico

```
        ┌──────────────────────────┐
        │   modifica vim_docs/      │ ◄─── edit qui
        └──────────┬───────────────┘
                   │
        ┌──────────▼───────────────┐
        │ npm run build:monolith    │ ◄─── rigenera monolite
        └──────────┬───────────────┘
                   │
        ┌──────────▼───────────────┐
        │ npm start                 │ ◄─── apre browser su
        │                           │      http://localhost:8765
        └──────────┬───────────────┘
                   │
                ok? ────► no ────► torna su
                   │
                  sì
                   │
        ┌──────────▼───────────────┐
        │ npm run build:enketo      │ ◄─── pacchetto produzione
        └──────────┬───────────────┘
                   │
        ┌──────────▼───────────────┐
        │ deploy su Enketo Express  │ ◄─── vedi sez. 6
        └──────────────────────────┘
```

> Scorciatoia: `npm run build` esegue **entrambi** `build:monolith` e
> `build:enketo` in sequenza, con `npm run check` (syntax check sui .js)
> come pre-hook automatico.

### 4.2 Cosa modificare per quale tipo di cambiamento

| Vuoi cambiare... | Modifica | Note |
|---|---|---|
| Colori, font, design tokens | `vim_docs/styles/tokens.scss` | usare CSS variables `var(--accent)`, mai hex diretti |
| Stile di una schermata | `vim_docs/screens/<schermata>/<schermata>.scss` | es. `screens/form/form.scss` |
| Stili condivisi (bottoni, modal, RTL…) | `vim_docs/styles/*.scss` | buttons, modal, feedback, rtl, responsive |
| Markup di una schermata | `vim_docs/screens/<schermata>/<schermata>.html` | es. `screens/form/form.html` |
| Guscio HTML (head, cornice, app-bar) | `vim_docs/template.html` | i partial entrano al marker `<!-- @screens -->` |
| Testi UI / aggiungere una lingua | `vim_docs/i18n/<lingua>.js` + `i18n/index.js` | vedi `vim_docs/README.md` → "Aggiungere una lingua" |
| Logica di una schermata | `vim_docs/screens/<schermata>/<schermata>.js` | es. form, outbox, lang, download |
| Navigazione tra schermate | `vim_docs/core/router.js` | showScreen, goHome… |
| Rendering campi, bozze, completamento | `vim_docs/screens/form/form.js` | renderPage, nextField, updateCompleteBtn, `COMPLETE_THRESHOLD` |
| Campi condizionali | `vim_docs/core/relevant.js` → `RELEVANT` | sintassi XLSForm: `${campo}='valore'` |
| Endpoint o formato submit | `vim_docs/api.js` → `doSubmit` | monolite usa Kobo diretto; pacchetto Enketo usa `/submission` |
| Aggiungere/togliere campi del form | `vim_docs/data.js` → `PAGES` e `CHOICES` | meglio rigenerare da XLSForm aggiornato |
| Nome/icone PWA | `vim_docs/manifest.json` | |
| Ordine di concatenazione / nuovo file | `vim_docs/build.order` | aggiungi il path nella sezione `[js]` o `[scss]` |

### 4.3 Test locale del monolite

```bash
npm run build:monolith    # rigenera valigia_immateriale.html
npm start                 # avvia http-server su :8765 e apre il browser
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

## 5. Generazione dei pacchetti

I tre comandi principali sono dichiarati negli `scripts` di `package.json`:

```bash
npm run build              # build:monolith + build:enketo (con check pre-hook)
npm run build:monolith     # solo monolite
npm run build:enketo       # solo pacchetto Enketo
npm run check              # syntax check su tutti i .js in vim_docs/
npm start                  # http-server + apre il monolite nel browser
npm run serve              # http-server senza auto-apertura
npm run clean              # rimuove enketo_package/ e valigia_immateriale.html
```

> Gli npm scripts richiamano internamente `./build_monolith.sh` e
> `./build_enketo_package.sh`. Puoi anche lanciarli direttamente — gli script
> sono autoconsistenti e includono il path locale `./node_modules/.bin/`.

### 5.1 Monolite (per test locale)

```bash
npm run build:monolith
```

Genera `valigia_immateriale.html` (~143 KB, file singolo autocontenuto).
Concatena SCSS (per `build.order`) e compila in-line; concatena `data.js` + frammenti JS + `api.js`.

### 5.2 Pacchetto Enketo Express (per produzione)

```bash
npm run build:enketo
```

Genera `enketo_package/` con la struttura specchio di Enketo Express:

- `public/css/theme-vim.css` — SCSS compilato e compresso
- `public/js/vim.data.js` — config Enketo (no TOKEN) + PAGES/CHOICES
- `public/js/vim.navigation.js` — concatenazione dei frammenti JS (i18n + core + screens)
- `public/js/vim.api.js` — `api.js` patchato per endpoint `/submission`
- `public/manifest.json` — copia di `manifest.json`
- `app/views/surveys/webform.pug` — conversione del template via html2pug
- `config/config.json.example` + `INSTALL.md` — file hand-written

### 5.3 Differenze fra monolite e pacchetto Enketo

| Aspetto | Monolite | Pacchetto Enketo |
|---|---|---|
| Numero file | 1 | 8 |
| TOKEN API | iniettato a build-time dal `.env` (DEV ONLY, finisce nel file ma il file è gitignored) | assente (server-side) |
| Endpoint submit | `${BASE}/api/v2/assets/${UID}/submissions/` | `${BASE}/submission` |
| Header submit | `Authorization: Token ...` | `X-OpenRosa-Version: 1.0` |
| PWA installabile | no (manifest disabilitato) | sì |
| Caching offline | no | sì (service worker di Enketo) |
| Uso consigliato | test/debug in browser | produzione |

---

## 6. Deploy in produzione (Enketo Express self-hosted)

Hai **due strade**:

- **6.A — Native install (sez. 6.1-6.8)** — node + redis sul VPS, systemd, nginx reverse proxy. Più granulare, integra bene se il VPS ha già altri servizi gestiti dallo stesso modo.
- **6.B — Docker Compose (sez. 6.9)** — un solo `docker compose up -d` tira su tutto. Più riproducibile, isola Enketo da node/redis di sistema, ideale per dev locale e per VPS dedicati.

Per **test locale** (con nginx/Apache già attivi sulla tua macchina di sviluppo, come è il caso qui) **la 6.B è caldamente raccomandata** — niente conflitti di porta né di redis, e `docker compose down` cancella tutto in un colpo solo.

### 6.1 Prerequisiti server

- VPS Linux (Ubuntu 22.04 LTS consigliato)
- 2 GB RAM minimi, 10 GB disco
- Dominio con DNS puntato al VPS (es. `vim.tuodominio.org`)
- Porte 80 e 443 aperte
- Account KoboToolbox con form già caricato e token API generato

### 6.2 Installazione base sul server

```bash
# Connessione SSH
ssh utente@vim.tuodominio.org

# Dipendenze sistema
sudo apt update && sudo apt install -y curl git nginx redis-server

# Node 22 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Verifica
node --version    # v22.x
redis-cli ping    # PONG
```

### 6.3 Clone e installazione Enketo Express

```bash
cd /opt
sudo git clone https://github.com/enketo/enketo-express
sudo chown -R $USER:$USER enketo-express
cd enketo-express
npm install
```

### 6.4 Iniezione del pacchetto VIM

Dal tuo computer locale, dopo aver lanciato `npm run build:enketo`:

```bash
# Trasferimento via rsync
rsync -avz enketo_package/ utente@vim.tuodominio.org:/opt/enketo-express/

# Oppure singoli file via scp
scp enketo_package/public/css/theme-vim.css       utente@server:/opt/enketo-express/public/css/
scp enketo_package/public/js/vim.*.js             utente@server:/opt/enketo-express/public/js/
scp enketo_package/public/manifest.json           utente@server:/opt/enketo-express/public/
scp enketo_package/app/views/surveys/webform.pug  utente@server:/opt/enketo-express/app/views/surveys/
scp enketo_package/config/config.json.example     utente@server:/opt/enketo-express/config/
```

Sul server:

```bash
cd /opt/enketo-express
# Backup template originale
cp app/views/surveys/webform.pug.orig app/views/surveys/webform.pug.bak 2>/dev/null || true

# Configurazione: rinomina + edit
mv config/config.json.example config/config.json
nano config/config.json
# Sostituisci:
#   INSERIRE_QUI_TOKEN_KOBO         → il tuo token KoboToolbox
#   INSERIRE_STRINGA_CASUALE_...    → output di: openssl rand -hex 16

# Build
npm run build
```

### 6.5 Avvio come servizio systemd

```bash
sudo tee /etc/systemd/system/enketo.service > /dev/null <<'EOF'
[Unit]
Description=Enketo Express - VIM
After=network.target redis-server.service

[Service]
Type=simple
User=utente
WorkingDirectory=/opt/enketo-express
ExecStart=/usr/bin/node app.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable --now enketo
sudo systemctl status enketo
# verifica con:
curl http://localhost:8005
```

### 6.6 Reverse proxy nginx + HTTPS

```bash
sudo tee /etc/nginx/sites-available/vim > /dev/null <<'EOF'
server {
    listen 80;
    server_name vim.tuodominio.org;

    location / {
        proxy_pass http://localhost:8005;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        client_max_body_size 100M;  # per upload media
    }
}
EOF

sudo ln -s /etc/nginx/sites-available/vim /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# HTTPS via Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d vim.tuodominio.org
# Rinnovo automatico già attivo via timer systemd
```

### 6.7 Verifica e accesso

Apri nel browser:
```
https://vim.tuodominio.org/x/<ENKETO-ID>
```

Su iPhone (Safari) → Condividi → "Aggiungi a schermata Home"
per installare come PWA.

### 6.8 Aggiornamenti successivi

Dal computer locale, dopo modifiche a `vim_docs/`:

```bash
npm run build:enketo
rsync -avz enketo_package/public/ utente@server:/opt/enketo-express/public/
rsync -avz enketo_package/app/    utente@server:/opt/enketo-express/app/
ssh utente@server 'cd /opt/enketo-express && npm run build && sudo systemctl restart enketo'
```

---

### 6.9 Alternativa B — Docker Compose

Il pacchetto include `Dockerfile` + `docker-compose.yml` + `config.json.docker.example`
che incapsulano Enketo Express + 2× Redis. Tutto in un singolo stack riproducibile.

#### Prerequisiti

- Docker ≥ 24
- Docker Compose v2 (`docker compose ...` come sotto-comando)

Su Ubuntu:
```bash
sudo apt install -y docker.io docker-compose-v2
sudo usermod -aG docker $USER && newgrp docker   # per usare docker senza sudo
```

#### Build + avvio (sia locale che server)

```bash
npm run build:enketo                          # rigenera enketo_package/
cd enketo_package/

# 1. Config
cp config/config.json.docker.example config/config.json
nano config/config.json                       # token Kobo + openssl rand -hex 16

# 2. (opzionale) Porta host
cp .env.example .env
nano .env                                     # HOST_PORT=8765 se 8005 occupata

# 3. Su!
docker compose up -d --build
docker compose logs -f enketo                 # CTRL-C per uscire dai log
```

Prima build: 3-5 min (clona Enketo, npm install, build webpack).
Run successivi: immediati grazie alla cache layer.

Verifica:
```bash
curl -I http://localhost:8005                 # 200 OK
docker compose ps                             # tutti i container "Up"
```

Apertura: `http://localhost:8005/x/<ENKETO-ID>` (o la `HOST_PORT` configurata).

#### Aggiornamenti del tema VIM (Docker)

Quando modifichi `vim_docs/` e vuoi vedere le modifiche nel container:

```bash
npm run build:enketo                          # nella root del progetto
cd enketo_package/
docker compose build --no-cache enketo        # rebuild solo del servizio enketo
docker compose up -d
```

#### HTTPS in produzione con Docker

Mettere un reverse proxy (nginx nativo, Caddy, oppure Traefik in altro container)
davanti alla porta esposta da `enketo`. Esempio Caddy:

```
vim.tuodominio.org {
    reverse_proxy localhost:8005
}
```

Caddy gestisce automaticamente Let's Encrypt — niente certbot manuale.

#### Stop, cleanup, log

```bash
docker compose down                # ferma container (preserva submission in Redis volume)
docker compose down -v             # rimuove anche i volumi (perde submission offline)
docker compose logs --tail=100 enketo
docker compose exec enketo sh      # shell dentro il container per debugging
```

---

## 7. Troubleshooting

| Problema | Diagnosi | Soluzione |
|---|---|---|
| `sass: command not found` o `html2pug: command not found` | `node_modules/` mancante | `npm install` nella root del progetto |
| `node` v13 o inferiore | versione obsoleta | `nvm install 22 && nvm use 22` |
| `npm install` fallisce con `EACCES` | permessi sbagliati su `node_modules/` | `rm -rf node_modules && npm install` (mai con `sudo`) |
| `npm start` dice `EADDRINUSE: 0.0.0.0:8765` | un altro server gira sulla porta | trova porta libera con `ss -tln \| grep LISTEN`, poi `npx http-server -p <PORTA> -c-1 -o /valigia_immateriale.html` (oppure modifica `package.json` → `scripts.start`) |
| Build fallisce con `ERRORE: vim_docs/XX mancante` | file sorgente eliminato | controllare `vim_docs/`, ripristinare dal backup |
| Browser mostra pagina vuota | CORS bloccato | usare server statico, NON `file://` |
| Submit fallisce con 401 | token Kobo errato/scaduto | rigenera token su Kobo, aggiorna `data.js` (dev) o `config.json` (prod) |
| Submit fallisce con CORS | dominio non autorizzato | KoboToolbox → Account → Security → API CORS Origins → aggiungere dominio |
| iOS non chiede camera/microfono | HTTP non HTTPS | servire su HTTPS (Let's Encrypt) |
| Tema VIM non appare in Enketo | `npm run build` non rieseguito | `cd /opt/enketo-express && npm run build` |
| Service worker cacha vecchia versione | cache browser | DevTools → Application → Clear storage |
| `systemctl status enketo` mostra failed | log errori | `journalctl -u enketo -f --since "5 minutes ago"` |

---

## 8. Sicurezza e produzione

### 8.1 Credenziali nel repo

- **TOKEN API KoboToolbox:** vive **solo** in `.env` (gitignored). I sorgenti
  in `vim_docs/data.js` usano i placeholder `__VIM_KOBO_TOKEN__` ecc., che
  vengono sostituiti a build-time. Quindi i sorgenti sono **safe da committare
  su un repo pubblico**.
- **Artefatti generati con credenziali dentro:** `valigia_immateriale.html`
  (monolite) contiene il TOKEN dopo il build, perché serve al fetch verso
  Kobo. È **gitignored** — non finisce mai su Git. Stessa cosa per i `.bak`.
- **Pacchetto Enketo (`enketo_package/`):** non contiene MAI il TOKEN
  (l'autenticazione la fa il server Enketo lato backend). Il `vim.data.js`
  generato ha solo `UID`, non `TOKEN`.

### 8.2 Pubblicare il repo su GitHub

Prima di `git init` + `git push`:

1. **Rigenera il token Kobo** (Account → Security → Regenerate). Tutti i
   token che hai usato in dev finora vanno considerati compromessi.
2. Verifica che `.env` sia gitignored: `git check-ignore -v .env` deve
   stampare la riga del `.gitignore`.
3. Scansiona la storia: `grep -r '<token_pattern>' .` non deve restituire
   nulla nei file tracciati. Se sì, lo storico Git va riscritto con
   `git filter-repo` PRIMA di pushare (o, più semplice, riparti con un
   `git init` pulito).
4. Considera installare `gitleaks` come pre-commit hook:
   `brew install gitleaks` o vedi https://github.com/gitleaks/gitleaks

### 8.3 Produzione (Enketo Express)

- **Encryption key:** in `config.json` di Enketo, stringa di 32 caratteri
  per cifrare le bozze offline lato client. Generala con `openssl rand -hex 16`.
- **Permessi config:** `chmod 600 /opt/enketo-express/config/config.json`
  (leggibile solo dall'utente che gira Enketo).
- **Backup:** schedula `tar czf vim-backup-$(date +%F).tgz /opt/enketo-express/config /opt/enketo-express/app/models /opt/enketo-express/setup` con cron.
- **Limiti upload:** `client_max_body_size 100M` in nginx — alzare se servono
  video più lunghi.
- **HTTPS obbligatorio in prod** per accesso camera/microfono da iOS e per
  installazione PWA.

---

## 9. Aggiornare il form (nuovo XLSForm)

Quando `VIM_XLSForm_KoboToolbox_*.xlsx` cambia:

1. Caricare la nuova versione su KoboToolbox (interfaccia web Kobo)
2. Esportare il form aggiornato come JSON o rigenerare manualmente `PAGES`
   e `CHOICES` nel formato già usato in `vim_docs/data.js` (vedi quel file)
3. Aggiornare anche `RELEVANT` in `vim_docs/core/relevant.js` se sono
   cambiate le condizioni dei campi condizionali
4. `./build_monolith.sh` → test locale
5. `./build_enketo_package.sh` → deploy

> Non esiste ancora uno script di rigenerazione automatica da XLSX. È un
> task aperto (vedi `vim_docs/README.md` → Prossimi sviluppi).

---

## 10. Risorse

- **Documentazione tecnica dettagliata:** `vim_docs/README.md`
- **Guida deploy Enketo:** `enketo_package/INSTALL.md`
- **Enketo Express docs:** https://enketo.github.io/enketo-express/
- **KoboToolbox API v2:** https://kobo.kobotoolbox.org/api/v2/
