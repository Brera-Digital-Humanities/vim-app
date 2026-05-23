#!/usr/bin/env bash
# =============================================================================
# build_enketo_package.sh
# Build enketo_package/ from the modular sources in vim_docs/ (per build.order).
#
# Requires: node >= 18, sass, html2pug  (all via `npm install`)
# Usage:    ./build_enketo_package.sh   (or: npm run build:enketo)
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/vim_docs"
OUT="$ROOT/enketo_package"

# Anteponi node_modules/.bin al PATH: trova sass/html2pug installati
# localmente via `npm install`. Se non presenti, fallback su installazioni globali.
export PATH="$ROOT/node_modules/.bin:$PATH"

# ── 0. Verifica prerequisiti ────────────────────────────────────────────────
for cmd in sass html2pug node; do
  command -v "$cmd" >/dev/null 2>&1 || {
    echo "ERRORE: '$cmd' non trovato. Esegui 'npm install' nella root del progetto."
    exit 1
  }
done
[ -d "$SRC" ] || { echo "ERRORE: vim_docs/ mancante"; exit 1; }
for f in data.js template.html api.js manifest.json build.order; do
  [ -f "$SRC/$f" ] || { echo "ERRORE: vim_docs/$f mancante"; exit 1; }
done

# Legge una sezione ([js], [scss], [html]) da vim_docs/build.order → path per riga.
order() { awk -v s="[$1]" '$0==s{f=1;next} /^\[/{f=0} f&&NF&&$1!~/^#/{print $1}' "$SRC/build.order"; }

# Espande template.html: inserisce i partial [html] al marker <!-- @screens -->.
expand_template() {
  local files; files="$(order html | tr '\n' ' ')"
  awk -v dir="$SRC/" -v list="$files" '
    /^[[:space:]]*<!-- @screens -->/ {
      n = split(list, a, " ")
      for (i = 1; i <= n; i++) if (a[i] != "") { while ((getline l < (dir a[i])) > 0) print l; close(dir a[i]) }
      next
    } { print }' "$SRC/template.html"
}

# Carica .env per ricavare VIM_KOBO_UID (no TOKEN qui — gestito server-side).
if [ -f "$ROOT/.env" ]; then
  # shellcheck disable=SC1091
  set -a; . "$ROOT/.env"; set +a
else
  echo "ERRORE: file .env mancante. cp .env.example .env e personalizza."
  exit 1
fi
: "${VIM_KOBO_UID:?VIM_KOBO_UID non definito in .env}"

echo "▸ Tool versions:"
echo "    node     $(node --version)"
echo "    sass     $(sass --version)"
echo "    html2pug $(html2pug --version)"
echo

# ── 1. Struttura di output ──────────────────────────────────────────────────
echo "▸ (Ri)creo enketo_package/"
rm -rf "$OUT"
mkdir -p "$OUT/public/css" "$OUT/public/js" "$OUT/public/images" \
         "$OUT/app/views/surveys" "$OUT/config"

# ── 2. SCSS → CSS — usa il tema ENKETO ([enketo-scss]), non quello dell'app ─
echo "▸ Concateno + compilo tema Enketo → theme-vim.css"
TMP_SCSS="$(mktemp --suffix=.scss)"
: > "$TMP_SCSS"
for f in $(order enketo-scss); do
  [ -f "$SRC/$f" ] || { echo "ERRORE: vim_docs/$f in build.order ma mancante"; rm -f "$TMP_SCSS"; exit 1; }
  cat "$SRC/$f" >> "$TMP_SCSS"; printf '\n' >> "$TMP_SCSS"
done
sass --no-source-map --style=compressed "$TMP_SCSS" "$OUT/public/css/theme-vim.css"
rm -f "$TMP_SCSS"

# ── 3. HTML → Pug (espande i partial al marker, poi converte) ──────────────
echo "▸ Espando template + converto HTML → webform.pug"
expand_template | html2pug -d > "$OUT/app/views/surveys/webform.pug"
# Patch path CSS (default html2pug mantiene il path originale)
sed -i 's|/styles/vim\.css|/css/theme-vim.css|g' \
    "$OUT/app/views/surveys/webform.pug"

