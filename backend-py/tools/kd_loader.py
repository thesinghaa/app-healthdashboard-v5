import json, os, textwrap
from pathlib import Path

_DATA_PATH = Path(__file__).parent.parent / "kd_data.json"
_cache: dict | None = None


def _load() -> dict:
    global _cache
    if _cache is None:
        with open(_DATA_PATH) as f:
            _cache = json.load(f)
    return _cache


def get_division_summary(division_id: str) -> str:
    data = _load()
    div = data.get(division_id)
    if not div:
        return f"Division '{division_id}' not found."

    lines = [
        f"DIVISION: {div['fullName']} ({div['label']})",
        f"Total programmes: {len(div['programmes'])}",
        "",
    ]

    for prog_id, prog in div["programmes"].items():
        kds = prog.get("kds", [])
        achieved = close = gap = neutral = 0
        gap_kds, close_kds = [], []

        for kd in kds:
            t, a = kd.get("target"), kd.get("achievement")
            if t is None or a is None or t == 0:
                neutral += 1
                continue
            ratio = a / t
            if kd.get("lowerIsBetter"):
                if ratio <= 1.00:   achieved += 1
                elif ratio <= 1.33: close += 1; close_kds.append(kd)
                else:               gap += 1;   gap_kds.append(kd)
            else:
                if ratio >= 1.00:   achieved += 1
                elif ratio >= 0.75: close += 1; close_kds.append(kd)
                else:               gap += 1;   gap_kds.append(kd)

        total_scored = achieved + close + gap
        lines += [
            f"── PROGRAMME: {prog['name']} | Status: {prog['status'].upper()}",
            f"   Key metric: {prog.get('keyMetric', 'N/A')}",
            f"   KD scores: {achieved} achieved / {close} caution / {gap} gap (of {total_scored} scored, {neutral} neutral)",
        ]
        if prog.get("summary"):
            lines.append(f"   Summary: {prog['summary']}")
        if gap_kds:
            lines.append("   GAP indicators (achievement < 75% of target):")
            for kd in gap_kds[:5]:
                t, a = kd['target'], kd['achievement']
                pct = round((a / t) * 100) if t else 0
                lines.append(f"     • {kd['indicator']}: target={kd['targetLabel']}, achieved={kd['achievedLabel']} ({pct}% of target)")
        if close_kds:
            lines.append("   CAUTION indicators (75–99% of target):")
            for kd in close_kds[:3]:
                t, a = kd['target'], kd['achievement']
                pct = round((a / t) * 100) if t else 0
                lines.append(f"     • {kd['indicator']}: target={kd['targetLabel']}, achieved={kd['achievedLabel']} ({pct}% of target)")
        if prog.get("observations"):
            lines.append("   Key observations:")
            for obs in prog["observations"][:3]:
                lines.append(f"     - {obs}")
        if prog.get("nfhsData"):
            lines.append("   NFHS trend (select indicators):")
            for nf in prog["nfhsData"][:4]:
                direction = "↓ lower is better" if nf.get("lowerIsBetter") else "↑ higher is better"
                lines.append(f"     • {nf['label']}: NFHS-4={nf['nfhs4']}% → NFHS-5={nf['nfhs5']}% ({direction})")
        lines.append("")

    return "\n".join(lines)


def get_raw_division(division_id: str) -> dict:
    return _load().get(division_id, {})
