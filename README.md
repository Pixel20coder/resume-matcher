# ResumeMatch

> Paste your resume and a job description — get an instant match score, a
> per-category breakdown, a skills-gap analysis, and rewritten bullet points
> tailored to the role.

![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178c6)
![Tests](https://img.shields.io/badge/tests-97%20passing-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)

A full-stack AI web app built with Next.js and TypeScript. It talks to any
OpenAI-compatible chat endpoint and defaults to NVIDIA NIM's free Mistral model,
so it costs nothing to run. The interesting logic — parsing, cleanup, keyword
matching, persistence, sharing — lives in small pure modules under `src/lib`,
each covered by its own unit tests.

## Demo flow

1. Paste your resume and the job description into `/match`.
2. See instant, client-side keyword coverage before you spend a request.
3. Run the analysis for a scored, categorised, tailored breakdown.
4. Copy the bullets, download a report, or share a read-only link.

## Features

**Analysis**
- Overall match score (0–100) with a one-line summary and a score ring.
- Per-category breakdown — Skills, Experience, Keywords, Education — as labelled bars.
- Matched vs missing skills, de-duplicated and reconciled (a skill is never both).
- Rewritten, achievement-focused bullet suggestions in a tone you choose:
  **impact**, **concise**, or **friendly**.

**Smart input handling**
- Instant, client-side keyword coverage that updates as you type — no API call.
- Live per-field character count with min / near-limit / over states.
- Automatic cleanup of pasted text (smart bullets, zero-width and control
  characters, ragged whitespace) before anything reaches the model.
- **⌘/Ctrl + Enter** submits from anywhere in the form.

**Results, export & sharing**
- Copy a single bullet or **Copy all** at once.
- Download a self-contained Markdown report of the whole analysis.
- **Copy share link** — the result is encoded into a `?r=` URL and opens
  read-only, with no server round-trip and nothing stored.

**Persistence**
- Your last analysis is auto-saved to `localStorage` and restored on return.
- A history of the last eight analyses — reopen any, remove one, or clear all.

**Reliability**
- Model calls time out after 30s and retry transient failures with backoff.
- Inputs are validated (50–20,000 chars) before any tokens are spent.

## Tech stack

- **Next.js 16** (App Router) · **React 19** · **TypeScript 5**
- **Tailwind CSS v4**
- **Vitest** for unit tests
- **NVIDIA NIM / Mistral** via an OpenAI-compatible API (swappable)

## Getting started

```bash
npm install
cp .env.example .env.local   # then add your NVIDIA_API_KEY
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
npm test          # run the unit tests once
npm run build     # production build
npm run lint      # eslint
```

Node 20 is the target (see `.nvmrc`).

## Configuration

| Variable               | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| `NVIDIA_API_KEY`       | API key for the OpenAI-compatible endpoint. **Required.**   |
| `NVIDIA_BASE_URL`      | Optional. Defaults to the NVIDIA integrate endpoint.        |
| `NVIDIA_MODEL`         | Optional. Defaults to `mistralai/mistral-7b-instruct-v0.3`. |
| `NEXT_PUBLIC_SITE_URL` | Optional. Absolute base URL used for Open Graph links.      |

Because the client is OpenAI-compatible, pointing these three variables at
another provider (OpenAI, Together, Groq, a local server) is all it takes to
switch models.

## Project layout

```
src/
  app/
    page.tsx              landing page
    match/                the analyzer UI (form, results, history)
    api/analyze/route.ts  server route: validate → clean → call model → parse
  lib/
    analyze.ts    prompt building + defensive result parsing
    llm.ts        OpenAI-compatible client with timeout + retries
    normalize.ts  clean pasted text before it reaches the model
    keywords.ts   client-side keyword extraction and coverage
    types.ts      shared types, validation, length banding
    storage.ts    last-session persistence
    history.ts    recent-analyses list
    share.ts      encode/decode result links
    report.ts     Markdown report + clipboard formatting
    shortcut.ts   keyboard-shortcut matching
```

Every module in `src/lib` is pure and independently unit-tested — the analysis
result flows through the same defensive `parseAnalysis` whether it comes from the
model, a saved session, the history list, or a shared link.

## License

MIT © [Pixel20coder](https://github.com/Pixel20coder)
