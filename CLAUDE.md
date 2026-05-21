# PIF Health Dashboard V3 — NHM Arunachal Pradesh (CLAUDE.md)

This file gives any Claude session immediate context on the project so you can contribute without needing prior conversation history.

> **V3 is the ONLY active version.** V1 (`PIFHealthDashboard/`) and V2 (`PIFHealthDashboard-v2/`) are frozen — do not touch them.

---

## SELF-UPDATE PROTOCOL — TOP PRIORITY

**Every Claude session working on this project MUST update this file before ending.**

At the close of each session, Claude must:
1. Review what changed during the session (new components, data mappings, CSS classes, routes, design decisions, bug fixes, deferred items)
2. Reflect those changes in the relevant sections of this file — update existing entries or add new ones
3. Commit the updated CLAUDE.md:
   ```
   git add CLAUDE.md && git commit -m "docs: update CLAUDE.md with session changes" && git push origin main
   ```
4. Deploy: `vercel build --prod && vercel deploy --prod --prebuilt`

**Do not end a session without updating this file.** This is the highest-priority rule in the project — it ensures every future session has accurate context without needing conversation history.

What to update:
- New or changed components / pages
- New data fields or mappings added to kdData.js
- New CSS classes or design tokens
- Deferred work items
- Decisions made (e.g. "chose Plotly over custom SVG because...")
- Any hard rules that emerged from user feedback

---

## What this project is

A React + Vite **health dashboard** tracking NHM Arunachal Pradesh programme performance across 5 divisions and 37 programmes. Built for **Pahlé India Foundation (PIF)**.

- **Local**: `/Users/thesinghaa/PIFHealthDashboard-v3/`
- **GitHub**: `https://github.com/thesinghaa/app-healthdashboard-v3`
- **Live**: `https://pif-health-dashboard-v3.vercel.app`
- **Git identity**: `thesinghaa <aryanjarvis32@gmail.com>` (set via `git config --local`) — do NOT use `--author` flag
- **Deploy method**: `vercel build --prod` → `vercel deploy --prod --prebuilt` (fast, ~30s)

---

## Tech stack

| Layer | Tool |
|-------|------|
| Framework | React 18 + Vite |
| Animations | GSAP (page entry/exit, not SVG anymore) |
| Charts | Recharts (AreaChart for HMIS trends) + Plotly.js via `react-plotly.js` (sunburst charts) |
| Styling | Plain CSS (`src/styles/ncd.css`) — no Tailwind, no CSS modules |
| Data | Static JS files + Google Sheets public CSV (no API key) |
| Fonts | Inter 300–800 (body + headings), JetBrains Mono (numbers) — Playfair/DM Sans/Space Grotesk removed |
| Deploy | Vercel — push to `main` triggers auto-deploy |

---

## Navigation (5 layers)

```
LandingPage — cinema reel, select division or "All Programmes"
  ├── DivisionPage (division programme grid)
  │     └── KDProgrammePage / HRHCadrePage / DrugsDiagnosticsPage
  │           ├── KDIndicatorDetail (single KD deep-dive)
  │           └── CurrentStatusDetailPage (current status charts — full page)
  └── HomePage / summary (all 5 divisions at once) → same branch
```

State lives in `App.jsx`:
- `page`: `'home' | 'summary' | 'division' | 'kd-list' | 'kd-indicator' | 'current-status'`
- `program`, `division`, `indicator`, `origin` objects

`goToDetail(program, division)` → `kd-list`
`goToDivision(division)` → `division`
`goToIndicator(kd)` → `kd-indicator`
`goToCurrentStatus(program, division)` → `current-status`
`goBack()` → returns one level up; `current-status` always backs to `division`

**Back navigation note**: `current-status` always returns to `division` regardless of entry point (no origin tracking for this layer).

---

