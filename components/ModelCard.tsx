import type { HealthModel } from "@/types";

export default function ModelCard({ model }: { model: HealthModel }) {
  const icon = model.medical_tuned ? "🧬" : "🤖";
  const hfUrl = `https://huggingface.co/${model.hf}`;
  const ollamaUrl = model.ollama ? `https://ollama.com/library/${model.ollama.split(":")[0]}` : null;

  return (
    <div className="hf-card">
      <div className="hf-card-top">
        <span className="hf-card-icon">{icon}</span>
        <div className="hf-card-badges">
          {model.medical_tuned ? (
            <span className="badge badge-med">Medical</span>
          ) : (
            <span className="badge badge-gen">General</span>
          )}
          <span className={`badge ${model.license_type === "open-source" ? "badge-open" : "badge-weights"}`}>
            {model.license_type === "open-source" ? "Open Source" : "Open Weights"}
          </span>
          {model.params !== "?" && (
            <span className="badge badge-type">{model.params}</span>
          )}
        </div>
      </div>

      <h3 className="hf-card-title">{model.name}</h3>
      <p className="hf-card-dev">{model.developer}</p>
      <p className="hf-card-usecase">{model.usecase}</p>
      {model.strength && (
        <p className="hf-card-strength">
          <strong>Best for:</strong> {model.strength}
        </p>
      )}

      <div className="hf-card-tags">
        {(model.language || []).map((l) => (
          <span key={l} className="pill pill-lang">🌐 {l}</span>
        ))}
        {model.tags.slice(0, 4).map((tag) => (
          <span key={tag} className="pill">{tag}</span>
        ))}
      </div>

      <div className="hf-card-links">
        <a className="card-link" href={hfUrl} target="_blank" rel="noopener noreferrer">
          HuggingFace ↗
        </a>
        {ollamaUrl && (
          <a className="card-link" href={ollamaUrl} target="_blank" rel="noopener noreferrer">
            Ollama ↗
          </a>
        )}
        {!ollamaUrl && (
          <span className="card-link-note">Not on Ollama</span>
        )}
        <span className="hf-card-lic">{model.license}</span>
      </div>

      <div className="trust-row">
        <span className="trust-item">
          <span className="trust-label">Licence source</span>
          <span className="trust-val">HuggingFace card</span>
        </span>
        {model.weights_format && (
          <span className="trust-item">
            <span className="trust-label">Weights</span>
            <span className="trust-val">{model.weights_format}</span>
          </span>
        )}
        {model.remote_code && (
          <span className="trust-item trust-warn">
            <span className="trust-label">⚠</span>
            <span className="trust-val">Requires custom code</span>
          </span>
        )}
        {model.status === "checked" && (
          <span className="trust-item trust-status trust-checked">✓ Licence verified</span>
        )}
      </div>
    </div>
  );
}
