"""
FastAPI server — POST /api/report/{division_id}
Returns: { html: string }
"""
import os, re
from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from tools.kd_loader    import get_division_summary, get_raw_division
from tools.hmis_fetcher import fetch_hmis_summary
from tools.chart_gen    import generate_all_charts
from crew_report        import run_report

app = FastAPI(title="PIF Health Report API", version="1.0.0")

origins = [o.strip() for o in os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,https://pif-health-dashboard-v3.vercel.app"
).split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["*"],
)

VALID_DIVISIONS = {"rch", "ndcp", "ncd", "hss", "hrh"}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/report/{division_id}")
async def generate_report(division_id: str):
    if division_id not in VALID_DIVISIONS:
        raise HTTPException(status_code=404, detail=f"Unknown division: {division_id}")

    # 1. Load KD data
    div_raw     = get_raw_division(division_id)
    div_summary = get_division_summary(division_id)
    div_name    = div_raw.get("fullName", division_id.upper())

    # 2. Fetch HMIS live data
    hmis_summary = fetch_hmis_summary(division_id)

    # 3. Generate matplotlib charts
    charts = generate_all_charts(div_raw)

    # 4. Run CrewAI 3-agent pipeline
    try:
        html_raw = run_report(div_summary, hmis_summary, div_name, charts)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {e}")

    # 5. Inject base64 chart images into the HTML
    html = html_raw
    for chart_key, chart_b64 in charts.items():
        if not chart_b64:
            continue
        placeholder = f"<!--CHART:{chart_key}-->"
        img_tag = (
            f'<img src="data:image/png;base64,{chart_b64}" '
            f'alt="{chart_key}" style="width:100%;max-width:680px;'
            f'border-radius:8px;margin:16px 0;display:block;" />'
        )
        html = html.replace(placeholder, img_tag)

    return {"html": html, "division": div_name}
