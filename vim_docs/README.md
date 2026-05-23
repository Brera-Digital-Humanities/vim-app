# VIM — Reference tecnica del form
## Documentazione dei sorgenti in `vim_docs/`

Questo documento descrive **la struttura del form e dei file sorgente**.
Per setup ambiente, build, deploy e troubleshooting vedi i file
nella root del progetto:

| Documento | Quando consultarlo |
|---|---|
| [`../SETUP.md`](../SETUP.md) | Setup dev + workflow + deploy completo (sviluppatore che lavora sul progetto) |
| [`../enketo_package/INSTALL.md`](../enketo_package/INSTALL.md) | Installazione del pacchetto pre-buildato su un'istanza Enketo Express esistente (sysadmin che riceve solo il pacchetto) |
| **questo file** | Capire il form: sezioni, campi, lingue, mapping XLSForm → JS |

---

## Struttura dei file sorgente

Dalla Fase 1 il codice è **modulare**: organizzato per schermata, con le lingue
separate. I file vengono concatenati nell'ordine definito da `build.order`.

```
vim_docs/
├── build.order        Ordine di concatenazione (sezioni [html], [js], [scss])
├── template.html      Guscio HTML (head, cornice, app-bar) + marker <!-- @screens -->
├── data.js            PAGES + CHOICES + placeholder credenziali (__VIM_KOBO_*__)
├── api.js             doSubmit() — invio XForm/OpenRosa a KoboToolbox
├── manifest.json      Web App Manifest (PWA)
│
├── i18n/              Una lingua per file (UI della shell)
│   ├── it.js          const VIM_LANG_it = { key, name, rtl, ui:{…} }
│   ├── en.js          const VIM_LANG_en = …
│   ├── ar.js          const VIM_LANG_ar = …   (rtl: true)
│   └── index.js       const UI_LANGS = [VIM_LANG_it, VIM_LANG_en, VIM_LANG_ar]
│
├── core/              Logica condivisa (non legata a una schermata)
│   ├── state.js       Stato globale (pageIdx, answers, outbox…)
│   ├── clock.js       Orologio status-bar
│   ├── i18n-runtime.js tr(), langKey()
│   ├── labels.js      getLabel/getChoiceLabel/getGroupLabel (multilingua)
│   ├── relevant.js    isVisible/evalRelevant (campi condizionali)
│   ├── router.js      showScreen, goHome, navigazione schermate
│   ├── feedback.js    showSuccess/showError
│   └── init.js        Bootstrap (eseguito per ultimo, su DOMContentLoaded)
│
├── screens/           Una cartella per schermata: HTML + JS + SCSS correlati
│   ├── lang/          lang.html + lang.js (select/confirm/applyUILang) + lang.scss
│   ├── home/          home.html + home.scss (nessun JS dedicato)
│   ├── form/          form.html + form.js (render, nav, bozze, builder, gate) + form.scss
│   ├── download/      download.html + download.js + download.scss
│   └── outbox/        outbox.html + outbox.js + outbox.scss
│
└── styles/            Design system condiviso (SCSS)
    ├── tokens.scss base.scss layout.scss phone-shell.scss app-bar.scss
    ├── screens-base.scss buttons.scss modal.scss feedback.scss
    └── rtl.scss responsive.scss
```

### Aggiungere una lingua

1. Crea `i18n/xx.js` con `const VIM_LANG_xx = { key, name, rtl, ui:{…} }`
   (53 chiavi UI — copia da `it.js` e traduci)
2. Aggiungi `VIM_LANG_xx` all'array in `i18n/index.js`
3. Aggiungi `i18n/xx.js` alla sezione `[js]` di `build.order` (dopo gli altri i18n)
4. Aggiungi le label del **form** sul form KoboToolbox (le label dei campi
   vengono da lì, non da qui)

### build.order

Definisce l'ordine di concatenazione, letto da entrambi gli script di build.
**HTML:** i partial in `[html]` vengono inseriti nel guscio `template.html`
al marker `<!-- @screens -->`. **JS:** le `const` globali (state, UI_LANGS)
precedono l'uso; `init.js` è ultimo. **SCSS:** `tokens.scss` per primo (le
variabili devono essere viste dai file successivi).

`vim_docs/` è la **fonte di verità**. Gli artefatti
(`valigia_immateriale.html` e `enketo_package/`) si generano da qui — vedi
`../SETUP.md` sez. 5.

---

## Stack tecnologico

