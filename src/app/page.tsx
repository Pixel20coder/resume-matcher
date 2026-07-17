import Link from "next/link";

const features = [
  {
    title: "Match score",
    body: "See at a glance how well your resume lines up with the role, from 0 to 100.",
  },
  {
    title: "Skills gap",
    body: "Find the keywords and requirements the job asks for that your resume is missing.",
  },
  {
    title: "Tailored bullets",
    body: "Get rewritten, achievement-focused bullet points aimed at this specific job.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6">
      <section className="flex flex-col items-center pt-24 text-center sm:pt-32">
        <span className="rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          AI-powered · free to run
        </span>
        <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
          Match your resume to any job
          <span className="block text-indigo-600 dark:text-indigo-400">
            in seconds.
          </span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-zinc-600 dark:text-zinc-400">
          Paste your resume and a job description. ResumeMatch scores the fit,
          surfaces the skills you&apos;re missing, and rewrites your bullets to
          land the interview.
        </p>
        <div className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/match"
            className="rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Analyze my resume
          </Link>
          <a
            href="#how-it-works"
            className="rounded-lg border border-zinc-300 px-6 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-900"
          >
            How it works
          </a>
        </div>
      </section>

      <section id="how-it-works" className="grid gap-6 py-24 sm:grid-cols-3">
        {features.map((feature) => (
          <div
            key={feature.title}
            className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800"
          >
            <h2 className="text-lg font-semibold">{feature.title}</h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              {feature.body}
            </p>
          </div>
        ))}
      </section>

      <footer className="mt-auto border-t border-zinc-200 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800">
        Built by{" "}
        <a
          href="https://github.com/Pixel20coder"
          className="font-medium text-zinc-700 underline-offset-4 hover:underline dark:text-zinc-300"
        >
          Pixel20coder
        </a>
      </footer>
    </main>
  );
}
