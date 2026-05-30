# Portfolio Asset Integration & Social Headers Guide

Add these tags inside the `<head>` block of your frontend HTML tracking views (`index.html`, `blog.html`, `resume.html`) to ensure seamless browser tab processing and production-ready social parsing interfaces.

## 1. Device Bookmarks & Manifest Hook layers
```html
<link rel="icon" type="image/svg+xml" href="assets/icons/favicon.svg">

<link rel="alternate icon" type="image/x-icon" href="assets/icons/favicon.ico">

<link rel="apple-touch-icon" sizes="180x180" href="assets/icons/apple-touch-icon.png">

<link rel="manifest" href="manifest.json">
<meta name="theme-color" content="#0a0d13">

<meta property="og:type" content="website">
<meta property="og:url" content="[https://www.vijaykumarcode.space/](https://www.vijaykumarcode.space/)">
<meta property="og:title" content="Vijay Kumar | Backend Java Developer Portfolio">
<meta property="og:description" content="Explore robust Spring Boot architectures, real-time WebSocket applications, and optimized database systems built by Vijay Kumar.">
<meta property="og:image" content="[https://www.vijaykumarcode.space/assets/icons/og-image.jpg](https://www.vijaykumarcode.space/assets/icons/og-image.jpg)">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">

<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:domain" content="vijaykumarcode.space">
<meta name="twitter:url" content="[https://www.vijaykumarcode.space/](https://www.vijaykumarcode.space/)">
<meta name="twitter:title" content="Vijay Kumar | Backend Java Developer Portfolio">
<meta name="twitter:description" content="Explore robust Spring Boot architectures, real-time WebSocket applications, and optimized database systems built by Vijay Kumar.">
<meta name="twitter:image" content="[https://www.vijaykumarcode.space/assets/icons/og-image.jpg](https://www.vijaykumarcode.space/assets/icons/og-image.jpg)">

---

### Step 3: Run Verification Check
Run this command to check that all your assets are accounted for and sized accurately:
```bash
ls -lh