- **Form engine**: KoboToolbox / Enketo Express (XLSForm standard)
- **Frontend**: HTML5 + SCSS + JavaScript vanilla ES6+ (nessun framework, nessuna dep a runtime)
- **Font**: Cormorant Garamond (serif), DM Sans (UI), DM Mono (numeri), Noto Naskh Arabic (RTL)
- **API**: KoboToolbox REST API v2, formato OpenRosa/XForm
- **Build**: Dart Sass + html2pug + bash scripts (vedi `package.json`)

---

## Lingue supportate

| Codice | Nome | RTL |
|--------|------|-----|
| `Italian (it)` | Italiano | No |
| `English (en)` | English | No |
| `Arabic (ar)` | العربية | Sì |

**Per aggiungere una lingua:**
1. Creare `i18n/xx.js` e registrarlo in `i18n/index.js` (vedi sopra), con `{ key, name, rtl, ui: {...} }`
2. Aggiungere le colonne `label_xx` / `hint_xx` per la nuova lingua nell'XLSForm
3. Rigenerare `PAGES` e `CHOICES` in `data.js`
4. Aggiornare `getLabel(field)` / `getChoiceLabel(...)` se accedono a chiavi hardcoded

---

## Sezioni del form (da XLSForm)

Il form è organizzato in **9 sezioni** (`PAGES`), con **un campo per schermata**.

| # | Nome interno | IT | EN | AR | Obbligatoria |
|---|-------------|----|----|-----|:---:|
| 1 | `pag_nomi` | Nomi dell'espressione | Names of the expression | أسماء التعبير | ✓ |
| 2 | `sez_materiali` | Materiale raccolto | Collected material | المادة المجمّعة | ✓ |
| 3 | `pag_classif` | Classificazione | Classification | التصنيف | ✓ |
| 4 | `pag_portatore` | Il portatore | The bearer | حامل التراث | ✓ |
| 5 | `pag_fpic` | Consenso FPIC | FPIC Consent | موافقة FPIC | ✓ |
| 6 | `pag_evento` | Evento di raccolta | Collection event | حدث الجمع | — |
| 7 | `pag_rischio` | Stato di rischio | Risk assessment | تقييم الخطر | — |
| 8 | `pag_descriz` | Descrizione espressione | Description | وصف التعبير | — |
| 9 | `pag_note` | Note raccoglitore | Collector's notes | ملاحظات الجامع | — |

Il bottone **Completato** si sblocca solo quando tutte le sezioni 1-5
(le obbligatorie) hanno tutti i campi `required="yes"` compilati.
La soglia è definita da `COMPLETE_THRESHOLD = 5` in `screens/form/form.js`.

---

## Campi condizionali

Definiti in `RELEVANT` (`core/relevant.js`). Sintassi XLSForm:
`${nome_campo}='valore'` con operatori `or` / `and`.

| Campo | Visibile se… |
|-------|-----|
| `media_audio` | `${file_type}='tipo_file_19_1'` |
| `media_foto` | `${file_type}='tipo_file_19_3'` |
| `media_video` | `${file_type}='tipo_file_19_2'` |
| `media_documento` | `${file_type}='tipo_file_19_4' or ${file_type}='tipo_file_19_5'` |
| `bearer_age` | `${bearer_type}='tipo_port_6_1'` (solo se "individuo") |
| `fpic_consent_recording` | `${fpic_consent}='consenso_28_1'` (consenso verbale) |
| `fpic_consent_file` | `${fpic_consent}='consenso_28_2'` (consenso scritto) |

Implementazione: `isVisible(fieldName)` → `evalRelevant(expr)` interpreta
la stringa XLSForm sostituendo `${campo}` con `answers[campo]` e valutando
l'espressione booleana.

---

## Flusso utente

```
Avvio
  └─ Selezione lingua (IT / EN / AR)
       └─ Home
            ├─ Scarica modulo → [0.8s] → Home
            ├─ Compila modulo
            │    ├─ Campo per campo, sezione per sezione
            │    ├─ Salva bozza → [modal] → Home o rimani
            │    └─ Completato* → Outbox
            ├─ Modifica bozza → riprende da ultimo punto
            ├─ Moduli da inviare (Outbox)
            │    ├─ Invia singolo → API KoboToolbox
            │    └─ Invia tutti
            └─ Moduli inviati
```

*Completato disponibile solo dopo aver compilato tutti i campi
obbligatori delle prime 5 sezioni.

---

## Stato applicazione (`core/state.js`)

Variabili globali che mantengono lo stato durante una sessione:

