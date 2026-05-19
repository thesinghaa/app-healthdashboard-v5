# Design Audit — Kerala eHealth Dashboard
**URL**: https://dashboard.ehealth.kerala.gov.in  
**Audit date**: May 2026  
**Auditor**: PIF Health Dashboard V3 project  
**Purpose**: UI/UX learning reference — architecture, structure, design patterns, colour, typography observations to inform V3 decisions

---

## 1. First Impressions

The Kerala dashboard is a **government-grade administrative portal** — functional, data-complete, but not designed for interpretive storytelling. It answers "what data do we have?" rather than "what does this data mean?". The visual hierarchy is flat — everything is given equal weight, so nothing stands out as urgent or actionable.

**Immediate contrast with V3:** V3 leads with programme status (Critical/Caution/On Track), Kerala leads with system modules. Kerala is for administrators; V3 is designed for programme officers and decision-makers.

---

## 2. Framework & Technical Architecture

| Property | Value |
|---|---|
| Base framework | AdminLTE 2.x (open-source admin template on Bootstrap 3) |
| Version | 2.7.8.178 |
| Last updated | May 13, 2026 |
| Rendering | Server-side / partial JS — some views are static HTML tables |
| Routing | Hash-based (`/#`) |
| Charts | Likely Chart.js or Highcharts (standard AdminLTE integrations) |
| Tables | DataTables.js (filterable, sortable) |
| Auth | Session-based login (separate login route) |

**Key observation:** AdminLTE is a theme, not a purpose-built system. This means the dashboard inherits all of Bootstrap's generic visual language — grids, cards, buttons — none of it was designed with health data in mind. It works, but it doesn't communicate.

---

## 3. Information Architecture

### 3.1 Navigation Structure
```
Landing Page (public)
├── eHealth Project       → Hospital management stats
├── Covid-19 Death        → Death management system
├── Dept of Homeopathy    → Consultation statistics
├── NCD Survey            → Population-based NCD data
├── Health Innovation Zone → Blood bag monitoring
└── ABDM Kerala           → Ayushman Bharat Digital Mission

External Links (header nav)
├── SDHM Website
├── GoK Dashboard
├── eHealth Covid Dashboard
├── Kerala Health Portal
├── Kerala.gov.in
└── Book Your Appointment
```

**UX observation:** The top-level split between modules and external links creates two competing navigation systems. A first-time user doesn't know which to use. The external links look as important as the core modules — no visual hierarchy between "this dashboard" and "other sites".

### 3.2 Depth of Navigation
- Appears to be **2–3 layers deep**: Landing → Module → Data table/chart
- No breadcrumb visible — users can get disoriented on sub-pages
- No global search across modules

### 3.3 Entry Points
- Public landing page shows all 6 modules — no login required to see module list
- Deeper data may be behind authentication (login route exists)
- No onboarding or orientation for new users

---

## 4. Layout & Grid System

### Landing Page Layout
- **Header**: Logo left + navigation right (standard AdminLTE topbar)
- **Hero section**: Dashboard title "State Digital Health Mission" centred
- **Module cards**: 3-column grid (Bootstrap col-md-4), 6 cards total
- **Data tables**: Full-width below module cards, with filter controls above
- **Footer**: Links row + version + copyright

### Card Layout (Module Cards)
```
┌─────────────────────────────┐
│  [Icon / image]             │
│  Module Title (H4, bold)    │
│  Short description (p)      │
│  [ Visit → ] button         │
└─────────────────────────────┘
```
- Cards are equal size — no proportional weighting by importance
- No status indicator on any card — you don't know if a module has critical data
- CTA is a generic "Visit" — doesn't tell you what you'll find
- No key metric surfaced on the card itself — you must click in to see any numbers

**What V3 does differently:** Each card surfaces the key metric + status immediately. You can read the health of a programme without clicking anything.

---

## 5. Colour System

Based on AdminLTE 2.x defaults (confirmed by framework identification):

