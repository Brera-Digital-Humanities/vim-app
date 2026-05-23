#!/usr/bin/env bash
# =============================================================================
# build_monolith.sh
# Build valigia_immateriale.html (self-contained single file) from vim_docs/.
# Use it to test changes in a browser without going through Enketo Express.
#
# Requires: node >= 18, sass  (both via `npm install`)
# Usage:    ./build_monolith.sh   then   npm start
# =============================================================================

set -euo pipefail

ROOT="$(cd "$(dirname "$0")" && pwd)"
SRC="$ROOT/vim_docs"
OUT="$ROOT/valigia_immateriale.html"
TMP_CSS="$(mktemp --suffix=.css)"
TMP_JS="$(mktemp --suffix=.js)"
TMP_TPL="$(mktemp --suffix=.html)"
trap 'rm -f "$TMP_CSS" "$TMP_JS" "$TMP_TPL"' EXIT

export PATH="$ROOT/node_modules/.bin:$PATH"

# Read a section ([js], [scss], [html]) from vim_docs/build.order → newline paths.
order() { awk -v s="[$1]" '$0==s{f=1;next} /^\[/{f=0} f&&NF&&$1!~/^#/{print $1}' "$SRC/build.order"; }

# Expand template.html: insert the [html] partials at the <!-- @screens --> marker.
expand_template() {
  local files; files="$(order html | tr '\n' ' ')"
  awk -v dir="$SRC/" -v list="$files" '
    /^[[:space:]]*<!-- @screens -->/ {
      n = split(list, a, " ")
      for (i = 1; i <= n; i++) if (a[i] != "") { while ((getline l < (dir a[i])) > 0) print l; close(dir a[i]) }
      next
    } { print }' "$SRC/template.html"
}

# ── 0. Prerequisites ────────────────────────────────────────────────────────
command -v sass >/dev/null 2>&1 || { echo "ERROR: sass missing. Run 'npm install' in the project root."; exit 1; }
for f in data.js template.html api.js build.order; do
  [ -f "$SRC/$f" ] || { echo "ERROR: vim_docs/$f missing"; exit 1; }
done

# ── 0b. Load .env (TOKEN, UID, BASE) ────────────────────────────────────────
if [ -f "$ROOT/.env" ]; then
  # shellcheck disable=SC1091
  set -a; . "$ROOT/.env"; set +a
else
  echo "ERROR: .env missing. Run: cp .env.example .env  and fill in your values."
  exit 1
fi
: "${VIM_KOBO_TOKEN:?VIM_KOBO_TOKEN not set in .env}"
: "${VIM_KOBO_UID:?VIM_KOBO_UID not set in .env}"
: "${VIM_KOBO_BASE:?VIM_KOBO_BASE not set in .env}"

# ── 1. Concatenate SCSS (per build.order) then compile ──────────────────────
echo "▸ Concatenate + compile SCSS"
: > "$TMP_CSS.scss"
for f in $(order scss); do
  [ -f "$SRC/$f" ] || { echo "ERROR: vim_docs/$f listed in build.order but missing"; exit 1; }
  cat "$SRC/$f" >> "$TMP_CSS.scss"; printf '\n' >> "$TMP_CSS.scss"
done
sass --no-source-map --style=expanded "$TMP_CSS.scss" "$TMP_CSS"
rm -f "$TMP_CSS.scss"

# ── 2. Concatenate JS: data.js + (build.order [js]) + api.js ────────────────
echo "▸ Concatenate JS"
{
  echo "// === vim_docs/data.js ==="
  cat "$SRC/data.js"; echo
  for f in $(order js); do
    [ -f "$SRC/$f" ] || { echo "ERROR: vim_docs/$f listed in build.order but missing"; exit 1; }
    echo "// === vim_docs/$f ==="
    cat "$SRC/$f"; echo
  done
  echo "// === vim_docs/api.js ==="
  cat "$SRC/api.js"; echo
} > "$TMP_JS"

# ── 3. Assemble monolith: expand template, then inline CSS+JS ───────────────
echo "▸ Assemble valigia_immateriale.html"
expand_template > "$TMP_TPL"
awk -v cssf="$TMP_CSS" -v jsf="$TMP_JS" '
function inline_file(path) { while ((getline line < path) > 0) print line; close(path) }
# Drop PWA manifest (local monolith is not an installable PWA)
/<link rel="manifest"/ { next }
# Replace CSS link with inline <style>
/<link rel="stylesheet" href="\/styles\/vim\.css"\/>/ {
  print "  <style>"; inline_file(cssf); print "  </style>"; next
}
# Replace the first vim.data.js script tag with the whole inlined JS bundle
/<script src="\/js\/vim\.data\.js"><\/script>/ {
  print "  <script>"; inline_file(jsf); print "  </script>"; next
}
# Drop the other two script tags (already inlined above)
/<script src="\/js\/vim\.(navigation|api)\.js"><\/script>/ { next }
{ print }
' "$TMP_TPL" > "$OUT"

# ── 4. Inject credentials from .env ─────────────────────────────────────────
echo "▸ Inject TOKEN/UID/BASE from .env"
sed -i \
  -e "s|__VIM_KOBO_TOKEN__|$VIM_KOBO_TOKEN|g" \
  -e "s|__VIM_KOBO_UID__|$VIM_KOBO_UID|g" \
  -e "s|__VIM_KOBO_BASE__|$VIM_KOBO_BASE|g" \
  "$OUT"

# ── 5. Syntax-check the inlined JS ──────────────────────────────────────────
echo "▸ Syntax check inlined JS"
awk '/<script>/{p=1;next} /<\/script>/{p=0} p' "$OUT" > "$TMP_JS"
node --check "$TMP_JS" && echo "    inlined JS OK"

# ── 6. Summary ──────────────────────────────────────────────────────────────
SIZE=$(wc -c < "$OUT")
echo
echo "▸ Built: $OUT  ($((SIZE / 1024)) KB)"
echo "  Test:  npm start   (serves on http://localhost:8765)"