# ── 4. vim.data.js — config Enketo + PAGES/CHOICES da vim_docs/data.js ──
echo "▸ Genero vim.data.js (config Enketo + CHOICES/PAGES da data.js)"
[ -f "$SRC/data.js" ] || { echo "ERRORE: vim_docs/data.js mancante"; exit 1; }
{
  cat <<'EOF'
/**
 * =============================================================================
 * VIM — vim.data.js   (generato da build_enketo_package.sh)
 * CHOICES + PAGES presi da vim_docs/data.js.
 *
 * Config Enketo Express:
 *   BASE  → URL Enketo (default: stesso dominio)
 *   UID   → UID del form su KoboToolbox
 *   TOKEN → NON presente: autenticazione gestita server-side da Enketo
 * =============================================================================
 */

const BASE = window.location.origin;
const UID  = '__VIM_KOBO_UID__';

EOF
  # Estrae le righe CHOICES e PAGES da vim_docs/data.js, scartando il TOKEN
  # e le altre dichiarazioni dev (BASE/UID già definiti sopra per Enketo).
  grep -E '^const (CHOICES|PAGES)\s*=' "$SRC/data.js"
} > "$OUT/public/js/vim.data.js"
# Inietta UID reale dal .env
sed -i "s|__VIM_KOBO_UID__|$VIM_KOBO_UID|g" "$OUT/public/js/vim.data.js"

# ── 5. vim.navigation.js (concatena i frammenti js da build.order) ──────────
echo "▸ Concateno i frammenti JS → vim.navigation.js"
{
  echo "// VIM — navigation bundle (generated from vim_docs/ per build.order)"
  for f in $(order js); do
    [ -f "$SRC/$f" ] || { echo "ERRORE: vim_docs/$f in build.order ma mancante"; exit 1; }
    echo "// --- $f ---"
    cat "$SRC/$f"; echo
  done
} > "$OUT/public/js/vim.navigation.js"

# ── 6. vim.api.js (patch endpoint Enketo) ───────────────────────────────────
echo "▸ Patch api.js → endpoint Enketo /submission"
sed -e 's|`${BASE}/api/v2/assets/${UID}/submissions/`|`${BASE}/submission`|g' \
    -e "s|headers: { 'Authorization': \`Token \${TOKEN}\` }|headers: { 'X-OpenRosa-Version': '1.0' }|g" \
    "$SRC/api.js" > "$OUT/public/js/vim.api.js"

# ── 7. Manifest PWA ─────────────────────────────────────────────────────────
echo "▸ Copio manifest.json"
cp "$SRC/manifest.json" "$OUT/public/manifest.json"

# ── 8. File hand-written (template) ─────────────────────────────────────────
# Tutti i file in enketo_package_template/ vengono copiati nel pacchetto:
# INSTALL.md, config/*.example, Dockerfile, docker-compose.yml, .env.example,
# .dockerignore, ecc. Aggiungerne uno nuovo lì lo include automaticamente.
if [ -d "$ROOT/enketo_package_template" ]; then
  echo "▸ Copio template hand-written (INSTALL.md, config, Docker, ...)"
  # -a per preservare permessi/timestamp; . per includere i dotfile
  cp -a "$ROOT/enketo_package_template/." "$OUT/"
fi

# ── 9. Syntax check JS ──────────────────────────────────────────────────────
echo "▸ Syntax check JS"
for f in "$OUT/public/js/"*.js; do
  printf "    %-40s " "$(basename "$f")"
  node --check "$f" && echo "OK"
done

# ── 10. Sommario ────────────────────────────────────────────────────────────
echo
echo "▸ Pacchetto generato in: $OUT"
echo
find "$OUT" -type f | sort | sed "s|$OUT/|    |"
echo
echo "✓ Build completata. Vedi enketo_package/INSTALL.md per il deploy."
