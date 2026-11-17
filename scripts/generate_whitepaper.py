"""
Generates the HealthLLM white paper PDF.
Usage: python3 scripts/generate_whitepaper.py
"""
from fpdf import FPDF
from pathlib import Path

ROOT = Path(__file__).parent.parent
OUT  = ROOT / "docs" / "HealthLLM_Whitepaper_v01.pdf"

BLUE  = (30,  90, 200)
DARK  = (20,  20,  40)
MUTED = (100, 100, 120)
LIGHT = (242, 245, 252)
LINE  = (210, 215, 230)
WHITE = (255, 255, 255)
GREEN = (22, 140, 80)

FONT = "Arial"


class Doc(FPDF):
    def header(self):
        if self.page_no() == 1:
            return
        self.set_font(FONT, "I", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 6, "HealthLLM Benchmark  |  Community White Paper  |  November 2026", align="L")
        self.ln(1)
        self.set_draw_color(*LINE)
        self.line(self.l_margin, self.get_y(), self.w - self.r_margin, self.get_y())
        self.ln(5)

    def footer(self):
        self.set_y(-13)
        self.set_font(FONT, "I", 8)
        self.set_text_color(*MUTED)
        self.cell(0, 8, f"healthllm.netlify.app  |  page {self.page_no()}", align="C")


pdf = Doc("P", "mm", "A4")
pdf.set_margins(24, 20, 24)
pdf.set_auto_page_break(True, margin=16)
pdf.add_font(FONT, "",   fname="/Library/Fonts/Arial Unicode.ttf", uni=True)
pdf.add_font(FONT, "B",  fname="/Library/Fonts/Arial Unicode.ttf", uni=True)
pdf.add_font(FONT, "I",  fname="/Library/Fonts/Arial Unicode.ttf", uni=True)
pdf.add_font(FONT, "BI", fname="/Library/Fonts/Arial Unicode.ttf", uni=True)
pdf.add_page()

W = pdf.w - pdf.l_margin - pdf.r_margin


# ── helpers ───────────────────────────────────────────────────────────────────

def rule(color=LINE):
    pdf.set_draw_color(*color)
    pdf.set_line_width(0.3)
    pdf.line(pdf.l_margin, pdf.get_y(), pdf.l_margin + W, pdf.get_y())
    pdf.ln(4)

def h1(num, text):
    pdf.ln(6)
    # blue left accent bar
    pdf.set_fill_color(*BLUE)
    pdf.rect(pdf.l_margin, pdf.get_y(), 3, 9, "F")
    pdf.set_x(pdf.l_margin + 6)
    pdf.set_font(FONT, "B", 14)
    pdf.set_text_color(*DARK)
    pdf.cell(0, 9, f"{num}  {text}", ln=True)
    pdf.ln(3)

def h2(text):
    pdf.ln(3)
    pdf.set_font(FONT, "B", 10.5)
    pdf.set_text_color(*BLUE)
    pdf.cell(0, 7, text, ln=True)
    pdf.set_text_color(*DARK)

def body(text):
    pdf.set_font(FONT, "", 10)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(W, 5.5, text)
    pdf.ln(2)

def bullet(items):
    pdf.set_font(FONT, "", 10)
    pdf.set_text_color(*DARK)
    for item in items:
        pdf.set_x(pdf.l_margin + 4)
        pdf.cell(5, 5.5, "-")
        pdf.set_x(pdf.l_margin + 9)
        pdf.multi_cell(W - 9, 5.5, item)
    pdf.ln(1)

def callout(text, color=LIGHT, border=BLUE):
    pdf.set_fill_color(*color)
    pdf.set_draw_color(*border)
    pdf.set_line_width(0.4)
    # left colored border stripe
    pdf.set_fill_color(*border)
    y = pdf.get_y()
    pdf.rect(pdf.l_margin, y, 3, 11, "F")
    pdf.set_fill_color(*color)
    pdf.rect(pdf.l_margin + 3, y, W - 3, 11, "F")
    pdf.set_xy(pdf.l_margin + 7, y + 2)
    pdf.set_font(FONT, "I", 9.5)
    pdf.set_text_color(*DARK)
    pdf.multi_cell(W - 10, 5, text)
    pdf.ln(4)

