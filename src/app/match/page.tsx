"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  MIN_INPUT_LENGTH,
  DEFAULT_TONE,
  SUGGESTION_TONES,
  type AnalysisResult,
  type SuggestionTone,
} from "@/lib/types";
import { SAMPLE_RESUME, SAMPLE_JOB } from "@/lib/sample";
import { clearSession, loadSession, saveSession } from "@/lib/storage";
import {
  clearHistory,
  entryLabel,
  loadHistory,
  pushHistory,
  removeFromHistory,
  type HistoryEntry,
} from "@/lib/history";
import { decodeResult, SHARE_PARAM } from "@/lib/share";
import { isSubmitShortcut } from "@/lib/shortcut";
import {
  coverageScore,
  extractKeywords,
  keywordCoverage,
  type Keyword,
} from "@/lib/keywords";
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
  const [shared, setShared] = useState(false);
  const [tone, setTone] = useState<SuggestionTone>(DEFAULT_TONE);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const formRef = useRef<HTMLFormElement>(null);

  // On mount, hydrate from (in priority order) a shared ?r= link, then the last
  // saved session, plus past runs. localStorage and the URL are only available on
  // the client, so this must happen in an effect.
  useEffect(() => {
    const sharedResult = decodeResult(
      new URLSearchParams(window.location.search).get(SHARE_PARAM),
    );
    const saved = loadSession();
    /* eslint-disable react-hooks/set-state-in-effect -- one-time external-store hydration */
    setHistory(loadHistory());
    if (sharedResult) {
      setResult(sharedResult);
      setShared(true);
      return;
    }
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

  // Instant, client-side keyword coverage — no LLM call needed. Recomputed only
  // when the inputs change, and only once both have enough text to be useful.
  const coverage = useMemo(() => {
    if (!resumeReady || !jobReady) return null;
    const keywords = extractKeywords(jobDescription);
    const { covered, missing } = keywordCoverage(resume, keywords);
    return { covered, missing, score: coverageScore(covered.length, keywords.length) };
  }, [resume, jobDescription, resumeReady, jobReady]);

  function loadSample() {
    setResume(SAMPLE_RESUME);
    setJobDescription(SAMPLE_JOB);
    setError(null);
    setResult(null);
    setRestored(false);
    setShared(false);
  }

  function clearAll() {
    setResume("");
    setJobDescription("");
    setError(null);
    setResult(null);
    setRestored(false);
    setShared(false);
    clearSession();
  }

  function restoreEntry(entry: HistoryEntry) {
    setResume(entry.resume);
    setJobDescription(entry.jobDescription);
    setResult(entry.result);
    setError(null);
    setRestored(true);
    setShared(false);
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

  function removeHistoryEntry(id: string) {
    setHistory(removeFromHistory(id));
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLFormElement>) {
    // Cmd/Ctrl+Enter submits from anywhere in the form, including the textareas.
    if (isSubmitShortcut(event) && canSubmit) {
      event.preventDefault();
      formRef.current?.requestSubmit();
    }
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
        body: JSON.stringify({ resume, jobDescription, tone }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `Request failed (${res.status})`);
      }
      const analysis = (await res.json()) as AnalysisResult;
      setResult(analysis);
      setRestored(false);
      setShared(false);
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

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        onKeyDown={handleKeyDown}
        className="grid gap-6 sm:grid-cols-2"
      >
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

        <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Analyzing…" : "Analyze match"}
          </button>
          <label className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
            Bullet tone
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as SuggestionTone)}
              className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm capitalize outline-none focus:border-indigo-500 dark:border-zinc-700 dark:bg-zinc-950"
            >
              {SUGGESTION_TONES.map((t) => (
                <option key={t} value={t} className="capitalize">
                  {t}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="sm:col-span-2 -mt-2">
          {!canSubmit && !loading ? (
            <p className="mt-2 text-xs text-zinc-500">
              Add at least {MIN_INPUT_LENGTH} characters to each field.
            </p>
          ) : (
            !loading && (
              <p className="mt-2 text-xs text-zinc-400">
                Tip: press{" "}
                <kbd className="rounded border border-zinc-300 px-1 dark:border-zinc-700">⌘</kbd>
                /
                <kbd className="rounded border border-zinc-300 px-1 dark:border-zinc-700">Ctrl</kbd>
                {" + "}
                <kbd className="rounded border border-zinc-300 px-1 dark:border-zinc-700">Enter</kbd>{" "}
                to analyze.
              </p>
            )
          )}
        </div>
      </form>

      {coverage && (coverage.covered.length > 0 || coverage.missing.length > 0) && (
        <KeywordCoverage
          covered={coverage.covered}
          missing={coverage.missing}
          score={coverage.score}
        />
      )}

      {error && (
        <p className="mt-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}

      {!loading && result && shared && (
        <p className="mt-6 rounded-lg border border-indigo-200 bg-indigo-50 px-4 py-3 text-sm text-indigo-700 dark:border-indigo-900 dark:bg-indigo-950 dark:text-indigo-300">
          You&apos;re viewing a shared analysis. Paste your own resume above and run
          it to get your match.
        </p>
      )}

      {!loading && result && restored && !shared && (
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
              <li key={entry.id} className="flex items-stretch gap-2">
                <button
                  type="button"
                  onClick={() => restoreEntry(entry)}
                  className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-left text-sm transition hover:border-indigo-400 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:border-indigo-600 dark:hover:bg-zinc-900"
                >
                  {entryLabel(entry)}
                </button>
                <button
                  type="button"
                  onClick={() => removeHistoryEntry(entry.id)}
                  aria-label={`Remove ${entryLabel(entry)}`}
                  title="Remove"
                  className="shrink-0 rounded-lg border border-zinc-200 px-3 text-sm text-zinc-400 transition hover:border-red-300 hover:text-red-600 dark:border-zinc-800 dark:hover:border-red-900 dark:hover:text-red-400"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}

function KeywordCoverage({
  covered,
  missing,
  score,
}: {
  covered: Keyword[];
  missing: Keyword[];
  score: number;
}) {
  return (
    <section className="mt-8 rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
          Job keyword coverage
        </h2>
        <span className="text-sm font-medium tabular-nums">
          {score}% <span className="text-zinc-400">({covered.length}/{covered.length + missing.length})</span>
        </span>
      </div>
      <p className="mb-3 text-xs text-zinc-500">
        A quick, instant check of which top job keywords already appear in your resume — run
        the full analysis for scored, tailored feedback.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {covered.map((k) => (
          <span
            key={k.term}
            className="rounded-full border border-green-300 bg-green-50 px-2.5 py-0.5 text-xs text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
          >
            {k.term}
          </span>
        ))}
        {missing.map((k) => (
          <span
            key={k.term}
            className="rounded-full border border-zinc-300 px-2.5 py-0.5 text-xs text-zinc-500 line-through dark:border-zinc-700"
          >
            {k.term}
          </span>
        ))}
      </div>
    </section>
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
