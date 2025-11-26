# Requisiti Funzionali e Non Funzionali - Virtual Data Room

## 1. Requisiti Funzionali

### 1.1 Autenticazione e Gestione Utenti

#### RF-AUTH-001: Registrazione Utente
- L'utente deve poter creare un account fornendo email e password
- L'utente deve poter registrarsi tramite OAuth2 (Google, Microsoft)
- Il sistema deve inviare email di verifica
- Il sistema deve supportare passkey/WebAuthn (futuro)

#### RF-AUTH-002: Autenticazione
- L'utente deve poter effettuare login con email/password
- L'utente deve poter effettuare login con OAuth2
- Il sistema deve supportare 2FA (futuro)
- Il sistema deve gestire sessioni sicure con refresh token

#### RF-AUTH-003: Gestione Profilo
- L'utente deve poter visualizzare e modificare il proprio profilo
- L'utente deve poter cambiare password
- L'utente deve poter caricare foto profilo
- L'utente deve poter eliminare il proprio account

### 1.2 Gestione Workspace/Team

#### RF-TEAM-001: Creazione Workspace
- L'utente deve poter creare un workspace/team
- Il workspace deve avere un nome univoco
- Il workspace deve avere uno slug URL-friendly
- L'owner deve avere controllo completo

#### RF-TEAM-002: Gestione Membri
- L'owner deve poter invitare membri via email
- Il sistema deve supportare ruoli: Owner, Admin, Member, Viewer
- I membri devono poter accettare o rifiutare inviti
- L'admin deve poter rimuovere membri
- L'admin deve poter modificare ruoli membri

#### RF-TEAM-003: Branding Workspace
- Il workspace deve permettere upload di logo
- Il workspace deve permettere configurazione colori brand
- Il workspace deve permettere custom domain (futuro)

### 1.3 Gestione Documenti

#### RF-DOC-001: Upload Documenti
- L'utente deve poter caricare documenti singoli (drag & drop o selezione)
- Il sistema deve supportare formati: PDF, DOCX, PPTX, immagini (PNG, JPG), Excel
- Il sistema deve supportare upload multipli (bulk upload)
- Il sistema deve generare preview per documenti
- Il sistema deve estrarre numero pagine per PDF

#### RF-DOC-002: Organizzazione Documenti
- L'utente deve poter creare cartelle
- L'utente deve poter spostare documenti tra cartelle
- L'utente deve poter rinominare documenti
- L'utente deve poter aggiungere descrizioni
- L'utente deve poter cercare documenti

#### RF-DOC-003: Versioning Documenti
- L'utente deve poter caricare nuove versioni di un documento
- Il sistema deve mantenere storico versioni
- L'utente deve poter visualizzare versioni precedenti
- L'utente deve poter ripristinare versioni precedenti

#### RF-DOC-004: Eliminazione Documenti
- L'utente deve poter eliminare documenti
- Il sistema deve confermare eliminazione (soft delete inizialmente)
- L'eliminazione deve rimuovere link associati o renderli inattivi

### 1.4 Virtual Data Room (VDR)

#### RF-VDR-001: Creazione Data Room
- L'utente deve poter creare una data room
- La data room deve avere nome e descrizione
- La data room deve avere uno slug univoco
- La data room deve appartenere a un workspace

#### RF-VDR-002: Struttura Data Room
- L'utente deve poter creare cartelle nella data room
- L'utente deve poter creare sottocartelle (struttura gerarchica)
- L'utente deve poter riordinare cartelle
- L'utente deve poter assegnare documenti a cartelle

#### RF-VDR-003: Configurazione Data Room
- L'utente deve poter configurare:
  - Watermarking (attivo/disattivo, tipo)
  - Download permission (permetti/blocca)
  - Screenshot protection (attivo/disattivo)
  - View expiration (data scadenza)
  - Email verification richiesta
  - Password protection

#### RF-VDR-004: Permessi Data Room
- L'owner deve poter aggiungere viewer alla data room
- L'owner deve poter assegnare permessi granulari:
  - Accesso completo data room
  - Accesso solo a specifiche cartelle
  - Download abilitato/disabilitato
  - Scadenza accesso
- L'owner deve poter revocare accessi

### 1.5 Condivisione e Link

#### RF-LINK-001: Generazione Link
- L'utente deve poter generare link per documento singolo
- L'utente deve poter generare link per data room
- Il link deve avere slug univoco e breve
- Il sistema deve generare URL condivisibile

