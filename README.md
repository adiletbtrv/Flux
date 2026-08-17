<div align="center">

# ⚡ Flux Exchange

**High-Performance Real-Time Currency Conversion & Market Analytics Engine**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.0.0-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.x-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Chart.js](https://img.shields.io/badge/Chart.js-4.4.1-FF6384?style=flat-square&logo=chartdotjs&logoColor=white)](https://www.chartjs.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

<br />

**[Live Demo](https://adiletbtrv.github.io/Flux/)** • **[System Architecture](#-system-architecture)** • **[Engineering Highlights](#-key-architectural--engineering-highlights)** • **[Tech Stack](#-tech-stack)** • **[Project Structure](#-project-structure)** • **[Getting Started](#-getting-started)**

</div>

---

## 📸 Preview

<div align="center">

| Desktop Light Mode | Mobile Responsive & Dark Mode |
| :---: | :---: |
| <img src="https://github.com/user-attachments/assets/4700511a-4d1b-4c75-9df9-ec90b9bf0388" width="100%" alt="Flux Light Mode" /> | <img src="https://github.com/user-attachments/assets/55b61535-4035-44bc-a379-59cbdc5c0492" width="100%" alt="Flux Dark Mode" /> |

<br />

<img src="https://github.com/user-attachments/assets/12d7ab1e-a85f-4c06-a0ec-fe032978c31a" width="95%" alt="Flux History and Analytics" />

</div>

---

## ⚡ Key Architectural & Engineering Highlights

* **Reactive Bidirectional Computation Engine (`App.tsx`):**  
  Calculates instantaneous currency exchange calculations via memoized selectors (`useMemo`). Supports inverse conversions (`from ⇄ to`), handles floating-point arithmetic edge cases, and applies an adaptive numerical precision formatter (`formatRate`) ranging from 2 fixed decimal places ($\ge 100$) up to 4 significant digits (sub-cent values $< 0.01$).

* **Asynchronous Time-Series Canvas Visualization (`components/RateChart.tsx`):**  
  Integrates `Chart.js` with the HTML5 Canvas 2D context to render 30-day historical exchange trajectories. Employs a strict **async cancellation pattern** (`cancelled` guard flag) to eliminate race conditions and memory leaks during rapid currency switching, paired with dynamic canvas linear gradient interpolation (`createLinearGradient`) and runtime theme synchronization.

* **Dual-Tier Resilient API Pipeline (`services/api.ts`):**  
  Decouples data acquisition across specialized transport layers: real-time spot rates via Open Exchange Rates (`open.er-api.com`) and 30-day historical time-series via European Central Bank data (`Frankfurter API`). Features automated ISO-3166-1 flag resolution via `FlagCDN` with regional fallback overrides for non-standard currency codes (e.g., `KZT`, `KGS`, `RUB`, `GEL`, `AMD`).

* **Debounced State Persistence & Cross-Browser Clipboard Fallback (`App.tsx`):**  
  Implements a 2,000ms debounced conversion recorder with deep deduplication to prevent storage thrashing, persisting calculation journals and user preferences to `localStorage`. Includes a resilient clipboard utility prioritizing the modern asynchronous `navigator.clipboard` API with an automatic DOM textarea injection fallback (`document.execCommand`) for legacy runtimes and insecure origins.

---

## 🏛 System Architecture

```
                                  ┌────────────────────────────────────────┐
                                  │            Presentation Layer          │
                                  │      (React 18 / Tailwind CSS SPA)     │
                                  └──────────────────┬─────────────────────┘
                                                     │
                                                     ▼
                                  ┌────────────────────────────────────────┐
                                  │         App Engine (App.tsx)           │
                                  │  • Bidirectional Exchange Calculation  │
                                  │  • Debounced History Journal (2000ms)  │
                                  │  • Dark / Light Theme Context Manager  │
                                  └────┬──────────────┬──────────────┬─────┘
                                       │              │              │
                    ┌──────────────────┘              │              └──────────────────┐
                    ▼                                 ▼                                 ▼
   ┌─────────────────────────────────┐ ┌─────────────────────────────┐ ┌─────────────────────────────────┐
   │       CurrencyRow.tsx           │ │      CurrencySelect.tsx     │ │         RateChart.tsx           │
   │  • Decimal Input Sanitization   │ │ • Outside-Click Detection   │ │ • Chart.js HTML5 Canvas Engine  │
   │  • Priority Index Sorting       │ │ • Keyboard Navigation (ESC) │ │ • Race-Condition Cancellation   │
   │  • Dynamic Flag Resolution      │ │ • Fuzzy Search Filter       │ │ • Adaptive Theme Interpolation  │
   └────────────────┬────────────────┘ └──────────────┬──────────────┘ └────────────────┬────────────────┘
                    │                                 │                                 │
                    └──────────────────┬──────────────┴─────────────────────────────────┘
                                       │
                                       ▼
                     ┌───────────────────────────────────┐
                     │       Service Layer (api.ts)      │
                     │  • Axios Client (Timeout: 15s)    │
                     │  • Typed Exchange Schema Mapping  │
                     └─────────────────┬─────────────────┘
                                       │
            ┌──────────────────────────┼──────────────────────────┐
            ▼                          ▼                          ▼
┌───────────────────────┐  ┌───────────────────────┐  ┌───────────────────────┐
│   Spot Rates API      │  │ Historical ECB API    │  │ Flag Asset Pipeline   │
│   (open.er-api.com)   │  │ (api.frankfurter.app) │  │ (flagcdn.com/w80)     │
└───────────────────────┘  └───────────────────────┘  └───────────────────────┘
```

---

## 🛠 Tech Stack

| Layer / Domain | Technologies / Version | Description / Purpose |
| :--- | :--- | :--- |
| **Core UI & Runtime** | `React 18.2.0`, `React DOM 18.2.0` | Declarative component hierarchy, Virtual DOM reconciliation, and hooks lifecycle |
| **Type System** | `TypeScript 5.x`, `@types/react 19.x` | Strict static typing, type narrowing, and compile-time contract enforcement |
| **Styling & Theming** | `Tailwind CSS 3.x` | Utility-first design system, glassmorphism, responsive grid, and dark mode toggling |
| **Financial Charting** | `Chart.js 4.4.1`, `react-chartjs-2 5.2.0` | Time-series Canvas 2D linear gradient rendering with custom tooltips |
| **Network & Transport** | `Axios 1.6.0` | Promise-based HTTP client configured with 15-second request timeouts |
| **State & Persistence** | `Web Storage API` (`localStorage`) | Client-side persistence for preferences, active pairs, and calculation logs |
| **Build & Bundler** | `Vite 5.0.0`, `@vitejs/plugin-react 4.2.0` | Native ESM dev server, fast Hot Module Replacement, and optimized production bundle |
| **Deployment & CI** | `gh-pages 6.3.0` | Automated static artifact deployment pipeline to GitHub Pages |

---

## 📁 Project Structure

```
Flux/
├── components/
│   ├── CurrencyRow.tsx       # Memoized numeric input row with dynamic ISO-3166-1 flag resolution
│   ├── CurrencySelect.tsx    # Searchable combobox dropdown with outside-click and escape key listeners
│   ├── FluxLogo.tsx          # Scalable vector logo component with dynamic SVG coordinate geometry
│   ├── HistoryList.tsx       # Interactive transaction history with one-tap conversion restoration
│   └── RateChart.tsx         # HTML5 Canvas time-series chart with async unmount cancellation guards
├── services/
│   └── api.ts                # Axios transport layer for open.er-api rates and Frankfurter historical data
├── App.tsx                   # Central state machine, reactive formulas, and debounced store dispatcher
├── index.html                # HTML5 entry point, Tailwind CDN configuration, fonts, and importmap
├── index.tsx                 # React 18 DOM root mount point (`createRoot`)
├── types.ts                  # Shared TypeScript interfaces (CurrencyMap, Rates, ExchangeRateResponse)
├── vite.config.ts            # Vite build configuration, base URL, dev server port, and asset output
├── tsconfig.json             # TypeScript compiler configuration and strict mode flags
└── package.json              # Project manifests, dependency specifications, and NPM execution scripts
```

---

## 🌐 API Integrations & Data Sources

| Provider | Endpoint Pattern | Description |
| :--- | :--- | :--- |
| **Open Exchange Rates** | `GET https://open.er-api.com/v6/latest/{BASE}` | Real-time spot currency exchange rates across 40+ global pairs |
| **Frankfurter API** | `GET https://api.frankfurter.app/{START}..{END}?from={A}&to={B}` | 30-day historical time-series published by the European Central Bank (ECB) |
| **FlagCDN** | `GET https://flagcdn.com/w80/{COUNTRY_CODE}.png` | High-DPI country flag raster assets with custom regional overrides |

---

## 🚀 Getting Started

### Prerequisites

Ensure the following runtimes are installed on your environment:
* **Node.js**: `v18.0.0` or higher
* **NPM**: `v9.0.0` or higher (or `pnpm` / `yarn`)

### Installation & Local Development

1. **Clone the repository:**
   ```bash
   git clone https://github.com/adiletbtrv/Flux.git
   cd Flux
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start the local development server:**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000/Flux/`.

4. **Build for production:**
   ```bash
   npm run build
   ```

5. **Preview the production build locally:**
   ```bash
   npm run preview
   ```

---

## 🔍 Static Analysis & Type Verification

Flux maintains strict static typing and clean build artifacts across the entire codebase:

```bash
# Execute static type checking across all components and services
npx tsc --noEmit

# Validate bundle integrity and tree-shaking
npm run build
```

---

## 📜 License & Author

Distributed under the **MIT License**. See `LICENSE` for more information.

**Author:** [Adilet Batyrov](https://github.com/adiletbtrv) • Connect on [LinkedIn](https://www.linkedin.com/in/adilet-batyrov/)
