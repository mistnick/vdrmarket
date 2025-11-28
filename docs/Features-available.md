# DataRoom VDR - Features Available

**Version:** 2.0.0  
**Last Updated:** 28 Novembre 2025  
**Status:** Production Ready  

---

## 📋 Overview

DataRoom VDR è una Virtual Data Room moderna e sicura per la gestione e condivisione di documenti aziendali. Questo documento elenca tutte le funzionalità attualmente disponibili e funzionanti.

---

## 🎨 Design System

### Palette Colori (Flat UI Inspired)
| Colore | HEX | Utilizzo |
|--------|-----|----------|
| **Primary Blue** | `#3498DB` | Azioni principali, link, pulsanti |
| **Accent Blue** | `#5DADE2` | Hover states, elementi secondari |
| **Secondary Blue** | `#2980B9` | Elementi scuri, enfasi |
| **Success Green** | `#27AE60` | Conferme, stati positivi |
| **Warning Orange** | `#F39C12` | Avvisi, attenzione |
| **Danger Red** | `#E74C3C` | Errori, azioni distruttive |
| **Foreground** | `#2C3E50` | Testo principale |
| **Muted Gray** | `#7F8C8D` | Testo secondario |
| **Background** | `#FFFFFF` | Sfondo principale |
| **Border** | `#BDC3C7` | Bordi, divisori |

### Temi Supportati
- ✅ Light Theme (Default)
- ✅ Dark Theme (Automatico o manuale)

---

## 🔐 Authentication & Security

### ✅ Autenticazione Custom
- Login con Email/Password
- Registrazione utenti con validazione
- Sessioni sicure (httpOnly cookies, 7 giorni)
- Password hashing con bcrypt (cost factor 10)
- Logout sicuro con invalidazione sessione
- Protezione CSRF integrata

### ✅ Protezione Route
- Middleware per route protette
- Redirect automatico per utenti non autenticati
- Gestione ruoli (Owner, Admin, Member, Viewer)

---

## 📁 Document Management

### ✅ Upload Documenti
- Upload singolo e multiplo
- Drag & Drop interface
- Supporto formati: PDF, DOCX, XLSX, PPTX, immagini
- Progress indicator durante upload
- Validazione tipo e dimensione file

### ✅ Visualizzazione Documenti
- **Document Viewer Dialog**: Modale per visualizzazione inline
- **Enhanced Secure Viewer**: Visualizzatore PDF/immagini sicuro
- Zoom in/out e navigazione pagine
- Modalità fullscreen
- Download diretto con permessi

### ✅ Gestione Documenti
- Lista documenti con vista griglia/lista
- Filtri e ordinamento
- Dettagli documento (metadata, owner, data creazione)
- Soft delete (documenti recuperabili)
- Organizzazione in cartelle

### ✅ Storage
- Supporto S3 (AWS, MinIO, Aruba Cloud)
- Supporto Azure Blob Storage
- Presigned URLs per download sicuri
- Configurazione flessibile via variabili ambiente

---

## 🔗 Share Links

### ✅ Creazione Link
- Link pubblici per condivisione documenti
- Slug personalizzabili o auto-generati
- Configurazione permessi per link

### ✅ Protezioni Link
- **Password Protection**: Richiede password per accesso
- **Email Whitelist**: Solo email autorizzate
- **Email Verification**: Verifica email prima dell'accesso
- **Expiration Date**: Scadenza automatica link
- **Download Control**: Abilita/disabilita download

### ✅ Tracking
- Conteggio visualizzazioni
- Tracking download
- Log IP e User Agent
- Timestamp accessi

---

## 🛡️ Secure Document Viewer

### ✅ Protezioni Anti-Screenshot
- Blocco Print Screen e shortcuts (Cmd+Shift+3/4/5 su macOS)
- Blocco stampa (Ctrl/Cmd+P)
- Blocco copia/incolla (Ctrl/Cmd+C/V)
- Blocco menu contestuale (right-click)
- Blocco drag & drop contenuti

### ✅ Watermark Dinamiche
- Email visualizzatore
- Username visualizzatore
- Indirizzo IP
- Timestamp real-time
- Watermark animate anti-screenshot
- Corner watermarks per copertura completa

### ✅ Protezioni Avanzate
- Overlay su window blur/focus
- Rilevamento DevTools
- MutationObserver anti-manipolazione DOM
- CSS print media query blocking

### ✅ Security Logging
- Log tentativi di stampa
- Log tentativi screenshot
- Log tentativi copia
- Log perdita focus finestra
- Log apertura DevTools
- Metadata completi: tipo violazione, conteggio, IP, timestamp

---

## 👥 Team Management

### ✅ Gestione Team
- Creazione team con nome e slug
- Modifica impostazioni team
- Piani: Free, Professional, Enterprise
- Eliminazione team (solo Owner)

### ✅ Membri Team
- Invito membri via email
- Ruoli: Owner, Admin, Member, Viewer
- Rimozione membri
- Modifica ruoli

### ✅ Permessi
- Owner: Accesso completo
- Admin: Gestione membri e documenti
- Member: Upload e visualizzazione
- Viewer: Solo visualizzazione

