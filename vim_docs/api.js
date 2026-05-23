/**
 * =============================================================================
 * VIM — La valigia immateriale
 * 04_api.js
 *
 * Gestione invio dati a KoboToolbox / Enketo Express.
 * Contiene TUTTE le chiamate di rete del progetto.
 *
 * In Enketo Express self-hosted questo file può essere sostituito con
 * l'API nativa di Enketo (enketo-core/src/js/submission.js), che gestisce
 * già il formato OpenRosa/XForm e i media attachment.
 *
 * DIPENDE DA:
 *   - vim.data.js       → TOKEN, UID, BASE, PAGES
 *   - vim.navigation.js → showSuccess(), showError(), tr(), answers, outbox
 *
 * STRUTTURA:
 *   1. Configurazione API
 *   2. doSubmit()      → invio singolo modulo (chiamato da navigation.js)
 *   3. Note integrazione Enketo Express
 * =============================================================================
 */


// =============================================================================
// 1. CONFIGURAZIONE API
// =============================================================================
//
// TOKEN, UID e BASE sono definiti in vim.data.js.
// In produzione con Enketo Express self-hosted:
//
//   BASE = 'https://tuodominio.org'   ← URL del tuo server Enketo Express
//   UID  = '<FORM-UID>'  ← UID del form su KoboToolbox
//   TOKEN = '...'                     ← Token API KoboToolbox
//
// SICUREZZA:
//   Il TOKEN non deve mai essere esposto in un file JS pubblico.
//   In produzione usare una delle seguenti alternative:
//
//   a) Server proxy: l'app chiama /api/submit sul tuo server,
//      che aggiunge il TOKEN server-side e invia a KoboToolbox.
//
//   b) Enketo Express self-hosted: il server gestisce l'autenticazione
//      con KoboToolbox tramite variabili d'ambiente, non il client.
//      In questo caso l'endpoint di invio cambia in:
//        POST /submission (endpoint OpenRosa nativo di Enketo)
//
//   c) KoboToolbox API con CORS configurato per il tuo dominio.


// =============================================================================
// 2. doSubmit() — INVIO MODULO
// =============================================================================

/**
 * doSubmit(ans, mf) — Invia un modulo completato a KoboToolbox.
 *
 * Formato di invio: multipart/form-data con:
 *   - xml_submission_file: file XML in formato OpenRosa/XForm
 *   - [fieldName]: file media allegati (audio, foto, video, documenti)
 *
 * Il formato XML OpenRosa è lo standard usato da ODK Collect, KoBoCollect
 * e Enketo. È compatibile con tutti i server KoboToolbox/Enketo Express.
 *
 * @param {Object} ans - Map fieldName → valore risposta (da answers in navigation.js)
 * @param {Object} mf  - Map fieldName → File object (da mediaFiles in navigation.js)
 * @returns {Promise<boolean>} True se l'invio è andato a buon fine
 *
 * NOTA PER ENKETO EXPRESS SELF-HOSTED:
 *   Sostituire l'URL con il proprio endpoint:
 *     `${BASE}/submission`           ← endpoint OpenRosa standard
 *   e rimuovere l'header Authorization (gestito dal server).
 *   Il formato XML rimane identico.
 */