| Variabile | Tipo | Significato |
|---|---|---|
| `pageIdx` | number | Indice della sezione corrente (0–8) |
| `window._fieldIdx` | number | Indice del campo corrente dentro la sezione |
| `answers` | `{ [name]: string \| string[] }` | Risposte dell'utente |
| `mediaFiles` | `{ [name]: File }` | File media caricati/registrati |
| `outbox` | `Array<{ answers, mediaFiles, savedAt, label }>` | Moduli completati pronti all'invio |
| `sentForms` | `Array<...>` | Storico moduli già inviati |
| `draftAnswers` / `draftPage` | object / number | Bozza in corso (sopravvive al ritorno in Home, NON al refresh) |
| `currentLangIdx` | number | Indice in `UI_LANGS` della lingua attiva |

> ⚠️ Le bozze non sono persistenti tra refresh. Per persistenza offline reale
> serve IndexedDB (vedi roadmap in fondo).

---

## Funzioni chiave

| Funzione | Cosa fa |
|---|---|
| `renderPage(idx)` | Renderizza la sezione corrente, un campo alla volta |
| `nextField()` | Avanza al campo successivo; se è l'ultimo, avanza di sezione |
| `prevPage()` | Torna al campo precedente |
| `buildQuestion(q)` | Genera HTML per un campo singolo |
| `buildMediaField(q, kind)` | Doppio bottone "Registra" / "Carica" per audio/video/foto |
| `updateCompleteBtn()` | Abilita/disabilita il bottone "Completato" in base a `COMPLETE_THRESHOLD` |
| `isVisible(fieldName)` | Risolve i campi condizionali tramite `evalRelevant` |
| `evalRelevant(expr)` | Interpreta espressioni XLSForm |
| `saveDraft()` | Salva bozza in memoria + mostra modal di conferma |
| `markComplete()` | Sposta il modulo corrente in `outbox[]` |
| `applyUILang()` | Riapplica tutti i testi UI nella lingua corrente (incluso RTL) |
| `tr()` / `langKey()` | Accesso veloce a UI strings / chiave lingua attiva |
| `doSubmit(ans, mf)` | (in `api.js`) Invia il modulo come multipart XForm |

---

## Mapping XLSForm → strutture JS

### Da `survey` / `choices` (XLSX) a `PAGES` / `CHOICES`

Una riga `begin_group` nell'XLSForm diventa una entry in `PAGES`:

```js
{ name: 'pag_fpic',
  label_it: 'Consenso FPIC',
  label_en: 'FPIC Consent',
  label_ar: 'موافقة FPIC',
  fields: [
    { type: 'select_one consenso_list',
      name: 'fpic_consent',
      label_it: 'Consenso FPIC *',
      hint_it: 'Obbligatorio. In assenza di consenso non procedere.',
      required: 'yes',
      relevant: '' },
    ...
  ]
}
```

Una `select_one xxx_list` con righe `choices` diventa una entry in `CHOICES`:

```js
"consenso_list": [
  { name: 'consenso_28_1', it: 'Consenso verbale registrato', en: 'Verbal consent (recorded)', ar: '...' },
  { name: 'consenso_28_2', it: 'Consenso scritto firmato', en: 'Written consent (signed)', ar: '...' },
]
```

Non esiste ancora uno script di rigenerazione automatica da XLSX
(vedi roadmap).

---

## Convenzioni di codice

- **Nessun framework, nessuna dipendenza a runtime.** Vanilla JS ES6+.
- **CSS variables sempre:** `var(--accent)`, mai `#c4763a`.
- **Animazioni:** `slideIn`/`slideBack` per transizioni campo, `fadeIn`/`slideUp` per modal.
- **Modal:** sempre append dentro `.phone-shell` (per restare nella cornice).
- **RTL:** testare ogni modifica con la lingua araba.
- **Syntax check obbligatorio** prima di ogni commit. `npm run check` lo fa per tutti i `.js`.

---

## Roadmap

- [ ] Persistenza offline con IndexedDB (bozze sopravvivono al refresh)
- [ ] Service worker custom per caching offline completo
- [ ] Script di rigenerazione automatica di `PAGES` e `CHOICES` da XLSForm aggiornato
- [ ] Test end-to-end con Playwright (flusso compilazione + invio)
- [ ] Icone PWA generate da SVG sorgente

---

## Risorse esterne

- KoboToolbox API v2: https://kobo.kobotoolbox.org/api/v2/
- Enketo Express: https://enketo.github.io/enketo-express/
- XLSForm spec: https://xlsform.org/
- Form pubblico Kobo (test): https://ee-eu.kobotoolbox.org/x/<ENKETO-ID>