---

## 📂 Virtual Data Rooms (VDR)

### ✅ Gestione Data Room
- Creazione data room con nome e descrizione
- Struttura gerarchica cartelle
- Assegnazione documenti
- Statistiche: documenti, membri, visualizzazioni

### ✅ Permessi Data Room
- Viewer: Solo lettura
- Editor: Modifica documenti
- Admin: Gestione completa

### ✅ Componenti UI
- DataRoomPermissions
- PermissionDialog
- PermissionMatrix
- DataRoomList con griglia

---

## 📊 File Explorer

### ✅ Tree View Navigation
- Visualizzazione ad albero delle cartelle
- Espansione/collasso cartelle
- Scroll verticale
- Icone per tipo contenuto

### ✅ Operazioni
- Creazione cartelle
- Upload documenti
- Visualizzazione documenti (icona 👁️)
- Navigazione breadcrumb

---

## 🔔 Notifications

### ✅ Sistema Notifiche
- Notifiche in-app
- Mark as read/unread
- Notifiche per:
  - Visualizzazione link
  - Download documenti
  - Milestone raggiunti
  - Inviti team

### ✅ API Notifiche
- GET `/api/notifications` - Lista notifiche
- PATCH `/api/notifications` - Mark as read

---

## 📈 Analytics & Audit

### ✅ Document Analytics
- Visualizzazioni per documento
- Download tracking
- Timeline accessi
- Endpoint: `/api/analytics/document/[documentId]`

### ✅ Audit Logs
- Log tutte le azioni utente
- Filtraggio per tipo, utente, data
- Visualizzazione dettagliata
- Export dati

---

## 🔍 Search

### ✅ Ricerca Base
- Ricerca documenti per nome
- Ricerca in cartelle
- Endpoint: `/api/search`

---

## ⚙️ Settings

### ✅ Impostazioni Utente
- Modifica profilo
- Cambio password
- Preferenze notifiche

### ✅ Impostazioni Team
- Nome e slug team
- Gestione membri
- Piano abbonamento

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login utente |
| POST | `/api/auth/logout` | Logout utente |
| POST | `/api/auth/signup` | Registrazione |
| GET | `/api/auth/session` | Verifica sessione |

### Documents
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/documents` | Lista documenti |
| POST | `/api/documents` | Upload documento |
| GET | `/api/documents/[id]` | Dettaglio documento |
| DELETE | `/api/documents/[id]` | Elimina documento |
| GET | `/api/documents/[id]/view` | URL visualizzazione |
| GET | `/api/documents/[id]/download` | Download documento |

### Folders
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/folders` | Lista cartelle |
| POST | `/api/folders` | Crea cartella |
| GET | `/api/folders/[id]` | Dettaglio cartella |
| PATCH | `/api/folders/[id]` | Modifica cartella |
| DELETE | `/api/folders/[id]` | Elimina cartella |

### Links
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/links` | Lista link |
| POST | `/api/links` | Crea link |
| GET | `/api/links/[id]` | Dettaglio link |
| DELETE | `/api/links/[id]` | Elimina link |

### Teams
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/teams` | Lista team |
| POST | `/api/teams` | Crea team |
| GET | `/api/teams/[id]` | Dettaglio team |
| PATCH | `/api/teams/[id]` | Modifica team |
| DELETE | `/api/teams/[id]` | Elimina team |

### Data Rooms
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/datarooms` | Lista data rooms |
| POST | `/api/datarooms` | Crea data room |
| GET | `/api/datarooms/[id]` | Dettaglio data room |
| PATCH | `/api/datarooms/[id]` | Modifica data room |
| DELETE | `/api/datarooms/[id]` | Elimina data room |

### Analytics
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/analytics/document/[id]` | Analytics documento |
| GET | `/api/audit-logs` | Lista audit logs |

### Health
| Method | Endpoint | Descrizione |
|--------|----------|-------------|
| GET | `/api/health` | Health check |

---

## 🐳 Docker & Deployment

### Servizi Inclusi
- **PostgreSQL 16**: Database principale
- **Redis 7**: Cache e sessioni
- **MinIO/S3**: Object storage
- **Nginx**: Reverse proxy con SSL
- **Certbot**: Certificati SSL automatici

### Configurazione Produzione
- SSL/TLS con Let's Encrypt
- Health checks automatici
- Resource limits configurati
- Automatic restart on failure

---

## 📱 Responsive Design

- ✅ Desktop (1920px+)
- ✅ Laptop (1024px - 1919px)
- ✅ Tablet (768px - 1023px)
- ✅ Mobile (< 768px)

---

## 🌍 Internazionalizzazione

### Lingue Supportate
- 🇮🇹 Italiano
- 🇬🇧 English

---

## 🔧 Requisiti Tecnici

### Server
- Node.js 22+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose

### Browser Supportati
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

## 📞 Supporto

Per assistenza tecnica o segnalazione bug, contattare:
- Email: admin@simplevdr.com
- Website: https://www.simplevdr.com

---

**© 2025 SimpleVDR. All rights reserved.**
