"use client";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import React, { useEffect } from "react";
import {
  BarChart3,
  BrainCircuit,
  FileText,
  PenSquare,
  LogOut,
} from "lucide-react";
import {
  WeeklyActivityChart,
  InterviewPerformanceChart,
  SubmissionBreakdownChart,
  AiInsightsChart,
} from "@/components/StatsCharts";

/**
 * PUBLIC_INTERFACE
 * Authenticated dashboard shell for CareerAI Nexus.
 * - Cyber-security theme: pitch black/cyan (dark), white/pink (light)
 * - Persistent navigation to Resume, Cover Letter, Interview modules
 * - Placeholders for graphs/stats & AI insights
 * - Protected: visible only to authenticated users (session + middleware enforced)
 */
export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    }
  }, [session, status, router]);

  // Theme classes
  const baseCard =
    "bg-white/80 dark:bg-[#0a0a0a]/90 border border-pink-200 dark:border-cyan-600";
  const navHighlight =
    "bg-pink-400 dark:bg-cyan-500 text-white dark:text-black";
  const navOutline =
    "border border-pink-200 dark:border-cyan-600 text-pink-600 dark:text-cyan-400 bg-white dark:bg-[#191B21]";
  const heading =
    "font-bold text-2xl text-black dark:text-cyan-400 tracking-tight";
  const sectionTitle =
    "font-semibold text-pink-600 dark:text-cyan-400 uppercase text-sm tracking-wide mb-2";

  // PUBLIC_INTERFACE
  function handleSignOut() {
    signOut({ callbackUrl: "/signin" });
  }

  return (
    <main className="min-h-screen w-full bg-white dark:bg-black transition-colors duration-300 flex flex-col">
      <header
        className="w-full shadow-md flex justify-between items-center px-6 py-5
                    bg-white/80 dark:bg-[#0a0a0a]/95 sticky top-0 z-10 border-b border-pink-100 dark:border-cyan-800"
      >
        <div className="flex gap-3 items-center">
          <BrainCircuit className="w-7 h-7 text-pink-600 dark:text-cyan-400" />
          <span className="font-bold text-lg tracking-wider text-black dark:text-cyan-200">
            AIspire Dashboard
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-base text-black dark:text-cyan-200 font-medium">
            {session?.user?.name || session?.user?.email}
          </span>
          <button
            onClick={handleSignOut}
            className="p-1 px-2 rounded transition-colors bg-transparent hover:bg-pink-100 dark:hover:bg-cyan-800"
            aria-label="Sign out"
          >
            <LogOut className="w-5 h-5 text-pink-600 dark:text-cyan-400" />
          </button>
        </div>
      </header>
      <section className="flex flex-1 flex-col md:flex-row gap-6 p-6 max-w-6xl mx-auto w-full">
        {/* Sidebar Navigation */}
        <nav
          className={`flex md:flex-col gap-4 md:w-56 min-w-[140px]`}
          aria-label="Dashboard navigation"
        >
          <Link
            href="/dashboard"
            className={`${navHighlight} rounded-lg py-3 flex items-center gap-2 px-5 font-semibold`}
            aria-current="page"
          >
            <BarChart3 className="w-5 h-5" /> Dashboard
          </Link>
          <Link
            href="/resume"
            className={`${navOutline} rounded-lg py-3 flex items-center gap-2 px-5 font-semibold hover:bg-pink-50 dark:hover:bg-[#222d]`}
          >
            <FileText className="w-5 h-5" /> Resume
          </Link>
          <Link
            href="/cover-letter"
            className={`${navOutline} rounded-lg py-3 flex items-center gap-2 px-5 font-semibold hover:bg-pink-50 dark:hover:bg-[#222d]`}
          >
            <PenSquare className="w-5 h-5" /> Cover Letter
          </Link>
          <Link
            href="/interview"
            className={`${navOutline} rounded-lg py-3 flex items-center gap-2 px-5 font-semibold hover:bg-pink-50 dark:hover:bg-[#222d]`}
          >
            <BrainCircuit className="w-5 h-5" /> Interview Prep
          </Link>
        </nav>
        {/* Main Dashboard Content */}
        <div className={`flex-1 flex flex-col gap-7 min-w-0`}>
          {/* Performance Stats/Graphs */}
          <section className={`${baseCard} rounded-2xl shadow-lg p-6`}>
            <h2 className={sectionTitle}>Your Progress</h2>
            <div className="flex flex-col md:flex-row gap-6 w-full">
              {/* Left: Graphs column */}
              <div className="flex-1 flex flex-col gap-6 min-w-0">
                <div className="rounded-xl p-4 bg-pink-50/60 dark:bg-cyan-950/40 border border-pink-100 dark:border-cyan-700 mb-2">
                  <span className="font-bold text-black dark:text-cyan-200 text-base">Weekly Activity</span>
                  <WeeklyActivityChart />
                </div>
                <div className="rounded-xl p-4 bg-pink-50/60 dark:bg-cyan-950/40 border border-pink-100 dark:border-cyan-700">
                  <span className="font-bold text-black dark:text-cyan-200 text-base">Interview Performance</span>
                  <InterviewPerformanceChart />
                </div>
              </div>
              {/* Key stats + resume/cover chart */}
              <div className="flex flex-col gap-5 w-72 min-w-[200px] shrink-0">
                <div className="rounded-lg bg-pink-100/80 dark:bg-cyan-900/90 flex flex-col items-center p-3 border border-pink-200 dark:border-cyan-800">
                  <div className="text-xs uppercase font-semibold tracking-wide text-pink-700 dark:text-cyan-400 pb-2">Submissions</div>
                  <SubmissionBreakdownChart />
                  <div className="flex mt-2 gap-3 justify-center w-full text-center text-xs font-medium">
                    <span className="flex-auto text-pink-700 dark:text-cyan-300">Resumes: 12</span>
                    <span className="flex-auto text-pink-700 dark:text-cyan-300">Covers: 7</span>
                  </div>
                </div>
                <div className="rounded-md bg-pink-100 dark:bg-cyan-900/80 text-center p-3 border border-pink-200 dark:border-cyan-800">
                  <div className="text-xl font-bold text-pink-700 dark:text-cyan-300">6</div>
                  <div className="text-xs uppercase font-semibold text-pink-700 dark:text-cyan-300">Weeks Tracked</div>
                </div>
                <div className="rounded-md bg-pink-100 dark:bg-cyan-900/80 text-center p-3 border border-pink-200 dark:border-cyan-800">
                  <div className="text-xl font-bold text-pink-700 dark:text-cyan-300">Interview High: 89%</div>
                  <div className="text-xs uppercase font-semibold text-pink-700 dark:text-cyan-300">Best Score</div>
                </div>
              </div>
            </div>
          </section>
          {/* Weekly AI Insights */}
          <section className={`${baseCard} rounded-2xl shadow-lg p-6`}>
            <h2 className={sectionTitle}>Weekly AI Insights</h2>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              <div className="flex-1 flex flex-col min-w-0">
                <AiInsightsChart />
              </div>
              <div className="flex flex-col gap-2 shrink-0 w-64">
                <div className="flex items-center gap-3">
                  <BrainCircuit className="w-6 h-6 text-pink-500 dark:text-cyan-400" aria-hidden />
                  <span className="italic text-black/90 dark:text-cyan-200 opacity-80">
                    Sample AI-powered weekly insight: <br />
                    <span className="font-semibold">“Your interview performance is trending upward. Keep practicing scenario-based questions.”</span>
                  </span>
                </div>
              </div>
            </div>
          </section>
          {/* Feedback Form navigation (optional per spec; main modules visible above) */}
          <div className="mt-4 w-full text-right">
            <Link
              href="/feedback"
              className="inline-block rounded-lg border border-pink-400 dark:border-cyan-400 px-4 py-2 font-semibold text-pink-600 dark:text-cyan-400 bg-white dark:bg-black hover:bg-pink-50 dark:hover:bg-cyan-950 transition"
            >
              Give Feedback
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
