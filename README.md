# Vijay Kumar — Portfolio Website

[![Live](https://img.shields.io/badge/Live-vijaykumarcode.space-2f81f7?style=flat-square&logo=vercel)](https://vijaykumarcode.space)
[![Backend](https://img.shields.io/badge/Backend-Render-46E3B7?style=flat-square&logo=render)](https://portfolio-backend-v17c.onrender.com/api/v1/health)
[![Java](https://img.shields.io/badge/Java_17-ED8B00?style=flat-square&logo=openjdk)](https://openjdk.org/projects/jdk/17/)
[![Spring Boot](https://img.shields.io/badge/Spring_Boot_3-6DB33F?style=flat-square&logo=springboot)](https://spring.io/projects/spring-boot)

Personal portfolio website with a Spring Boot backend for contact form persistence and email notification.

**Live:** [vijaykumarcode.space](https://vijaykumarcode.space)

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vercel)                │
│   Vanilla HTML · CSS (IBM Plex Mono / DM Sans)      │
│   Dark theme · Responsive (411px – 1920px)          │
│   vercel.json → cleanUrls · /blog/:slug rewrites    │
└────────────────────────┬────────────────────────────┘
                         │ POST /api/v1/contact
                         ▼
┌─────────────────────────────────────────────────────┐
│               Backend (Render Free Tier)            │
│   Spring Boot 3 · Java 17 · Port 8080               │
│   Kept warm by cron-job.org (5-min ping)            │
└──────────┬──────────────────────┬───────────────────┘
           │                      │
           ▼                      ▼
┌─────────────────┐    ┌─────────────────────────────┐
│  PostgreSQL      │    │  Resend HTTP API           │
│  Neon (cloud)    │    │  Email notification on     │
│  contact_messages│    │  every form submission     │
└─────────────────┘    └─────────────────────────────┘
```

---

## Repository Structure

```
portfolio-website/
├── frontend/                     # Static site — deployed on Vercel
│   ├── index.html                # Main portfolio page
│   ├── blog.html                 # Engineering log listing
│   ├── post.html                 # Single post reader
│   ├── css/
│   │   ├── style.css             # Design tokens, component styles
│   │   ├── mediaqueries.css      # Responsive breakpoints (400–1920px)
│   │   └── blog.css              # Blog/post page styles
│   ├── js/
│   │   ├── script.js             # Scroll-reveal, hamburger, skill bars
│   │   ├── contact.js            # Form validation + API call
│   │   ├── blogManager.js        # Home page blog preview
│   │   ├── home-blog.js          # BlogManager entry point
│   │   ├── blog.js               # Blog listing, search, filter
│   │   └── post.js               # Single post renderer
│   ├── src/
│   │   ├── config/
│   │   │   └── config.js         # API endpoints, environment config
│   │   └── utils/
│   │       ├── api.js            # Fetch abstraction layer
│   │       └── helpers.js        # stripHtml, escHtml, formatDate
│   ├── data/
│   │   └── posts.json            # Blog post content
│   ├── assets/                   # Images, icons
│   └── vercel.json               # Clean URLs + security headers
│
├── backend/                      # Spring Boot API — deployed on Render
│   ├── src/main/java/com/vijaykumar/portfolio/
│   │   ├── config/
│   │   │   ├── AppConfig.java    # RestTemplate @Bean
│   │   │   └── CorsConfig.java   # CORS — allows custom domain
│   │   ├── controller/
│   │   │   └── ContactController.java
│   │   ├── dto/
│   │   │   ├── ApiResponse.java  # Standard JSON response record
│   │   │   └── ContactRequest.java # Validated request record
│   │   ├── entity/
│   │   │   └── ContactMessage.java # JPA entity
│   │   ├── repository/
│   │   │   └── ContactRepository.java
│   │   └── service/
│   │       └── ContactService.java # Saves to DB + sends email via Resend
│   ├── src/main/resources/
│   │   ├── application.properties       # Local dev defaults
│   │   └── application-prod.properties  # Production (env var driven)
│   ├── Dockerfile
│   └── pom.xml
│
├── {}package.json
|
├── README.md
|
└── {} vercel.json
```

---

## Frontend

**Stack:** Vanilla HTML5 · CSS3 · JavaScript (ES2022 modules) · No frameworks

**Design:** IBM Plex Mono (code identity) + DM Sans (reading) · Dark theme `#0c0f14` · Accent `#2f81f7`

**Features:**
- Responsive from 400px (Android) to 1920px (ultrawide)
- Scroll-reveal via `IntersectionObserver`
- Skill bar animation on section enter
- Blog with live search + category filter + load-more pagination
- Contact form with client-side validation + loading state
- Clean URLs: `/blog` and `/blog/:slug` via Vercel rewrites

**Key fixes applied:**
- `html { overflow-x: hidden }` — prevented horizontal scroll on 411px Android devices
- `#profile::before` width uses `min(480px, 90vw)` — glow never exceeds viewport
- `#skills` has no `border-radius` — prevents section gap on mobile

---

## Backend

**Stack:** Java 17 · Spring Boot 3.5 · Spring Data JPA · PostgreSQL · Resend HTTP API

**API:**

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/v1/contact` | Submit contact form |
| `GET`  | `/api/v1/health`  | Health check (used by cron-job.org keep-alive) |

**Environment variables (Render):**

| Key | Description |
|-----|-------------|
| `DB_URL` | PostgreSQL JDBC URL (Neon) |
| `DB_USERNAME` | Database username |
| `DB_PASSWORD` | Database password |
| `RESEND_API_KEY` | Resend API key for email notification |
| `app.notify-email` | Your Gmail to receive contact submissions |
| `app.mail-from` | `onboarding@resend.dev` (Resend free tier shared domain) |
| `PORT` | Auto-set by Render |

**Cold start prevention:** [cron-job.org](https://cron-job.org) pings `/api/v1/health` every 5 minutes. Render never idles the service.

---

## Local Development

```bash
# Frontend (no build step needed)
cd frontend
python3 -m http.server 5500
# Open http://localhost:5500

# Backend
cd backend
cp src/main/resources/application.properties.example \
   src/main/resources/application.properties
# Fill in DB_URL, DB_USERNAME, DB_PASSWORD
mvn spring-boot:run
```

---

## Deployment

**Frontend → Vercel**
```bash
# Vercel auto-deploys on push to main
git push origin main
```

**Backend → Render**
```bash
mvn clean package -DskipTests
git add backend/
git commit -m "feat: ..."
git push origin main
# Render auto-deploys from the backend/ directory
```

---

## Contact

- **Email:** vkumar.kumar31@gmail.com
- **Portfolio:** [vijaykumarcode.space](https://vijaykumarcode.space)
- **LinkedIn:** [linkedin.com/in/vijaykumarcode](https://linkedin.com/in/vijaykumarcode)