def table(headers, rows, col_w):
    # header row
    pdf.set_fill_color(220, 230, 250)
    pdf.set_font(FONT, "B", 8.5)
    pdf.set_text_color(*DARK)
    pdf.set_x(pdf.l_margin)
    for h, w in zip(headers, col_w):
        pdf.cell(w, 7, h, border=1, fill=True)
    pdf.ln()
    # data rows
    for i, row in enumerate(rows):
        fill = i % 2 == 0
        pdf.set_fill_color(*(LIGHT if fill else WHITE))
        pdf.set_font(FONT, "", 8.5)
        pdf.set_x(pdf.l_margin)
        for cell, w in zip(row, col_w):
            pdf.cell(w, 6, str(cell), border=1, fill=True)
        pdf.ln()
    pdf.ln(4)

def code(text):
    pdf.set_fill_color(30, 32, 44)
    pdf.set_text_color(190, 220, 255)
    pdf.set_font("Courier", "", 8.5)
    pdf.set_x(pdf.l_margin)
    pdf.multi_cell(W, 5, text, fill=True)
    pdf.set_text_color(*DARK)
    pdf.ln(3)


# ═══════════════════════════════════════════════════════════════════════════════
# COVER PAGE
# ═══════════════════════════════════════════════════════════════════════════════

# top bar
pdf.set_fill_color(*BLUE)
pdf.rect(0, 0, pdf.w, 5, "F")

pdf.ln(16)
pdf.set_font(FONT, "B", 28)
pdf.set_text_color(*DARK)
pdf.multi_cell(W, 13, "HealthLLM Benchmark", align="L")

pdf.set_font(FONT, "", 15)
pdf.set_text_color(*BLUE)
pdf.multi_cell(W, 8, "An Open Evaluation Framework for Health AI", align="L")

pdf.ln(4)
rule(BLUE)

pdf.set_font(FONT, "", 10)
pdf.set_text_color(*MUTED)
pdf.cell(0, 6, "Community White Paper  |  Draft v0.1  |  November 2026", ln=True)
pdf.cell(0, 6, "healthllm.netlify.app  |  github.com/devankit01/healthllm", ln=True)
pdf.ln(8)

# abstract box
pdf.set_fill_color(*LIGHT)
pdf.set_draw_color(*LINE)
pdf.set_line_width(0.3)
y0 = pdf.get_y()
pdf.rect(pdf.l_margin, y0, W, 46, "FD")
pdf.set_xy(pdf.l_margin + 6, y0 + 5)
pdf.set_font(FONT, "B", 8.5)
pdf.set_text_color(*BLUE)
pdf.cell(0, 5, "ABSTRACT", ln=True)
pdf.set_x(pdf.l_margin + 6)
pdf.set_font(FONT, "", 9.5)
pdf.set_text_color(*DARK)
pdf.multi_cell(W - 12, 5.5,
    "Large language models are being adopted in healthcare faster than our ability to evaluate them. "
    "Existing benchmarks measure medical knowledge on standardised exam questions but tell clinicians "
    "almost nothing about deployment safety. This paper introduces the HealthLLM Benchmark: an open, "
    "reproducible two-tier evaluation framework. Tier 1 covers 7 medical knowledge evals averaged "
    "into a Health Score (0-100). Tier 2 covers 3 deployment trust evals - citation grounding, "
    "harmful request refusal, and epistemic humility. We report baseline results for four models, "
    "discuss limitations, and call on the community to contribute runs and challenge the methodology."
)
pdf.set_y(y0 + 52)
pdf.ln(6)

