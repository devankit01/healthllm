import fs from "fs";
import path from "path";

function getLastSync(): string | null {
  try {
    const f = path.join(process.cwd(), "data", "last-sync.json");
    const { date } = JSON.parse(fs.readFileSync(f, "utf8"));
    return date ?? null;
  } catch {
    return null;
  }
}

export default function Footer() {
  const lastSync = getLastSync();

  return (
    <footer>
      <div className="wrap foot">
        <p>
          <strong>HealthLLM</strong> — open catalogue for health AI.
          Scores compare models under the same questions and settings (temperature 0, seed 42, 100 samples).
          Results may vary across hardware and Ollama versions.
        </p>
        <p>
          <strong>Not medical advice.</strong> These benchmarks measure language model performance on standardised questions, not clinical safety.
          Always validate models with domain experts before clinical use.
          Compliance with HIPAA or other regulations is your responsibility — it depends on how you deploy, where PHI goes, and the licence terms.
        </p>
        <p className="foot-maintenance">
          Static site on Netlify · Updated weekly by a{" "}
          <a href="https://github.com/devankit01/healthllm/blob/main/.github/workflows/weekly-sync.yml" target="_blank" rel="noopener noreferrer">GitHub Action</a>
          {lastSync ? ` · Last synced ${lastSync}` : ""}
          {" · "}
          <a href="https://github.com/devankit01/healthllm" target="_blank" rel="noopener noreferrer">Open source · fork it</a>
        </p>
        <p style={{ marginTop: 12 }}>
          <a href="https://github.com/devankit01/healthllm" target="_blank" rel="noopener noreferrer">GitHub</a>
          {" · "}
          <a href="https://github.com/devankit01/healthllm/blob/main/CONTRIBUTING.md" target="_blank" rel="noopener noreferrer">Contributing</a>
          {" · "}
          <a href="https://github.com/devankit01/healthllm/issues" target="_blank" rel="noopener noreferrer">Issues</a>
          {" · "}
          <a href="/methodology">Methodology</a>
        </p>
      </div>
    </footer>
  );
}
