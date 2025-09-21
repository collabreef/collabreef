CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY,
  openai_api_key TEXT,
  gemini_api_key TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);