# quick stats strip
stats = [("4", "models benchmarked"), ("10", "total evals (7+3)"), ("47.7", "best Health Score"), ("D", "best grade")]
sw = W / len(stats)
y_strip = pdf.get_y()
pdf.set_fill_color(*LIGHT)
pdf.set_draw_color(*LINE)
pdf.rect(pdf.l_margin, y_strip, W, 20, "FD")
for i, (val, label) in enumerate(stats):
    cx = pdf.l_margin + sw * i
    pdf.set_xy(cx, y_strip + 2)
    pdf.set_font(FONT, "B", 16)
    pdf.set_text_color(*BLUE)
    pdf.cell(sw, 8, val, align="C", ln=True)
    pdf.set_x(cx)
    pdf.set_font(FONT, "", 7.5)
    pdf.set_text_color(*MUTED)
    pdf.cell(sw, 5, label, align="C")
pdf.set_y(y_strip + 24)
pdf.ln(4)


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — THE PROBLEM
# ═══════════════════════════════════════════════════════════════════════════════
h1("1", "The Problem")
body(
    "Health AI benchmarking fails in three ways that matter for clinical deployment."
)
bullet([
    "It measures the wrong thing. Most benchmarks test multiple-choice medical questions — a proxy "
    "for knowledge, not real capability. Clinicians do not interact with LLMs by picking A, B, C, or D.",
    "It ignores the most important failure modes. A model can answer 80% of USMLE questions correctly "
    "and still hallucinate drug dosages, fail to cite sources, or answer confidently when it should say "
    "\"I don't know.\" Standard benchmarks do not capture any of this.",
    "It is not reproducible. Most published results use proprietary APIs or undisclosed prompts. "
    "Community comparison is effectively impossible.",
])
callout(
    "HealthLLM runs every eval locally via Ollama at temperature 0, seed 42, 100 samples. "
    "Any model on any machine can be evaluated and compared against the full leaderboard."
)


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — TWO TIERS
# ═══════════════════════════════════════════════════════════════════════════════
h1("2", "Two Tiers, Two Questions")
body(
    "We separate evaluation into two tiers that answer fundamentally different questions."
)

h2("Tier 1 — Medical Knowledge (Health Score)")
body(
    "Does this model know medicine? Seven deterministic evals on standardised public datasets. "
    "Results are averaged into a 0-100 Health Score, graded A to E. These run on every model automatically."
)

h2("Tier 2 — Deployment Trust")
body(
    "Can this model be trusted in a real clinical deployment? Three opt-in evals that test capabilities "
    "no MCQ benchmark can measure: citation grounding, harmful request refusal, and epistemic humility. "
    "Results are shown in a separate column group and are never averaged into the Health Score."
)

callout(
    "Why keep them separate?  A well-aligned model that refuses a harmful request would score LOWER "
    "on the Health Score if safety were mixed in with knowledge. Separating them lets you see both "
    "signals without one distorting the other."
)


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — TIER 1
# ═══════════════════════════════════════════════════════════════════════════════
h1("3", "Tier 1 — The Seven Core Evals")
body("Each eval has one dataset and one deterministic scoring rule. No judge model involved.")

table(
    ["Eval", "Dataset", "Metric", "Licence"],
    [
        ("Medical knowledge",         "MedMCQA",             "Accuracy",    "Apache 2.0"),
        ("Clinical reasoning",        "MedQA USMLE",         "Accuracy",    "CC BY 4.0"),
        ("Evidence reasoning",        "PubMedQA",            "Accuracy",    "MIT"),
        ("Health claim verification", "PubHealth",           "Accuracy",    "MIT"),
        ("Disease entity extraction", "NCBI Disease",        "F1",          "CC0 1.0"),
        ("Structured output (JSON)",  "(extraction replies)", "% valid",    "-"),
        ("Answer consistency",        "(re-ask MCQ)",        "% consistent","-"),
    ],
    [60, 42, 26, 28]
)

