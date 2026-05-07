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
│ Frontend (Vercel) │
│ Vanilla HTML · CSS · JavaScript (ES2022) │
│ Dark theme · Responsive 400px–1920px │
│ vercel.json → cleanUrls /blog/:slug rewrites│
└──────────────────┬──────────────────────────┘
│ POST /api/v1/contact
▼
┌─────────────────────────────────────────────┐
│ Backend (Render Free Tier) │
│ Spring Boot 3 · Java 17 · Port 8080 │
│ Kept warm by cron-job.org (5‑min ping) │
└──────────┬────────────┬─────────────────────┘
│ │
▼ ▼
┌───────────────┐ ┌──────────────────────────┐
│ PostgreSQL │ │ Resend HTTP API │
│ Neon (cloud) │ │ Email on every form │
│ contact_msgs │ │ submission │
└───────────────┘ └──────────────────────────┘
text


---

## 📁 Repository Structure

portfolio-website/
├── frontend/ # Static site — deployed on Vercel
│ ├── index.html # Main portfolio page
│ ├── blog.html # Engineering log listing
│ ├── post.html # Single post reader
│ ├── css/
│ │ ├── style.css # Design tokens + components
│ │ ├── mediaqueries.css # Responsive (400–1920px)
│ │ └── blog.css # Blog/post specific styles
│ ├── js/
│ │ ├── script.js # Nav, scroll‑reveal, skills animation
│ │ ├── contact.js # Form validation + API call
│ │ ├── blogManager.js # Home page blog preview
│ │ ├── home-blog.js # Blog preview entry point
│ │ ├── blog.js # Blog listing + search/filter
│ │ └── post.js # Single post renderer
│ ├── src/
│ │ ├── config/
│ │ │ └── config.js # API endpoints & environment
│ │ └── utils/
│ │ ├── api.js # Fetch with timeout & retry
│ │ └── helpers.js # HTML sanitisation, date formatting
│ ├── data/
│ │ └── posts.json # Blog content
│ ├── assets/ # Images, icons, fonts
│ └── vercel.json # Vercel routes + security headers
│
├── backend/ # Spring Boot API — deployed on Render
│ ├── src/main/java/com/vijaykumar/portfolio/
│ │ ├── config/
│ │ │ ├── AppConfig.java
│ │ │ └── CorsConfig.java
│ │ ├── controller/
│ │ │ └── ContactController.java
│ │ ├── dto/
│ │ │ ├── ApiResponse.java
│ │ │ └── ContactRequest.java
│ │ ├── entity/
│ │ │ └── ContactMessage.java
│ │ ├── repository/
│ │ │ └── ContactRepository.java
│ │ └── service/
│ │ └── ContactService.java
│ ├── src/main/resources/
│ │ ├── application.properties
│ │ └── application-prod.properties
│ ├── Dockerfile
│ └── pom.xml
│
├── package.json # Root scripts
└── README.md
text


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

| Method | Path                | Description                 |
|--------|---------------------|-----------------------------|
| `POST` | `/api/v1/contact`   | Submit contact form         |
| `GET`  | `/api/v1/health`    | Health check (keep‑alive)   |

### Environment Variables (Render)

| Key                | Description                             |
|--------------------|-----------------------------------------|
| `DB_URL`           | PostgreSQL JDBC URL (Neon)              |
| `DB_USERNAME`      | Database username                       |
| `DB_PASSWORD`      | Database password                       |
| `RESEND_API_KEY`   | Resend API key for email notification   |
| `app.notify-email` | Email address to receive submissions    |
| `app.mail-from`    | `onboarding@resend.dev` (Resend default)|
| `PORT`             | Auto‑set by Render                      |

**Cold start prevention:** [cron-job.org](https://cron-job.org) pings `/api/v1/health` every 5 minutes — Render never idles the service.

---

## 🛠️ Local Development

### Frontend

```bash
cd frontend
# No build step — just serve static files
python3 -m http.server 5500
# Open http://localhost:5500

Backend
bash

cd backend
# Copy and fill in the example config
cp src/main/resources/application.properties.example \
   src/main/resources/application.properties
# Edit application.properties with your DB URL, credentials, and Resend key
mvn spring-boot:run

    Note: The contact form in local development will point to the backend running on localhost:8080.

🚢 Deployment
Frontend → Vercel

    Push to main branch.

    Vercel automatically deploys using the vercel.json in frontend/.

    Ensure Root Directory is set to frontend in Vercel project settings.

Backend → Render

    git push the backend/ directory.

    Render auto‑deploys from the backend/ folder.

    Set the environment variables listed above in the Render dashboard.

🔒 Security & Performance

    All static assets served with Cache-Control: public, max-age=31536000, immutable

    Content‑Security‑Policy headers (via vercel.json)

    X-Content-Type-Options: nosniff, X-Frame-Options: DENY, Referrer-Policy: strict-origin-when-cross-origin

    All external links use rel="noopener noreferrer"

    Lazy loading on all non‑hero images (loading="lazy")

    Fonts loaded with font-display: swap for zero layout shift

📈 Lighthouse Scores (Target)
Category	Score
Performance	95+
Accessibility	100
Best Practices	100
SEO	100
🧑‍💻 About the Author

Vijay Kumar — Java Backend Engineer

    Portfolio: vijaykumarcode.space

    GitHub: VijayKumarCode

    LinkedIn: vijaykumarcode

    X (Twitter): @VijayKumarCode

    Email: vkumar.kumar31@gmail.com

Open to remote backend roles — let’s build something scalable.
text


