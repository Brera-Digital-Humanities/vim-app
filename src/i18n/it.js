// VIM — Italian (it) UI strings
const VIM_LANG_it = {
    key: 'Italian (it)',
    name: 'Italiano',
    rtl: false,
    ui: {
      // — Titles and navigation —
      appTitle:         'La valigia immateriale',
      loginTitle: 'Accesso',
      loginName: 'Username',
      loginCode: 'Password',
      loginBtn: 'Entra',
      loginErrName: 'Inserisci lo username',
      loginErrCode: 'Credenziali non valide',
      loginErrNetwork: 'Login non disponibile, riprova.',
      questionnaire:    'Modulo',
      // — Home menu —
      compilaTitle:     'Compila modulo',
      compilaSub:       'Avvia il modulo',
      scaricaTitle:     'Scarica modulo',
      scaricaSub:       'Aggiorna dalla rete',
      bozzaTitle:       'Modifica bozza',
      bozzaSub:         'Riprendi una compilazione',
      outboxTitle:      'Moduli da inviare',
      outboxSub:        'In attesa di invio',
      outboxSubEmpty:   'Nessun invio in coda',
      outboxSubOnline:  'Connesso: invio automatico attivo',
      outboxSubOffline: 'In attesa di connessione',
      outboxSubSending: 'Invio in corso',
      outboxSubError:   'Errore di invio: intervento richiesto',
      inviatiTitle:     'Moduli inviati',
      inviatiSub:       'Visualizza risposte inviate',
      archivio:         'Archivio',
      azioniPrincipali: 'Azioni principali',
      accountTitle:     'Account',
      accountLoggedUser: 'Utente loggato',
      logout:           'Disconnetti',
      // — Language —
      cambiaLinguaTitle: 'Cambia lingua',
      cambiaLinguaSub:   'Lingua attiva',
      // — Form buttons —
      avanti:    'Avanti',
      indietro:  '←',
      invia:     'Invia',
      completato: '✓ Completato',
      salvaBozza: '💾 Salva bozza',
      // — States —
      loading:      'Caricamento…',
      sending:      'Invio in corso…',
      successTitle: 'Grazie!',
      successMsg:   'Il tuo modulo è stato inviato.',
      noBozza:      'Nessuna bozza salvata.',
      noOutbox:     'Nessun modulo completato',
      noInviati:    'Nessun modulo inviato.',
      outboxSavedMsg: 'Salvato nella coda di invio.<br>Vai su "Moduli da inviare" per inviarlo.',
      noFormDl:     'Scarica prima il modulo.',
      // — Download —
      dlBtn:     'Scarica selezionati',
      dlLoading: 'Download…',
      dlOk:      '✓ Pronto.',
      dlErr:     '⚠️ Errore: ',
      notDl:     'Non scaricato',
      downloaded: '✓ Scaricato',
      // — Language —
      continua: 'Continua',
      // — Form section header —
      sectionLabel:  'Sezione',
      requiredNote:  'Campi obbligatori per il completamento',
      fieldRequired: 'Questo campo è obbligatorio',
      // — Form bar —
      home:         'Home',
      back:         'Indietro',
      // — Save-draft modal —
      draftLabel:   'Bozza',  // fallback label for an unnamed draft (e.g. "Bozza 3")
      draftTitle:   'Bozza salvata',
      draftMsg:     'Vuoi tornare alla home o continuare la compilazione?',
      draftGoHome:  'Vai alla home',
      draftStay:    'Continua qui',
      resume:       'Riprendi',
      draftsHeader: 'Bozze salvate',
      // — Form exit modal —
      exitTitle:    'Uscire dalla compilazione?',
      exitMsg:      'Se esci senza salvare perdi quello che hai inserito finora.',
      exitSave:     'Salva bozza ed esci',
      exitDiscard:  'Esci senza salvare',
      exitStay:     'Rimani',
      // — Media —
      tapRecord:       'Registra',
      tapUploadAudio:  'Carica audio',
      tapPhoto:        'Scatta foto',
      tapUploadPhoto:  'Carica foto',
      tapVideo:        'Registra video',
      tapUploadVideo:  'Carica video',
      tapFile:         'Carica file',
      captured:        '✓ Acquisito',
      audioStop:       'Interrompi',
      audioRecording:  'Registrazione',
      audioRecorded:   'Audio registrato',
      audioRecordError: 'Registrazione audio non riuscita.',
      audioPermissionError: 'Microfono non disponibile o permesso negato.',
      // — Outbox —
      sendAll:     'Invia tutti',
      inAttesa:    'In attesa di invio',
      sentHeader:  'Elenco inviati',
      formSavedAt: 'Salvato il',
      retry:       'Riprova',
      sendFailed:  'Invio non riuscito — riprova o elimina.',
      autoSuspended: 'Invio automatico sospeso.',
      submitInProgress: 'Invio in corso…',
      submitFailed: 'Invio non riuscito',
      submitOk:    'Modulo inviato',
      submitGenericError: 'Errore di invio non specificato',
      submitNoConnection: 'Il browser segnala assenza di connessione.',
      noSubmitErrors: 'Nessun errore di invio registrato.',
      sendDebugTitle: 'Debug invio',
      connectionState: 'Connessione',
      lastAttempt: 'Ultimo tentativo',
      lastError:   'Ultimo errore',
      httpStatus:  'HTTP',
      networkError: 'Errore di rete',
      form:        'Modulo',
      mediaLargeWarn: 'File grande, l’invio potrebbe non riuscire.',
      removeFile:    'Rimuovi file',
      // Welcome popup shown once after the first language choice; reopened
      // from the home via the disclaimerLink. disclaimerText is rendered as
      // HTML (controlled content) so it can carry <h3>/<p> structure.
      disclaimerTitle:   'Informativa',
      disclaimerText: `
<h3>A cosa serve questa app?</h3>
<p>VIM – Valigia Immateriale è una piattaforma digitale dedicata alla documentazione e alla salvaguardia delle tradizioni e del patrimonio culturale immateriale. Attraverso la raccolta di testimonianze, registrazioni, immagini e informazioni descrittive, l’app contribuisce a conservare pratiche culturali, conoscenze e tradizioni che rappresentano una parte importante della memoria e dell’identità sia delle singole persone che della collettività.</p>

<h3>Che cosa puoi documentare?</h3>
<p>Puoi contribuire alla documentazione di una pratica o espressione culturale, ad esempio: un canto, una musica, una danza, un racconto orale, una festa, un rituale, una tecnica artigianale, una pratica legata al cibo o qualsiasi altra conoscenza trasmessa nel tempo.</p>
<p>L’applicazione è stata costruita utilizzando categorizzazioni istituzionali ma ugualmente comunitarie per renderla il più inclusiva possibile (UNESCO).</p>

<h3>Dove vanno i dati? Di chi è la proprietà?</h3>
<p>Questa specifica raccolta di informazioni fatta tra giugno-luglio 2026 è finalizzata principalmente alla messa a punto dello strumento. I dati saranno temporaneamente raccolti nei server VIM del progetto risiedenti in Svizzera, quindi alla fine della fase di test saranno poi donati al Museo Nazionale Palestinese.</p>
<p>L’intero progetto è realizzato dall’Accademia di Belle Arti di Brera, nell’ambito del progetto PNRR JERUS-IT-ARTS finanziato dall’Unione Europea.</p>

<p class="consent-cta"><strong>Prima di cominciare devi essere d’accordo a partecipare al test!</strong></p>`,
      disclaimerApprove: 'Approva',
      disclaimerLink:    'Termini d’uso',
      editForm:    'Modifica',
      info:        'Info',
      close:       'Chiudi',
      completeHow: 'Come vuoi inviare il modulo?',
      sendAuto:    'Invia automaticamente (appena c’è rete)',
      sendManual:  'Invia manualmente',
      autoSendLabel: 'Invio automatico',
      autoOn:      'on',
      autoOff:     'off',
      persistNote: 'I dati restano sul dispositivo ma sono soggetti a limiti di spazio e del sistema operativo (su iOS apri l’app almeno ogni ~7 giorni). Invia appena puoi.',
      schemaChangedTitle: 'Modulo cambiato',
      schemaChangedMsg:   'Il modulo è stato modificato dopo la compilazione: rieditarlo potrebbe comportare la perdita di alcuni dati.',
      editAnyway:  'Edita comunque',
      sendAsIs:    'Invia modulo così',
      // — Connectivity indicator (home) —
      statusOnline:  'Connesso',
      statusOffline: 'Nessuna connessione',
      storageLow:    'Spazio quasi esaurito: invia i moduli appena hai connessione.',
    }
};