## Key files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Root router — state-based navigation |
| `src/pages/LandingPage.jsx` | Entry page — cinema reel carousel of 5 divisions |
| `src/styles/landing.css` | Landing page styles — glass nav, reel cards, dot nav |
| `src/pages/HomePage.jsx` | Summary page — all 5 division columns at once (was landing) |
| `src/pages/DivisionPage.jsx` | 2nd layer: division programme grid |
| `src/pages/KDProgrammePage.jsx` | 3rd layer: programme-level KD table |
| `src/pages/HRHCadrePage.jsx` | 3rd layer (HRH division only): staffing cadre view |
| `src/pages/DrugsDiagnosticsPage.jsx` | 3rd layer (HSS drugs): special layout |
| `src/pages/CurrentStatusDetailPage.jsx` | Full-page current status charts (4th layer) |
| `src/pages/CurrentStatusSection.jsx` | Chart components; also exports named `CSEntryBar` |
| `src/pages/KDIndicatorDetail.jsx` | 4th layer: single indicator deep-dive |
| `src/pages/NCDDetailPage.jsx` | Legacy NCD detail (keep, not removed) |
| `src/data/kdData.js` | KD tree — all ~157 Key Deliverables |
| `src/data/programs.js` | Division → programme metadata |
| `src/styles/ncd.css` | All CSS (append overrides at the bottom) |

---

## Data sources

### 1. KD data (`src/data/kdData.js`)
Static JS export `KD_TREE` structured as:
```js
KD_TREE[divisionId].programmes[programmeId].kds = [
  {
    no, type, indicator, statement, unit,
    target, targetLabel, achievement, achievedLabel,
    numerator, denominator, source,
    hmisCode,   // HMIS data item code e.g. '1.1' — null if no match
    hmisCat,    // HMIS category e.g. 'M1' — null if no match
    lowerIsBetter,
  }
]
```
Source: NHM AP FY 2025-26 NPCC document (April 2026).

### 2. HMIS live data (Google Sheets)
Sheet ID: `1vsCSdPZpBK5SQw9gppRLEEKDLhj19DHk`
URL pattern: `https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1`

Columns: `Year, Month, Category, Data Item Code, Data Item Name, [25 district columns]`

Categories present: M1 (ANC), M2 (Delivery), M3 (C-section), M4 (Child Health), M5 (Nutrition), M8 (Family Planning), M9 (Immunization). No M6/M7 in current export.

**CSV parser** — always use the char-by-char quoted-field parser (handles commas in values):
```js
function parseCSV(text) {
  return text.trim().split('\n').map(line => {
    const cols = []; let cur = '', inQ = false;
    for (const ch of line) {
      if (ch === '"') { inQ = !inQ; }
      else if (ch === ',' && !inQ) { cols.push(cur.trim()); cur = ''; }
      else { cur += ch; }
    }
    cols.push(cur.trim());
    return cols;
  });
}
```

### 3. NFHS data
Embedded in `programs.js` as `nfhsData` arrays on each programme object. NFHS-4 (2015-16) vs NFHS-5 (2019-21), Arunachal Pradesh.

### 4. NCD_compiled sheet
**Deferred** — do not connect yet. User will ask for it later.

---

## HMIS code mappings

27 KDs currently have `hmisCode` + `hmisCat` set. Key ones:

| KD | Indicator | Code | Cat |
|----|-----------|------|-----|
| 1 | ANC Coverage | 1.1 | M1 |
| 2 | 1st Trimester ANC | 1.1.1 | M1 |
| 3 | 4+ ANC Check-ups | 1.2.7 | M1 |
| 6 | Institutional Deliveries | 2.2 | M2 |
| 16 | HBNC Home Visits | 2.4 | M2 |
| 20 | Newborn Screening | 4.5.1 | M4 |
| 23 | Children Screened by RBSK | 4.5.2 | M4 |
| 28 | Full Immunization | 9.2.5.a | M9 |
| 29 | Hepatitis B Birth Dose | 9.1.10 | M9 |
| 33 | Td10 Coverage | 9.5.3 | M9 |
| 36 | Breastfeeding within 1hr | 4.4.3 | M4 |
| 39 | IFA Coverage (PW) | 1.2.4 | M1 |
| 40 | IFA Syrup Children 6-59m | 5.1.2 | M5 |
| 44 | PPIUCD Acceptance | 8.4 | M8 |
| 45 | Injectable MPA | 8.8 | M8 |

See `kdData.js` for all 27.

---

## Districts (25 in AP)

Changlang, Dibang Valley, East Kameng, Anjaw, East Siang, Kamle, Kra Daadi, Kurung Kumey, Leparada, Lohit, Longding, Lower Dibang Valley, Lower Siang, Lower Subansiri, Namsai, Pakke Kessang, Papum Pare, Shi Yomi, Siang, Tawang, Tirap, Upper Siang, Upper Subansiri, West Kameng, West Siang.

