# =============================================================================
# VIM — Enketo Express con tema VIM
# Multi-stage build:
#   1. builder: clona Enketo Express, ci inietta il pacchetto VIM, fa npm run build
#   2. runtime: immagine minimale che esegue node app.js
#
# Costruzione:
#   docker build -t vim-enketo .
# oppure (più comune):
#   docker compose build
# =============================================================================

# ── Stage 1: build ───────────────────────────────────────────────────────────
# Enketo Express 6.x requires Node 14-16 and has legacy deps (node-sass,
# phantomjs) needing build tools + bzip2 + fontconfig.
FROM node:16-bullseye AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
        git python3 make g++ ca-certificates bzip2 fontconfig libfontconfig1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv

# Versione di Enketo Express da clonare. Override:
#   docker build --build-arg ENKETO_REF=2.1.0 .
ARG ENKETO_REF=master
RUN git clone --depth 1 --branch ${ENKETO_REF} \
        https://github.com/enketo/enketo-express.git

WORKDIR /srv/enketo-express
RUN npm install --omit=optional

# ── Inietta il pacchetto VIM ──────────────────────────────────────────
# Tutti i file vengono presi dal context build (= cartella enketo_package/)
COPY public/css/theme-vim.css       public/css/
COPY public/js/vim.data.js          public/js/
COPY public/js/vim.navigation.js    public/js/
COPY public/js/vim.api.js           public/js/
COPY public/manifest.json           public/
COPY app/views/surveys/webform.pug  app/views/surveys/webform.pug

# Build del frontend (Webpack + grunt + tema)
RUN npm run build

# Pulizia per ridurre la dimensione finale
RUN npm prune --omit=dev


# ── Stage 2: runtime ─────────────────────────────────────────────────────────
FROM node:16-bullseye-slim

# tini come PID 1 per gestire correttamente i segnali (CTRL-C / docker stop)
RUN apt-get update && apt-get install -y --no-install-recommends tini \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /srv/enketo-express
COPY --from=build /srv/enketo-express ./

# La config.json viene montata come volume da docker-compose
# (vedi docker-compose.yml). Default port è 8005.
EXPOSE 8005

ENTRYPOINT ["/usr/bin/tini", "--"]
CMD ["node", "app.js"]
