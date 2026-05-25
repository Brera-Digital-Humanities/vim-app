/**
 * VIM — api.js
 * All network calls. Submits completed forms to KoboToolbox.
 *
 * Depends on: data.js (TOKEN, UID, BASE, PAGES) and the navigation bundle
 * (showSuccess, showError, tr, answers, outbox).
 *
 * To serve the form via Enketo Express instead of KoboToolbox, see
 * ../enketo/README.md (endpoint + config differ; the OpenRosa XML is the same).
 */


// API config (TOKEN/UID/BASE come from data.js, injected at build time from
// .env). The token ships in the built file: convenience for beta, not real
// security — for production proxy it server-side. See ../enketo/README.md.


/**
 * doSubmit(ans, mf, instanceId) — Submit a completed form to KoboToolbox.
 *
 * Sends multipart/form-data: an OpenRosa/XForm XML (xml_submission_file) plus
 * one part per media file. instanceId goes in <meta><instanceID> so a re-sent
 * form is deduplicated server-side (idempotent).
 *
 * @param {Object} ans          - fieldName → answer value (from answers)
 * @param {Object} mf           - fieldName → File object (from mediaFiles)
 * @param {string} [instanceId] - stable OpenRosa instanceID
 * @returns {Promise<boolean>} true on success
 */
async function doSubmit(ans, mf, instanceId) {
  try {

    // ── Build OpenRosa XML ───────────────────────────────────────────────
    // <data id="{uid}"><field>value</field><mediaField>filename</mediaField>…</data>
    // Media fields carry only the filename here; the binary goes as a separate
    // multipart part below.
    const xmlParts = [`<?xml version="1.0" ?><data id="${UID}">`];

    PAGES.forEach(pg => {
      pg.fields.forEach(q => {
        const v = ans[q.name];

        // Skip empty fields
        if (v === undefined || v === null || v === '' ||
            (Array.isArray(v) && v.length === 0)) return;

        const val = Array.isArray(v) ? v.join(' ') : v;

        if (mf[q.name]) {
          // Media field: only the filename goes in the XML
          xmlParts.push(`<${q.name}>${mf[q.name].name}</${q.name}>`);
        } else {
          // Text/select field: escape XML-special characters
          const escaped = String(val)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
          xmlParts.push(`<${q.name}>${escaped}</${q.name}>`);
        }
      });
    });

    // OpenRosa meta: stable instanceID → server-side dedup of re-sent forms
    if (instanceId) xmlParts.push(`<meta><instanceID>${instanceId}</instanceID></meta>`);
    xmlParts.push('</data>');
    const xmlString = xmlParts.join('');

    // ── Build multipart FormData ──────────────────────────────────────────
    const formData = new FormData();

    // The XML is the main part of the submission
    formData.append(
      'xml_submission_file',
      new Blob([xmlString], { type: 'text/xml' }),
      'submission.xml'
    );

    // Media attachments: each file keyed by its field name
    Object.entries(mf).forEach(([fieldName, file]) => {
      formData.append(fieldName, file, file.name);
    });

    // ── API call ──────────────────────────────────────────────────────────
    // POST /api/v2/assets/{uid}/submissions/ (KoboToolbox API v2).
    // Expected: 201/200 ok · 400 bad XML · 401 bad token · 403 forbidden · 503 down.
    const response = await fetch(`${BASE}/api/v2/assets/${UID}/submissions/`, {
      method:  'POST',
      headers: { 'Authorization': `Token ${TOKEN}` },
      body:    formData,
    });

    return response.ok || response.status === 201;

  } catch (error) {
    // Network errors (offline, timeout, CORS)
    console.error('[VIM API] submit error:', error);
    return false;
  }
}
