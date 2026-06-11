# Vijay Kumar — Portfolio Website

[![Live](https://img.shields.io/badge/Live-vijaykumarcode.space-2f81f7?style=flat-square&logo=vercel)](https://vijaykumarcode.space)
[![X](https://img.shields.io/badge/X.com-%40VijayKumarCode-000000?style=flat-square&logo=x)](https://x.com/VijayKumarCode)
[![Security](https://img.shields.io/badge/Security-Cloudflare_Turnstile-F38020?style=flat-square&logo=cloudflare)](https://www.cloudflare.com/products/turnstile/)
[![Hosting](https://img.shields.io/badge/Hosting-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com)
[![Form Processing](https://img.shields.io/badge/Forms-Formspree-E5122F?style=flat-square&logo=formspree)](https://formspree.io/)
[![Platform](https://img.shields.io/badge/PWA-Ready-00A3E0?style=flat-square&logo=progressivewebapp)](https://web.dev/progressive-web-apps/)

**High-performance, accessibility-focused developer portfolio featuring a modern frontend architecture, privacy-first cryptographic bot protection, and an engineering log.**

---

## 🚀 Project Overview

This repository houses the complete source code for **vijaykumarcode.space**. The objective of this project is to provide a lightning-fast, production-grade interface that acts as a central hub for professional technical branding, deep-dive software engineering blog distributions, and algorithmic project showcases.

### Core Engineering Focus:
* **Zero Overhead:** Built purely with vanilla web standards to optimize execution speed and eliminate framework maintenance cycles.
* **Enterprise Security:** Integrated non-interactive validation barriers to completely neutralize malicious contact forms without imposing user friction.
* **Recruiter UX:** Clean, data-dense layouts optimized for instant scanning by technical talent acquirers and engineering managers.

---

## 🧱 Production Architecture
```
┌─────────────────────────────────────────────┐
│  Client Browser                             │
│  Validates PWA Service Worker Cache Layer   │
└──────────────────┬──────────────────────────┘
│
│  1. Requests Static Assets (HTTPS)
▼
┌──────────────────────────────────────────────┐
│  Vercel Edge Network CDN                     │
│  Serves Vanilla HTML · CSS · JS (ES2022)     │
└──────────────────┬───────────────────────────┘
│
│  2. Triggers Cryptographic Check (On Form Interaction)
▼
┌──────────────────────────────────────────────┐
│  Cloudflare Turnstile Security Matrix        │
│  Evaluates Browser Fingerprint & Origin      │
└──────────────────┬───────────────────────────┘
│
│  3. Forwards Validated Payload + Security Token
▼
┌──────────────────────────────────────────────┐
│  Formspree Serverless Ingest Engine          │
│  Parses Input Parameters & Dispatches Hook   │
└──────────────────┬───────────────────────────┘
│
│  4. Instant Secure Relaying
▼
┌──────────────────────────────────────────────┐
│  Target Developer Inbox                      │
│  Receives Form Submission Alert Notification │
└──────────────────────────────────────────────┘
```
### Component Breakdown
* **Vercel CDN:** Provides asset delivery with zero-configuration global caching and edge rewrites.
* **Cloudflare Turnstile:** Replaces legacy, high-friction CAPTCHAs with alternative challenge mechanisms using non-interactive client tokens.
* **Formspree:** Eliminates backend state management, executing automated schema parsing and email formatting workflows on form submission.

---

## 📁 Repository Structure
```
portfolio-website/
├── frontend/                    # Consolidated application root
│   ├── index.html               # Main portfolio application shell
│   ├── blog.html                # Engineering log directory interface
│   ├── post.html                # Dynamic article reader layout
│   ├── css/
│   │   ├── style.css            # Custom design tokens & core layouts
│   │   ├── mediaqueries.css     # Responsive viewport rules (400px–1920px)
│   │   └── blog.css             # Blog specific typographical treatments
│   ├── js/
│   │   ├── script.js            # Global navigation, scroll effects & view observers
│   │   ├── contact.js           # Turnstile token integration & Formspree engine pipeline
│   │   ├── blogManager.js       # Index preview layout rendering managers
│   │   ├── home-blog.js         # Homepage entry management scripts
│   │   ├── blog.js              # Live content searching, category filtering & state arrays
│   │   └── post.js              # Markdown-to-DOM parser for article templates
│   ├── src/
│   │   ├── config/
│   │   │   └── config.js        # Serverless target endpoints and site credentials
│   │   └── utils/
│   │       ├── api.js           # Async fetch interfaces with embedded timeout protections
│   │       └── helpers.js       # Context sanitation routines & date format engines
│   ├── data/
│   │   └── posts.json           # Content storage arrays for software engineering logs
│   ├── assets/                  # Media assets, compressed branding elements, and web manifest files
│   └── vercel.json              # Edge routing rules, clean routing parameters, and CSP headers
├── .gitignore                   # Workspace exclusion filters
├── package.json                 # Global automation task hooks
└── README.md                    # Primary repository engineering specifications
```
---

## ⚙️ Technology Stack

* **Frontend:** Vanilla HTML5, CSS3 Custom Properties, JavaScript ES2022 Module Architecture.
* **Security Layer:** Cloudflare Turnstile Explicit Script Engine Injection.
* **Ingest Workflow:** Formspree Cloud API Relay Core.
* **Deployment System:** Vercel Automated Edge Integration Pipeline.
* **Typography Core:** DM Sans (High-legibility reading index), IBM Plex Mono (Aesthetic code snippet formatting blocks).

---

## 🎨 Core System Features

### 1. Responsive Interface Fluidity
Layout engine fluidly scales from small screens (**400px** mobile viewports) up to widescreen developer layouts (**1920px** desktop systems) without structural clipping.

### 2. Searchable Engineering Log
Features an optimized JavaScript engine processing data searches and category indexing filters directly on local datasets, avoiding unnecessary page requests.

### 3. Progressive Web App (PWA) Execution
Equipped with offline service-worker caching routines and an explicit `manifest.json` asset configuration matrix, allowing standalone desktop and mobile home screen app pinning.

### 4. Zero Layout Shift Performance
Typography assets utilize explicit `font-display: swap` instructions synchronized with geometric CSS height bounds to ensure an optimized Cumulative Layout Shift (CLS) score during rendering.

---

## 🔒 Contact Form Integrity & Security

To prevent automated spam engines from flooding the notification delivery queues, the contact form relies on a decoupled, client-side validation chain:

1. **User Focus Tracking:** The form field triggers Turnstile script execution only upon active form component engagement, avoiding page-load resource drains.
2. **Cryptographic Validation:** Cloudflare evaluates the client handshake signature, returning an immutable transaction token to the DOM.
3. **Payload Dispatch:** JavaScript extracts the token, appending it to the sanitized form object payload before streaming it securely via standard JSON payloads to Formspree endpoints.

```javascript
// Contact validation architecture signature preview
const turnstileToken = turnstile.getResponse();
if (!turnstileToken) {
    showNotification("Security validation pending. Please verify you are human.", "error");
    return;
}
```
🛠️ Local Development Blueprint
Prerequisites

    Node.js 18+ (Recommended for serving optimization scripts)

    Cloudflare Turnstile Development Site Key pairs

Executing the Local Server Context
```

# Navigate to application assets
cd frontend

# Launch localized HTTP service container using Node.js tooling
npx live-server --port=5500

```
Once initialized, access http://localhost:5500 inside your preferred browser. To confirm contact form operations work seamlessly inside a development environment, modify your endpoint configurations within frontend/src/config/config.js to target your local test environments.
🚢 Production Deployment Pipeline
Automated Continuous Integration via Vercel

    Set up tracking branches to evaluate your primary repository's updates.

    Link the repository structure inside your Vercel Account Dashboard interface.

    Important Project Parameter Adjustment: Explicitly change the Root Directory field config selection to frontend inside your project deployment setup pane. This action ensures Vercel ignores global project configuration assets and treats the subfolder tree as a direct build source.

🗺️ Engineering Development Roadmap

    [ ] ATS Optimization Module: Integrate a custom parsing review system within the portfolio view to analyze keyword distribution patterns.

    [ ] Client-Side Resume Engine: Add an interface that reads JSON objects to build and output print-ready PDF resumes on the fly.

    [ ] Developer Utilities Sandbox: Deploy an offline-first visual interface featuring JSON sanitizers, epoch string calculators, and bitwise layout mapping tables.

## 🧑‍💻 About the Developer
```
Vijay Kumar — Aspiring Software Engineer specializing in scalable application logic, system design paradigms, and performant backend development.

* **Primary Engineering Focus:** Java, Spring Boot, Data Structures & Algorithms (DSA), High-Performance Computing, and Distributed Services.
* **Core Active Engine:** Currently designing and maintaining **Nexus**, an independent real-time multiplayer gaming platform implementing high-concurrency WebSocket channels, STOMP networks, and transactional database schemas.

| Interface Platform | Secure Resource Access Endpoint |
| :--- | :--- |
| **Branding Hub** | [vijaykumarcode.space](https://vijaykumarcode.space) |
| **Source Repositories** | [@VijayKumarCode](https://github.com/VijayKumarCode) |
| **Professional Network** | [linkedin.com/in/vijaykumarcode](https://linkedin.com/in/vijaykumarcode) |
| **Social Channel** | [@VijayKumarCode](https://x.com/VijayKumarCode) |
| **Developer Communications** | <vkumar.kumar31@gmail.com> |
```
License

This repository is open-source software licensed under the terms of the MIT License.

---

