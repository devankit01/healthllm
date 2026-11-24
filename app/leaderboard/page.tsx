import { createClient } from "@/utils/supabase/server";
import type { EvalResult } from "@/types";
import type { Metadata } from "next";
import ScoresBanner from "@/components/ScoresBanner";
import LeaderboardClient from "@/components/LeaderboardClient";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Leaderboard — HealthLLM",
  description: "Health LLM benchmark scores across 7 clinical evals. Temperature 0, seed 42, 100 samples.",
};

export default async function LeaderboardPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("eval_results")
    .select("*")
    .order("health_score", { ascending: false });

  const results: EvalResult[] = data ?? [];

  return (
    <>
      <ScoresBanner />
      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 80 }}>
        <div style={{ marginBottom: 24 }}>
          <p className="sec-label" style={{ marginBottom: 8 }}>Leaderboard</p>
          <h2 style={{ marginBottom: 10 }}>Health LLM Benchmark Scores</h2>
          <p className="intro" style={{ marginBottom: 8 }}>
            Models compared at temperature&nbsp;0, seed&nbsp;42, 100 samples each.
            Click any model for full details.{" "}
            <Link href="/methodology">How scoring works →</Link>
          </p>
          <p style={{ fontSize: "13px", color: "var(--muted)", margin: 0 }}>
            <strong>Tier 1 (Health Score)</strong> = weighted average across 7 medical evals.{" "}
            <strong>Tier 2 (Deployment Trust)</strong> = safety refusal, abstention, citation — displayed but not in score.
          </p>
        </div>

        {results.length === 0 ? (
          <div className="notice demo">
            <p>No eval results yet. Run <code>python3 scripts/run_evals.py &lt;model&gt; --push</code> to be the first.</p>
          </div>
        ) : (
          <LeaderboardClient results={results} />
        )}

        <p style={{ marginTop: 20, fontSize: "12.5px", color: "var(--muted)" }}>
          Weights: Med Knowledge 20% · Clinical 20% · Evidence 15% · Claims 15% · NER 15% · Consistency 10% · JSON 5%.
          95% Wilson CI shown. n=100 → ±9pp margin.{" "}
          <a href="https://github.com/devankit01/healthllm/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Submit your model →</a>
        </p>
      </div>
    </>
  );
}
