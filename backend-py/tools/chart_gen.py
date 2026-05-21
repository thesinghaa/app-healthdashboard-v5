import base64, io, math
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
from matplotlib.patches import FancyArrowPatch

PALETTE = {
    "gap":      "#D93258",
    "close":    "#C8780A",
    "achieved": "#149650",
    "bg":       "#0a1628",
    "text":     "#ffffff",
    "subtext":  "#b8ccd8",
    "org":      "#FF5500",
}


def _to_base64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=150, bbox_inches="tight",
                facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)
    return base64.b64encode(buf.read()).decode()


def programme_status_donut(div_data: dict) -> str:
    programmes = div_data.get("programmes", {})
    counts = {"red": 0, "yellow": 0, "green": 0}
    for p in programmes.values():
        s = p.get("status", "yellow")
        counts[s] = counts.get(s, 0) + 1

    labels  = ["Critical", "Caution", "On Track"]
    values  = [counts["red"], counts["yellow"], counts["green"]]
    colors  = [PALETTE["gap"], PALETTE["close"], PALETTE["achieved"]]
    values  = [max(v, 0) for v in values]

    fig, ax = plt.subplots(figsize=(4, 4), facecolor=PALETTE["bg"])
    ax.set_facecolor(PALETTE["bg"])

    wedges, _ = ax.pie(
        [max(v, 0.01) for v in values],
        colors=colors,
        startangle=90,
        wedgeprops=dict(width=0.52, edgecolor=PALETTE["bg"], linewidth=2),
        counterclock=False,
    )

    total = sum(values)
    ax.text(0, 0.08, str(total), ha="center", va="center",
            fontsize=26, fontweight="bold", color=PALETTE["text"])
    ax.text(0, -0.22, "Programmes", ha="center", va="center",
            fontsize=9, color=PALETTE["subtext"])

    legend = [mpatches.Patch(color=c, label=f"{l} ({v})")
              for l, v, c in zip(labels, values, colors) if v > 0]
    ax.legend(handles=legend, loc="lower center", bbox_to_anchor=(0.5, -0.18),
              ncol=3, frameon=False,
              labelcolor=PALETTE["text"], fontsize=8)
    ax.set_title(f"{div_data.get('label','Division')} Programme Status",
                 color=PALETTE["text"], fontsize=11, pad=12)

    return _to_base64(fig)


def top_critical_kds_chart(div_data: dict, n: int = 8) -> str:
    rows = []
    for prog in div_data.get("programmes", {}).values():
        for kd in prog.get("kds", []):
            t, a = kd.get("target"), kd.get("achievement")
            if not t or a is None or t == 0:
                continue
            ratio = a / t
            if kd.get("lowerIsBetter"):
                deficit = ratio - 1.0
            else:
                deficit = 1.0 - ratio
            if deficit > 0.01:
                rows.append({
                    "label": kd["indicator"][:40],
                    "deficit": deficit,
                    "achieved": a,
                    "target": t,
                    "unit": kd.get("unit", ""),
                })

    rows.sort(key=lambda x: x["deficit"], reverse=True)
    rows = rows[:n]
    if not rows:
        return ""

    fig, ax = plt.subplots(figsize=(7, max(3, len(rows) * 0.55 + 1)),
                           facecolor=PALETTE["bg"])
    ax.set_facecolor(PALETTE["bg"])

    labels   = [r["label"] for r in rows]
    deficits = [r["deficit"] * 100 for r in rows]
    colors   = [PALETTE["gap"] if d > 25 else PALETTE["close"] for d in deficits]

    bars = ax.barh(labels, deficits, color=colors, height=0.55,
                   edgecolor=PALETTE["bg"], linewidth=0.5)

    for bar, row in zip(bars, rows):
        ax.text(bar.get_width() + 0.5,
                bar.get_y() + bar.get_height() / 2,
                f"{row['achieved']}{row['unit']} / {row['target']}{row['unit']}",
                va="center", ha="left", fontsize=7, color=PALETTE["subtext"])

    ax.set_xlabel("Gap from Target (%)", color=PALETTE["subtext"], fontsize=9)
    ax.tick_params(colors=PALETTE["text"], labelsize=8)
    ax.spines[:].set_visible(False)
    ax.xaxis.label.set_color(PALETTE["subtext"])
    ax.set_title("Top Critical KD Gaps", color=PALETTE["text"], fontsize=11, pad=10)
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.tick_params(axis="y", colors=PALETTE["text"])
    ax.tick_params(axis="x", colors=PALETTE["subtext"])

    plt.tight_layout()
    return _to_base64(fig)


def programme_scorecard_chart(div_data: dict) -> str:
    progs = list(div_data.get("programmes", {}).values())
    if not progs:
        return ""

    names, achieved_pct = [], []
    for p in progs:
        kds = p.get("kds", [])
        scored = [k for k in kds if k.get("target") and k.get("achievement") is not None]
        if not scored:
            names.append(p["name"][:22])
            achieved_pct.append(0)
            continue
        ach = sum(1 for k in scored if (
            (k["achievement"] / k["target"] >= 1.0 and not k.get("lowerIsBetter")) or
            (k["achievement"] / k["target"] <= 1.0 and k.get("lowerIsBetter"))
        ))
        names.append(p["name"][:22])
        achieved_pct.append(round(ach / len(scored) * 100))

    colors = []
    for pct in achieved_pct:
        if pct >= 60:   colors.append(PALETTE["achieved"])
        elif pct >= 35: colors.append(PALETTE["close"])
        else:           colors.append(PALETTE["gap"])

    fig, ax = plt.subplots(figsize=(7, max(3, len(names) * 0.6 + 1)),
                           facecolor=PALETTE["bg"])
    ax.set_facecolor(PALETTE["bg"])

    bars = ax.barh(names, achieved_pct, color=colors, height=0.55,
                   edgecolor=PALETTE["bg"], linewidth=0.5)

    for bar, pct in zip(bars, achieved_pct):
        ax.text(min(bar.get_width() + 1, 98), bar.get_y() + bar.get_height() / 2,
                f"{pct}%", va="center", ha="left", fontsize=8,
                color=PALETTE["text"], fontweight="bold")

    ax.set_xlim(0, 110)
    ax.set_xlabel("% KDs Achieved", color=PALETTE["subtext"], fontsize=9)
    ax.set_title("Programme KD Achievement Rate", color=PALETTE["text"], fontsize=11, pad=10)
    for spine in ax.spines.values():
        spine.set_visible(False)
    ax.tick_params(axis="y", colors=PALETTE["text"], labelsize=8)
    ax.tick_params(axis="x", colors=PALETTE["subtext"])
    ax.axvline(75, color=PALETTE["close"], linestyle="--", linewidth=0.8, alpha=0.6)
    ax.text(75.5, len(names) - 0.3, "75% threshold", color=PALETTE["close"], fontsize=7)

    plt.tight_layout()
    return _to_base64(fig)


def generate_all_charts(div_data: dict) -> dict:
    return {
        "status_donut":   programme_status_donut(div_data),
        "critical_kds":   top_critical_kds_chart(div_data),
        "scorecard":      programme_scorecard_chart(div_data),
    }