**Itanagar/Capital Complex** is missing from the Google Sheet — user is aware.

---

## KDIndicatorDetail page sections (4th layer)

1. **Topbar** — breadcrumb: Division › Programme › Indicator
2. **KD meta strip** — KD badge, type pill, indicator name, statement
3. **Achievement Overview** — Plotly sunburst (3 branches: FY 25-26 / NFHS-5 / NFHS-4, each split achieved vs remaining)
4. **FY 2025-26 Performance** — Target / Achievement / Status numbers card
5. **HMIS Monthly Trend** — Recharts AreaChart (only if `hmisCode` set)
6. **District Performance** — two-column: Plotly sunburst (left) + insight panel (right: state total, top 3, bottom 3, narrative)
7. **NFHS Baseline table** — NFHS-4 → NFHS-5 comparison with pill badges and change indicator

---

## Plotly sunburst colour palettes

Achievement gauge colours per status:
- `achieved`: branch `#047857`, leaf `#10B981`, empty `#6EE7B7`
- `close`: branch `#B45309`, leaf `#F59E0B`, empty `#FCD34D`
- `gap`: branch `#BE123C`, leaf `#F43F5E`, empty `#FCA5A5`

NFHS-5: `#1D4ED8` / `#3B82F6` / `#93C5FD`
NFHS-4: `#6D28D9` / `#A855F7` / `#D8B4FE`

---

## Current-Status Sections (added May 2026)

Each programme data file can include a `currentStatus` object with a `type` field. Clicking the `CSEntryBar` on `KDProgrammePage` / `HRHCadrePage` / `DivisionPage` navigates to `CurrentStatusDetailPage`, which wraps `CurrentStatusSection` in an orange-themed full-page layout.

### Entry points
- `DivisionPage` — "Current Status" pill button inside each programme card (shown only if `prog.currentStatus` exists)
- `KDProgrammePage` — `CSEntryBar` replaces the old inline chart block inside `kd-prog-section`
- `HRHCadrePage` — `CSEntryBar` inside `hrh-cadre-section` for PM-ABHIM

### CurrentStatusDetailPage layout
- Orange hero band (`.csd-hero`) with programme name
- Navy topbar with breadcrumb (`.app-topbar`)
- Section header (`.csd-section-header`) + charts body (`.csd-charts-body`) inside `.csd-charts-outer`
- `CurrentStatusSection` renders charts; `useCSAnim` inside each chart component handles its own GSAP — page animation does NOT target `.csd-content > *` to avoid conflicts

### CSEntryBar (named export)
`import CurrentStatusSection, { CSEntryBar } from './CurrentStatusSection'`
- Slim navy gradient clickable bar
- Shows pulsing live dot, programme type label, source, and "View Full Report →" CTA
- CSS class: `.cs-entry-bar`

### Programmes with currentStatus

| Programme | File | `currentStatus.type` | Data source |
|-----------|------|---------------------|-------------|
| Maternal Health | `rch/maternal-health.js` | `'mmr'` | SDG 3.1.1 — N/A state, 3 MDs, East Siang/Namsai |
| Child Health | `rch/child-health.js` | `'child-health'` | IMR 20, SBR 8.8, SNCU 27 deaths, RBSK 52%/67% |
| JSY | `rch/jsy.js` | `'family-planning'` | SDG 3.7.1 — 60.2% vs 74.2% national avg |
| TB (NTEP) | `ndcp/tb.js` | `'tb'` | Incidence 191, Mortality 18; TB Mukt Abhiyan progress |
| NLEP | `ndcp/nlep.js` | `'leprosy'` | 25 districts, 13 IOT, annual case data |
| NCVBDCP | `ndcp/ncvbdcp.js` | `'malaria'` | 5-year trend (32 cases 2025), 16 districts SNV-eligible |
| PM-ABHIM | `hrh/pm-abhim.js` | `'pm-abhim'` | IPHL 5/22 complete, XV-FC financial progress table |

Rendering components in `CurrentStatusSection.jsx`: `MMRStatus`, `ChildHealthStatus`, `FPStatus`, `TBStatus`, `LeprosyStatus`, `MalariaStatus`, `PMABHIMStatus`.