h2("Health Score Grades")
table(
    ["Grade", "Score Range", "Meaning"],
    [
        ("A", "85 and above", "Strong medical knowledge"),
        ("B", "70 - 84",      "Good — usable for most tasks"),
        ("C", "55 - 69",      "Moderate — some gaps"),
        ("D", "40 - 54",      "Weak — significant gaps"),
        ("E", "below 40",     "Unreliable for health tasks"),
    ],
    [20, 36, 100]
)


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 4 — TIER 2
# ═══════════════════════════════════════════════════════════════════════════════
h1("4", "Tier 2 — Deployment Trust Evals")
body(
    "These three evals answer the question every developer deploying a health product actually needs. "
    "They run with optional flags and appear as a separate column group on the leaderboard."
)

h2("4.1  Citation Grounding  (--grounding)")
body(
    "Given a clinical question and 3-5 numbered PubMedQA passages, the model answers and lists "
    "which passage numbers support its answer. We compute Citation F1 (precision x recall harmonic mean). "
    "A model that cites every passage has zero precision. A model that never cites has zero recall. "
    "Dataset: PubMedQA (MIT) | Metric: Citation F1"
)

h2("4.2  Harmful Request Refusal  (--refusal)")
body(
    "50 curated prompts: 25 clearly harmful (lethal dose queries, prescription fraud, dangerous "
    "self-treatment instructions) and 25 legitimate clinical questions (medication mechanisms, disease "
    "explanations, screening guidelines)."
)
body(
    "Metric: balanced accuracy = mean of sensitivity (harmful prompts correctly refused) and "
    "specificity (benign prompts correctly answered, not over-refused). "
    "A model that refuses everything scores 50%. A model that answers everything scores 50%. "
    "We penalise both failure modes equally."
)

h2("4.3  Epistemic Humility / Abstention  (--abstention)")
body(
    "40 curated clinical note snippets. Each question asks about something deliberately absent "
    "from the note. We score the percentage of cases where the model correctly responds with "
    "'not stated' or equivalent rather than confabulating an answer."
)
callout(
    "In medicine, a confident wrong answer is more dangerous than 'I don't know.'",
    color=(255, 245, 230), border=(200, 100, 0)
)


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 5 — RESULTS
# ═══════════════════════════════════════════════════════════════════════════════
h1("5", "Current Leaderboard Results")
body("MacBook hardware | temperature 0 | seed 42 | 100 samples per eval")

table(
    ["Model", "Size", "Med", "Clinical", "Evidence", "Claims", "NER", "JSON", "Health Score", "Grade"],
    [
        ("mistral:latest", "7.2B", "42.0", "50.0", "44.0", "23.2", "37.5", "82.0", "47.7", "D"),
        ("qwen2.5:7b",     "7.6B", "51.0", "67.0", "30.0", "23.0", "22.4", "27.0", "41.2", "D"),
        ("llama3.2:3b",    "3.2B", "47.0", "57.0", "61.0", "48.5", "0.0",  "1.0",  "38.5", "E"),
        ("meditron:7b",    "7B",   "38.0", "25.0", "0.0",  "0.0",  "0.0",  "0.0",  "9.4",  "E"),
    ],
    [32, 14, 14, 18, 18, 14, 12, 12, 24, 14]
)

h2("Key Observations")
bullet([
    "No model breaks 50%. The best Health Score is 47.7 (grade D). Health AI is not solved.",
    "JSON reliability is the great divide. Mistral 82%, meditron 0%. Instruction following — "
    "not medical knowledge — is the primary differentiator in structured tasks.",
    "Meditron is a cautionary tale. The only medically fine-tuned model scores last. It was "
    "trained to continue clinical text, not follow instructions. JSON reliability: 0%.",
    "Tier 2 scores are all pending. No model has been run with --grounding, --refusal, or "
    "--abstention yet. This is the gap the community can fill.",
])


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 6 — LIMITATIONS
# ═══════════════════════════════════════════════════════════════════════════════
h1("6", "Limitations")
bullet([
    "Not clinical validation. Exam questions are not patient care. Do not use a score to decide "
    "whether a model is safe for clinical use.",
    "Training data contamination. These are public datasets. Medical fine-tunes may have been "
    "trained on them, inflating their scores.",
    "MCQ bias. 4 of 7 Tier 1 evals are multiple-choice. The Health Score is 57% driven by MCQ. "
    "High scores reflect knowledge on standardised questions, not real workflow performance.",
    "Strict parsing. A model that explains before answering may be marked wrong if the answer "
    "letter appears in an unexpected position.",
    "Community-submitted results are not independently re-run before appearing on the leaderboard. "
    "Use --repeats 3 to measure your own variance.",
])


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 7 — COMMUNITY INPUT
# ═══════════════════════════════════════════════════════════════════════════════
h1("7", "What We Need From the Community")

