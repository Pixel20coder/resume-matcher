"use client";

import Link from "next/link";
import { useState } from "react";
import { MIN_INPUT_LENGTH, type AnalysisResult } from "@/lib/types";

export default function MatchPage() {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const resumeReady = resume.trim().length >= MIN_INPUT_LENGTH;
  const jobReady = jobDescription.trim().length >= MIN_INPUT_LENGTH;
  const canSubmit = resumeReady && jobReady && !loading;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, jobDescription }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      setResult((await res.json()) as AnalysisResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-12">
      <div className="mb-8">
        <Link
          href="/"
          className="text-sm text-zinc-500 underline-offset-4 hover:underline"
        >
          ← Back
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Analyze your resume</h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Paste your resume and the job description you&apos;re targeting.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 sm:grid-cols-2">
        <Field
          label="Your resume"
          value={resume}
          onChange={setResume}
          ready={resumeReady}
          placeholder="Paste your resume text here…"
        />
        <Field
          label="Job description"
          value={jobDescription}
          onChange={setJobDescription}
          ready={jobReady}
          placeholder="Paste the job description here…"
        />

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Analyze match"}
          </button>
          {!canSubmit && !loading && (
            <p className="mt-2 text-xs text-zinc-500">
              Add at least {MIN_INPUT_LENGTH} characters to each field.
            </p>
          )}
        </div>
      </form>

      {error && (
        <p className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {result && (
        <pre className="mt-6 overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}

function Field({
  label,
  value,
  onChange,
  ready,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  ready: boolean;
  placeholder: string;
}) {
  return (
    <label className="flex flex-col">
      <span className="mb-2 flex items-center justify-between text-sm font-medium">
        {label}
        <span className={ready ? "text-green-600" : "text-zinc-400"}>
          {value.trim().length} chars
        </span>
      </span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={14}
        className="resize-y rounded-lg border border-zinc-300 bg-white p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:ring-indigo-900"
      />
    </label>
  );
}