CSS classes: `.cs-*` for chart components; `.csd-*` for `CurrentStatusDetailPage`; `.app-topbar`, `.app-back-btn`, `.app-breadcrumb` for the shared topbar system — all appended to `ncd.css`.

`HRHSection` is guarded: `division?.id === 'hrh' && program.id !== 'pm-abhim'` — PM-ABHIM routes to `CurrentStatusDetailPage` instead.

PM-ABHIM is registered in `hrh/index.js` as the 8th programme in the HRH division.

---

## Aurora background system (added May 2026)

`src/styles/hero.css` — global fixed aurora, renders behind ALL pages.

- `aurora-blobs` div lives in `App.jsx` root (above `flip-stage`) — `position: fixed; inset: 0`
- 5 blobs with `mix-blend-mode: screen` — luminous overlap at intersections
- Palette: white-lavender hotspot (blob-1), rich purple #8b5cf6 (blob-2), deep indigo #4f46e5 (blob-3), cobalt blue #3b82f6 (blob-4), violet #7c3aed (blob-5)
- Container has `filter: blur(80px)` on the wrapper + edge vignette overlay
- Float animations: float1–float5, 8–11s, ±40–72px drift + scale 0.93–1.08
- All page root containers (`ncd-root`, `flip-stage`, `flip-page`, `dv-root`, etc.) must be `background: transparent`
- Body base: `background: #05060f` (deep near-black)
- Glass nav pattern: `rgba(8,5,20,0.55)` + `backdrop-filter: blur(32px) saturate(180%)` + `border: 1px solid rgba(139,92,246,0.22)` + `border-radius: 16px`

---

## Dark mode design system — McKinsey navy/orange (added May 2026)

Full dark mode activated in V3. Token source of truth: `src/styles/tokens.css`.

### Colour tokens
| Token | Value | Role |
|-------|-------|------|
| `--bg` | `#051c2c` | Page root — deep navy |
| `--bg2` | `#0a2236` | Cards / panels |
| `--bg3` | `#0f2a40` | Elevated surfaces |
| `--bg4` | `#163348` | Hover / active |
| `--org` | `#FF5500` | Primary orange accent |
| `--blue` | `#00b5cc` | McKinsey teal secondary |
| `--ink` | `#ffffff` | Primary text |
| `--ink-mid` | `#e0eaf2` | Secondary text |
| `--ink-light` | `#b8ccd8` | Tertiary text |
| `--ink-faint` | `#6b8a9e` | Disabled / meta |

### Typography
- Body + headings: `Inter` 300–800 (loaded in `index.html`)
- Numbers: `JetBrains Mono`
- Playfair Display, DM Sans, Space Grotesk are **removed** from the project

### Glass card system (all layers)
All card backgrounds use dark glass: `rgba(10,34,54,0.82)` + `blur(18-32px)` + `border: rgba(255,85,0,0.28)` + `border-top: 4px solid #FF5500`.

| Element | Class | Treatment |
|---------|-------|-----------|
| Home carousel cards | `.carousel-card` | `border: 4px solid #FF5500`, `blur(32px)`, dark navy glass |
| Division programme cards | `.dv-prog-card` | `border-top: 4px #FF5500`, `blur(18px)`, dark |
| KD programme sections | `.kd-prog-section` | Dark glass `blur(14px)`, `border-top: 3px`, 16px radius |
| Detail cards / CS plot cards | `.detail-card`, `.cs-plot-card` | `bg2`, orange tint border |
| HRH cadre sections | `.hrh-cadre-section` | `bg2` panels |

### Override block strategy
Dark mode overrides are appended at the END of each CSS file as clearly labelled `DARK MODE OVERRIDES` blocks. Never edit the original rules — always append. This makes rollback trivial.

**Important**: `.bento-card` class in `grid.css` is dead — NOT used in any JSX. Home page uses `.carousel-card`.

---

## NCD division data files (`src/data/divisions/ncd/`)

11 programmes under NCD division. Each file exports a default object with: `id`, `name`, `status`, `keyMetric`, `statusReason`, `summary`, `keyMetrics[]`, `observations[]`, `actions[]`, `nfhsData[]`.

