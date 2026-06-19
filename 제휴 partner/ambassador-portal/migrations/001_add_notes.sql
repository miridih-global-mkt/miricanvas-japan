-- 連絡事項 / 非公開メモ 분리 (기존 데이터 보존: ADD COLUMN만 — 기존 행은 NULL로 채워짐)
-- submissions.admin_note = 連絡事項(노출, 기존 유지) / private_note = 非公開メモ(신규)
-- bills.memo = 非公開メモ(노출X, 기존 유지)        / liaison_note = 連絡事項(신규)
ALTER TABLE submissions ADD COLUMN private_note TEXT;
ALTER TABLE bills ADD COLUMN liaison_note TEXT;
