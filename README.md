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

## License

MIT © [Pixel20coder](https://github.com/Pixel20coder)
