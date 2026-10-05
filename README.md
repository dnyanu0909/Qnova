# QNova — Pro ISO-Grade Vector QR Studio & Dynamic Link Platform

[![Vercel Deployment](https://img.shields.io/badge/Deployment-Vercel%20Live-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://qnova-black.vercel.app/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![ISO Standard](https://img.shields.io/badge/ISO%2FIEC-15415%20Compliant-FF6B6B?style=for-the-badge)](https://www.iso.org/standard/43896.html)
[![License](https://img.shields.io/badge/License-MIT-green.style=for-the-badge)](LICENSE)

> **Live Production App**: [qnova-black.vercel.app](https://qnova-black.vercel.app/)  
> **GitHub Repository**: [github.com/dnyanu0909/Qnova](https://github.com/dnyanu0909/Qnova)

---

## Executive Overview & The "Anti-Hostage" Manifesto

Commercial QR generator services frequently hold user links hostage. Most web-based QR generators wrap static target URLs inside proprietary redirect domains, trackable only behind paywalls. When a free trial expires or subscription plan lapses, the QR code breaks on printed packaging, business cards, or marketing banners, returning a 404 error or a forced upgrade message.

**QNova** was built to eliminate this anti-pattern. 

QNova is an open-source, enterprise-grade **Vector QR Studio and Dynamic Link Platform**. It provides a clear architectural split between **Zero-Trust Client-Side Static Generation** and **Cloud-Managed Dynamic Redirection**:

1. **Zero-Trust Static Matrix Engine**: 100% offline, browser-local rendering for static payload QR codes (Text, WiFi, vCard, URLs). Generated QRs contain raw data payload without intermediary tracking servers, guaranteeing lifetime longevity—your printed codes will work forever without external dependencies.
2. **ISO 15415 Preflight Engine**: Real-time mathematical verification of optical contrast, quiet zone padding, and module density to guarantee scannability on commercial printing presses before physical production.
3. **Dynamic Managed Telemetry Engine**: Powered by Supabase database triggers and Vercel edge routing, allowing zero-downtime destination link swaps and privacy-focused scan analytics for active marketing campaigns.

---

## System Architecture & Data Flow

QNova explicitly isolates client-side vector synthesis from cloud telemetry. The diagram below illustrates the dual-path execution flow:

```mermaid
graph TD
    User([User Device / Designer]) -->|Selects Workflow| Choice{Code Type}
    
    subgraph Zero-Trust Static Engine (Client-Only)
        Choice -->|Static / Offline| LocalGen[Browser WebWorker Matrix Engine]
        LocalGen --> Preflight[ISO/IEC 15415 & Quiet Zone Verifier]
        Preflight --> RawExport[Vector SVG / EPS / 300+ DPI PDF]
    end

    subgraph Dynamic Telemetry Engine (Cloud)
        Choice -->|Dynamic Managed| SupaAuth[Supabase DB / Short Hash Registry]
        SupaAuth --> EdgeRoute[Vercel Edge /r/:slug]
        Scanner([Physical Scanner]) --> EdgeRoute
        EdgeRoute -->|Async Geo/Device Log| Telemetry[(Scan Telemetry Database)]
        EdgeRoute -->|HTTP 302 Found| Destination[Target Destination / Micro-Page]
    end
```

---

## Core Powers & Engine Capabilities

### 1. ISO/IEC 15415 Quality & Scannability Verification
QNova incorporates an automated pre-flight quality verification algorithm that evaluates matrix geometry and color values prior to export:

* **Symbol Contrast ($SC$) Calculation**:
  In accordance with ISO/IEC 15415 section 7.8.2, Symbol Contrast measures the difference between the highest reflectance ($R_{max}$) and lowest reflectance ($R_{min}$) across light and dark modules:
  $$SC = R_{max} - R_{min}$$
  QNova enforces a minimum $SC \ge 40\%$ ($0.40$, Grade C threshold) for baseline optical scanners and recommends $SC \ge 70\%$ ($0.70$, Grade A threshold) for commercial print runs.
* **WCAG 2.1 Relative Luminance Compliance**:
  Evaluates human readability contrast ratios on digital screens:
  $$\text{Contrast Ratio} = \frac{L_1 + 0.05}{L_2 + 0.05} \ge 4.5:1$$
* **Quiet Zone Enforcement**:
  Automatically enforces the mandatory $4 \times X\text{-dimension}$ margin around the symbol matrix to prevent optical reader framing failure.
* **Logo Occlusion & Error Correction Safety**:
  Calculates embedded logo area ratio against Error Correction Level capacity ($L \approx 7\%$, $M \approx 15\%$, $Q \approx 25\%$, $H \approx 30\%$) to prevent matrix corruption.

### 2. Commercial Print Export Engine
* **Raw Vector SVG & EPS**: Pure vector paths without embedded bitmaps, allowing infinite resolution scaling in Adobe Illustrator, Figma, or CorelDRAW.
* **300+ DPI Preflight PDF Exporter**: Built using `jspdf`, generating print-ready PDFs with configurable bleed zones, trim crop marks, and customizable substrate presets (Business Card 3.5"x2", Flyer A4, Sticker 2"x2", Table Tent).

### 3. Dynamic Link Engine & Time-Series Telemetry
* **Zero-Downtime Target Swapping**: Update destination URLs on deployed physical QR codes without reprinting collateral.
* **Privacy-Aware Telemetry**: Log scan events, operating system distributions, user-agent device profiles, referrers, and time-series analytics without third-party tracking cookies.

### 4. Micro-Landing Page Studio
* **Integrated Bio-Card Builder**: Build mobile-optimized micro landing pages (link-in-bio, contact cards, business portfolios) directly linked to dynamic QRs.
* **Custom Theme Customization**: Custom color palettes, social icons, CTA buttons, and direct vCard download triggers.

### 5. Bulk Matrix Batch Engine
* **CSV Bulk Processing**: Import CSV payloads to generate hundreds of QR codes concurrently.
* **ZIP Archive Package**: Instant client-side zip bundle generation via `JSZip`.

---

## Competitive Feature Matrix

| Feature / Capability | **QNova** (Vercel + Supabase) | **Bitly** | **QR Code Generator** | **Uniqode (Beaconstac)** |
| :--- | :---: | :---: | :---: | :---: |
| **Zero-Trust Static QR (No Lock-in)** | 🟢 **100% Free & Permanent** | 🔴 Lock to Bitly Domain | 🔴 Requires Paid Plan | 🔴 Limited Free Tier |
| **ISO/IEC 15415 Preflight Scoring** | 🟢 **Real-Time Automated** | 🔴 None | 🔴 None | 🟡 Basic Warning |
| **Vector Export (SVG / EPS)** | 🟢 **Included Free** | 🔴 Paid Tier Only | 🔴 Enterprise Plan | 🔴 Paid Tier Only |
| **300+ DPI PDF Print Engine with Crop Marks** | 🟢 **Native Engine** | 🔴 Bitmaps Only | 🔴 Basic PDF | 🟡 Standard PDF |
| **Dynamic Link Destination Editing** | 🟢 **Self-Host / Supabase** | 🟢 Paid Tier | 🟢 Paid Tier | 🟢 Paid Tier |
| **Built-In Micro-Landing Page Builder** | 🟢 **Integrated Studio** | 🟡 Basic Link-in-bio | 🟡 Basic Page | 🟢 Advanced Cards |
| **Client-Side Bulk CSV Generation** | 🟢 **Free JSZip Export** | 🔴 Enterprise Only | 🔴 Enterprise Only | 🔴 Paid Add-on |
| **Price / Licensing Model** | 🟢 **Open Source (MIT)** | 🔴 \$35–\$300+/month | 🔴 \$10–\$50+/month | 🔴 \$25–\$99+/month |

---

## Industry Limitations & Trade-Offs

In accordance with open engineering standards, the following architectural boundaries and trade-offs are documented:

1. **Client-Side Browser Thread Bounds during Bulk Generation**:
   Batch QR rendering executes inside the primary browser DOM / WebWorker thread. Generating batches exceeding $\ge 5,000$ codes in a single context will experience CPU thread saturation and memory pressures depending on client device RAM. For massive multi-thousand batch jobs, node server-side CLI scripts are recommended.
2. **Color Space Representation (sRGB vs. ICC CMYK Profiles)**:
   Web browsers natively process colors in the `sRGB` color space. While QNova generates high-resolution vector PDFs, commercial offset printing presses using `CMYK` separation may show subtle color shifts when converting custom RGB hex codes. Commercial printers should perform standard CMYK color mapping in preflight software.
3. **Geo-Location Precision Bounds**:
   Dynamic link scan location metrics rely on server HTTP header IP geolocation rather than browser GPS prompt authorization. Location data provides city/country level accuracy rather than exact physical street coordinates.
4. **Single-Tenant vs. Enterprise Multi-Tenant RBAC**:
   The current Supabase backend schema is structured around individual user accounts and public API keys. Enterprise multi-tenant team workspaces with fine-grained Role-Based Access Control (RBAC) require custom organization table extensions.

---

## Tech Stack & Architecture

```
├── Frontend Framework : React 18.3 + TypeScript 5.8
├── Build Tooling     : Vite 5.4 + Tailwind CSS 3.4
├── UI Components     : Radix UI Primitives + Shadcn UI + Lucide Icons
├── Backend & Database : Supabase (PostgreSQL, Row Level Security, Auth)
├── Vector Engine     : qrcode, jspdf (300+ DPI PDF Exporter), jszip (Bulk Export)
├── Analytics Charts  : Recharts
├── Scanner Engine    : jsqr (Webcam & File Matrix Decoder)
└── Hosting Platform  : Vercel (Edge Network & Serverless Hosting)
```

---

## Local Development & Setup Guide

### Prerequisites
* **Node.js**: `v18.0.0` or higher
* **npm** / **yarn** / **pnpm**
* **Supabase Instance**: (Optional for dynamic links & auth, not required for static local generation)

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dnyanu0909/Qnova.git
   cd Qnova
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (refer to `.env.example` below):
   ```bash
   cp .env.example .env
   ```

   **`.env.example` Specification**:
   ```env
   # Supabase Configuration
   VITE_SUPABASE_URL=https://your-supabase-project-id.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=your-supabase-publishable-key
   ```

4. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:8080`.

5. **Run Tests & Verification**:
   ```bash
   # Run Vitest test suite
   npm run test

   # Run ESLint validation
   npm run lint

   # Build production bundle
   npm run build
   ```

---

## Deployment to Vercel

QNova is optimized for zero-config deployment on Vercel:

1. Push your repository to GitHub / GitLab.
2. Import project into your [Vercel Dashboard](https://vercel.com/new).
3. Set Framework Preset to **Vite**.
4. Add environment variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Click **Deploy**.

---

## License & Author

Distributed under the **MIT License**. See `LICENSE` for details.

* **Author**: [Dnyaneshwar (dnyanu0909)](https://github.com/dnyanu0909)
* **Live Application**: [qnova-black.vercel.app](https://qnova-black.vercel.app/)
