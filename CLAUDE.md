# PIF Health Dashboard V5 — NHM Arunachal Pradesh (CLAUDE.md)

This file gives any Claude session immediate context on the project so you can contribute without needing prior conversation history.

> **V5 is the ONLY active version** at `/Users/thesinghaa/PIFHealthDashboard-v5/`. V1, V2, V3, and V4 are frozen — do not touch them.

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

- **Local**: `/Users/thesinghaa/PIFHealthDashboard-v5/`
- **GitHub**: `https://github.com/thesinghaa/app-healthdashboard-v5`
- **Live**: `https://pif-health-v4.vercel.app` · `https://arunachalhealthdashboard.vercel.app`
- **Git identity**: `thesinghaa <aryanjarvis32@gmail.com>` (set via `git config --local`) — do NOT use `--author` flag
- **Deploy method**: `vercel build --prod` → `vercel deploy --prod --prebuilt` → manually alias both URLs
- **Push**: `GH_TOKEN=<token-in-memory> git push origin main` (token stored in remote URL, do not commit it)
- **After every deploy**: `vercel alias set <hash>.vercel.app pif-health-v4.vercel.app` AND `vercel alias set <hash>.vercel.app arunachalhealthdashboard.vercel.app`

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

## V4 Landing Page — Scrollable Command Center (added May 2026)

**Complete redesign** of `LandingPage.jsx` + `landing-v4.css`. Old cinema-reel layout fully replaced.

### Layout (scrollable story)
1. **Hero strip** — KPI bar (On Track / Caution / Critical Gap / Overall %) + brand
2. **Programme Overview** (`ProgrammeOverview.jsx`) — ICED-style interactive 5-zone layout (see below)
3. **NHM Programme Flow** — @nivo/sankey (NHM → Divisions → Programmes → Status), animated, clickable
4. **Critical Alerts** — table of top-8 gap KDs ranked by deficit magnitude

### ProgrammeOverview component (`src/components/ProgrammeOverview.jsx`) — added May 2026

ICED-style interactive section. 5 horizontal zone columns, each representing an NHM division.

**Hover behaviour:**
- Hovered zone stays full opacity; all others dim to `opacity: 0.12`
- Floating stat pills appear below the label box: Total KDs · On Track % · Critical count
- Bar chart panel slides up from bottom of zone (CSS `translateY(100%) → 0`, 0.38s ease)
- Bar chart shows On Track / Caution / Critical / Not Mapped counts with animated fill widths

**Icons:** 3 filled colorful SVG icons per division, hardcoded in `ICONS` constant:
- RCH (blue): pregnant mother+child, baby with smile, vaccination syringe
- NDCP (amber): lungs/TB, mosquito/malaria, medicine capsule
- NCD (purple): heart ECG, glucometer, eye
- HSS (teal): hospital building, capsule pills, ambulance
- HRH (red): doctor in coat, medical team, training clipboard

**Icon positions** (`ICON_LAYOUTS`): top-left `{top:16, left:12, size:72}`, top-right `{top:14, right:12, size:62}`, mid-left `{top:188, left:18, size:66}`

**CSS namespace:** `.pov-*` (appended at bottom of `landing-v4.css`)
- Zone grid: `.pov-zones` (5-col, height:520px)
- Active state: `.pov-has-active` on grid, `.pov-zone--active` on zone
- Label box: `.pov-div-box` — bordered, fills with division color on hover
- Stats: `.pov-stats-row`, `.pov-stat`, `.pov-stat-val`, `.pov-stat-lbl`
- Chart: `.pov-chart`, `.pov-bar-row`, `.pov-bar-fill` (animates via `--bar-w` CSS var)
- KPI cards: `.pov-card`, `.pov-card-bar`, `.pov-card-foot`

**Click** → `onSelectDivision(div)` → navigates to DivisionPage.

