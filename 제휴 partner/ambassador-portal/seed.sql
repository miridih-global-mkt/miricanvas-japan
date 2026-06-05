-- 로컬 테스트용 시드 데이터 v4 (운영 DB에는 실행하지 말 것)
-- 데모: 지불완료 빌(해외송금/아마존)·지불전 빌·미편성 승인건·확인중 건 모두 포함

INSERT INTO ambassadors (name, token, description) VALUES
  ('テスト太郎', 'test-token-taro-0001', 'Shift AI講師・YouTube発信'),
  ('テスト花子', 'test-token-hanako-02', 'X発信・デザイン系');

-- 지불건
INSERT INTO bills (ambassador_id, title, memo, method, gift_codes, transfer_date, created_at, paid_at) VALUES
  (1, '2026年4月分', '기업연수 정산', 'transfer', NULL, '2026-05-30', '2026-05-25 03:00:00', '2026-05-30 03:00:00'),
  (1, '2026年5月分', NULL, 'amazon', '["AMZN-TEST-AAAA-1111","AMZN-TEST-BBBB-2222"]', NULL, '2026-06-25 03:00:00', '2026-06-28 03:00:00'),
  (1, '2026年6月分', '운영정산 포함', NULL, NULL, NULL, datetime('now'), NULL);  -- 지불전

-- 太郎: 4월 웨비나(빌1), 5월 콘텐츠(빌2), 6월 콘텐츠+운영정산(빌3=지불전)
INSERT INTO submissions (ambassador_id, type, payload, activity_date, suggested_amount, approved_amount, status, bill_id, created_at, reviewed_at) VALUES
  (1, 'webinar',
   '{"title":"企業AI研修","event_date":"2026-04-18","webinar_type":"targeted","participants":120,"memo":"Zoom参加者リストで確認"}',
   '2026-04-18', 60000, 60000, 'approved', 1, '2026-04-19 03:00:00', '2026-04-22 03:00:00'),
  (1, 'content',
   '{"category":"ai_slide","url":"https://youtube.com/watch?v=may1","channel":"YouTube","published_date":"2026-05-20"}',
   '2026-05-20', 10000, 10000, 'approved', 2, '2026-05-21 03:00:00', '2026-05-25 03:00:00'),
  (1, 'content',
   '{"category":"ai_slide","url":"https://youtube.com/watch?v=jun1","channel":"YouTube","published_date":"2026-06-02"}',
   '2026-06-02', 10000, 10000, 'approved', 3, '2026-06-02 03:00:00', '2026-06-03 03:00:00'),
  (1, 'adjustment',
   '{"title":"紹介成約の残金（佐藤AI子さん・初回活動完了）","memo":"紹介報酬 2.5万円の残金分"}',
   '2026-06-03', 25000, 25000, 'approved', 3, '2026-06-04 03:00:00', '2026-06-04 03:00:00'),

-- 花子: 5월 콘텐츠 승인 (지불건 미편성 — 체크박스로 빌 생성 테스트용)
  (2, 'content',
   '{"category":"ai_slide","url":"https://note.com/hanako/may","channel":"note","published_date":"2026-05-15"}',
   '2026-05-15', 10000, 10000, 'approved', NULL, '2026-05-16 03:00:00', '2026-05-18 03:00:00'),
  (2, 'adjustment',
   '{"title":"紹介成約の残金","memo":"테스트"}',
   '2026-06-10', 25000, 25000, 'approved', NULL, '2026-06-10 03:00:00', '2026-06-10 03:00:00');

-- 확인중 제출 (승인 흐름 테스트용)
INSERT INTO submissions (ambassador_id, type, payload, activity_date, suggested_amount, status, created_at) VALUES
  (1, 'webinar',
   '{"title":"AI資料作成セミナー","event_date":"2026-06-20","webinar_type":"targeted","participants":28,"memo":"終了後の報告"}',
   '2026-06-20', 14000, 'submitted', datetime('now','-1 days')),
  (2, 'referral',
   '{"referral_kind":"person","p_name":"佐藤AI子","p_sns_url":"https://x.com/example","p_main_channel":"X","p_track":"ai","reason":"AI資料作成の発信者でフォロワー3万人","relation":"同じコミュニティのメンバー","referral_date":"2026-06-04"}',
   '2026-06-04', NULL, 'submitted', datetime('now'));
