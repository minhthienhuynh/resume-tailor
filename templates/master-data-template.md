# Master Data — <Candidate Name>

*This is your single source of truth for `resume-tailor:generate`. Fill in real
information only — never invent numbers, technologies, or claims you can't
back up in an interview. If a metric isn't confirmed, leave it out; the skill
will use a qualitative description instead of fabricating a number.*

## Personal

Full name · date of birth (optional) · location
<email> · <phone> · <portfolio/GitHub/LinkedIn URLs>

## Goals

- Target role / seniority (e.g. "Senior Backend Developer, IC not lead")
- Target company type / location (e.g. "product company, remote-friendly")
- Anything else that should shape tailoring decisions (language proficiency, industry preference, etc.)

## Timeline

List every job in reverse-chronological order with **real** start/end dates.
Mark any job with a real duration of ≤ 1 year — `resume-tailor:generate` will
ask you whether to keep or drop each one. If you know in advance you want a
job excluded regardless of the question, mark it with `<!-- exclude -->`.

```
MM/YYYY–MM/YYYY  Company A — Title
MM/YYYY–MM/YYYY  Company B — Title  <!-- exclude -->
MM/YYYY–present  Company C — Title
```

## Experience

For each job, in reverse-chronological order:

### Company Name (MM/YYYY–MM/YYYY) — Title

Brief description of the company/product. List the real projects worked on
and the tech stack **per project** — this feeds the italicized project+tech
line under each job heading on the resume.

- Bullet points describing responsibilities and impact. Use real, confirmed
  numbers where you have them (e.g. "reduced API latency by 30%",
  "supported 10 routes across 3 operators"). If you don't have a number,
  describe the impact qualitatively (e.g. "improved query performance",
  "standardized the deployment process") — do not guess a percentage.
- Tech stack used at this job.
- Anything else worth mentioning: leadership, cross-team collaboration,
  notable technical decisions.

*(Repeat this section for each job.)*

## Freelance / side projects (optional)

Same format as Experience — real projects only, with your actual role and
scope (e.g. "worked on part of the backend, in a team" vs. "built the whole
thing solo").

## Personal projects (optional)

Only list projects with real usage (even if the only user is you, as long as
you actively use and maintain it) — not tutorial-following exercises or
mandatory coursework.

## Skills

Group by category. Only list what you can discuss in an interview.

- **Languages:**
- **Backend:**
- **Frontend:**
- **Database:**
- **Cloud/DevOps:**
- **Testing:**
- **Other:**

## Education

School — Degree · MM/YYYY–MM/YYYY

## Languages (spoken)

e.g. English: reads/writes documentation and code comfortably

---

**Honesty reminder:** every claim on the generated resume should trace back
to something written here. If `resume-tailor:generate` infers something
(e.g. inferring a library from a framework you mentioned), it will flag that
inference for you to confirm — it will not add anything you haven't
confirmed is real.