### CSS file: `src/styles/landing-v4.css`
- Old `.v4c-*` namespace (cinema reel legacy) still present but no longer rendered
- Active namespaces: `.v4l-*` (landing wrapper, hero, flow/Sankey, alerts) + `.pov-*` (overview zones)
- Status colors: `--v4-gap: #FF3B5C`, `--v4-close: #FFB020`, `--v4-ok: #00C97A`
- Division colors: `--v4-rch: #4F8EF7`, `--v4-ndcp: #F7B23B`, `--v4-ncd: #9B6FEB`, `--v4-hss: #2DD4BF`, `--v4-hrh: #F7614F`
- `.v4c-root { height: 100%; overflow-y: auto }` — scrollable within `.flip-page`
- `.v4c-reveal` + `.v4c-in` — IntersectionObserver scroll-reveal pattern (threshold 0.10)
- Light mode overrides via `[data-theme="light"]` block at end of file
- Sticky navbar: `--v4-nav-h: 64px`; backdrop blur 20px

### Key data constants (in LandingPage.jsx)
- `DIST_SCORES` — 27 districts, scores 27–68 (composite health, illustrative FY25-26)
  - Keys match GeoJSON `properties.DISTRICT` exactly (title-case, e.g. `'Papum Pare'`)
- `DIV_META` — per-division: color, heroVal, heroLbl, spot KDs for alert table
- `NFHS_CHART` — 5 indicators comparing NFHS-4 vs NFHS-5
- `WINS` — 3 callout cards: Institutional Births +26.9pp, PNC +27.5pp, IMR -44%

### Animations
- GSAP timeline on mount: nav → hero text → score → status strip
- Hero score count-up: `gsap.to({n:0}, { n: onTrackPct, onUpdate: write to scoreRef.current.textContent })` — no React re-renders
- IntersectionObserver adds `.v4c-in` to `.v4c-reveal` elements as they enter viewport
- Progress rings: CSS `conic-gradient` updated via inline style `--pct`

### Navbar banner (updated May 2026 — dissolve crossfade)
- 3 banner images rotate every 5s via GSAP opacity crossfade (dissolve, not 3D roll)
- `bannerRefs = useRef([])`, `bannerIdx = useRef(0)` in LandingPage.jsx
- GSAP: `gsap.to(slides[prev], {opacity:0, duration:1.4, ease:'power2.inOut'})` + `gsap.to(slides[next], {opacity:1, ...})`
- Container class: `.v4l-nav-banner-dissolve` — `position:absolute; left:50%; transform:translateX(-50%); width:100vw; height:100%; z-index:0`
- Image class: `.v4l-nav-banner-slide` — `position:absolute; top:50%; transform:translateY(-50%); width:100%; opacity:0`
- Overlay also full-bleed: `left:50%; transform:translateX(-50%); width:100vw; height:100%`
- Images: `/banners/banner1.jpeg`, `banner2.jpeg`, `banner3.jpeg` — placed in `/public/banners/`
- Banner container inside `.v4l-nav-inner` (max-width:1400px) — full-bleed trick breaks out of container

### Sankey (updated May 2026)
- Heading: "How Programmes distribute across divisions and outcome status" (was "How KDs distribute...")

### Map
- `react-simple-maps` (ComposableMap, Geographies, Geography)
- GeoJSON: `/public/ap-districts.geojson` (same file, title-case DISTRICT keys)
- `projectionConfig: { center: [94.483, 28.056], scale: 2780 }`
- `distColor(score)`: ≥60 → `--v4-ok`, ≥45 → `--v4-close`, <45 → `--v4-gap`
- Hover tooltip: `.v4c-map-tip` absolutely positioned

### ThemeContext change
- Default theme changed from `'light'` to `'dark'` (localStorage fallback)

---

## V5 Landing Page — New Sections (added May 2026)

`LandingPage.jsx` + `landing-v4.css` — CSS namespace `.v5-*`

### Layout (top to bottom)
1. **Hero identity bar** (`.v5-hero-bar`) — title "Our state's health, district by district" + 3 role-selector buttons (Public / Programme Officers / Administrators). Golden-orange `#C8860A` fill, white font, no border, glow shadow. Half-width green gradient underline via `::after`.