#### RF-LINK-002: Configurazione Link
- L'utente deve poter configurare per ogni link:
  - Nome/descrizione link
  - Password protection
  - Email verification
  - Domain restriction (lista domini permessi)
  - Expiration date
  - Download permission
  - View limit (numero massimo visualizzazioni)
  - Watermark
  - Screenshot protection
  - Tracking abilitato/disabilitato

#### RF-LINK-003: Gestione Link
- L'utente deve poter visualizzare lista link creati
- L'utente deve poter modificare configurazione link
- L'utente deve poter disabilitare/eliminare link
- L'utente deve poter copiare URL link

#### RF-LINK-004: Accesso Link (Viewer)
- Il viewer deve poter accedere al link pubblico
- Il sistema deve richiedere autenticazione se configurato:
  - Inserimento password
  - Verifica email (invio OTP)
  - Login account (per link privati)
- Il viewer deve poter visualizzare documento inline
- Il viewer deve poter navigare tra pagine
- Il viewer deve poter scaricare (se permesso)
- Il viewer deve poter visualizzare struttura data room (se link VDR)

### 1.6 Analytics e Tracking

#### RF-ANALYTICS-001: Tracking Visualizzazioni
- Il sistema deve tracciare automaticamente:
  - Data/ora visualizzazione
  - Email viewer (se disponibile)
  - Durata visualizzazione
  - Pagine visualizzate
  - Tempo per pagina
  - Completion rate (% documento visto)
  - Device info (browser, OS, device type)
  - Geolocalizzazione (paese, città)
  - IP address
  - Referrer URL

#### RF-ANALYTICS-002: Dashboard Analytics
- L'utente deve poter visualizzare analytics per:
  - Documento singolo
  - Link singolo
  - Data room
  - Workspace (aggregato)
- La dashboard deve mostrare:
  - Total views
  - Unique viewers
  - Average view duration
  - Completion rate
  - Most viewed pages
  - Geographic distribution
  - Device/browser breakdown
  - Timeline views (grafico temporale)

#### RF-ANALYTICS-003: Notifiche Real-Time
- L'utente deve ricevere notifica quando documento viene visualizzato
- L'utente deve ricevere notifica per milestone (50%, 100% completamento)
- Le notifiche devono essere via email e/o in-app
- L'utente deve poter configurare preferenze notifiche

#### RF-ANALYTICS-004: Export Analytics
- L'utente deve poter esportare dati analytics in CSV
- L'utente deve poter esportare report in PDF
- L'export deve includere tutti i dati di tracking

### 1.7 Audit Trail e Compliance

#### RF-AUDIT-001: Audit Log
- Il sistema deve registrare tutte le azioni rilevanti:
  - Upload/delete documenti
  - Creazione/modifica link
  - Accesso documenti/data room
  - Modifiche permessi
  - Inviti/rimozione membri
  - Modifiche configurazione
- Ogni log deve includere:
  - Timestamp preciso
  - Utente/email che ha eseguito azione
  - Tipo azione
  - Entità coinvolta (documento, link, ecc.)
  - IP address
  - Metadata aggiuntivi (JSON)

#### RF-AUDIT-002: Visualizzazione Audit Log
- L'admin deve poter visualizzare audit log completo
- Il log deve essere filtrabile per:
  - Periodo temporale
  - Tipo azione
  - Utente
  - Entità
- Il log deve essere esportabile

### 1.8 Collaboration Features

#### RF-COLLAB-001: Comments (Futuro)
- L'utente deve poter lasciare commenti su documenti
- I commenti devono essere associati a pagine specifiche
- I membri team devono poter rispondere a commenti
- L'utente deve ricevere notifiche per nuovi commenti

#### RF-COLLAB-002: Q&A (Futuro)
- Il viewer deve poter lasciare domande sul documento
- L'owner deve poter rispondere alle domande
- Le Q&A devono essere organizzate in threads
- Il sistema deve notificare nuove domande/risposte

### 1.9 Integrazioni

#### RF-INT-001: Webhooks
- L'utente deve poter configurare webhook URL
- Il sistema deve inviare eventi webhook per:
  - Nuovo view documento
  - Completion documento
  - Nuovo commento/domanda
  - Scadenza link
- I webhook devono includere firma HMAC per sicurezza