async function doSubmit(ans, mf) {
  try {

    // ── Costruzione XML OpenRosa ─────────────────────────────────────────
    //
    // Formato standard XForm/OpenRosa:
    //   <?xml version="1.0" ?>
    //   <data id="{form_uid}">
    //     <fieldName>valore</fieldName>
    //     <mediaField>nomefile.mp3</mediaField>
    //     ...
    //   </data>
    //
    // Per i campi media: nel XML si inserisce solo il nome del file.
    // Il file binario viene allegato come parte separata del multipart.

    const xmlParts = [`<?xml version="1.0" ?><data id="${UID}">`];

    PAGES.forEach(pg => {
      pg.fields.forEach(q => {
        const v = ans[q.name];

        // Salta campi vuoti
        if (v === undefined || v === null || v === '' ||
            (Array.isArray(v) && v.length === 0)) return;

        const val = Array.isArray(v) ? v.join(' ') : v;

        if (mf[q.name]) {
          // Campo media: inserisce solo il nome del file nell'XML
          xmlParts.push(`<${q.name}>${mf[q.name].name}</${q.name}>`);
        } else {
          // Campo testo/selezione: escape caratteri XML speciali
          const escaped = String(val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          xmlParts.push(`<${q.name}>${escaped}</${q.name}>`);
        }
      });
    });

    xmlParts.push('</data>');
    const xmlString = xmlParts.join('');

    // ── Costruzione FormData multipart ────────────────────────────────────
    const formData = new FormData();

    // Il file XML è la parte principale della submission
    formData.append(
      'xml_submission_file',
      new Blob([xmlString], { type: 'text/xml' }),
      'submission.xml'
    );

    // Allegati media: ogni file viene aggiunto con il nome del campo come chiave
    Object.entries(mf).forEach(([fieldName, file]) => {
      formData.append(fieldName, file, file.name);
    });

    // ── Chiamata API ──────────────────────────────────────────────────────
    //
    // KoboToolbox API v2 — endpoint invio submission:
    //   POST /api/v2/assets/{uid}/submissions/
    //
    // Header richiesti:
    //   Authorization: Token {token}
    //   Content-Type: multipart/form-data (impostato automaticamente da fetch con FormData)
    //
    // Risposte attese:
    //   201 Created  → submission salvata con successo
    //   200 OK       → (alcuni server restituiscono 200)
    //   400          → errore validazione XML
    //   401          → token non valido o scaduto
    //   403          → permessi insufficienti
    //   503          → server non disponibile (offline)

    const response = await fetch(`${BASE}/api/v2/assets/${UID}/submissions/`, {
      method:  'POST',
      headers: { 'Authorization': `Token ${TOKEN}` },
      body:    formData,
    });

    return response.ok || response.status === 201;

  } catch (error) {
    // Errori di rete (offline, timeout, CORS)
    console.error('[VIM API] Errore invio:', error);
    return false;
  }
}


// =============================================================================
// 3. NOTE INTEGRAZIONE ENKETO EXPRESS SELF-HOSTED
// =============================================================================
//
// Per usare Enketo Express come server invece di KoboToolbox direttamente:
//
// A) INSTALLAZIONE ENKETO EXPRESS
// ────────────────────────────────
//   git clone https://github.com/enketo/enketo-express
//   cd enketo-express
//   npm install
//   cp config/default-config.json config/config.json
//   # Editare config.json con le proprie credenziali
//   npm start
//
// B) CONFIGURAZIONE config.json
// ────────────────────────────────
//   {
//     "linked form and data server": {
//       "name": "La valigia immateriale",
//       "server url": "https://eu.kobotoolbox.org",
//       "api key": "TUO_API_KEY_KOBO"
//     },
//     "encryption key": "CHIAVE_CASUALE_32_CHARS",
//     "less secure encryption key": false,
//     "port": 8005,
//     "offline enabled": true,   ← abilita service worker offline
//     "maps": [{ ... }]
//   }
//
// C) ENDPOINT ENKETO (sostituzione di questo file)
// ─────────────────────────────────────────────────
//   In Enketo Express l'invio avviene tramite:
//
//     POST /submission
//     Content-Type: multipart/form-data
//     X-OpenRosa-Version: 1.0
//
//   Non serve Authorization header perché è gestito server-side.
//
//   Modifica doSubmit() per Enketo Express:
//
//   const response = await fetch(`${BASE}/submission`, {
//     method: 'POST',
//     headers: {
//       'X-OpenRosa-Version': '1.0',
//       // NO Authorization header — gestito dal server Enketo
//     },
//     body: formData,
//   });
//
// D) OFFLINE / SERVICE WORKER
// ─────────────────────────────
//   Enketo Express include già un service worker per il caching offline.
//   Con "offline enabled": true in config.json, il form funziona offline e
//   le submission vengono accodate localmente (IndexedDB) e inviate
//   automaticamente quando la connessione torna disponibile.
//
//   Il meccanismo di outbox implementato in navigation.js (outbox[]) è
//   una versione semplificata in-memory. In produzione con Enketo Express
//   è preferibile usare il meccanismo nativo basato su IndexedDB.
//
// E) BRANDING CUSTOM
// ─────────────────────
//   Per applicare il tema VIM (01_styles.scss) a Enketo Express:
//
//   1. Copiare vim.css in enketo-express/public/css/
//   2. Modificare enketo-express/app/views/surveys/webform.pug per
//      caricare vim.css invece del tema default
//   3. In enketo-express/config/config.json impostare:
//      "theme": "vim"
//   4. Compilare con: npm run build
//
// F) PWA (PROGRESSIVE WEB APP)
// ─────────────────────────────
//   Per installare l'app su iPhone/Android come PWA:
//
//   1. Aggiungere manifest.json (vedi 05_manifest.json)
//   2. Servire su HTTPS (obbligatorio per PWA e API media su iOS)
//   3. Il service worker di Enketo gestisce già il caching
//
//   URL apertura su iPhone:
//     https://tuodominio.org/x/{enketo_id}
//   Poi "Aggiungi a schermata Home" da Safari.
//
// G) CORS
// ────────
//   Se l'app è servita su dominio diverso da KoboToolbox,
//   aggiungere il proprio dominio alle origini consentite:
//     KoboToolbox → Account → Security → API CORS Origins
//   Oppure usare un proxy server che aggiunge gli header CORS.