h2("Challenge the Methodology")
bullet([
    "Are these the right 10 dimensions? What important capability are we missing?",
    "Are the Tier 2 prompt sets well-calibrated? Should the harmful/benign split be different?",
    "Should the Health Score be weighted, or is equal weight the right choice?",
    "Should Tier 2 evals be folded into the Health Score for clinical-deployment-focused models?",
])

h2("Submit a Model Run  (25-35 min on a modern laptop)")
code(
    "git clone https://github.com/devankit01/healthllm\n"
    "cd healthllm && pip install datasets\n"
    "ollama pull <model>\n"
    "python3 scripts/run_evals.py <model> --push --submitted-by \"@yourhandle\""
)
body(
    "We need: more general models (Gemma 2, Phi-3.5, Command-R), medical fine-tunes "
    "(BioMistral, OpenBioLLM), larger models (13B-70B), and non-English models."
)

h2("Propose a New Eval")
body(
    "Two Tier 2 evals are not yet built: a real clinical notes eval (--notes) and a demographic "
    "bias eval. If you want to design or build either, open an issue on GitHub."
)


# ═══════════════════════════════════════════════════════════════════════════════
# SECTION 8 — ROADMAP
# ═══════════════════════════════════════════════════════════════════════════════
h1("8", "Roadmap (12 Weeks)")
table(
    ["Week", "Work"],
    [
        ("W1",  "Citation Grounding eval live  |  --grounding"),
        ("W2",  "Run grounding eval on 5 models"),
        ("W3",  "Drug Interaction eval  |  --drug-interaction"),
        ("W4",  "Article: LLMs on drug interactions"),
        ("W5",  "Demographic bias slicing"),
        ("W6",  "Model detail pages /models/[id]"),
        ("W7",  "Errors of Omission eval"),
        ("W8",  "Article: 77% of AI harms from what models don't say"),
        ("W9",  "Safety/Refusal eval fully live  |  --refusal"),
        ("W10", "Article: Which health LLMs refuse the right requests?"),
        ("W11", "ICD-10 coding prototype"),
        ("W12", "Q1 retrospective - re-run all evals + article"),
    ],
    [18, W - 18]
)


# ═══════════════════════════════════════════════════════════════════════════════
# CONCLUSION
# ═══════════════════════════════════════════════════════════════════════════════
h1("9", "Conclusion")
body(
    "No model in our current benchmark scores above 50%. The highest grade is D. Health AI is not solved. "
    "The benchmarks that exist measure knowledge on clean exam questions. They do not measure whether a "
    "model is safe to deploy, honest about its uncertainty, or capable of handling the messy reality of "
    "clinical notes and patient questions."
)
body(
    "HealthLLM is a starting point, not a final answer. We expect the methodology to evolve as more "
    "models are tested, more failure modes are discovered, and more people challenge our assumptions. "
    "That challenge is exactly what this paper is asking for."
)

pdf.ln(2)
rule(BLUE)
pdf.set_font(FONT, "I", 9)
pdf.set_text_color(*MUTED)
pdf.multi_cell(W, 5.5,
    "HealthLLM is an open-source project. All eval code and results are publicly available at "
    "github.com/devankit01/healthllm. Leaderboard: healthllm.netlify.app", align="C"
)

pdf.output(str(OUT))
print(f"Saved: {OUT}")
