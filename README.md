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
- [ ] Results view
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

## Environment

| Variable          | Description                                            |
| ----------------- | ------------------------------------------------------ |
| `NVIDIA_API_KEY`  | API key for the NVIDIA NIM OpenAI-compatible endpoint. |
| `NVIDIA_BASE_URL` | Optional. Defaults to the NVIDIA integrate endpoint.   |

## License

MIT © [Pixel20coder](https://github.com/Pixel20coder)
