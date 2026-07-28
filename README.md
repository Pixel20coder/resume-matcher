# ResumeMatch

> Paste your resume and a job description, get an instant AI match score, a
> skills-gap analysis, and tailored bullet-point suggestions.

A full-stack AI web app built with Next.js and TypeScript. It runs against an
OpenAI-compatible endpoint (defaults to NVIDIA NIM's free Mistral model), so it
costs nothing to run.

## Status

🚧 In active development. Building in the open, one feature at a time.

- [x] Project scaffold (Next.js 16, TypeScript, Tailwind)
- [x] Landing page
- [x] Resume + job-description input form (`/match`)
- [x] AI analysis endpoint (score, gap, bullets)
- [x] Results view (score ring, skill chips, copyable bullets)
- [ ] Deploy to Vercel

## Tech stack

- **Next.js 16** (App Router) + **React** + **TypeScript**
- **Tailwind CSS v4**
- **NVIDIA NIM / Mistral** via an OpenAI-compatible API (swappable)

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your NVIDIA_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run the tests with:

```bash
npm test
```

## Environment

| Variable              | Description                                              |
| --------------------- | ------------------------------------------------------- |
| `NVIDIA_API_KEY`      | API key for the NVIDIA NIM OpenAI-compatible endpoint.  |
| `NVIDIA_BASE_URL`     | Optional. Defaults to the NVIDIA integrate endpoint.    |
| `NVIDIA_MODEL`        | Optional. Defaults to `mistralai/mistral-7b-instruct-v0.3`. |
| `NEXT_PUBLIC_SITE_URL`| Optional. Absolute base URL used for Open Graph links.  |

## Score breakdown

Beyond the single overall number, the analysis returns a per-category breakdown
— Skills, Experience, Keywords, Education, each 0–100 — rendered as labelled bars
under the score ring and included in the downloaded report. Parsing is defensive:
`parseAnalysis` clamps each category score to 0–100 and drops unnamed or malformed
entries, and the field defaults to an empty array, so older saved or shared results
without a breakdown still load fine.

## Input cleanup

Resumes and job descriptions pasted from PDFs, Word, or web pages arrive full of
noise — smart bullet glyphs, non-breaking and zero-width spaces, stray control
characters, and ragged blank lines. Before anything is sent to the model, both
inputs pass through a pure `normalizeText()` (`src/lib/normalize.ts`) that unifies
line endings, strips invisible junk, rewrites bullet glyphs to `- `, and collapses
excess whitespace. It is idempotent and unit-tested against real invisible
characters, and it means cleaner prompts and fewer wasted tokens.

## Reliability

Model calls are hardened against the flakiness of a free hosted endpoint:

- **Timeout** — each request is aborted after 30s (`REQUEST_TIMEOUT_MS`).
- **Retries** — transient failures (network errors, timeouts, and HTTP
  408/429/500/502/503/504) are retried up to twice with exponential backoff
  (500ms, 1s). Non-transient errors like a 400 fail fast.
- **Input limits** — each field must be between 50 and 20,000 characters; the
  `/api/analyze` route rejects anything outside that range with a 400 before
  spending any tokens.

## Downloadable reports

Every analysis can be saved as a self-contained Markdown report — score and
verdict, matched/missing skills, and the tailored bullet suggestions. Click
**Download report** in the results view to save a `resume-match-report-<score>.md`
file to share or paste into notes. The report is built by a pure `buildReport()`
helper in `src/lib/report.ts`, so it is unit-tested independently of the browser.

## Saved sessions

Your most recent analysis — the resume, the job description, and the result —
is saved to `localStorage` and restored automatically the next time you open the
page, so a refresh or a quick tab-close never loses your work. **Clear** wipes it.
Serialization and validation live in a pure `src/lib/storage.ts` module (malformed
or tampered data parses back to `null` and is ignored), unit-tested on its own.

## Analysis history

The last eight analyses are kept under a **Recent analyses** list (newest first).
Click any entry to reopen its resume, job description, and result; re-running the
same inputs replaces the old entry rather than piling up duplicates. **Clear
history** wipes the list. The list logic — dedup, cap, labelling, and lenient
parsing that skips malformed entries — lives in a pure `src/lib/history.ts`
module with its own unit tests.

## Shareable result links

**Copy share link** in the results view puts a URL on your clipboard that encodes
the whole result in a `?r=` query param. Open that link and the analysis loads
read-only with a "viewing a shared analysis" banner — handy for sending a match
to a mentor. Encoding is UTF-8-safe base64url, and decoding runs the payload back
through `parseAnalysis`, so a truncated or tampered link simply resolves to no
shared result. The encode/decode core lives in a pure `src/lib/share.ts` module
with its own unit tests — no server round-trip, nothing stored.

## Suggestion tone

A **Bullet tone** selector next to the Analyze button steers the voice of the
tailored bullets: **impact** (metrics-driven, the default), **concise** (short and
punchy), or **friendly** (warm, first-person). The choice rides along in the
`/api/analyze` request and is appended to the model's system prompt; unknown or
missing values fall back to `impact` server-side via `parseTone`. The tone→prompt
mapping lives in `toneInstruction()` and is unit-tested.

## Copy all suggestions

A **Copy all** button in the suggestions header copies every tailored bullet to
the clipboard as a dash-prefixed list, so you can paste the whole set into your
resume in one go (individual **Copy** buttons remain per bullet). Formatting is a
pure `suggestionsToText()` helper — it trims each line and drops blanks — and is
unit-tested on its own.

## License

MIT © [Pixel20coder](https://github.com/Pixel20coder)
