/* ═══════════════════════════════════════════════════════════════════════════
   districtDemography.js
   District-level demographic data for Arunachal Pradesh — all 27 districts.

   Sources:
   - Census of India 2011 (Primary Census Abstract) — actuals for original 16
   - Wikipedia / citypopulation.de — estimates for post-2011 districts
   - 2021 projected: 2011 figures × 1.22 (AP decadal growth rate ~22%, NE India
     slowdown trend; Census 2025 not yet released as of May 2026)
   - Newer districts (carved after 2011): population = area carved from parent
     district at the time of the 2011 census (estimated from parent district totals)

   Keys match GeoJSON properties.DISTRICT exactly (title-case).
   ═══════════════════════════════════════════════════════════════════════════ */

export const DISTRICT_DEMOGRAPHY = {
  'Anjaw': {
    hq:          'Hawai',
    pop2011:     21089,
    pop2021:     25729,
    areaSqKm:    6190,
    density2011: 3,
    source:      'Census 2011',
  },
  'Bichom': {
    hq:          'Nafra',
    pop2011:     9710,
    pop2021:     11846,
    areaSqKm:    2897,
    density2011: 3,
    source:      'Est. — carved from West Kameng (2024)',
  },
  'Changlang': {
    hq:          'Changlang',
    pop2011:     147951,
    pop2021:     180500,
    areaSqKm:    4662,
    density2011: 32,
    source:      'Census 2011',
  },
  'Dibang Valley': {
    hq:          'Anini',
    pop2011:     7948,
    pop2021:     9697,
    areaSqKm:    9129,
    density2011: 1,
    source:      'Census 2011',
  },
  'East Kameng': {
    hq:          'Seppa',
    pop2011:     40799,
    pop2021:     49775,
    areaSqKm:    2500,
    density2011: 16,
    source:      'Census 2011 adjusted (Kamle + Pakke Kessang carved)',
  },
  'East Siang': {
    hq:          'Pasighat',
    pop2011:     32099,
    pop2021:     39161,
    areaSqKm:    2005,
    density2011: 16,
    source:      'Census 2011 adjusted (Siang + Leparada carved)',
  },
  'Kamle': {
    hq:          'Raga',
    pop2011:     22256,
    pop2021:     27152,
    areaSqKm:    1500,
    density2011: 15,
    source:      'Est. — carved from East Kameng (2018)',
  },
  'Keyi Panyor': {
    hq:          'Yachuli',
    pop2011:     28000,
    pop2021:     34160,
    areaSqKm:    1200,
    density2011: 23,
    source:      'Est. — carved from Papum Pare + East Kameng (2023)',
  },
  'Kra Daadi': {
    hq:          'Jamin',
    pop2011:     22290,
    pop2021:     27194,
    areaSqKm:    2202,
    density2011: 10,
    source:      'Est. — carved from Kurung Kumey (2015)',
  },
  'Kurung Kumey': {
    hq:          'Koloriang',
    pop2011:     67427,
    pop2021:     82261,
    areaSqKm:    6600,
    density2011: 10,
    source:      'Census 2011 adjusted (Kra Daadi carved)',
  },
  'Leparada': {
    hq:          'Basar',
    pop2011:     35000,
    pop2021:     42700,
    areaSqKm:    1800,
    density2011: 19,
    source:      'Est. — carved from East Siang (2018)',
  },
  'Lohit': {
    hq:          'Tezu',
    pop2011:     49588,
    pop2021:     60497,
    areaSqKm:    1700,
    density2011: 29,
    source:      'Census 2011 adjusted (Namsai carved)',
  },
  'Longding': {
    hq:          'Longding',
    pop2011:     60000,
    pop2021:     73200,
    areaSqKm:    1200,
    density2011: 50,
    source:      'Est. — carved from Tirap (2012)',
  },
  'Lower Dibang Valley': {
    hq:          'Roing',
    pop2011:     53986,
    pop2021:     65862,
    areaSqKm:    3900,
    density2011: 14,
    source:      'Census 2011',
  },
  'Lower Siang': {
    hq:          'Likabali',
    pop2011:     80597,
    pop2021:     98328,
    areaSqKm:    3500,
    density2011: 23,
    source:      'Est. — carved from West Siang (2018)',
  },
  'Lower Subansiri': {
    hq:          'Ziro',
    pop2011:     82839,
    pop2021:     101063,
    areaSqKm:    3460,
    density2011: 24,
    source:      'Census 2011',
  },
  'Namsai': {
    hq:          'Namsai',
    pop2011:     95950,
    pop2021:     117059,
    areaSqKm:    1587,
    density2011: 60,
    source:      'Est. — carved from Lohit (2014)',
  },
  'Pakke Kessang': {
    hq:          'Lemmi',
    pop2011:     15358,
    pop2021:     18737,
    areaSqKm:    1400,
    density2011: 11,
    source:      'Est. — carved from East Kameng (2018)',
  },
  'Papum Pare': {
    hq:          'Yupia',
    pop2011:     148385,
    pop2021:     181030,
    areaSqKm:    2200,
    density2011: 67,
    source:      'Census 2011 adjusted (Keyi Panyor carved)',
  },
  'Shi Yomi': {
    hq:          'Tato',
    pop2011:     13310,
    pop2021:     16238,
    areaSqKm:    2875,
    density2011: 5,
    source:      'Est. — carved from West Siang (2018)',
  },
  'Siang': {
    hq:          'Boleng',
    pop2011:     31920,
    pop2021:     38942,
    areaSqKm:    2919,
    density2011: 11,
    source:      'Est. — carved from East Siang (2015)',
  },
  'Tawang': {
    hq:          'Tawang',
    pop2011:     49950,
    pop2021:     60939,
    areaSqKm:    2085,
    density2011: 24,
    source:      'Census 2011',
  },
  'Tirap': {
    hq:          'Khonsa',
    pop2011:     51975,
    pop2021:     63410,
    areaSqKm:    1162,
    density2011: 45,
    source:      'Census 2011 adjusted (Longding carved)',
  },
  'Upper Siang': {
    hq:          'Yingkiong',
    pop2011:     33146,
    pop2021:     40438,
    areaSqKm:    6188,
    density2011: 5,
    source:      'Census 2011',
  },
  'Upper Subansiri': {
    hq:          'Daporijo',
    pop2011:     83205,
    pop2021:     101510,
    areaSqKm:    7032,
    density2011: 12,
    source:      'Census 2011',
  },
  'West Kameng': {
    hq:          'Bomdila',
    pop2011:     77303,
    pop2021:     94310,
    areaSqKm:    4525,
    density2011: 17,
    source:      'Census 2011 adjusted (Bichom carved)',
  },
  'West Siang': {
    hq:          'Aalo',
    pop2011:     18365,
    pop2021:     22406,
    areaSqKm:    1901,
    density2011: 10,
    source:      'Census 2011 adjusted (Lower Siang + Shi Yomi carved)',
  },
};

/* ── Derived helpers ────────────────────────────────────────────────────── */

/** Total state population (sum of all districts) */
export const STATE_POP_2011 = Object.values(DISTRICT_DEMOGRAPHY)
  .reduce((s, d) => s + d.pop2011, 0);

export const STATE_POP_2021 = Object.values(DISTRICT_DEMOGRAPHY)
  .reduce((s, d) => s + d.pop2021, 0);

/** Population quintile for heatmap (1 = least populous, 5 = most) */
export function popQuintile(districtName) {
  const pops = Object.values(DISTRICT_DEMOGRAPHY).map(d => d.pop2021).sort((a, b) => a - b);
  const pop  = DISTRICT_DEMOGRAPHY[districtName]?.pop2021 ?? 0;
  const idx  = pops.indexOf(pop);
  return Math.ceil(((idx + 1) / pops.length) * 5);
}

/** Population density category */
export function densityCategory(districtName) {
  const d = DISTRICT_DEMOGRAPHY[districtName]?.density2011 ?? 0;
  if (d <= 5)  return 'very-sparse';   // <5 /km²
  if (d <= 15) return 'sparse';        // 5-15 /km²
  if (d <= 35) return 'moderate';      // 15-35 /km²
  return 'dense';                      // >35 /km²
}
