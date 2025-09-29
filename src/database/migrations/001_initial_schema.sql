-- Initial database schema
-- This migration creates the core tables for the script summarizer application

-- Scripts table
CREATE TABLE IF NOT EXISTS scripts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  file_path TEXT NOT NULL,
  content_hash TEXT UNIQUE NOT NULL,
  word_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Summaries table
CREATE TABLE IF NOT EXISTS summaries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  script_id INTEGER NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  plot_overview TEXT,
  characters TEXT, -- JSON string
  themes TEXT, -- JSON string
  production_notes TEXT, -- JSON string
  genre TEXT,
  model_used TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (script_id) REFERENCES scripts(id)
);

-- User ratings and notes
CREATE TABLE IF NOT EXISTS script_evaluations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  script_id INTEGER NOT NULL REFERENCES scripts(id) ON DELETE CASCADE,
  rating INTEGER CHECK(rating >= 1 AND rating <= 5),
  notes TEXT,
  tags TEXT, -- JSON string
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (script_id) REFERENCES scripts(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scripts_content_hash ON scripts(content_hash);
CREATE INDEX IF NOT EXISTS idx_summaries_script_id ON summaries(script_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_script_id ON script_evaluations(script_id);
CREATE INDEX IF NOT EXISTS idx_scripts_created_at ON scripts(created_at);

-- DOWN
-- Drop tables in reverse order to handle foreign key constraints
DROP INDEX IF EXISTS idx_scripts_created_at;
DROP INDEX IF EXISTS idx_evaluations_script_id;
DROP INDEX IF EXISTS idx_summaries_script_id;
DROP INDEX IF EXISTS idx_scripts_content_hash;

DROP TABLE IF EXISTS script_evaluations;
DROP TABLE IF EXISTS summaries;
DROP TABLE IF EXISTS scripts;