export interface HealthModel {
  id: string;
  name: string;
  developer: string;
  params: string;
  params_size: "tiny" | "small" | "medium" | "large";
  medical_tuned: boolean;
  license: string;
  license_type: "open-source" | "open-weights";
  hf: string;
  ollama: string | null;
  weights_format?: string;
  remote_code?: boolean;
  status?: "checked" | "auto";
  specialty: string[];
  usecase: string;
  strength: string;
  tags: string[];
  language?: string[];
  featured: boolean;
  created_at?: string;
}

export interface HealthDataset {
  id: string;
  name: string;
  type: string;
  size: string;
  task: string;
  access: "open" | "credentialed" | "gated";
  status?: "checked" | "auto";
  license: string;
  hf: string;
  specialty: string[];
  description: string;
  usecase: string;
  tags: string[];
  language?: string[];
  featured: boolean;
  created_at?: string;
}

export interface EvalResult {
  id: string;
  model_id: string;
  model_name: string;
  hardware: string;
  ollama_version: string;
  submitted_by: string;
  med_knowledge: number;
  clinical_reasoning: number;
  evidence_reasoning: number;
  claim_verification: number;
  entity_extraction: number;
  json_reliability: number;
  consistency: number;
  health_score: number;
  citation_grounding?: number;
  safety_refusal?: number;
  abstention?: number;
  quantization?: string;
  parameter_size?: string;
  samples: number;
  seed: number;
  submitted_at: string;
  /** "strict" | "lenient_strip_thinking" — which parser produced this result */
  parser_mode?: string;
  /** % of replies successfully parsed per eval */
  parse_rates?: Record<string, number>;
  /** True for preview/non-comparable runs (e.g. n=20 MLX) */
  is_preview?: boolean;
  /** model_id this entry duplicates */
  duplicate_of?: string;
}