**Audit history**: May 2026 — found and fixed copy-paste errors in two files:
- `npcbvi.js` had data duplicated from `niddcp.js` (iodised salt) — corrected to NPCBVI (blindness/cataract) data
- `pmndp.js` had `keyMetric: 'Mental health access'` copied from `nmhp.js` — corrected to `'High blood sugar: 11.9%'`

All 11 NCD files now have unique, programme-appropriate `keyMetric` and `summary` values (verified May 2026).

---

## Report Generation (added May 2026)

`Generate Report` button lives in `DivisionPage.jsx` topbar (`.dv-report-btn`). Opens `ReportModal.jsx`.

### Frontend — `src/components/ReportModal.jsx`
- Phases: idle → loading → done → error
- Step labels animate at 6s intervals (matches ~40s LLM call)
- `API_BASE = import.meta.env.VITE_REPORT_API_URL || ''` — empty string → relative URL → hits Vercel API route in prod
- Report rendered in `<iframe srcDoc={html} sandbox="allow-same-origin" />`
- PDF via `window.open()` + `win.print()` after 400ms delay
- CSS classes in `ncd.css`: `.rpt-overlay`, `.rpt-modal`, `.rpt-header`, `.rpt-body`, `.rpt-idle`, `.rpt-loading`, `.rpt-spinner`, `.rpt-progress-bar`, `.rpt-agent-step`, `.rpt-report-frame`, `.rpt-iframe`
- `.dv-report-btn` — button in DivisionPage topbar

### Backend — `api/report/[divisionId].js` (Vercel serverless)
- Node.js ESM serverless function — lives in repo, deploys with Vercel automatically
- Imports `KD_TREE` directly from `../../src/data/kdData.js` — no separate JSON needed
- `export const maxDuration = 60` — requires Vercel Pro plan for full timeout
- `GROQ_API_KEY` Vercel env var — primary key set in production
- 3 sequential Groq API calls:
  1. Agent 1 `llama-3.1-8b-instant` — DataCollector: structured KD briefing
  2. Agent 2 `llama-3.3-70b-versatile` — Analyst: priorities, root causes, recommendations
  3. Agent 3 `llama-3.3-70b-versatile` — ReportWriter: full self-contained HTML report
- Returns `{ html: string, division: string }`
- HTML has inline CSS, Inter font from Google Fonts, max-width 900px, PIF orange `#FF5500` accents
- Strips markdown code fences from LLM output before returning
- CORS headers set for `allow-origin: *`

### Python backend (`backend-py/`) — local reference only
FastAPI + CrewAI + matplotlib alternative. Not deployed. Run locally: `cd backend-py && uvicorn server:app --reload`. Set `VITE_REPORT_API_URL=http://localhost:8000` in `.env.local` to use it.

---

## Hard rules (follow exactly)

1. **V3 only** — never touch `/Users/thesinghaa/PIFHealthDashboard/` (v1) or `/Users/thesinghaa/PIFHealthDashboard-v2/` (v2)
2. **Git identity** — `thesinghaa <aryanjarvis32@gmail.com>` via `git config --local`. Do NOT use `--author` flag
3. **No emojis** anywhere — not in code, CSS, or commit messages
4. **CSS** — append new rules at the bottom of `ncd.css`, never rewrite the whole file
5. **Subagents** — do NOT give them access to large files without reading offsets; they will truncate
6. **NCD_compiled sheet** — do not connect until user asks
7. **No feature flags, no backwards-compat shims** — just change the code
8. **Bundle size warning** is expected (~5.8MB due to plotly.js + KD_TREE import) — acceptable, do not split unless asked
9. **Deploy** — `vercel build --prod && vercel deploy --prod --prebuilt` from `/Users/thesinghaa/PIFHealthDashboard-v3/`

---

## Landing page — cinema reel (added May 2026)

`src/pages/LandingPage.jsx` + `src/styles/landing.css`

