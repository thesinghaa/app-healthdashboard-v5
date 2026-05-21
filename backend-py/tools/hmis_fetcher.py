import httpx, csv, io
from collections import defaultdict

SHEET_ID = "1vsCSdPZpBK5SQw9gppRLEEKDLhj19DHk"
CSV_URL = f"https://docs.google.com/spreadsheets/d/{SHEET_ID}/gviz/tq?tqx=out:csv&sheet=Sheet1"

# Category labels
CAT_LABELS = {
    "M1": "ANC",
    "M2": "Delivery",
    "M3": "C-section",
    "M4": "Child Health",
    "M5": "Nutrition",
    "M8": "Family Planning",
    "M9": "Immunization",
}

# Division → relevant HMIS categories
DIV_CATS = {
    "rch":  ["M1", "M2", "M3", "M4", "M5", "M8", "M9"],
    "ndcp": [],
    "ncd":  [],
    "hss":  [],
    "hrh":  [],
}

# Key indicators to highlight per division
DIV_KEY_CODES = {
    "rch": ["1.1", "1.1.1", "2.2", "9.2.5.a", "1.2.4", "8.4"],
}


def _parse_csv(text: str) -> list[list[str]]:
    rows = []
    for row in csv.reader(io.StringIO(text.strip())):
        rows.append([c.strip() for c in row])
    return rows


def fetch_hmis_summary(division_id: str) -> str:
    relevant_cats = DIV_CATS.get(division_id, [])
    if not relevant_cats:
        return "No HMIS live data configured for this division."

    try:
        resp = httpx.get(CSV_URL, timeout=15)
        resp.raise_for_status()
    except Exception as e:
        return f"HMIS fetch failed: {e}"

    rows = _parse_csv(resp.text)
    if len(rows) < 2:
        return "HMIS data unavailable."

    header = rows[0]
    # Columns: Year, Month, Category, Data Item Code, Data Item Name, [districts...]
    try:
        yr_i  = header.index("Year")
        mo_i  = header.index("Month")
        cat_i = header.index("Category")
        cod_i = header.index("Data Item Code")
        nam_i = header.index("Data Item Name")
        dist_cols = list(range(5, len(header)))
    except ValueError:
        return "HMIS CSV header format unexpected."

    key_codes = set(DIV_KEY_CODES.get(division_id, []))
    monthly: dict[str, dict[str, list]] = defaultdict(lambda: defaultdict(list))

    for row in rows[1:]:
        if len(row) <= max(cat_i, cod_i, nam_i):
            continue
        cat  = row[cat_i]
        code = row[cod_i]
        name = row[nam_i]
        yr   = row[yr_i]
        mo   = row[mo_i]

        if cat not in relevant_cats:
            continue
        if key_codes and code not in key_codes:
            continue

        try:
            state_total = sum(
                float(row[i].replace(",", "")) for i in dist_cols
                if i < len(row) and row[i].strip() not in ("", "-", "N/A")
            )
        except ValueError:
            continue

        monthly[f"{code}|{name}"][f"{yr}-{mo}"].append(state_total)

    if not monthly:
        return "No matching HMIS indicators found for this division."

    lines = ["HMIS LIVE DATA SUMMARY (state totals, recent months):"]
    for key, months in list(monthly.items())[:8]:
        code, name = key.split("|", 1)
        sorted_months = sorted(months.items())[-6:]
        trend = ", ".join(f"{m}: {int(sum(v)):,}" for m, v in sorted_months)
        lines.append(f"  [{code}] {name}")
        lines.append(f"    Trend: {trend}")

    return "\n".join(lines)
