"""
3-agent CrewAI pipeline for NHM division report generation.

Agent 1 — DataCollector  : structures KD + HMIS data into a briefing
Agent 2 — Analyst        : identifies priorities, trends, root causes
Agent 3 — ReportWriter   : produces the final HTML report
"""
import os
from crewai import Agent, Task, Crew, Process

# ── Model strings via LiteLLM (set GROQ_API_KEY in env) ──────────────
FAST_MODEL   = "groq/llama-3.1-8b-instant"
STRONG_MODEL = "groq/llama-3.3-70b-versatile"


def build_crew(division_summary: str, hmis_summary: str,
               div_full_name: str, charts: dict) -> Crew:

    chart_context = "\n".join(
        f"[CHART:{k}] is embedded in the report as a base64 PNG."
        for k, v in charts.items() if v
    )

    # ── Agent 1: DataCollector ────────────────────────────────────────
    collector = Agent(
        role="NHM Data Aggregator",
        goal=(
            "Compile a concise, structured performance briefing for the "
            f"{div_full_name} division so analysts can immediately understand "
            "the current programme situation."
        ),
        backstory=(
            "You are a data analyst at Pahlé India Foundation (PIF), embedded "
            "with the NHM Arunachal Pradesh team. You know how to read HMIS "
            "data, interpret KD achievement ratios, and flag issues precisely."
        ),
        llm=FAST_MODEL,
        verbose=False,
        allow_delegation=False,
    )

    task_collect = Task(
        description=(
            f"You have been given raw KD data and HMIS trends for the "
            f"{div_full_name} (NHM Arunachal Pradesh).\n\n"
            f"=== KD DATA ===\n{division_summary}\n\n"
            f"=== HMIS LIVE DATA ===\n{hmis_summary}\n\n"
            "Produce a structured data briefing with:\n"
            "1. Overall division snapshot (total programmes, KD counts by status)\n"
            "2. Per-programme performance table (programme name, status, KD achieved/caution/gap, key concern)\n"
            "3. Top 5 most critical KD gaps with exact numbers\n"
            "4. Top 3 best-performing KDs\n"
            "5. HMIS trend observations (if data available)\n"
            "6. NFHS baseline movement (key indicators that improved or regressed)\n"
            "Be precise with numbers. Do not add commentary or recommendations yet."
        ),
        expected_output=(
            "A structured text briefing with sections: Division Snapshot, "
            "Programme Performance Table, Critical KD Gaps, Best Performers, "
            "HMIS Trends, NFHS Baseline Movement."
        ),
        agent=collector,
    )

    # ── Agent 2: Analyst ─────────────────────────────────────────────
    analyst = Agent(
        role="Public Health Programme Analyst",
        goal=(
            "Identify the most important performance patterns, root causes, "
            "and actionable priorities for the division — framed for a senior "
            "health officer who must decide where to focus resources."
        ),
        backstory=(
            "You are a senior programme analyst with 10 years in public health "
            "monitoring in India. You understand NHM structures, district-level "
            "constraints in remote tribal states, and how to translate data into "
            "strategic priorities that DHS-level officers can act on."
        ),
        llm=STRONG_MODEL,
        verbose=False,
        allow_delegation=False,
    )

    task_analyse = Task(
        description=(
            "Using the data briefing provided, produce a deep analytical assessment:\n"
            "1. TOP 3 CRITICAL PRIORITIES — programmes/KDs needing immediate attention "
            "   with likely root causes (supply chain, HR, training, awareness, infra)\n"
            "2. POSITIVE FINDINGS — what is genuinely working and why it matters\n"
            "3. SYSTEMIC PATTERNS — cross-programme issues (e.g. HR gaps affecting "
            "   multiple programmes, infrastructure bottlenecks)\n"
            "4. RISK ASSESSMENT — which gaps pose the highest risk to beneficiaries "
            "   and SDG targets\n"
            "5. STRATEGIC RECOMMENDATIONS — 5 to 7 specific, actionable recommendations "
            "   suitable for a Division Head / DHS to implement within 1-2 quarters\n"
            "Write in clear officer-facing language. Be specific, not generic."
        ),
        expected_output=(
            "A structured analysis with: Critical Priorities, Positive Findings, "
            "Systemic Patterns, Risk Assessment, Strategic Recommendations."
        ),
        agent=analyst,
        context=[task_collect],
    )

    # ── Agent 3: ReportWriter ─────────────────────────────────────────
    writer = Agent(
        role="Senior Health Report Writer",
        goal=(
            f"Produce a polished, authoritative 4-5 page HTML report on "
            f"{div_full_name} division performance — suitable for a senior "
            "NHM officer to read, present, and share."
        ),
        backstory=(
            "You write executive health reports for government health departments "
            "in India. Your reports are clear, data-driven, and structured so "
            "a busy district officer can act on them in under 10 minutes. "
            "You produce clean, self-contained HTML with inline CSS — no external deps."
        ),
        llm=STRONG_MODEL,
        verbose=False,
        allow_delegation=False,
    )

    task_write = Task(
        description=(
            f"Write a complete HTML report for {div_full_name} division. "
            "Use all data from the briefing and analysis provided.\n\n"
            f"Charts available (use placeholder tags exactly as shown):\n{chart_context}\n\n"
            "REPORT STRUCTURE (all sections required):\n"
            "1. Header — division name, 'NHM Arunachal Pradesh', date, PIF logo placeholder\n"
            "2. Executive Summary — 2-3 sentences: overall health of the division\n"
            "3. Division Scorecard — HTML table: Programme | Status badge | Key Metric | KD Achievement | Trend\n"
            "4. Critical Priorities — 1 card per critical programme: what the issue is, "
            "   what the data shows, what must change\n"
            "5. What is Working — 2-3 bright spots with specific numbers\n"
            "6. HMIS Trend Observations — bullet list of monthly data patterns\n"
            "7. Strategic Recommendations — numbered list, 5-7 items, each with a "
            "   responsible party and timeline\n"
            "8. Appendix — full KD data table (Programme | Indicator | Target | Achievement | Status)\n\n"
            "STYLING RULES:\n"
            "- Self-contained HTML with ALL CSS inline or in a <style> block\n"
            "- Light background (#f8f9fa), PIF orange (#FF5500) for headings/accents\n"
            "- Inter font (load from Google Fonts)\n"
            "- Status badges: red=#fee2e2/text #991b1b, amber=#fef3c7/text #92400e, green=#d1fae5/text #065f46\n"
            "- Max width 900px, centered, A4-friendly for printing\n"
            "- Where a chart should appear, output: <!--CHART:status_donut--> etc.\n"
            "- DO NOT use markdown, only valid HTML\n"
            "- Make it look professional — this will be printed and shared"
        ),
        expected_output=(
            "A complete, valid HTML document string (starting with <!DOCTYPE html>) "
            "with all 8 sections, proper styling, and chart placeholders."
        ),
        agent=writer,
        context=[task_collect, task_analyse],
    )

    return Crew(
        agents=[collector, analyst, writer],
        tasks=[task_collect, task_analyse, task_write],
        process=Process.sequential,
        verbose=False,
    )


def run_report(division_summary: str, hmis_summary: str,
               div_full_name: str, charts: dict) -> str:
    crew = build_crew(division_summary, hmis_summary, div_full_name, charts)
    result = crew.kickoff()
    return str(result)