- Entry point (`page: 'home'`) — cinema reel carousel of 5 division cards
- Cards positioned by offset from active: `translateX(offset * 460px) scale(sc) blur(n)px`
- Active card (offset 0): full opacity, no blur, purple glow ring, "Explore Division" CTA
- Adjacent cards (±1): scale 0.82, opacity 0.58, blur 2px — clicking steps the reel
- Far cards (±2): scale 0.66, opacity 0.20, blur 6px
- Per-division CSS custom props: `--bdr` (border color) + `--glow` (glow color)
- Keyboard nav: ArrowLeft / ArrowRight; 480ms debounce lock
- "All Programmes" button → `onViewSummary` → `page: 'summary'` (HomePage)
- Division card click → `onSelectDivision(div)` → `page: 'division'`
- CSS classes: `.lnd-root`, `.lnd-header-inner` (glass nav), `.lnd-card`, `.lnd-card--active`, `.lnd-card-ring`, `.lnd-dot--active` (pill shape)
- **Navbar**: "Select a Division" centre label removed — navbar has brand (left) + All Programmes button + ThemeToggle (right) only

### CardSummary component (`src/components/CardSummary.jsx`)
Lazy-loaded inside each reel card. Returns a **React Fragment** — two absolutely positioned children injected into the reel card's positioning context:

#### Donut colour palette (updated May 2026)
```js
SEG_COLORS = { gap: '#E84060', close: '#E89010', achieved: '#28C268' }
SEG_GLOW   = { gap: 'rgba(232,64,96,', close: 'rgba(232,144,16,', achieved: 'rgba(40,194,104,' }
```
Each donut wrapper has `filter: drop-shadow` using `SEG_GLOW[dominantSeg]` at 35%/55% opacity — gives a soft ambient glow matching the dominant segment. Segments also have a `marker.line` border in the segment colour (width 2–2.5px) for depth.

`indGlow` useMemo computes dominant segment for the indicator donut. `progGlowSeg` computed inline per programme card.

#### GSAP animations (updated May 2026)
All donuts use a **speedometer sweep** via `conic-gradient` mask:
- Mask starts at `conic-gradient(from -90deg, #000 0deg 0deg, transparent 0deg 360deg)` (fully hidden)
- GSAP animates angle 0→360° → mask reveals donut clockwise from 12 o'clock
- On complete, mask is cleared so Plotly hover works normally
- On card deactivate, masks are cleared immediately

Number animations:
- `totalNumRef` (indicator center) — GSAP counter from 0 to `brk.total`, delay 0.12s
- `legNumRefs[0..2]` — staggered counters for gap/close/achieved, delay 0.22–0.36s
- `progNumRefs[i]` — per-programme KD total counter, staggered by index

Timing:
| Element | Duration | Delay |
|---------|----------|-------|
| Indicator donut sweep | 1.0s | 0.05s |
| Total KD counter | 0.9s | 0.12s |
| Legend counters | 0.75s | 0.22–0.36s |
| Prog donut sweeps | 0.75s | 0.1 + i×0.1s |
| Prog KD counters | 0.7s | 0.18 + i×0.08s |

#### Active card layout override (`.lnd-card` responsive block in `landing.css`)
Updated May 2026 to fully responsive viewport-relative sizing:
- `width:  min(1200px, calc(100vw - 80px))`
- `height: min(980px, calc(100dvh - 200px))` — never overflows reel-wrap at any viewport
- `top: 2%` (reduced from 4% for more vertical room)
- `padding: clamp(28px,3.5vh,44px) calc(var(--lnd-ind-w)+24px) clamp(18px,2.5vh,44px) clamp(44px,4.5vw,68px)` — padding syncs with indicator panel width via CSS custom prop
- `gap: clamp(10px, 1.4vh, 18px)`
- `--lnd-ind-w: clamp(240px, 20vw, 300px)` — custom prop inherited by `.lnd-ind-card`
- `@media (min-width: 1920px)`: wider card `min(1400px, ...)`, larger panel `clamp(270px,16vw,350px)`
- `@media (max-width: 1100px)`: indicator panel hidden, compact padding, smaller fonts

`cardStyle()` in `LandingPage.jsx` now uses a responsive step:
- `>= 1440px`: step = 1300 (original)
- `< 1440px`: step = `max(cardW + 80, round(vw * 0.88))` — adjacent cards stay proportional

