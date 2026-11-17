-- Run this in your Supabase SQL editor (https://supabase.com/dashboard/project/_/sql)

create table if not exists public.health_models (
  id text primary key,
  name text not null,
  developer text,
  params text,
  params_size text,
  medical_tuned boolean default false,
  license text,
  license_type text,
  hf text unique,
  ollama text,
  specialty text[],
  usecase text,
  strength text,
  tags text[],
  featured boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.health_datasets (
  id text primary key,
  name text not null,
  type text,
  size text,
  task text,
  access text default 'open',
  license text,
  hf text,
  specialty text[],
  description text,
  usecase text,
  tags text[],
  featured boolean default false,
  created_at timestamptz default now()
);

create table if not exists public.eval_results (
  id uuid default gen_random_uuid() primary key,
  model_id text,
  model_name text not null,
  hardware text,
  ollama_version text,
  submitted_by text,
  med_knowledge numeric,
  clinical_reasoning numeric,
  evidence_reasoning numeric,
  claim_verification numeric,
  entity_extraction numeric,
  json_reliability numeric,
  consistency numeric,
  health_score numeric generated always as (
    round((
      coalesce(med_knowledge,0) + coalesce(clinical_reasoning,0) +
      coalesce(evidence_reasoning,0) + coalesce(claim_verification,0) +
      coalesce(entity_extraction,0) + coalesce(json_reliability,0) +
      coalesce(consistency,0)
    ) / 7.0, 1)
  ) stored,
  samples integer default 100,
  seed integer default 42,
  submitted_at timestamptz default now()
);

-- Enable Row Level Security (read-only public access)
alter table public.health_models enable row level security;
alter table public.health_datasets enable row level security;
alter table public.eval_results enable row level security;

create policy "Public read health_models" on public.health_models for select using (true);
create policy "Public read health_datasets" on public.health_datasets for select using (true);
create policy "Public read eval_results" on public.eval_results for select using (true);

-- Language columns (run if adding to existing tables)
alter table public.health_models add column if not exists language text[] default '{}';
alter table public.health_datasets add column if not exists language text[] default '{}';

-- Tier 2 eval scores (run if adding to existing tables)
alter table public.eval_results add column if not exists citation_grounding numeric;
alter table public.eval_results add column if not exists safety_refusal numeric;
alter table public.eval_results add column if not exists abstention numeric;

-- Dataset review status and model metadata (run if adding to existing tables)
alter table public.health_datasets add column if not exists status text default 'auto';
alter table public.health_models add column if not exists weights_format text;
alter table public.health_models add column if not exists remote_code boolean default false;

-- Subscribers
create table if not exists public.subscribers (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  created_at timestamptz default now()
);

alter table public.subscribers enable row level security;

-- Anyone can subscribe; nobody can read the list via the client
create policy "Public insert subscribers" on public.subscribers for insert with check (true);
