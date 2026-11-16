import type { HealthDataset } from "@/types";

export default function DatasetCard({ dataset }: { dataset: HealthDataset }) {
  const hfUrl = dataset.hf ? `https://huggingface.co/datasets/${dataset.hf}` : null;

  return (
    <div className="hf-card">
      <div className="hf-card-top">
        <span className="hf-card-icon">📊</span>
        <div className="hf-card-badges">
          <span className="badge badge-type">{dataset.type}</span>
          <span className={`badge ${dataset.access === "open" ? "badge-open" : "badge-warn"}`}>
            {dataset.access === "open" ? "Open" : "Credentialed"}
          </span>
        </div>
      </div>

      <h3 className="hf-card-title">{dataset.name}</h3>
      <p className="hf-card-dev">{dataset.size}</p>
      <p className="hf-card-usecase">{dataset.description}</p>
      {dataset.usecase && (
        <p className="hf-card-strength">
          <strong>Use case:</strong> {dataset.usecase}
        </p>
      )}

      <div className="hf-card-tags">
        {(dataset.language || []).map((l) => (
          <span key={l} className="pill pill-lang">🌐 {l}</span>
        ))}
        {dataset.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="pill">{tag}</span>
        ))}
      </div>

      <div className="hf-card-links">
        {hfUrl ? (
          <a className="card-link" href={hfUrl} target="_blank" rel="noopener noreferrer">
            HuggingFace ↗
          </a>
        ) : (
          <span className="card-link-note">Not on HuggingFace</span>
        )}
        <span className="hf-card-lic">{dataset.license}</span>
      </div>

      <div className="trust-row">
        <span className="trust-item">
          <span className="trust-label">Licence source</span>
          <span className="trust-val">HuggingFace card</span>
        </span>
        <span className={`trust-item trust-status ${dataset.status === "checked" ? "trust-checked" : "trust-auto"}`}>
          {dataset.status === "checked" ? "✓ Licence verified" : "Auto-listed"}
        </span>
      </div>
    </div>
  );
}
