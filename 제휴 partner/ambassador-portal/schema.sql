-- 앰버서더 포털 스키마 (D1 / SQLite) v2
-- v2: activity_date(실행일 기준 정산), payments(지불 기록), adjustment(운영 정산), channel→description

CREATE TABLE IF NOT EXISTS ambassadors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  description TEXT,                             -- 설명 (수정 가능)
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ambassador_id INTEGER NOT NULL REFERENCES ambassadors(id),
  type TEXT NOT NULL CHECK (type IN ('content','webinar_pre','webinar_post','referral','adjustment')),
  payload TEXT NOT NULL DEFAULT '{}',           -- 폼 항목 전체 JSON (규정 변경 대비)
  activity_date TEXT,                           -- 실행일 (YYYY-MM-DD) — 정산 월 합산 기준
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
CREATE INDEX IF NOT EXISTS idx_submissions_activity ON submissions(activity_date);

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

-- 지불 기록 (앰버서더 × 실행월 단위, 잔금 등으로 한 달에 여러 건 가능)
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ambassador_id INTEGER NOT NULL REFERENCES ambassadors(id),
  month TEXT NOT NULL,                          -- 실행월 (YYYY-MM)
  method TEXT NOT NULL CHECK (method IN ('amazon','transfer')),
  gift_codes TEXT,                              -- 아마존: 기프트코드 JSON 배열
  transfer_date TEXT,                           -- 해외송금: 송금일 (YYYY-MM-DD)
  amount INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_payments_amb ON payments(ambassador_id, month);

CREATE TABLE IF NOT EXISTS admin_sessions (
  token TEXT PRIMARY KEY,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at TEXT NOT NULL
);
