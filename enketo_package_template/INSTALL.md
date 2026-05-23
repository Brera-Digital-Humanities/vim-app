# VIM su Enketo Express — Guida di installazione

Pacchetto pronto da iniettare in un'istanza self-hosted di **Enketo Express**
per servire il form **VIM (La valigia immateriale)** con il tema custom.

> Questa guida copre il caso in cui hai ricevuto **solo questo pacchetto**
> (es. via rsync/zip) e devi metterlo su un'istanza Enketo Express esistente.
>
> Se invece hai accesso al **progetto sorgente** completo, vedi
> `../SETUP.md` — copre dev, build e deploy end-to-end (Ubuntu + nginx +
> systemd + Let's Encrypt).

---

## Contenuto del pacchetto

```
enketo_package/
├── public/
│   ├── css/theme-vim.css                  ← Tema VIM compilato dai sorgenti SCSS
│   ├── js/vim.data.js                     ← PAGES, CHOICES, BASE, UID
│   ├── js/vim.navigation.js               ← Logica UI, navigazione, multilingua
│   ├── js/vim.api.js                      ← Submit verso /submission (Enketo)
│   └── manifest.json                      ← Web App Manifest (PWA)
├── app/views/surveys/webform.pug          ← Template Pug della UI VIM
├── config/
│   ├── config.json.example                ← Config per install nativa
│   └── config.json.docker.example         ← Config per Docker (host=redis_main)
├── Dockerfile                             ← Build immagine Enketo+VIM
├── docker-compose.yml                     ← Stack completo (enketo + 2x redis)
├── .env.example                           ← HOST_PORT per docker compose
├── .dockerignore
└── INSTALL.md                             ← Questo file
```

Hai **due strade** per installare:

- **A — Installazione nativa** (cap. 1-4): cloni Enketo Express, ci copi dentro i file VIM, fai `npm install + npm run build`. Più granulare, va bene se hai già un setup Node sul server.
- **B — Docker Compose** (cap. 1bis-4bis): un solo `docker compose up -d` tira su Enketo + i due Redis necessari, con il tema VIM già iniettato. Più riproducibile, niente conflitti con node/redis di sistema. Richiede docker + docker compose installati.

---

## Prerequisiti

**Comuni:**
- **Account KoboToolbox** con form già caricato — UID: `<FORM-UID>`
- **Dominio HTTPS** in produzione (obbligatorio per PWA e accesso camera/microfono su iOS)

**Per l'installazione nativa (A):**
- Node.js ≥ 18 (raccomandato v22 LTS)
- Redis server
- Git

**Per Docker (B):**
- Docker ≥ 24
- Docker Compose v2 (`docker compose ...` — già incluso in Docker Desktop / `docker-compose-plugin` su Ubuntu)

---

## 1. Clona e installa Enketo Express

```bash
git clone https://github.com/enketo/enketo-express
cd enketo-express
npm install
```

---

## 2. Copia il pacchetto VIM dentro Enketo Express

Dalla cartella di questo pacchetto (`enketo_package/`):

```bash
ENKETO=/percorso/a/enketo-express

# Tema
cp public/css/theme-vim.css       $ENKETO/public/css/

# Script applicativi
cp public/js/vim.data.js          $ENKETO/public/js/
cp public/js/vim.navigation.js    $ENKETO/public/js/
cp public/js/vim.api.js           $ENKETO/public/js/

# PWA manifest
cp public/manifest.json           $ENKETO/public/

# Template UI
cp app/views/surveys/webform.pug  $ENKETO/app/views/surveys/webform.pug
# (eventualmente fare backup del file originale prima di sovrascrivere)
```

> ⚠️ **Backup**: prima di sovrascrivere `webform.pug` salva l'originale
> (`cp $ENKETO/app/views/surveys/webform.pug{,.orig}`) — la UI di default
> di Enketo verrà rimpiazzata da quella di VIM.

---

## 3. Configurazione

```bash
cp config/config.json.example $ENKETO/config/config.json
```

Editare `$ENKETO/config/config.json` e sostituire:

- `INSERIRE_QUI_TOKEN_KOBO` → token API KoboToolbox
  (recuperabile da: KoboToolbox → Account Settings → Security → API Token)
- `INSERIRE_STRINGA_CASUALE_DI_32_CARATTERI` → chiave di cifratura
  (generabile con `openssl rand -hex 16`)

---

## 4. Build e avvio

```bash
cd $ENKETO
npm run build
npm start
```

Apertura locale: `http://localhost:8005`

Per il form VIM: `http://localhost:8005/x/<ENKETO-ID>`

---

# B — Installazione via Docker Compose

## 1bis. Setup

Dalla cartella `enketo_package/`:

```bash
# 1. Config Enketo (versione adattata per Docker — host redis_main/redis_cache)
cp config/config.json.docker.example config/config.json
nano config/config.json
#   → INSERIRE_QUI_TOKEN_KOBO       = token API KoboToolbox
#   → INSERIRE_STRINGA_CASUALE_...  = output di: openssl rand -hex 16

# 2. Porta sull'host (opzionale: default 8005)
cp .env.example .env
nano .env   # → HOST_PORT=8765 se 8005 occupata
```

## 2bis. Build + avvio

```bash
docker compose up -d --build
docker compose logs -f enketo    # CTRL-C per uscire dai log
```

Il primo build clona Enketo Express, ci inietta i file VIM e fa `npm run build`
dentro l'immagine. Ci vogliono 3-5 minuti la prima volta. I run successivi
sono istantanei (cache layer).

Verifica:
```bash
docker compose ps
curl -I http://localhost:8005
```

Apertura locale: `http://localhost:8005/x/<ENKETO-ID>`

## 3bis. Aggiornamenti del tema

Quando rigeneri `enketo_package/` (ad es. dopo `npm run build:enketo` nel
progetto sorgente):

```bash
docker compose build --no-cache enketo   # rebuild solo enketo
docker compose up -d
```

## 4bis. Stop / cleanup

```bash
docker compose down              # ferma e rimuove i container (preserva volumi)
docker compose down -v           # rimuove anche i volumi (perde le submission offline)
```

---

## 5. Deploy in produzione

### Opzione A — Reverse proxy (raccomandato)

`nginx` o `caddy` davanti a Enketo Express, con HTTPS via Let's Encrypt.

Esempio Caddy minimal:

```
vim.tuodominio.org {
    reverse_proxy localhost:8005
}
```

### Opzione B — Docker Compose (vedi cap. B sopra per dettagli)

```bash
cd enketo_package/
docker compose up -d --build
```

Per HTTPS in produzione con Docker, mettere nginx o Caddy (anch'essi in
container o nativi) davanti alla porta esposta da `enketo` e fare reverse
proxy a `localhost:${HOST_PORT}`.

---

## 6. Installazione su iPhone come PWA

1. Aprire `https://vim.tuodominio.org/x/<ENKETO-ID>` in **Safari**
   (Chrome su iOS non supporta l'installazione PWA)
2. Toccare **Condividi → Aggiungi a schermata Home**
3. L'icona compare nella home; al lancio l'app va a tutto schermo

Su Android funziona analogamente da Chrome.

---

## 7. Modifiche al form

Quando l'XLSForm cambia:

1. Caricare la nuova versione su KoboToolbox (`VIM_XLSForm_KoboToolbox_*.xlsx`)
2. Rigenerare `PAGES` e `CHOICES` ed editare `vim.data.js`
3. `npm run build` per ricompilare Enketo

---

## 8. Modifiche al tema

Quando uno SCSS in `vim_docs/styles/` o `vim_docs/screens/` cambia, rigenera
il pacchetto dalla root del progetto VIM:

```bash
npm run build:enketo
cp enketo_package/public/css/theme-vim.css $ENKETO/public/css/
cd $ENKETO && npm run build
```

Lo script concatena tutti gli SCSS (per `build.order`) e li compila in
`theme-vim.css` automaticamente.

---

## Troubleshooting

| Problema | Soluzione |
|---|---|
| 401 dal server Kobo | Token API errato o scaduto in `config.json` |
| CORS error su submission | Aggiungere il dominio Enketo in KoboToolbox → Security → API CORS Origins |
| Microfono/Camera bloccati su iOS | Servire su HTTPS valido (non `http://localhost` da remoto) |
| Tema non visibile | Verificare `"theme": "vim"` in config.json e `npm run build` rieseguito |
| Form mostra UI Enketo default | `webform.pug` non sovrascritto correttamente |
| Service worker non aggiorna | Cancellare cache browser + `Cmd+R` in DevTools |
| Docker: `port is already allocated` | Cambia `HOST_PORT` in `.env` o `docker compose down` di stack precedenti |
| Docker: `getaddrinfo ENOTFOUND redis_main` | Stai usando `config.json.example` invece di `config.json.docker.example` (host devono essere i service name di compose) |
| Docker: build lentissimo | Prima build clona Enketo e fa `npm install`: normale 3-5 min. Le successive sono in cache |
| Docker: cambiamenti al tema VIM non visibili | `docker compose build --no-cache enketo && docker compose up -d` |

---

## Note di sicurezza

- Il **token API KoboToolbox** in `config.json` non deve essere committato in
  un repo pubblico. Usare variabili d'ambiente per produzione.
- Il **`vim.api.js`** non contiene più alcun token (rispetto alla versione
  KoboToolbox diretta in `valigia_immateriale.html`): l'autenticazione è
  gestita interamente da Enketo Express server-side.

---

## Riferimenti

- Enketo Express docs: https://enketo.github.io/enketo-express/
- KoboToolbox API v2: https://kobo.kobotoolbox.org/api/v2/
- Form VIM (Kobo pubblico): https://ee-eu.kobotoolbox.org/x/<ENKETO-ID>
- Documentazione tecnica VIM: `../vim_docs/README.md`
