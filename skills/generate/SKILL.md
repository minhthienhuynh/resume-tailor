---
description: Generate a tailored LaTeX resume (.tex/.pdf) from a job description, referencing the candidate's master data and a LaTeX template. Use when the user asks to create or tailor a resume/CV for a specific job description.
argument-hint: "[jd-path-or-url]"
allowed-tools: Read Write Edit AskUserQuestion WebFetch Bash(python3*) Bash(python*) Bash(py*) mcp__plugin_resume-tailor_playwright__browser_navigate mcp__plugin_resume-tailor_playwright__browser_snapshot mcp__plugin_resume-tailor_playwright__browser_close
---

# resume-tailor:generate — tailor a resume to a job description

Generates a `.tex`/`.pdf` resume tailored to a specific job description (JD), using the candidate's own master data and LaTeX template. Always builds and verifies the PDF before calling the task done.

For LaTeX page-fit techniques and bullet-writing formulas, read `reference.md` (same directory) when you need to adjust layout or wording.

## Step 0 — precondition: config must exist

Check whether `${CLAUDE_PROJECT_DIR}/resume-tailor.config.json` exists.

- **Missing** → tell the user to run `/resume-tailor:init` first, then **stop**. Do not scaffold anything yourself here — that is `init`'s job, not `generate`'s.
- **Exists but broken** (a required field is missing, or the file at `masterData`/`template` doesn't actually exist on disk) → report exactly which field is wrong, suggest re-running `/resume-tailor:init` to fix it, then **stop**.

## Step 1 — gather input

- Read the config for `masterData`, `template` (if the field is absent, use `${CLAUDE_PLUGIN_ROOT}/templates/engineering-resume.tex`), `outputDir`, `inputDir`, `candidateName`. All config paths are relative to `${CLAUDE_PROJECT_DIR}`.
- Read the master data file — this is the **single source of truth** about the candidate's experience.
- JD comes from `$ARGUMENTS[0]` — either a local PDF path or a URL to a job posting. If missing, ask the user for it.
  - **If the JD is a URL:** try `WebFetch` first. Many job sites render the actual description client-side with JS — if the WebFetch result has no real job-description content (just HTML/script shell, no heading like "Job description" / "Responsibilities" / "Requirements"), fall back to the bundled **Playwright MCP**: `browser_navigate` to the URL, then `browser_snapshot` to get the fully-rendered accessibility tree and read the description from there. Close the browser (`browser_close`) once you have the content.
  - If neither WebFetch nor Playwright yields usable content, tell the user and ask them to paste the JD text directly or provide a PDF instead.
  - **Save the JD (required when the JD is a URL):** once fetched (via WebFetch or Playwright), save it to `<inputDir>/<company-slug>/<position-slug>.md` (see slug rules in Step 6). Only applies when the JD came from a URL — if the user gave a PDF path or pasted text directly, don't save it (it already exists as a file/text). Create the folder via the `Write` tool (which creates missing parent directories) if it doesn't exist; overwrite silently if the file already exists. Content:

    ```markdown
    # <Job Title> — <Company>

    - **Source:** <URL>
    - **Fetched:** YYYY-MM-DD
    - **Company:** <Company>
    - **Job title:** <Job Title>

    ---

    <Full extracted JD content (text)>
    ```

## Step 2 — analyze the JD

- Split requirements into **Required** vs **Preferred**.
- Note: job title, seniority level, main ATS keywords, and which stack the JD emphasizes (to decide ordering/emphasis later).
- **Build a skill/tech list filtered by the JD (used in Step 4):** cross-reference the JD against the master data, splitting tech into: (a) **matches the JD** — mentioned or directly relevant → include in the resume if the master data confirms it; (b) **foundational/transferable** — e.g. Git, SQL, testing, CI/CD → keep even if the JD doesn't mention it, so the resume doesn't look thin; (c) **not relevant to the JD** → drop from the resume so the interview doesn't wander into unrelated territory.

## Step 3 — ask before generating (`AskUserQuestion`)

Only ask when the master data doesn't already resolve the decision:

**Mandatory brainstorming rules for every question asked here:**
- **Never ask a bare/open-ended single question.** Before asking, briefly state what's already known, what's unconfirmed, and why this decision affects the resume.
- Offer **2–4 concrete options**, each stating the trade-off with respect to JD fit, honesty, timeline, or resume conciseness. Mark one option **Recommended** with a reason grounded in the master data + JD.
- Always include an **"Other / provide details"** option when the decision needs a real-world fact you don't have yet; ask for the minimum missing data (e.g. project, timeframe, stack, scope of responsibility) — never suggest fabricating a claim.
- For questions where multiple selections make sense (like which short jobs to drop), present each item with its JD-relevance assessment and use multi-select; for dependent questions (like covering a resulting gap), ask the follow-up immediately after the user locks in the prior choice.
- Each question must be self-contained enough for the user to decide immediately; ask only one related decision group per turn — don't cram multiple independent-but-complex decisions into one question.

Cases that trigger a question:
- Testing tools (e.g. Jest/Vitest) when the master data doesn't confirm them.
- How much to emphasize leadership (IC vs lead) when the JD asks for it.
- **Short-tenure jobs (≤ 1 year) — mandatory evaluation + question:** for EVERY job whose real duration (per the master data's timeline, NOT counting an end date that was already extended to cover a gap; **excluding the candidate's current job** — always keep that) is ≤ 1 year, assess its JD relevance and ask the user whether to **drop** it.
  - If the user decides to drop it → cover the resulting gap per the **gap-covering rule** below (do NOT pick which job to extend yourself).
  - Include a clear recommendation in the question: a short job that **strongly matches the JD** (matching stack) → recommend **keep**; a short job with **old/unrelated tech** → recommend **drop**.
  - Combine every short job under consideration into **one** `multiSelect` question ("which jobs to drop").
- **Covering the resulting gap when a job is dropped (mandatory question):** whenever the user confirms dropping a job (short-tenure or dropped for another reason), follow up with an `AskUserQuestion` about which adjacent job to extend to cover the gap — the **job immediately before** (extend its end date) or the **job immediately after** (push its start date back). Do NOT decide this yourself. Recommend extending whichever adjacent job has a **stack that matches the JD better** and raises the fewest questions. If multiple jobs are dropped, ask separately for each resulting gap. The real dates stay unchanged in the master data — only the resume covers the gap.
- **Language of these questions:** infer from the master data's language first; if that's unclear, fall back to the JD's language; if still unclear, fall back to English.

## Step 4 — tailor

- **Summary (optional — per the r/EngineeringResumes wiki, most resumes don't need one):** only add when it genuinely adds value — e.g. highlighting seniority + main JD-matching stack for a candidate with substantial experience, or explaining a career pivot. Default to omitting it, to leave more room for Skills/Experience/Projects. If added: 2–3 sentences right after the header, before Skills (seniority + years of experience + JD-matching stack + key strength), kept short.
- **Filter + reorder the Skills/Languages section by the JD (not just reordering):** the Skills section should only contain (1) skills/languages that **match the JD** (ranked by JD priority), and (2) core **foundational/transferable** skills (Git, SQL, testing, CI/CD...) even if the JD doesn't mention them. **Drop tech unrelated to the JD** from the `\textbf{...}` lines (Languages/Frameworks/Tools...) so the interview doesn't wander off-topic. Only drop tech that's real-but-unrelated; never invent a new skill to match the JD.
- Highlight the job that matches the JD most (more bullets, bold keywords). Within bullets, prioritize mentioning JD-matching tech; limit mentions of unrelated tech — only select real details worth presenting, never fabricate and never change the nature of the work actually done.
- Under each job heading, add one italicized line listing **project + tech per project** (e.g. `Smartbus (Laravel, WebSocket, MySQL) — Darewin (Bagisto, Vue.js, Elasticsearch)`) to highlight the products built and the tech used per project. Pull tech from the master data, never invent it. **Filter by JD:** prioritize listing JD-matching tech; real-but-unrelated tech can be trimmed from this line (trim only, never fabricate — the project line must still accurately reflect the real project).
- Cover the JD's ATS keywords (e.g. versioning/pagination/error handling, message queues, event-driven).
- Write each bullet using the wiki's recommended **XYZ** formula = "Accomplished [X] as measured by [Y] by doing [Z]" **when there's a real number**; when there isn't, use **STAR/CAR** with a qualitative result (both formulas are documented in the template). Always: strong past-tense action verb (present tense for the current job), **no first-person pronouns** (I/we/my), numbers written as digits. Use a qualitative result when there's no real number — never fabricate a number. Bullets 1–2 lines, no line-wrap with only 1–4 words. Formula details, action verbs, exclusion list, examples: see `reference.md`.
- Apply the gap-covering rule: drop companies the user chose to drop (including short-tenure jobs confirmed dropped in Step 3), extend the **adjacent job the user chose in Step 3** (previous job's end date, or next job's start date) to cover the resulting gap on the resume. **The real dates stay unchanged in the master data — only the resume covers the gap.**
- **Do not include (per the wiki):** an Objective section, soft skills, skill rating bars (%/stars), a photo, a full home address, "References available upon request." Only list skills/tech the candidate can actually discuss in an interview. Full list + ATS notes: `reference.md`.

## Step 5 — honesty principle (mandatory)

- **Never** fabricate a metric or a piece of tech that isn't in the master data.
- Only use numbers the master data has confirmed (a "defensible estimate").
- Flag every **inferred** claim (e.g. inferring TypeORM from NestJS, or inferring GitFlow/conventional commits) — list these for the user to confirm in Step 8.

## Step 6 — write the output

- Path: `<outputDir>/<company-slug>/<CandidateFullName>_<position-slug>.tex`.
  - `<company-slug>`: company name, lowercased, hyphenated (e.g. `pixel-perfect`).
  - `<position-slug>`: the JD's job title, hyphenated, each word capitalized (e.g. `Senior-Backend-Developer`).
  - `<CandidateFullName>`: the config's `candidateName`, normalized by stripping diacritics (Unicode NFD decomposition, drop combining marks — e.g. "Nguyễn Văn A" → "Nguyen Van A") and then removing spaces, keeping each word's original casing (e.g. `NguyenVanA`).
- Use the `Write` tool to write the file — it creates any missing parent directories on the path, so there's no need for a separate `Bash(mkdir*)` permission.

## Step 7 — build & verify

- Pick a python interpreter by trying, in order: `python3` → `python` → `py -3` (Windows launcher). Use the first one whose `--version` succeeds. If none work, tell the user, suggest installing Python 3, and stop here.
- Run: `<python> "${CLAUDE_PLUGIN_ROOT}/scripts/build.py" <path-to-tex>`.
- Check: build exit code `0`; **page count ≤ 2**; overfull count `0`; no clipping (compare the last line printed for each page against the resume's actual content — see `reference.md`).
- **Page constraint (mandatory):**
  - **Maximum 2 pages.** Over 2 pages → tighten in the order given in `reference.md` (trim bullets from the least JD-relevant job first → `\setlist` itemsep/topsep → `\vspace` between sections → margins). Still not fitting → reduce the number of jobs/bullets (drop the oldest/least JD-relevant job) until it's ≤ 2 pages.
  - Page breaks should land at section/job boundaries (after one complete job/section), never in the middle of one job's bullets.
- Read the PDF to review the layout; confirm the page break is clean.
- If there's a build error, clipping, or the wrong page count → adjust per `reference.md`. **Remember: if content is clipped, tighten spacing — don't try to expand the page area.**

## Step 8 — report to the user

- Summarize how the resume was tailored: what was reordered, emphasized, dropped.
- List every inferred claim that needs the user's confirmation (e.g. TypeORM, GitFlow).
- **Skills/tech trimmed from the resume** (real but unrelated to the JD) — list them so the user is aware, in case the interview brings them up anyway.
- Gaps vs the JD: skills the JD wants that the candidate doesn't have yet, so they can prepare for the interview. Never add these to the resume if they aren't real.

## Core principles

- Honesty above all: better to leave something out than to fabricate it.
- Always build + verify before reporting "done" — never claim success without having actually run `build.py`.
- Follow the existing template/pattern; don't invent a new one.
- **Resume is capped at 2 pages.**