#### RF-INT-002: API REST (Futuro)
- Il sistema deve esporre API REST pubblica
- API deve supportare autenticazione via API key
- API deve permettere:
  - Upload documenti
  - Creazione link
  - Lettura analytics
  - Gestione data room

## 2. Requisiti Non Funzionali

### 2.1 Performance

#### RNF-PERF-001: Tempi di Risposta
- Le pagine devono caricare in meno di 2 secondi (LCP)
- Le API devono rispondere in meno di 500ms (P95)
- L'upload di documenti deve supportare file fino a 100MB
- La preview di documenti deve generarsi in background (max 30s per PDF 100 pagine)

#### RNF-PERF-002: Scalabilità
- Il sistema deve supportare 1000+ utenti concorrenti
- Il sistema deve gestire 10,000+ documenti per workspace
- Il sistema deve processare 100,000+ view tracking events al giorno
- Il database deve scalare orizzontalmente (read replicas)

#### RNF-PERF-003: Caching
- Le pagine statiche devono essere cached su CDN
- Le API devono implementare caching appropriato (Redis)
- Le preview documenti devono essere cached
- Le analytics aggregate devono essere pre-calcolate

### 2.2 Sicurezza

#### RNF-SEC-001: Autenticazione e Autorizzazione
- Tutte le password devono essere hashed (bcrypt, min 12 rounds)
- Le sessioni devono usare JWT sicuri (httpOnly, secure, sameSite)
- I refresh token devono essere ruotati
- Le API devono implementare rate limiting (max 100 req/min per IP)

#### RNF-SEC-002: Protezione Dati
- Tutti i dati in transito devono usare TLS 1.3
- I dati sensibili nel database devono essere encrypted at rest
- Le password link devono essere hashed
- I file nel storage devono essere encrypted (AES-256)

#### RNF-SEC-003: Compliance
- Il sistema deve essere conforme GDPR
- Il sistema deve permettere export dati utente (GDPR right to data portability)
- Il sistema deve permettere eliminazione account e dati (GDPR right to erasure)
- Il sistema deve implementare consent management per cookies

#### RNF-SEC-004: Protezione Applicazione
- Il sistema deve proteggere contro SQL injection (uso ORM con prepared statements)
- Il sistema deve proteggere contro XSS (sanitizzazione input, CSP headers)
- Il sistema deve proteggere contro CSRF (tokens)
- Il sistema deve implementare security headers (HSTS, X-Frame-Options, ecc.)

### 2.3 Affidabilità

#### RNF-REL-001: Disponibilità
- Il sistema deve avere uptime 99.5% (target)
- Il sistema deve implementare health checks
- Il sistema deve avere monitoring attivo (logs, metrics, alerts)

#### RNF-REL-002: Backup e Recovery
- Il database deve avere backup automatici giornalieri
- I backup devono essere conservati per 30 giorni
- Il sistema deve permettere point-in-time recovery
- I file nel storage devono avere versioning abilitato

#### RNF-REL-003: Error Handling
- Tutti gli errori devono essere loggati centralmente
- Gli errori critici devono generare alert
- L'utente deve ricevere messaggi di errore user-friendly
- Il sistema deve implementare graceful degradation

### 2.4 Manutenibilità

#### RNF-MAINT-001: Codice
- Il codice deve seguire TypeScript strict mode
- Il codice deve avere coverage test > 70% (target)
- Il codice deve essere linted (ESLint, Prettier)
- Il codice deve avere documentazione inline (JSDoc)

#### RNF-MAINT-002: Architettura
- L'architettura deve essere modulare (separazione concerns)
- Le dipendenze devono essere minimizzate
- Il sistema deve usare dependency injection dove appropriato
- Il sistema deve avere layer separation (presentation, business logic, data access)

#### RNF-MAINT-003: Deployment
- Il deployment deve essere automatizzato (CI/CD)
- Il sistema deve supportare rollback rapido
- Il sistema deve avere environment separati (dev, staging, production)
- Il sistema deve usare feature flags per rilasci graduali

### 2.5 Usabilità

#### RNF-UX-001: Interfaccia
- L'interfaccia deve essere responsive (mobile, tablet, desktop)
- L'interfaccia deve essere accessibile (WCAG 2.1 AA)
- L'interfaccia deve supportare dark mode (futuro)
- L'interfaccia deve avere loading states chiare

