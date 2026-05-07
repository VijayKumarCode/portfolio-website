# Vijay Kumar — Portfolio Website

[![Live](https://img.shields.io/badge/Live-vijaykumarcode.space-2f81f7?style=flat-square&logo=vercel)](https://vijaykumarcode.space)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render)](https://portfolio-backend-v17c.onrender.com/api/v1/health)
[![Java](https://img.shields.io/badge/Java_17-ED8B00?style=flat-square&logo=openjdk)](https://openjdk.org/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot_3-6DB33F?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Docker](https://img.shields.io/badge/Docker-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![Resend](https://img.shields.io/badge/Resend-HTTP_API-6E5CE7?style=flat-square)](https://resend.com)

**Personal portfolio with a live Spring Boot backend, real‑time multiplayer project showcase, and engineering blog.**

---

## 🚀 Live Demo

**[vijaykumarcode.space](https://vijaykumarcode.space)** — fully responsive, dark‑themed, production‑deployed.

---

## 🧱 Architecture

┌─────────────────────────────────────────────┐
│  Frontend (Vercel)                          │
│  Vanilla HTML · CSS · JavaScript (ES2022)   │
│  Dark theme · Responsive 400px–1920px       │
│  vercel.json → cleanUrls /blog/:slug        │
└──────────────────┬──────────────────────────┘
│ POST /api/v1/contact
▼
┌─────────────────────────────────────────────┐
│  Backend (Render Free Tier)                 │
│  Spring Boot 3 · Java 17 · Port 8080        │
│  Kept warm by cron-job.org (5‑min ping)     │
└──────────┬────────────┬─────────────────────┘
│            │
▼            ▼
┌───────────────┐  ┌──────────────────────────┐
│  PostgreSQL   │  │  Resend HTTP API         │
│  Neon (cloud) │  │  Email on every form     │
│  contact_msgs │  │  submission              │
└───────────────┘  └──────────────────────────┘


---

## 📁 Repository Structure

portfolio-website/
├── frontend/                    # Static site — deployed on Vercel
│   ├── index.html               # Main portfolio page
│   ├── blog.html                # Engineering log listing
│   ├── post.html                # Single post reader
│   ├── css/
│   │   ├── style.css            # Design tokens + components
│   │   ├── mediaqueries.css     # Responsive (400–1920px)
│   │   └── blog.css             # Blog/post specific styles
│   ├── js/
│   │   ├── script.js            # Nav, scroll‑reveal, skills animation
│   │   ├── contact.js           # Form validation + API call
│   │   ├── blogManager.js       # Home page blog preview
│   │   ├── home-blog.js         # Blog preview entry point
│   │   ├── blog.js              # Blog listing + search/filter
│   │   └── post.js              # Single post renderer
│   ├── src/
│   │   ├── config/
│   │   │   └── config.js        # API endpoints & environment
│   │   └── utils/
│   │       ├── api.js           # Fetch with timeout & retry
│   │       └── helpers.js       # HTML sanitisation, date formatting
│   ├── data/
│   │   └── posts.json           # Blog content
│   ├── assets/                  # Images, icons, fonts
│   └── vercel.json              # Vercel routes + security headers
│
├── backend/                     # Spring Boot API — deployed on Render
│   ├── src/main/java/com/vijaykumar/portfolio/
│   │   ├── config/
│   │   │   ├── AppConfig.java
│   │   │   └── CorsConfig.java
│   │   ├── controller/
│   │   │   └── ContactController.java
│   │   ├── dto/
│   │   │   ├── ApiResponse.java
│   │   │   └── ContactRequest.java
│   │   ├── entity/
│   │   │   └── ContactMessage.java
│   │   ├── repository/
│   │   │   └── ContactRepository.java
│   │   └── service/
│   │       └── ContactService.java
│   ├── src/main/resources/
│   │   ├── application.properties
│   │   └── application-prod.properties
│   ├── Dockerfile
│   └── pom.xml
│
├── .gitignore                   # Root ignore rules
├── package.json                 # Root scripts
└── README.md


---

## 🎨 Frontend

**Stack:** Vanilla HTML5 · CSS3 (Custom Properties) · JavaScript ES2022 modules  
**Typography:** [DM Sans](https://fonts.google.com/specimen/DM+Sans) (reading) + [IBM Plex Mono](https://fonts.google.com/specimen/IBM+Plex+Mono) (code)  
**Color Palette:** Dark `#0c0f14` with violet‑teal accent

### Key Features

- Fully responsive from **400px** (Android) to **1920px** (ultrawide)
- Scroll‑reveal animations via `IntersectionObserver`
- Accessible mobile navigation with focus trap, backdrop, and Escape‑key support
- Skill bars animated on section entry (accessible `<meter>` elements)
- Blog with live search, category filter, and load‑more pagination
- Contact form with client‑side validation, loading state, and API submission to Spring Boot
- Clean URLs: `/blog` and `/blog/:slug` via Vercel rewrites
- No frameworks, no build step — instant development

---

## ⚙️ Backend

**Stack:** Java 17 · Spring Boot 3.5 · Spring Data JPA · PostgreSQL · Resend HTTP API

### API Endpoints

| Method | Path              | Description           |
|--------|-------------------|-----------------------|
| `POST` | `/api/v1/contact` | Submit contact form   |
| `GET`  | `/api/v1/health`  | Health check (keep‑alive) |

### Environment Variables (Render)

| Key                | Description                          |
|--------------------|--------------------------------------|
| `DB_URL`           | PostgreSQL JDBC URL (Neon)           |
| `DB_USERNAME`      | Database username                    |
| `DB_PASSWORD`      | Database password                    |
| `RESEND_API_KEY`   | Resend API key for email notification|
| `app.notify-email` | Email address to receive submissions |
| `app.mail-from`    | `onboarding@resend.dev` (default)    |
| `PORT`             | Auto‑set by Render                   |

> **Cold start prevention:** [cron-job.org](https://cron-job.org) pings `/api/v1/health` every 5 minutes — Render never idles the service.

---

## 🛠️ Local Development

### Prerequisites

- Node.js 18+ (for frontend tooling)
- Java 17+ and Maven 3.8+ (for backend)
- PostgreSQL 14+ (local or cloud instance)

### Frontend

```bash
cd frontend

# Option 1: Python HTTP server
python3 -m http.server 5500

# Option 2: Node.js live-server (if installed)
npx live-server --port=5500

# Open http://localhost:5500

Backend

cd backend

# Copy and fill in the example config
cp src/main/resources/application.properties.example \
   src/main/resources/application.properties

# Edit application.properties with your:
#   - DB_URL, DB_USERNAME, DB_PASSWORD
#   - RESEND_API_KEY
#   - app.notify-email and app.mail-from

# Run the application
mvn spring-boot:run

Note: In local development, the contact form points to http://localhost:8080. Ensure the backend is running before testing form submissions.

🚢 Deployment
Frontend → Vercel

    Push to main branch
    Vercel auto‑deploys using frontend/vercel.json
    Required: Set Root Directory to frontend in Vercel project settings

Backend → Render

    Push the backend/ directory
    Render auto‑deploys from the backend/ folder
    Set all environment variables listed above in the Render dashboard

🔒 Security & Performance

| Category     | Implementation                                                        |
| ------------ | --------------------------------------------------------------------- |
| **Caching**  | `Cache-Control: public, max-age=31536000, immutable` on static assets |
| **CSP**      | Content‑Security‑Policy headers via `vercel.json`                     |
| **Headers**  | `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`            |
| **Referrer** | `Referrer-Policy: strict-origin-when-cross-origin`                    |
| **Links**    | All external links use `rel="noopener noreferrer"`                    |
| **Images**   | Lazy loading on all non‑hero images (`loading="lazy"`)                |
| **Fonts**    | `font-display: swap` for zero layout shift                            |


🧑‍💻 About the Author
Vijay Kumar — Java Backend Engineer

| Platform  | Link                                                     |
| --------- | -------------------------------------------------------- |
| Portfolio | [vijaykumarcode.space](https://vijaykumarcode.space)     |
| GitHub    | [@VijayKumarCode](https://github.com/VijayKumarCode)     |
| LinkedIn  | [vijaykumarcode](https://linkedin.com/in/vijaykumarcode) |
| X         | [@VijayKumarCode](https://x.com/VijayKumarCode)          |
| Email     | <vkumar.kumar31@gmail.com>                               |

Open to remote backend roles — let's build something scalable.

License
This project is open source under the MIT License


---

## Key Fixes Summary

| Issue | Fix Applied |
|-------|-------------|
| `text` markers in code blocks | Removed; used proper ` ``` ` fences |
| Malformed `bash` annotations | Cleaned syntax highlighting tags |
| Architecture diagram | Replaced with proper ASCII block using code fence |
| Missing horizontal rules | Added `---` between all major sections |
| Table alignment | Fixed column widths and padding |
| Local dev note | Converted to proper `> **Note:**` callout |
| Missing `.gitignore` | Added to repository structure |
| Missing License section | Added MIT License footer |
| Inconsistent author links | Converted to clean table format |
| Security section readability | Converted bullet list to table |
| Prerequisites | Added missing section for local setup clarity |

Would you like me to save this as a file, or apply any additional changes (like adding a Contributing section, Changelog, or Docker Compose setup)?