| Usage | Colour | Hex |
|---|---|---|
| Primary / brand | Dark blue | `#222d32` (sidebar) |
| Header background | Light blue | `#3c8dbc` |
| Body background | Off-white | `#ecf0f5` |
| Card background | White | `#ffffff` |
| Success / green | Bootstrap green | `#00a65a` |
| Warning / amber | Bootstrap yellow | `#f39c12` |
| Danger / red | Bootstrap red | `#dd4b39` |
| Info / teal | Bootstrap teal | `#00c0ef` |
| Text primary | Near-black | `#333333` |
| Text muted | Grey | `#777777` |
| Border | Light grey | `#d2d6de` |

**Colour audit observations:**
- Colour is used functionally (status badges) but not expressively — no brand personality
- The blue/grey palette is cold and institutional — appropriate for a government system, but does not evoke health, care, or urgency
- No ambient colour — pages feel flat because background is always the same `#ecf0f5`
- Status colours (green/amber/red) are Bootstrap defaults — globally recognised but visually generic
- No gradient, no glass, no depth — purely flat 2D

**Contrast with V3:** V3 uses warm orange (`#FF5500`) as a primary accent — communicates urgency and warmth. Background gradients and glass morphism give depth. The Kerala dashboard has zero visual warmth.

---

## 6. Typography

| Element | Font | Weight | Size (est.) |
|---|---|---|---|
| Dashboard title | Source Sans Pro (AdminLTE default) | 300–400 | ~24px |
| Module titles | Source Sans Pro | 600–700 | ~18px |
| Body / descriptions | Source Sans Pro | 400 | 14px |
| Table data | Source Sans Pro | 400 | 13px |
| Labels / badges | Source Sans Pro | 600 | 11–12px |

**Typography observations:**
- Single typeface throughout — no typographic hierarchy signal between data types
- No serif or display font for headings — everything reads as body text
- Numbers (KPIs, counts) use the same font as labels — metrics don't stand out
- Line height and letter spacing are Bootstrap defaults — adequate but not optimised for data reading
- No use of monospace for numbers — alignment in tables can be inconsistent

**V3 contrast:** V3 uses three fonts with purpose — Playfair Display (editorial authority for headings), Inter (UI clarity for labels), JetBrains Mono (numerical precision for metrics). Each typeface signals what type of information it carries.

---

## 7. Data Presentation Patterns

### 7.1 What's Used
- **DataTables**: Filterable/sortable tables — the primary data display pattern
- **Filters**: Date range picker, dropdown selects (hospital name, type, district)
- **Stat counters**: Likely big number cards at top of sub-pages (AdminLTE info-box pattern)
- **Charts**: Present in sub-pages (chart type unknown from fetch — likely bar/line)

### 7.2 Table-First Design
The Kerala dashboard is fundamentally **table-first** — data is presented as rows and columns. This is great for:
- Exporting and auditing
- Finding a specific hospital or district
- Precise comparison

But weak for:
- Seeing patterns and trends at a glance
- Understanding programme health across dimensions
- Non-expert users who need interpretation, not raw data

### 7.3 What's Missing
- No target vs. achievement comparison visible
- No status classification logic (what makes something "on track" vs. "failing")
- No district-level heat mapping or geographic visualisation
- No trend lines or time-series at the module card level
- No "so what" layer — data is presented without interpretation

---

## 8. Navigation & UX Patterns

### Strengths
- **Multi-system integration**: Links to 6+ related portals — recognises the ecosystem
- **Filter granularity**: District + facility type + date range is good — respects the user's need to narrow
- **Modular architecture**: Each programme/scheme is a separate module — easy to add new ones
- **Public access**: No login needed for top-level data — promotes transparency

### Weaknesses
- **No global search**: Can't search "Kozhikode" or "ANC" across all modules simultaneously
- **No drill-down from map**: No geographic visualisation despite district-level data existing
- **No status dashboard**: No single view showing which modules/districts are performing well vs. poorly
- **Navigation confusion**: Module cards and external links look identical — no visual distinction
- **No mobile optimisation apparent**: AdminLTE 2.x has Bootstrap 3 responsive but not mobile-first
- **No loading states**: JS-heavy pages may show blank content before render
- **No contextual help**: No tooltips, no indicator definitions, no methodology notes

---

## 9. Information Density

Kerala's dashboard is **low density by default** — each module gets a card, each card has one sentence. Sub-pages presumably have more data but the landing communicates very little at a glance.

