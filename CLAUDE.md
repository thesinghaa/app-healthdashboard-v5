# PIF Health Dashboard V5 — CLAUDE.md

> **V5 only.** Local: `/Users/thesinghaa/PIFHealthDashboard-v5/`. V1–V4 frozen — never touch.

---

## Hard Rules

1. **V5 only** — never touch v1/v2/v3/v4
2. **Git identity** — `git config --local` sets `thesinghaa <aryanjarvis32@gmail.com>`. Never use `--author` flag
3. **No emojis** — not in UI, code, CSS, or commits
4. **CSS** — append at bottom of relevant file, never rewrite whole file
5. **Subagents** — no large files without read offsets
6. **NCD_compiled sheet** — do not connect until user asks
7. **Deploy** — `vercel build --prod && vercel deploy --prod --prebuilt` then alias both URLs
8. **vite.config.js** — do NOT add `if (id.includes('node_modules')) return 'vendor'` (circular chunk crash)
9. **CLAUDE.md** — update and commit at end of EVERY session (highest-priority rule)
10. **Bundle** — ~5.8MB with Plotly + KD_TREE is acceptable, do not split unless asked
11. **Color theme** — Forest Green `#17823e`, Teal `#1f7d70`, Dark Blue-Teal `#2a6078`

---

## Repo & Deploy

- **GitHub**: `github.com/thesinghaa/app-healthdashboard-v5`
- **Live**: `https://app-healthdashboard-v5.vercel.app` (primary, June 2026)
- **Also aliased**: `pif-health-v4.vercel.app` · `arunachalhealthdashboard.vercel.app`
- **Deploy**: `vercel build --prod && vercel deploy --prod --prebuilt` then `vercel alias set <hash> pif-health-v4.vercel.app` and `vercel alias set <hash> arunachalhealthdashboard.vercel.app`

---

## Stack

React 18 + Vite · GSAP · Plotly.js (`react-plotly.js`, lazy) · Recharts · @nivo/sankey · Plain CSS · Inter + JetBrains Mono · Static JS data + Google Sheets CSV

---

## Key Files

| File | Purpose |
|------|---------|
| `src/App.jsx` | Root router — state: `page \| program \| division \| indicator \| origin` |
| `src/pages/LandingPage.jsx` | Hero bar → stat strip → DistrictMap → Sankey → Alerts |
| `src/components/LeftSideNav.jsx` | Slide-in nav + **DivisionStoryPage** + **ProgrammeWheelPage** + KD table panel |
| `src/styles/landing-v4.css` | All landing+wheel+story CSS: `.v4l-*` `.v5-*` `.wpg-*` `.dsp-*` `.lsnav-*` `.pov-*` |
| `src/styles/ncd.css` | All other page CSS (append overrides at bottom) |
| `src/data/kdData.js` | `KD_TREE` — all ~157 KDs |
| `src/data/getDivisionStats.js` | `FACE0_PINNED` — pinned face-0 stat per division |
| `src/data/programs.js` | Division → programme metadata |
| `src/data/districtDemography.js` | 25 districts (GeoJSON mapped; 27 in demography data, 2 missing boundary shapes) AP districts: pop, area, density |
| `src/components/DistrictMap.jsx` | AP choropleth (react-simple-maps + GSAP panel) |
| `src/components/StatCard3D.jsx` | 3-face GSAP prism — frozen on face 0 |
| `api/report/[divisionId].js` | Vercel serverless report (3 Groq calls) |

---

## Navigation

```
LandingPage
  └── [left nav] → DivisionStoryPage (RCH only) → ProgrammeWheelPage
  └── DivisionPage → KDProgrammePage / HRHCadrePage
        └── KDIndicatorDetail → CurrentStatusDetailPage
```

App state keys: `page | program | division | indicator | origin`

---

## LandingPage Layout (V5, June 2026)

1. **Hero identity bar** (`.v5-hero-bar`) — golden-orange `#C8820A`, 3 role buttons
2. **Stat strip** (`.v5-stat-strip`) — 5 cards + golden pill heading "Highlights from Financial Year 2025-26"
   - Face 0 always pinned via `FACE0_PINNED` (plain text labels, no `<MarkAbbrev>`)
   - RCH: 18,024 fully immunised · NDCP: 2,314 Hep-C patients · NCD: 255 hearing aids · HSS: 408 AAMs · HRH: 96% MO-MBBS
3. **DistrictMap** — lazy loaded; choropleth + GSAP slide panel
4. **Sankey** — NHM → Divisions → Programmes → Status
5. **Critical Alerts** — top-8 gap KDs

---

## ProgrammeWheelPage (in LeftSideNav.jsx)

- 3-col grid: `left cards | wheel | right cards`
- Click segment → cards fade, header+wheel shift `x:-210px`, KD table panel slides in (`x:500→0`)
- `.wpg-frame`: bordered container (`border-radius:18px`) wraps entire layout
- `.wpg-right-box`: `position:absolute; top:24px; right:0; bottom:24px; width:55%` — compact HTML `<table>`
- Table cols: S.no | Indicator | Target | Achievement | Status
- GSAP: `gsap.to([headerRef.current, wheelRef.current], { x:-210 })` + `gsap.fromTo(panelRef.current, {x:500,opacity:0}, {x:0,opacity:1})`
- `<header ref={headerRef}>` — CRITICAL: ref must be present or GSAP crashes
- Programme icons: `/public/prog-icons/<id>.png` — `PROG_ICON_IMG` map in LeftSideNav.jsx
- Icon in wheel: `<g>` wrapper with `<defs><clipPath>` + `<image>` (NOT `<>` fragment — Babel parse error)
- KD panel IIFE: `{selected && (() => { const kdList = ...; return <div>...</div>; })()}`

