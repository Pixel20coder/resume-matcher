"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { MIN_INPUT_LENGTH, type AnalysisResult } from "@/lib/types";
import { SAMPLE_RESUME, SAMPLE_JOB } from "@/lib/sample";
import { clearSession, loadSession, saveSession } from "@/lib/storage";
import {
  clearHistory,
  entryLabel,
  loadHistory,
  pushHistory,
  type HistoryEntry,
} from "@/lib/history";
import AnalysisResults from "./AnalysisResults";
import ResultsSkeleton from "./ResultsSkeleton";

/** A best-effort unique id that degrades gracefully without crypto. */
function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${performance.now()}-${Math.round(performance.now() * 1000)}`;
}

export default function MatchPage() {
  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [restored, setRestored] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Restore the last analysis and past runs from a previous visit, once, on mount.
  // localStorage is unavailable during SSR, so this must happen in a client effect.
  useEffect(() => {
    const saved = loadSession();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time external-store hydration */
    setHistory(loadHistory());
    if (!saved) return;
    setResume(saved.resume);
    setJobDescription(saved.jobDescription);
    setResult(saved.result);
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  const resumeReady = resume.trim().length >= MIN_INPUT_LENGTH;
  const jobReady = jobDescription.trim().length >= MIN_INPUT_LENGTH;
  const canSubmit = resumeReady && jobReady && !loading;
  const hasInput = resume.length > 0 || jobDescription.length > 0;

  function loadSample() {
    setResume(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JOB);
    setError(null);
    setResult(null);
    setRestored(false);
  }

  function clearAll() {
    setResume("");
    setJobDescription("");
    setError(null);
    setResult(null);
    setRestored(false);
    clearSession();
  }

  function restoreEntry(entry: HistoryEntry) {
    setResume(entry.resume);
    setJobDescription(entry.jobDescription);
    setResult(entry.result);
    setError(null);
    setRestored(true);
    saveSession({
      resume: entry.resume,
      jobDescription: entry.jobDescription,
      result: entry.result,
    });
  }

  function wipeHistory() {
    clearHistory();
    setHistory([]);
  }

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
      const analysis = (await res.json()) as AnalysisResult;
      setResult(analysis);
      setRestored(false);
      saveSession({ resume, jobDescription, result: analysis });
      setHistory(
        pushHistory({
          id: newId(),
          savedAt: Date.now(),
          resume,
          jobDescription,
          result: analysis,
        }),
      );
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
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            onClick={loadSample}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            Try with sample data
          </button>
          {hasInput && (
            <button
              type="button"
              onClick={clearAll}
              className="rounded-md px-3 py-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Clear
            </button>
          )}
        </div>
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

      {!loading && result && restored && (
        <p className="mt-6 text-xs text-zinc-500">
          Showing your last analysis from this browser. Edit and re-run to refresh it.
        </p>
      )}

      {loading && <ResultsSkeleton />}
      {!loading && result && <AnalysisResults result={result} />}

      {history.length > 0 && (
        <section className="mt-12 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
              Recent analyses
            </h2>
            <button
              type="button"
              onClick={wipeHistory}
              className="text-xs font-medium text-zinc-500 transition hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              Clear history
            </button>
          </div>
          <ul className="space-y-2">
            {history.map((entry) => (
              <li key={entry.id}>
                <button
                  type="button"
                  onClick={() => restoreEntry(entry)}
                  className="w-full rounded-lg border border-zinc-200 px-4 py-2.5 text-left text-sm transition hover:border-indigo-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-indigo-600 dark:hover:bg-zinc-900"
                >
                  {entryLabel(entry)}
                </button>
              </li>
            ))}
          </ul>
        </section>
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