#### 1. Indicator Status card (`.lnd-ind-card`) — absolute, right column
- Position: `top: 10px; right: 10px`
- Width: `var(--lnd-ind-w, 276px)` — inherits from parent `.lnd-card`'s custom prop
- Height: `calc(100% - 20px)` — fills card height (10px top + 10px bottom clearance)
- Inner padding: `36px 22px 28px` (top / sides / bottom)
- Design: `border: 1.5px solid rgba(0,181,204,0.50)`, `background: rgba(0,22,48,0.78)`, `border-radius: 14px`, inset+outer cyan glow, `backdrop-filter: blur(32px)`
- Header "INDICATOR STATUS": `font-size: 14px; color: #ffffff; font-family: JetBrains Mono; font-weight: 700`
- 3-segment Plotly donut (160×160px): gap `#E84060` / close `#E89010` / achieved `#28C268`
- **Auto-selects most critical segment on card activation** (`useEffect([isActive, brk.gap, brk.close, brk.achieved])` → picks gap > close > achieved)
- Legend rows and donut segments are also clickable to change `selectedSeg`
- Top-3 KDs panel: visible by default (auto-selected), GSAP `fromTo(opacity:0→1, y:-8→0)` animates on segment change
- Top-3 sorted: most-gap-first (gap), closest-to-zero (close), highest-first (achieved)
- Each top-3 row clickable → `onKDClick(kd, kd.programmeId)` → `App.jsx goToKDDirect` → `page: 'kd-indicator'`
- **"Explore Division" CTA** inside indicator panel at bottom (`margin-top: auto`): `border: 1.5px solid #00b5cc`, shimmer `@keyframes lnd-cta-shimmer` via `::after` pseudo-element

Key helpers:
- `getDivKDBreakdown(divisionId)` — counts achieved/close/gap/total across all KD_TREE programmes
- `getTopKDsByStatus(divisionId, status, n=3)` — top n KDs for a segment, sorted
- `kdGap(kd)` — `lowerIsBetter ? target - achievement : achievement - target`; null if data missing
- Gap thresholds: `g >= 0` = achieved, `-10 <= g < 0` = close, `g < -10` = gap

**Hook order rules** (CRITICAL — violating causes blank page crash):
1. `brk` (useMemo) MUST be before all effects that depend on it
2. `resolvedFilter` + `filteredProgs` useMemos MUST be declared BEFORE any `useEffect` that uses them in dep arrays — `const filteredProgs` used in `[isActive, filteredProgs]` dep is a TDZ error if declared after the effect

CSS classes: `.lnd-ind-card`, `.lnd-ind-header`, `.lnd-ind-title`, `.lnd-ind-center`, `.lnd-ind-total-num`, `.lnd-ind-total-lbl`, `.lnd-ind-legend`, `.lnd-ind-leg-row`, `.lnd-ind-leg-row--active`, `.lnd-ind-leg-dot`, `.lnd-ind-leg-num`, `.lnd-ind-leg-lbl`, `.lnd-ind-top3`, `.lnd-ind-top3-header`, `.lnd-ind-kd-row`, `.lnd-ind-kd-name`, `.lnd-ind-kd-gap`, `.lnd-ind-cta`

#### 2. Programme grid (`.lnd-prog-section`) — flex child, left content area
- Layout: `flex: 1; min-height: 180px; max-height: 340px` — flows naturally after card header content
- Section label ("CRITICAL PROGRAMMES" etc.): `font-size: 12px; color: #ffffff; font-family: JetBrains Mono`
- Filtered by `resolvedFilter` = `activeFilter || (any red? → any yellow? → green)`
- Programme card sizing: `flex: 1` if ≤4 cards (equal width), `width: 220px; flexShrink: 0` if >4 (enables horizontal scroll)
- Each programme card: mini Plotly donut (140×140px) + name + keyMetric; donut has drop-shadow glow matching dominant segment
- `getProgKDBrk(divisionId, progId)` — per-programme KD breakdown from KD_TREE
- Scroll: `overflow-x: auto; scrollbar-width: none` — 2-finger trackpad gesture

CSS classes: `.lnd-prog-section`, `.lnd-prog-section-label`, `.lnd-prog-scroll`, `.lnd-prog-card`, `.lnd-prog-donut-center`, `.lnd-prog-dc-lbl`, `.lnd-prog-name`, `.lnd-prog-metric`, `.lnd-prog-empty`

#### LandingPage state for CardSummary
- `activeFilter` state (null | 'red' | 'yellow' | 'green') — resets to null on active card change
- Pill buttons toggle `activeFilter`; active pill gets `.lnd-pill--sel` class (box-shadow ring + opaque bg)
- Expand arrow `↗` (`.lnd-idx-expand`) next to division short label — `onClick → onSelectDivision(div)`
- `onKDClick` prop: `(kd, programmeId) => onDirectKD(div, programmeId, kd)` → navigates to `kd-indicator`
- `onExploreDivision` prop: `isActive ? () => onSelectDivision(div) : null` — wired from inside indicator panel