#### RNF-UX-002: Internazionalizzazione
- Il sistema deve supportare italiano e inglese
- Il sistema deve permettere aggiunta nuove lingue facilmente
- Le date devono essere formattate secondo locale
- I numeri e valute devono essere formattati secondo locale

### 2.6 Costi e Efficienza

#### RNF-COST-001: Ottimizzazione Costi Cloud
- Il sistema deve minimizzare uso di servizi managed costosi
- Lo storage deve usare tier appropriati (hot vs cold storage)
- Le risorse compute devono scalare automaticamente (auto-scaling)
- Il sistema deve implementare cleanup automatico dati obsoleti

#### RNF-COST-002: Target Costi Operativi
- Costi mensili infrastruttura: < €100/mese (per 1000 utenti)
- Costi storage: < €20/mese per TB
- Costi bandwidth: minimizzati con CDN e compressione
- Costi email: < €10/mese (provider economico)

### 2.7 Osservabilità

#### RNF-OBS-001: Logging
- Tutti i log devono essere centralized (stdout, aggregator)
- I log devono essere strutturati (JSON format)
- I log devono avere livelli appropriati (debug, info, warn, error)
- I log sensibili devono essere redacted

#### RNF-OBS-002: Monitoring
- Il sistema deve tracciare metriche chiave:
  - Request rate, latency, error rate
  - Database query performance
  - Storage usage
  - Memory/CPU usage
- Le metriche devono essere visualizzate in dashboard
- Il sistema deve avere alerting per anomalie

#### RNF-OBS-003: Tracing
- Le request devono avere trace ID per correlazione
- Le chiamate inter-service devono essere traceable
- Il sistema deve permettere distributed tracing (futuro)

## 3. Vincoli Tecnici

### VT-001: Stack Tecnologico
- **Linguaggio**: TypeScript (strict mode)
- **Framework**: Next.js 14+ (App Router)
- **Database**: PostgreSQL 15+
- **ORM**: Prisma 5+
- **UI**: Shadcn UI + Tailwind CSS
- **Auth**: NextAuth.js v5 (Auth.js)
- **Storage**: AWS S3 o Azure Blob Storage (configurabile)

### VT-002: Browser Support
- Chrome/Edge (ultime 2 versioni)
- Firefox (ultime 2 versioni)
- Safari (ultime 2 versioni)
- Mobile browsers (iOS Safari, Chrome Android)

### VT-003: Limiti Tecnici
- File upload max: 100MB per file
- Data room max documenti: 1000 documenti
- Link views tracking: conservati per 12 mesi
- Audit log: conservato per 24 mesi
- Session timeout: 7 giorni (inactivity)

## 4. Prioritizzazione Features (MVP)

### Fase 1 - MVP (Minimo Viable Product)
**Obiettivo**: Data room funzionante base con tracking

- ✅ Autenticazione (email/password + OAuth Google)
- ✅ Workspace singolo per utente
- ✅ Upload documenti (PDF, immagini)
- ✅ Creazione link condivisione base
- ✅ Link protection (password)
- ✅ Tracking views base (analytics semplice)
- ✅ Dashboard analytics base
- ✅ Viewer experience base

### Fase 2 - Features Principali
**Obiettivo**: Virtual Data Room completa

- ✅ Multi-workspace/team
- ✅ Gestione membri team
- ✅ Data room con cartelle
- ✅ Link avanzati (email verification, expiration, domain restriction)
- ✅ Page-by-page analytics
- ✅ Notifiche real-time
- ✅ Audit log completo
- ✅ Branding workspace (logo, colori)

### Fase 3 - Features Avanzate
**Obiettivo**: Differenziazione competitiva

- 🔄 Watermarking dinamico
- 🔄 Screenshot protection
- 🔄 Document versioning
- 🔄 Custom domain
- 🔄 Webhooks
- 🔄 Export analytics avanzato
- 🔄 Azure Blob Storage support

### Fase 4 - Collaboration & AI
**Obiettivo**: Features premium

- ⏳ Comments e Q&A
- ⏳ AI document chat
- ⏳ AI summarization
- ⏳ 2FA
- ⏳ SSO aziendale
- ⏳ API REST pubblica
- ⏳ Mobile app (React Native)

**Legenda**:
- ✅ MVP / Priorità alta
- 🔄 Priorità media
- ⏳ Priorità bassa / futuro
