-- 앰버서더 포털 스키마 (D1 / SQLite) v3
-- v3: 사전신청 삭제(webinar 단일화), 지불건(bills) 수동 생성 모델, 제출:지불건 = N:1
--     제출 상태 3종(submitted/approved/rejected) — 지불 여부는 bills가 담당

CREATE TABLE IF NOT EXISTS ambassadors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  description TEXT,                             -- 설명 (수정 가능)
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- 리워드 안건 (운영자가 활동을 수동 선택해 생성. 발송 전에는 수정·삭제 가능)
CREATE TABLE IF NOT EXISTS bills (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ambassador_id INTEGER NOT NULL REFERENCES ambassadors(id),
  title TEXT NOT NULL,                          -- 필수. 예: "2026年6月分"
  memo TEXT,
  pay_month TEXT,                               -- 지불월 (YYYY-MM, 선택)
  method TEXT CHECK (method IN ('amazon','transfer')),  -- 지불방법 (선택, 발송 시 필수)
  gift_codes TEXT,                              -- 아마존: 기프트코드 JSON 배열
  transfer_date TEXT,                           -- 해외송금: 송금일 (YYYY-MM-DD)
  sent_at TEXT,                                 -- 발송 시각 (NULL = 発送待ち)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_bills_amb ON bills(ambassador_id);

CREATE TABLE IF NOT EXISTS submissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ambassador_id INTEGER NOT NULL REFERENCES ambassadors(id),
  type TEXT NOT NULL CHECK (type IN ('content','webinar','referral','adjustment')),
  payload TEXT NOT NULL DEFAULT '{}',           -- 폼 항목 전체 JSON (규정 변경 대비)
  activity_date TEXT,                           -- 실행일 (YYYY-MM-DD)
  suggested_amount INTEGER,                     -- 자동 제안 금액(엔)
  approved_amount INTEGER,                      -- 운영자 확정 금액(엔)
  status TEXT NOT NULL DEFAULT 'submitted'
    CHECK (status IN ('submitted','approved','rejected')),
  admin_note TEXT,
  bill_id INTEGER REFERENCES bills(id),         -- 소속 지불건 (N:1, NULL = 미편성)
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  reviewed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_submissions_ambassador ON submissions(ambassador_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_bill ON submissions(bill_id);

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
