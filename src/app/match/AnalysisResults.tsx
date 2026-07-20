"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/types";

export default function AnalysisResults({ result }: { result: AnalysisResult }) {
  return (
    <section className="mt-10 space-y-8">
      <div className="flex flex-col items-center gap-5 rounded-xl border border-zinc-200 p-6 sm:flex-row sm:items-center dark:border-zinc-800">
        <ScoreRing score={result.score} />
        <div className="text-center sm:text-left">
          <h2 className="text-lg font-semibold">Match score</h2>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            {result.summary || "Here's how your resume lines up with the role."}
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <ChipList
          title="Matched skills"
          items={result.matchedSkills}
          tone="good"
          empty="No overlapping skills detected."
        />
        <ChipList
          title="Missing skills"
          items={result.missingSkills}
          tone="warn"
          empty="Nothing major missing — nice."
        />
      </div>

      {result.suggestions.length > 0 && (
        <div>
          <h3 className="mb-3 text-lg font-semibold">Tailored bullet suggestions</h3>
          <ul className="space-y-3">
            {result.suggestions.map((text, i) => (
              <Suggestion key={i} text={text} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ScoreRing({ score }: { score: number }) {
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const color =
    score >= 75 ? "text-green-500" : score >= 50 ? "text-amber-500" : "text-red-500";

  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          className="stroke-zinc-200 dark:stroke-zinc-800"
        />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} stroke-current transition-[stroke-dashoffset] duration-700`}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-2xl font-bold">
        {score}
      </span>
    </div>
  );
}

function ChipList({
  title,
  items,
  tone,
  empty,
}: {
  title: string;
  items: string[];
  tone: "good" | "warn";
  empty: string;
}) {
  const chip =
    tone === "good"
      ? "border-green-300 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950 dark:text-green-300"
      : "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-300";

  return (
    <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
      <h3 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wide">
        {title} <span className="text-zinc-400">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-sm text-zinc-500">{empty}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((item) => (
            <span
              key={item}
              className={`rounded-full border px-3 py-1 text-xs font-medium ${chip}`}
            >
              {item}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function Suggestion({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  return (
    <li className="flex items-start justify-between gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
      <span className="text-sm">{text}</span>
      <button
        onClick={copy}
        className="shrink-0 rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium text-zinc-600 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </li>
  );
}