2. **Stat strip** (`.v5-stat-strip`) — 5-column grid. One hero metric per NHM division. Each card (`.v5-stat-card`) has:
   - `--accent` CSS var for border color (rch=`#4F8EF7`, ndcp=`#F7B23B`, ncd=`#9B6FEB`, hss=`#2DD4BF`, hrh=`#F7614F`)
   - Illustration PNG (`/statcards/RCH.png` etc.) positioned absolute right, `mix-blend-mode: multiply`, white gradient mask via `::before`
   - Number, label, programme pill at bottom
   - Images live in `/public/statcards/` (RCH.png, NDCP.png, NCD.png, HSS.png, HRH.png)
   - **Now uses `StatCard3D` component** — 3-face GSAP prism, currently **frozen on face 0** (auto-roll removed)
   - Face 0 is always the **pinned featured stat** from `FACE0_PINNED` in `getDivisionStats.js`:
     - RCH: 18,024 Children fully immunised (KD #28)
     - NDCP: 2,314 Hepatitis C patients in treatment (KD #82)
     - NCD: 255 People rehabilitated with hearing aids (KD #125)
     - HSS: 408 Ayushman Arogya Mandirs with full 12 services (KD #154)
     - HRH: 96% MO-MBBS positions filled per IPHS norms (KD #169, hardcoded fmt)
   - Faces 1 & 2 auto-populated by algorithm (achieved-first, sorted by over-target ratio), excluding the pinned KD

3. **District Map** (`DistrictMap.jsx`, lazy-loaded) — See below.

### DistrictMap component (`src/components/DistrictMap.jsx`) — updated May 2026

Self-contained interactive map. No props.

**Default state (no district clicked):** Full choropleth view. Two layer toggles in header — Population and Density. Map uses demographic heatmap from `districtDemography.js`.

**District selected:** GSAP animates map to 58% width, right panel slides in (42%, x:60→0, opacity:0→1, 0.45s power3.out). Close button collapses with 0.3s power2.in, `setTimeout(300)` clears state after animation.

**District + programme:** KD achievement table (Indicator / Achievement / Target / Status badge). Table note: "State-level data — district-level breakdown coming soon".

**Demographic data source:** `src/data/districtDemography.js` (see below). Imports `DISTRICT_DEMOGRAPHY`, `STATE_POP_2021`.

**Colour scales (hardcoded):**
```js
POP_COLORS = [
  { max: 25000,    fill: '#d1fae5', stroke: '#a7f3d0' },
  { max: 50000,    fill: '#6ee7b7', stroke: '#34d399' },
  { max: 80000,    fill: '#10b981', stroke: '#059669' },
  { max: 120000,   fill: '#047857', stroke: '#065f46' },
  { max: Infinity, fill: '#064e3b', stroke: '#022c22' },
]
DEN_COLORS = [
  { max: 5,        fill: '#ede9fe', stroke: '#ddd6fe' },
  { max: 15,       fill: '#a78bfa', stroke: '#8b5cf6' },
  { max: 35,       fill: '#7c3aed', stroke: '#6d28d9' },
  { max: Infinity, fill: '#4c1d95', stroke: '#3b0764' },
]
```

**Demobanner:** Absolute overlay top-left of map box. Shows state-level stats: 16.8L pop | 88k km² area | 19/km² density | 27 districts. Class: `.v5-map-demobanner`.

**Scale bar:** Full-width bar pinned to bottom of map box (`position:absolute; left:0; right:0; bottom:0`). Auto-resizes when right panel opens (since it's inside `.v5-map-left`). Coloured segments span full width. Class: `.v5-map-scalebar`.

**Hover tooltip:** `position:fixed` follows cursor via `e.clientX/Y` on `onMouseMove`. Shows district name, pop2021, density, HQ. Class: `.v5-map-hover-tip`.

**Selected district fill:** `#0f5f2e` (dark green, overrides choropleth colour).

**Section heading:** `<h2 className="v5-map-section-heading">Demographic Distribution</h2>` — 28px/800 Inter, above the header row.

**Map body:** `height:660px`. ComposableMap: `width={800} height={460}`, `projectionConfig: { center:[94.4, 28.2], scale:7000 }` — fills the box with clear bottom margin above scalebar.

**GSAP:** refs `mapRef` + `panelRef`. `panelOpen` state drives animations.

**Demobanner stat values:** `font-size:20px` JetBrains Mono.

**Colours (selected district panel):** Division colours in `DIV_COLORS` constant. Default district `#4aab6d`, hover `#17823e`.

**CSS classes:** `.v5-map-section`, `.v5-map-section-heading`, `.v5-map-header`, `.v5-map-layer-btn`, `.v5-map-layer-btn--active`, `.v5-map-title`, `.v5-map-cta-pill` (pulsing), `.v5-map-body` (display:flex, height:660px), `.v5-map-left` (height:100%), `.v5-map-right`, `.v5-map-district-panel`, `.v5-map-prog-btn`, `.v5-map-kd-panel`, `.v5-map-kd-table`, `.v5-kd-badge`, `.v5-map-close-btn`, `.v5-map-demobanner`, `.v5-map-demostat`, `.v5-map-demostat-val`, `.v5-map-demostat-lbl`, `.v5-map-demostat-div`, `.v5-map-scalebar`, `.v5-map-scalebar-title`, `.v5-map-scalebar-track`, `.v5-map-scalebar-seg`, `.v5-map-scalebar-tick`, `.v5-map-hover-tip`

**Division field names:** Use `div.fullName` (not `div.name`) and `div.id`. `KD_TREE` uses `programmes` key.

**vite.config.js maps chunk:** Only `react-simple-maps` + `topojson` — do NOT include `d3-geo` (causes circular chunk with `charts` which catches all `d3-` via prefix).

---

### District demography data (`src/data/districtDemography.js`) — added May 2026

All 27 AP districts. Keys match GeoJSON `properties.DISTRICT` exactly (title-case).

Fields per district: `hq, pop2011, pop2021, areaSqKm, density2011, source`

Sources:
- Census 2011 actuals for original 16 districts
- Post-2011 districts (11): estimated by subtracting carved population from parent district totals
- pop2021 = pop2011 x 1.22 (22% decadal growth rate, AP/NE India trend)

State totals (computed): `STATE_POP_2011` ~1.13M, `STATE_POP_2021` ~1.38M, `STATE_AREA` ~83,743 km², `STATE_DENSITY` ~19/km²

Exports: `DISTRICT_DEMOGRAPHY`, `STATE_POP_2011`, `STATE_POP_2021`, `popQuintile(name)`, `densityCategory(name)`

---

### ProgrammeProgressChart component (`src/components/ProgrammeProgressChart.jsx`) — added May 2026

Stacked monthly bar chart showing HMIS indicator throughput per NHM programme, FY 2024-25 and 2025-26.

**Data:** Hardcoded from NCD_Compiled.xlsx. Only RCH has data currently; all other programmes show empty state.

**Indicators + colours (updated May 2026 — reference screenshot palette):**
```js
{ key:'anc',   label:'ANC registrations',        color:'#F59E0B' }  // amber
{ key:'del',   label:'Institutional deliveries',  color:'#10B981' }  // emerald
{ key:'imm',   label:'Fully immunised children',  color:'#06B6D4' }  // ocean cyan
{ key:'fp',    label:'Family planning acceptors', color:'#6B7280' }  // grey
{ key:'anaem', label:'Anaemia on treatment',      color:'#FF1744' }  // bright red
```

**Chart:** Recharts `BarChart`, `height:380px`, `barSize:26`. Top bar has `radius:[3,3,0,0]`, others no radius.

**Controls:** Programme selector pill (left) + FY selector (right) in header.

**Summary panel (right):** FY totals with proportional bar per indicator. Hover syncs with chart (opacity dim/focus on `hoveredKey`).

**Tooltip:** Custom `CustomTooltip`, `position:fixed`-like (Recharts cursor). Light theme hardcoded.

**CSS namespace:** `.ppc-*` — all values hardcoded (no CSS vars) to avoid dark/light theme conflicts.
- `.ppc-section`: `background:#F4F7FC`
- `.ppc-card`: `background:#FFFFFF; border:1px solid rgba(0,0,0,0.07); box-shadow:0 2px 16px rgba(0,0,0,0.06)`
- `.ppc-title`: `font-size:20px; font-weight:600; color:#0F172A`
- `.ppc-sum-val`: `font-size:15px; font-weight:600; color:#111827; font-family:'JetBrains Mono'`

---

### LeftSideNav component (`src/components/LeftSideNav.jsx`) — added May 2026

Slide-in left panel with 5 NHM division shortcuts. Imported and rendered in `LandingPage.jsx`.

**Behaviour:**
- Fixed panel `width:280px`, starts at `x:-280` (off-screen), GSAP slides to `x:0` on open
- Toggle tab: `position:absolute; right:-40px; top:50%` — always visible at viewport left edge
- Clicking a division row opens `PersonaModal` (not the panel link directly)
- `PersonaModal`: GSAP scale+fade (`opacity:0, y:24, scale:0.96 → opacity:1, y:0, scale:1`, 0.32s power3.out)
- 3 personas: Citizen / Programme Officer / Administrative Officer with SVG icons
- Persona select → `onSelectDivision({ id, fullName, label })` → navigates to DivisionPage
- GSAP fix: `gsap.set(panelRef.current, { x: -280 })` in mount useEffect to force off-screen before first render (CSS `transform` ignored by GSAP)

**GSAP fix details:** CSS `transform: translateX(-280px)` is NOT read by GSAP. Must call `gsap.set()` on mount to initialise the value that GSAP will animate. Without this the panel starts visible on load.

**CSS namespace:** `.lsnav-*` (appended at bottom of `landing-v4.css`)
- `.lsnav-panel`: `position:fixed; left:0; top:0; bottom:0; width:280px; z-index:1000`
- `.lsnav-tab`: toggle button, `position:absolute; right:-40px; top:50%; width:40px; height:56px`
- `.lsnav-div-row`: division row button with `--dc` (color) + `--db` (bg) CSS vars
- `.lsnav-overlay` + `.lsnav-modal`: persona picker fullscreen overlay + centered card
- `.lsnav-backdrop`: dark backdrop behind panel when open

---

## Navigation (5 layers)

```
LandingPage — scrollable command center (V4, May 2026)
  ├── [old] Cinema reel (removed — fully replaced by scrollable story layout)
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
| `src/pages/LandingPage.jsx` | Entry page — hero strip + Programme Overview + Sankey + Alerts |
| `src/components/ProgrammeOverview.jsx` | ICED-style interactive 5-zone section (hover → dim + bar chart) |
| `src/styles/landing-v4.css` | Landing v4 styles — `.v4l-*` + `.pov-*` namespaces |
| `src/styles/landing.css` | Old cinema-reel styles (legacy, not active) |
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
| `src/data/getDivisionStats.js` | Top-3 positive KD stats per division for stat strip; face 0 always pinned via `FACE0_PINNED` |
| `src/data/districtDemography.js` | All 27 AP districts — pop2011/2021, area, density, HQ, source |
| `src/components/StatCard3D.jsx` | 3-face GSAP prism card; frozen on face 0 (auto-roll removed) |
| `src/components/LeftSideNav.jsx` | Slide-in left panel — 5 NHM division shortcuts + persona picker popup |
| `src/components/ProgrammeProgressChart.jsx` | Stacked monthly bar chart (HMIS RCH throughput, FY 2024-25 + 2025-26) |
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

## Districts (27 in AP)

Changlang, Dibang Valley, East Kameng, Anjaw, East Siang, Kamle, Kra Daadi, Kurung Kumey, Leparada, Lohit, Longding, Lower Dibang Valley, Lower Siang, Lower Subansiri, Namsai, Pakke Kessang, Papum Pare, Shi Yomi, Siang, Tawang, Tirap, Upper Siang, Upper Subansiri, West Kameng, West Siang, Bichom, Keyi Panyor.

**Itanagar Capital Complex** is missing from the Google Sheet and shapefile (too new) — user is aware.

## AP Choropleth Map (`src/data/apDistricts.json`)

GeoJSON with 27 AP districts, WGS84, RDP-simplified (~234 KB). Vite JSON import.
- Feature key: `properties.DISTRICT` (e.g. `"Papum Pare"`, `"Changlang"`)
- Source: `DISTRICT_BOUNDARY.shp` (all-India, LCC projection), converted + reprojected with Python
- All 27 districts present including Bichom + Keyi Panyor

---

## KDIndicatorDetail page sections (4th layer)

1. **Topbar** — breadcrumb: Division › Programme › Indicator
2. **KD meta strip** — KD badge, type pill, indicator name, statement
3. **Achievement Overview** — Plotly sunburst (3 branches: FY 25-26 / NFHS-5 / NFHS-4, each split achieved vs remaining)
4. **FY 2025-26 Performance** — Target / Achievement / Status numbers card
5. **HMIS Monthly Trend** — Recharts AreaChart (only if `hmisCode` set)
6. **District Performance** — two-column: `DistrictMap` choropleth (left) + insight panel (right). Map zooms via `AP_SCALES = [52,78,117,175,263]` (`projection.scale`). +/- overlay buttons bottom-left.
7. **NFHS Baseline Comparison** — `PlotlyNFHSChart` horizontal stacked bar (converted from sunburst May 2026). Purple NFHS-5, amber NFHS-4.
8. **NFHS Baseline table** — NFHS-4 → NFHS-5 comparison with pill badges and change indicator

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

### Light mode — `[data-theme="light"]` on `<html>` (fully audited May 2026 — black & orange only)
ThemeToggle sets `document.documentElement.dataset.theme = 'light'`. All light overrides use `[data-theme="light"] .class` selectors.

**Palette**: black (`#1A1610`) + orange (`#FF5500`) only — zero blue/teal anywhere in light mode.
**Background**: `#F5F5F5` neutral grey (tokens.css `--bg`), cards white `#FFFFFF`.

**tokens.css** (`[data-theme="light"]` block):
- `--bg` through `--bg5`: neutral grey `#F5F5F5`→`#D8D8D8` (replaced warm cream)
- `--w1`–`--w4`: pure white glass `rgba(255,255,255,...)`
- All `--blue`, `--org`, `--teal-*` aliases → `#FF5500` orange in light mode

**landing.css** light mode block (appended, comprehensive — May 2026):
- `.lnd-header-inner` → white glass `rgba(255,255,255,0.96)`
- `.lnd-ind-card` → white `#FFFFFF`, orange border `rgba(255,85,0,0.30)`
- `.lnd-report-btn` → orange `rgba(255,85,0,0.08)` bg with orange border
- `.lnd-ind-cta` → orange border + `#C04000` text
- `.lnd-prog-section` → neutral `rgba(242,242,242,0.90)`, orange border
- `.lnd-prog-card` → white `#FFFFFF`

**ncd.css** light mode block (appended at ~line 4700, comprehensive — May 2026):
- Topbars (`app-topbar`, `ncd-topbar`, `dv-topbar`) → white `#FFFFFF`
- Division badge (`.dv-division-tag`) → orange `#FF5500` with `!important` (overrides inline chipColor style)
- All cards (`.dv-prog-card`, `.kd-prog-section`, `.detail-card`, `.cs-plot-card`) → white
- Aurora dark-glass override: `.kdi-section`, `.kd-prog-section`, `.hmis-section` → `background: transparent; backdrop-filter: none`
- Perf stat labels (`.perf-stat-label`, `.perf-fraction-label`) → `rgba(26,22,16,0.50)` (was slate-400 `#94A3B8`)
- Sunburst legend (`.sb-leg-item`, `.sb-leg-caption`, `.sb-leg-tick`) → warm dark neutrals

**KDIndicatorDetail.jsx** chart colors (May 2026):
- `N5` (NFHS-5 palette): teal `#00b5cc`/`#007a8f` → purple `#7C3AED`/`#6D28D9`
- `YEAR_COLORS` (HMIS trend): `['#FF5500', '#B45309', '#7C3AED']` (was teal)
- `DIST_PALETTE`: all `#00b5cc`, `#007a8f`, `#1E40AF` replaced with purple/green/crimson

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

1. **V5 only** — never touch `/PIFHealthDashboard/` (v1), `/PIFHealthDashboard-v2/` (v2), `/PIFHealthDashboard-v3/` (v3), `/PIFHealthDashboard-v4/` (v4) — all frozen
2. **Git identity** — `thesinghaa <aryanjarvis32@gmail.com>` via `git config --local`. Do NOT use `--author` flag
3. **No emojis** anywhere — not in code, CSS, or commit messages
4. **CSS** — append new rules at the bottom of CSS files, never rewrite whole file
5. **Subagents** — do NOT give them access to large files without reading offsets; they will truncate
6. **NCD_compiled sheet** — do not connect until user asks
7. **No feature flags, no backwards-compat shims** — just change the code
8. **Bundle size warning** is expected (~5.8MB due to plotly.js + KD_TREE import) — acceptable, do not split unless asked
9. **Deploy** — `vercel build --prod && vercel deploy --prod --prebuilt` from `/Users/thesinghaa/PIFHealthDashboard-v5/` then alias both URLs
10. **vite.config.js** — do NOT add `if (id.includes('node_modules')) return 'vendor'` — this causes circular chunk crash (charts→vendor→charts) in production. Only split plotly, gsap, recharts/d3.
11. **Color theme** — AP Health Govt colors: Forest Green `#17823e`, Teal `#1f7d70`, Dark Blue-Teal `#2a6078` (from health.arunachal.gov.in)

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

#### 2. Programme grid (`.lnd-prog-section`) — flex child, left content area (redesigned May 2026)
- Layout: `flex: 1; min-height: 180px; max-height: 340px` — flows naturally after card header content
- Section label ("CRITICAL PROGRAMMES" etc.): `font-size: 12px; color: #ffffff; font-family: JetBrains Mono`
- Filtered by `resolvedFilter` = `activeFilter || (any red? → any yellow? → green)`
- Programme card sizing: `flex: 1` if ≤4 cards (equal width), `width: 220px; flexShrink: 0` if >4 (enables horizontal scroll)
- Scroll: `overflow-x: auto; scrollbar-width: none` — 2-finger trackpad gesture

**Programme card design (current — policymaker-focused):**
- Plotly donut (120×120px) showing KD breakdown per programme with segment glow
- Hover tooltips per segment list specific KD indicator names (`customdata` + `hovertemplate`)
- `getProgKDBrk(divisionId, progId)` — per-programme KD breakdown from KD_TREE
- `getProgKDsByStatus(divisionId, progId, status)` — returns KD objects filtered by status (for hover data)
- `getWorstKD(divisionId, progId)` — single worst KD: sorted gap>close>achieved then by deficit magnitude
- Worst KD name shown below prog name as `.lnd-pc-kd-name` (2-line clamp)
- Mini counts row (`.lnd-pc-counts`) — coloured spans: `N gap / N caution / N ok`
- Card border-top colour-coded via `--pc-clr` CSS custom prop + `lnd-prog-card--red/yellow/green` modifier
- Click on prog card → `onKDClick(worstKD, prog.id)` → navigates directly to worst KD indicator detail

Key CSS classes: `.lnd-prog-section`, `.lnd-prog-section-label`, `.lnd-prog-scroll`, `.lnd-prog-card`, `.lnd-prog-card--red`, `.lnd-prog-card--yellow`, `.lnd-prog-card--green`, `.lnd-prog-donut-center`, `.lnd-prog-dc-lbl`, `.lnd-pc-name`, `.lnd-pc-kd-name`, `.lnd-pc-counts`

#### LandingPage state for CardSummary
- `activeFilter` state (null | 'red' | 'yellow' | 'green') — resets to null on active card change
- Pill buttons toggle `activeFilter`; active pill gets `.lnd-pill--sel` class (box-shadow ring + opaque bg)
- `onKDClick` prop: `(kd, programmeId) => onDirectKD(div, programmeId, kd)` → navigates to `kd-indicator`
- `onExploreDivision` prop: `isActive ? () => onSelectDivision(div) : null` — wired from inside indicator panel

**`lnd-card-idx` header row layout (updated May 2026):**
- `#01 | Division Label` (left) + expand arrow `↗` (`.lnd-idx-expand`, stays left) + `AI Report` button (`.lnd-report-btn`, `margin-left: auto` pushes it to far right)
- CRITICAL: these are two SEPARATE `{isActive && ...}` conditionals — NOT a Fragment. Wrapping both in a Fragment would cause `margin-left: auto` to push the whole fragment right, moving the expand arrow too.
- `AI Report` button (`.lnd-report-btn`) → opens `ReportModal` for the active division
- Removed duplicate "Generate Report" button that previously appeared below the status pills

**AI Report on landing page (added May 2026):**
- `reportDiv` state in `LandingPage.jsx` — set to active division when `AI Report` clicked
- `{reportDiv && <ReportModal division={reportDiv} onClose={() => setReportDiv(null)} />}` rendered at root of `LandingPage`
- Same `ReportModal.jsx` used by `DivisionPage`

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
