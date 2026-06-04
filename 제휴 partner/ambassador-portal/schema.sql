-- 앰버서더 포털 스키마 (D1 / SQLite)

CREATE TABLE IF NOT EXISTS ambassadors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  channel TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ambassador_id INTEGER NOT NULL REFERENCES ambassadors(id),
  type TEXT NOT NULL CHECK (type IN ('content','webinar_pre','webinar_post','referral')),
  payload TEXT NOT NULL DEFAULT '{}',          -- 폼 항목 전체 JSON (규정 변경 대비)
  suggested_amount INTEGER,                     -- 자동 제안 금액(엔), 제안 불가 시 NULL
  approved_amount INTEGER,                      -- 운영자 확정 금액(엔)
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','approved','rejected','paid')),
  admin_note TEXT,
  linked_submission_id INTEGER REFERENCES submissions(id),  -- 사후보고→사전신청 연결
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT,
  paid_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_submissions_ambassador ON submissions(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);

CREATE TABLE IF NOT EXISTS files (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  submission_id INTEGER NOT NULL REFERENCES submissions(id),
  kind TEXT NOT NULL DEFAULT 'photo',           -- photo | slide
  r2_key TEXT NOT NULL,
  filename TEXT NOT NULL,
  size INTEGER,
  content_type TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_files_submission ON files(submission_id);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
