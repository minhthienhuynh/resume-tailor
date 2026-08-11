# resume-tailor:generate — bullet-writing, LaTeX & page-fit reference

Read this file when writing/editing bullets (STAR/XYZ/CAR), fitting a resume to the page limit, or debugging a build error.

**Default template:** `${CLAUDE_PLUGIN_ROOT}/templates/engineering-resume.tex` (based on the r/EngineeringResumes community template). Every new resume copies this template (or the user's custom template from config) and fills in the candidate's data — never invent a new preamble/macro set.

**Source guidance:** the r/EngineeringResumes wiki — https://www.reddit.com/r/EngineeringResumes/wiki/index/ (XYZ formula, exclusion list, ATS, length).

## Writing bullets (STAR / XYZ / CAR)

- **XYZ** (Google's formula, the one the r/EngineeringResumes wiki recommends) = "Accomplished **X** as measured by **Y** by doing **Z**." → requires a metric **Y**; use it when there's a REAL number confirmed by the master data.
- **STAR** = Situation, Task, Action, Result → fallback when there's NO real number (qualitative result). This is the common case for most candidates.
- **CAR** = Challenge, Action, Result → another fallback.
- General shape: `[strong past-tense action verb] + [what/how] + [context/scope] + [result/impact]`.
- **Action verbs** — active: led, built, designed, architected, restructured, aligned, optimized, integrated, refactored… **Avoid**: "responsible for", "worked on", "involved in".
- **Tense & pronouns (per the wiki):** past tense for past jobs, present tense for the current job. **No first-person pronouns** (I, me, my, we). Numbers as digits (5, not "five").
- **Result & honesty:** if the candidate has no free-form metrics, don't fabricate a percentage. Use STAR/CAR with a **qualitative** result ("reducing latency", "improving throughput", "standardizing delivery"); only use XYZ/a number when the master data confirms it. This is where honesty (SKILL.md Step 5) takes priority over which formula (STAR vs XYZ) gets used.
- Each bullet: **1–2 lines, max one sentence**. Don't leave a bullet wrapping onto the next line with only 1–4 words — trim it, that's wasted space.
- Examples:
  - Weak: "Responsible for backend services."
  - Strong (qualitative): "Designed complex PostgreSQL schemas with advanced indexing and query optimization, cutting latency and improving throughput on high-traffic APIs."
  - Strong (confirmed number): "Built ticketing and card-payment APIs (Laravel) with real-time WebSocket at 99.9% uptime."

## Don't include (per the r/EngineeringResumes wiki)

The wiki excludes elements that waste space or confuse ATS parsers:
- **Objective** (outdated) — replace with an *optional* Summary if needed (SKILL.md Step 4).
- **Soft skills** (teamwork, communication…) and **skill rating bars** (%, stars) — not quantifiable.
- **A photo**, date of birth, marital status, nationality.
- **A full home address** — city/region is enough, or omit entirely.
- The line **"References available upon request"** and a references list.
- **First-person pronouns** in bullets (I, me, my, we).
- Listing EVERY technology ever touched — only keep what the candidate can actually discuss in an interview.

ATS (the default template handles most of this already): single column, standard heading sections, standard font, NO icons/tables/graphics, export as PDF.

## Default template — `templates/engineering-resume.tex`

- `\documentclass[11pt]{article}`; `geometry` margins 0.5in on all sides; **XCharter** font; `\pdfgentounicode=1` (ATS-readable).
- No custom macros like `\resumeSubheading`. Manual structure:
  - Name: `\centerline{\Huge Name}` → (optional) job title line → `\vspace{5pt}` → `\centerline{contact (\href)}` → `\vspace{-10pt}`.
  - **Summary** (OPTIONAL, see SKILL.md Step 4 — default to omitting it per the wiki): if added, `\section*{Summary}` + 2–3 sentences, placed IMMEDIATELY after the header, BEFORE Skills. Content: seniority + years of experience + main JD-matching stack + a standout strength. Keep it short (2–3 lines) so the resume still fits in 2 pages.
  - Sections: `\section*{Skills}`, `\section*{Experience}`, `\section*{Projects}`, `\section*{Education}`.
  - Skills: `\textbf{Category:} item, item \\`.
  - Job: `\textbf{Job Title,} {Company} -- City \hfill dates \\` → **project+tech line** `\textit{Project1 (tech) --- Project2 (tech)} \\` → `\vspace{-9pt}` → `\begin{itemize} \item ... \end{itemize}`.
    - The italicized project+tech line names the products/projects built at that company plus the tech used per project (pulled from the master data). Keep it to one line (don't let it wrap); if the job heading is already long (e.g. it includes an award), drop `-- City` to save space.
  - Education: `\textbf{School} -- Degree \hfill date \\`.

## Page-fit levers (this template)

Apply in this priority order:
1. **Trim wordy bullets / reduce bullet count** — highest priority. 3–5 bullets per job; each bullet 1–2 lines.
2. **`\setlist[itemize]{itemsep=-2pt, leftmargin=12pt, topsep=7pt}`** — tune global `itemsep`/`topsep` for bullets.
3. **`\vspace{-9pt}`** after a job's title line (before the itemize) and **`\vspace{-18.5pt}` / `\vspace{-6.5pt}`** between sections — make these more negative to tighten further.
4. **`geometry` margins** (top/bottom/left/right = 0.5in) — loosen/tighten LAST if still needed.

## ⚠️ Overflow & spacing

- The template uses **fixed** `geometry` margins → excess content flows onto a **clean new page** (unlike a template that hacks `\addtolength{\textheight}`, which can push text past the physical page edge and cause **clipping**). Don't use a `\textheight` hack with this template.
- Still verify against clipping as a precaution: if you tighten margins/`\vspace` too aggressively, the text extracted for a given page should still contain the content that's supposed to be there — see the `build.py` verify step.
- Clean breaks land at section/job boundaries (after one complete job), never in the middle of one job's bullets.
- **Hard constraint (see SKILL.md Step 7):** resume is **capped at 2 pages**. Page breaks should land after a complete job/section — never in the middle of one job's bullets.
- **To fit within 2 pages:** trim bullets from the least JD-relevant jobs first, or tighten `\setlist` itemsep/topsep (e.g. `itemsep=-3pt, topsep=4pt`) to claw back a few lines; only as a last resort, reduce the number of jobs/bullets (drop the oldest/least JD-relevant job).
- **Avoid an orphaned heading**: a job heading stranded at the bottom of a page while its bullets spill onto the next page. Fix by trimming ~1–2 lines from the bullets above it to pull the whole job (heading + bullets) onto the same page. Each line saved is roughly one 2-line bullet trimmed to one line.
- 2 pages is fine for an experienced candidate (8+ years) as long as the break is clean; don't force it down to 1 page if that means cutting evidence the JD needs.

## Installing Tectonic & fallback

`build.py` (Step 7 of SKILL.md) prefers **Tectonic** — a self-contained LaTeX engine that fetches the packages it needs from a CTAN bundle on first use, so there's no need to install a multi-GB TeX Live distribution.

- **Install Tectonic:** `brew install tectonic` (macOS), `cargo install tectonic`, `conda install -c conda-forge tectonic`, or the install script at https://tectonic-typesetting.github.io/. Check with `tectonic --version`.
- **Packages the default template needs:** XCharter, `fontenc`, `inputenc`, `enumitem`, `hyperref`, `titlesec` — Tectonic should fetch these automatically from its bundled CTAN mirror on first build. If a package fails to resolve, check the Tectonic error output for the missing package name.
- **Fallback:** if Tectonic isn't available but `pdflatex` is (an existing TeX Live/MacTeX install), `build.py` uses `pdflatex -interaction=nonstopmode -halt-on-error` instead.
- **Font fallback:** if XCharter isn't available under either engine, swap `\usepackage{XCharter}` for `\usepackage{charter}` (Bitstream Charter — same family, usually present) or comment the line out entirely (falls back to Computer Modern).
- **Neither engine installed:** `build.py` prints install instructions for both and exits non-zero.

## Common build errors

- **Missing font/dependency package**: a fatal `! LaTeX Error: File 'XCharter.sty' (or 'xstring.sty'/'fontaxes.sty'/'mweights.sty') not found.` under `pdflatex` usually means TeX Live is missing a package — install it (e.g. `tlmgr install xcharter xstring fontaxes mweights`) or switch to Tectonic, which fetches packages automatically.
- **Typo in a package option** (e.g. `dvipsanames`) → fatal, no PDF produced. When the build exits non-zero, `build.py` prints the first error lines from the log/stderr — read those to locate the problem.
- Tectonic's error format differs from `pdflatex`'s classic `! ` prefix — read whatever `build.py` prints for the actual wording before assuming the same parsing rules apply.

## Verify checklist after every build

1. Build exit code `0`.
2. Page count matches intent (≤ 2).
3. Overfull count `0` (or a deliberate, reviewed exception).
4. No clipping: each page's last extracted line looks complete and sane.
5. Read the PDF to review layout (spacing, alignment, no bullet wrapping with only 1–4 words on the last line).