The user has to know what to look for and click into it. For an expert (state health officer who visits daily), this is fine. For an outsider or PIF reviewing programme performance, it provides no orientation.

**V3 design principle derived from this:** Surface the maximum meaningful signal on the landing page. The 5-column layout shows 37 programme statuses without a single click.

---

## 10. Branding & Identity

- Dual branding: **AdminLTE logo** (third-party template branding visible) + **eHealth Kerala**
- No strong visual identity — the template's personality dominates
- Government colours (blue, white) but no Kerala-specific design language
- Footer is purely functional — version number, copyright, links

**Observation:** The fact that AdminLTE's own logo appears suggests the template was deployed without full white-labelling. This is common in government IT — speed of delivery prioritised over brand consistency.

---

## 11. Accessibility

Based on AdminLTE 2.x known characteristics:
- Bootstrap 3 grid is responsive but not fully accessible (WCAG AA)
- Form inputs likely have label associations
- Colour contrast: some AdminLTE default combinations fail 4.5:1 ratio (grey text on light bg)
- No dark mode
- No font-size scaling controls
- Icons likely use FontAwesome — screen reader compatibility depends on aria-label usage

---

## 12. Performance

- AdminLTE 2.x ships with jQuery, Bootstrap, DataTables, and chart libraries — **heavy baseline JS bundle**
- No evidence of lazy loading or code splitting
- Static assets likely served from NIC/government servers — variable latency
- Hash-based routing means full page load on navigation changes

---

## 13. Comparative Summary: Kerala vs. PIF V3

| Dimension | Kerala eHealth | PIF V3 |
|---|---|---|
| Primary audience | System administrators, IT staff | Programme officers, decision-makers |
| Data philosophy | Show all data, let user filter | Surface status first, drill on demand |
| Landing page signal | 6 module cards, no metrics | 37 programme statuses, key metrics |
| Visual language | Generic Bootstrap/AdminLTE | Purpose-built glass morphism |
| Colour | Cold blue/grey, status = generic | Warm orange accent, status = designed |
| Typography | Single font (Source Sans Pro) | 3-font hierarchy (Playfair/Inter/JetBrains Mono) |
| Search | None (global), table filters only | Deep search across all KDs + aliases |
| Status logic | None visible | On Track / Caution / Critical with thresholds |
| Geographic | None visible | District breakdown in KD detail layer |
| Mobile | Bootstrap 3 responsive | dvh-based, but desktop-first by design |
| Target vs achievement | Not surfaced | Core of every KD |
| Framework | AdminLTE (template) | Custom React + Vite |

---

## 14. Key Learnings for V3

1. **Status must be visible at tier 1** — Kerala buries data behind clicks. V3 is right to surface status on the landing page.
2. **Filter UX matters** — Kerala's date/district/type filters are genuinely useful. V3 search bar is a start; district filter on the landing page could be a V4 feature.
3. **Multi-system links are valuable** — Kerala links out to 6 portals. V3 could link to HMIS, NPCC documents, or district reports contextually.
4. **Module-based architecture scales** — Kerala's 6-module approach is easy to extend. V3's 5-division architecture follows the same principle.
5. **Generic templates communicate generic care** — AdminLTE tells users this is a standard deployment. V3's custom design communicates PIF's investment in the work.
6. **Public access builds trust** — Kerala's public landing page is a transparency signal. V3 is currently public — maintain this.
7. **Table export is a real need** — Kerala's DataTables presumably allow CSV export. V3 has no export yet — worth adding for programme officers who need to report.

---

## 15. Sites to Audit Next

For continued learning, recommend auditing:
- **HMIS NHM Dashboard** (hmis.nhp.gov.in) — national-level programme data
- **NHP Dashboard** (nhp.gov.in) — Ministry of Health national statistics
- **NITI Aayog SDG Dashboard** (sdgindiaindex.niti.gov.in) — best-in-class Indian govt data viz
- **Our World in Data** (ourworldindata.org/health) — gold standard for health data storytelling
- **GOV.UK Design System** (design-system.service.gov.uk) — best practice for govt UI/UX

---

*This file should be updated whenever a new dashboard or design reference is audited. Keep one site per major section.*
