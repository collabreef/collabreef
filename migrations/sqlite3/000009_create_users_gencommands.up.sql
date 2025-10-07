CREATE TABLE user_gencommands (
  id TEXT  PRIMARY KEY,
  user_id TEXT ,
  name TEXT,
  container_type TEXT,
  prompt TEXT,
  gen_type TEXT,
  model TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);