---

## DivisionStoryPage (in LeftSideNav.jsx, June 2026)

Full-screen overlay before wheel. Only RCH has data. Flow: division click → story → "Explore More" → wheel.

**State**: `activeDiv` → story page (`!showWheel`) → wheel (`showWheel`)  
**Story state**: `activeStory` (useState(0)), tabs for 5 stories

**Layout**: `dsp-page` (64px header + scrollable body) → hero (title+subtitle+intro) → 5 tabs → story card → insight → Explore More button

**Story card 2-col** (`.dsp-story-grid: 1fr 1.25fr`):
- Left: hero stat + `.dsp-story-narrative` ("Why this story" box)
- Right: "What data tells?" heading + lazy Plotly horizontal bars

**RCH stories** (real KD_TREE data):
1. "Safe pregnancy, safe delivery" — ANC funnel: 95%→65%→68%→88%→70%
2. "The first week of life" — stillbirth 8.89, SNCU 88%, breastfed 85%, HBNC 54%
3. "Full immunisation by year one" — Hep-B 90%, full 91%, MR-2 95%, U-WIN 95%
4. "Iron for every age" — PW 88%, 5-9y 93%, 6-59mo 20%
5. "An unequal burden" — IUCD 33%, FPLMIS 100%, Saas-Bahu 88%

**Plotly**: `orientation:'h'`, bars reversed, count annotations, transparent bg. Lazy via `<Suspense>`.

**CSS**: `.dsp-page .dsp-header .dsp-body .dsp-hero .dsp-title .dsp-subtitle .dsp-intro .dsp-tabs .dsp-tab .dsp-tab--active .dsp-story .dsp-story-head .dsp-story-grid .dsp-story-left .dsp-story-right .dsp-story-hero .dsp-story-narrative .dsp-narrative-head .dsp-narrative-text .dsp-data-heading .dsp-chart-wrap .dsp-insights-box .dsp-explore-btn`

---

## KD Data Schema

```js
KD_TREE[divisionId].programmes[programmeId].kds = [{
  no, type, indicator, target, achievement,
  achievedLabel, hmisCode, lowerIsBetter,
  numerator, denominator
}]
```

HMIS Sheet: `1vsCSdPZpBK5SQw9gppRLEEKDLhj19DHk` — 27 KDs wired. NCD_compiled deferred.

---

## Status Logic

```js
function kdStatus(kd) {
  const ratio = kd.achievement / kd.target;
  if (kd.lowerIsBetter) return ratio <= 1 ? 'achieved' : ratio <= 1.33 ? 'close' : 'gap';
  return ratio >= 1 ? 'achieved' : ratio >= 0.75 ? 'close' : 'gap';
}
```

Division colors: RCH `#4F8EF7` · NDCP `#F7B23B` · NCD `#9B6FEB` · HSS `#2DD4BF` · HRH `#F7614F`  
Status colors: gap `#FF3B5C` · close `#FFB020` · ok `#00C97A`

---

## Report Generation

`ReportModal.jsx` → `api/report/[divisionId].js` — 3 Groq calls:  
1. `llama-3.1-8b-instant` DataCollector → 2. `llama-3.3-70b` Analyst → 3. `llama-3.3-70b` ReportWriter  
Groq keys in Vercel env (`GROQ_API_KEY` + 4 fallbacks in `.env`).

---

## AP Geography

27 districts. GeoJSON: `/public/ap-districts.geojson`. Key: `properties.DISTRICT` (title-case, e.g. `"Papum Pare"`).  
Projection: `{ center: [94.483, 28.056], scale: 2780 }` (landing map) / `{ center:[94.4,28.2], scale:7000 }` (district map).

---

## Deferred (June 2026)

- `dsp-subtitle` + `dsp-intro` max-width removal — user wants full-width (remove `max-width:700-720px; margin:auto` from `landing-v4.css`)
- Stories for NDCP, NCD, HSS, HRH divisions
- District sex-ratio map (Story 2) — awaiting data
- Family planning method-mix chart (Story 5) — awaiting data

---

## GSAP Critical Notes

- `gsap.set()` on mount required for panels that start off-screen (CSS transform ignored by GSAP)
- Never call `gsap.set(ref.current, ...)` when `ref.current` may be null (conditional render)
- Use `gsap.fromTo` in the select effect instead of `gsap.set` on mount for conditionally rendered panels
- `<header ref={headerRef}>` must have ref or GSAP animation targeting it crashes

---

## Self-Update Protocol

At session end:
1. Update this file with any new components, CSS classes, data changes, decisions, deferred items
2. `git add CLAUDE.md && git commit -m "docs: update CLAUDE.md" && git push origin main`