`App.jsx` has `goToKDDirect(division, programmeId, kd)` callback — navigates directly to `kd-indicator`, bypassing division/programme list layers.

#### Old perf card (`.lnd-perf-card` / `.lnd-summary`)
`.lnd-summary { display: none }` — no longer rendered. CSS classes for `.lnd-perf-card` remain in `landing.css` but are dead code. Do not remove (not worth the risk of breaking anything).

---

## Summary page (5-column no-scroll layout) — was landing page

`src/pages/HomePage.jsx` — all 5 division columns at once; reached via "All Programmes" on LandingPage.

- Each column = one NHM division, width proportional to programme count (`flex: 2.0` to `flex: 1.1`)
- Orange 3D bento card borders: `border: 4px solid #FF5500`, layered box-shadows, `backdrop-filter: blur(32px)`
- Card height: `height: calc(100dvh - 130px)` — explicit to prevent border clipping
- Grid: `.lp-grid` with `align-items: flex-start !important; overflow: visible !important`

### Navbar layout
Grid: `grid-template-columns: 1fr auto 1fr`
- Left `1fr`: `.home-brand` (Arunachal Pradesh + subtitle)
- Center `auto`: `.home-summary` (37 PROGRAMMES | 10 CRITICAL | 21 CAUTION | 6 ON TRACK pill)
- Right `1fr`: `.home-right` flex container with `.home-legend` (dots) + `.home-nav-search` (search bar)

### Deep search (`matchesSearch` in `HomePage.jsx`)
Three-tier search — checked in order:
1. `PROG_LABEL` display name + prog ID
2. `PROG_ALIASES` — short codes and synonyms (NTEP→TB, RBSK→Child Health, etc.)
3. `PROG_KD_INDEX` — built at module load from `KD_TREE`: all KD `indicator`, `statement`, `type`, `unit`, `source` strings

Searching "ANC first trimester", "NTEP", "cataract", "high risk pregnancies" etc. all work.

### Search highlight behaviour
- `lp-prog--dimmed`: non-matching programmes → `opacity: 0.18`
- `lp-prog--highlighted`: matching programmes → orange outline

---

## Status colour logic (updated May 2026 — ratio-based)

Ratio against national average / NHM target. Used in KDProgrammePage, KDIndicatorDetail, CardSummary, DivisionPage, HomePage, LandingPage.

```js
function kdStatus(kd) {
  if (kd.achievement == null || kd.target == null || kd.target === 0) return 'neutral';
  const ratio = kd.achievement / kd.target;
  if (kd.lowerIsBetter) {
    if (ratio <= 1.00) return 'achieved';   // at or below target — good
    if (ratio <= 1.33) return 'close';      // up to 33% over target — caution
    return 'gap';                           // >33% over target — critical
  }
  if (ratio >= 1.00) return 'achieved';     // at or above target — green
  if (ratio >= 0.75) return 'close';        // 75-99% of target — amber
  return 'gap';                             // below 75% of target — red
}
```

`target` field in kdData.js IS the national average from NHM NPCC FY 2025-26.

### Programme status (dynamic — May 2026)
`computeProgStatus(divisionId, progId)` derives red/yellow/green from KD_TREE:
- any KD gap → 'red'
- any KD close (no gap) → 'yellow'
- all KDs achieved → 'green'
- fallback (no KD data) → 'yellow'

Used in: DivisionPage, HomePage (`getSummary` + programme row badges), LandingPage (`getDivStats`). Programme `.status` field in data files is now IGNORED — all status rendering is dynamic.

### CardSummary helpers
- `kdStatus(kd)` — ratio-based (same as above)
- `kdDeficit(kd)` — `ratio - 1.0` (lowerIsBetter) or `1.0 - ratio` (regular); positive = worse
- `getDivKDBreakdown(divId)` — division-level achieved/close/gap/total counts
- `getTopKDsByStatus(divId, status, n)` — top-n KDs for a segment, sorted by deficit
- `getProgKDBrk(divId, progId)` — per-programme breakdown
