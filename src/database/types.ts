export interface DatabaseScript {
  id: number;
  title: string;
  file_path: string;
  content_hash: string;
  word_count: number;
  created_at: string;
  updated_at: string;
}

export interface DatabaseSummary {
  id: number;
  script_id: number;
  plot_overview: string | null;
  characters: string | null; // JSON string
  themes: string | null; // JSON string
  production_notes: string | null; // JSON string
  genre: string | null;
  model_used: string | null;
  created_at: string;
}

export interface DatabaseScriptEvaluation {
  id: number;
  script_id: number;
  rating: number | null;
  notes: string | null;
  tags: string | null; // JSON string
  created_at: string;
  updated_at: string;
}

export interface DatabaseConnection {
  close(): void;
  prepare(sql: string): any;
  exec(sql: string): void;
  transaction(fn: () => void): () => void;
}

export interface MigrationRecord {
  id: number;
  version: string;
  applied_at: string;
}
