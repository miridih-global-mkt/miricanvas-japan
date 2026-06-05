-- 로컬 테스트용 시드 데이터 v3 (운영 DB에는 실행하지 말 것)
-- 데모 상태: 해외송금 완료(4월)·아마존 완료(5,6월)·지불 전(花子 5월) 모두 포함

INSERT INTO ambassadors (name, token, description) VALUES
  ('テスト太郎', 'test-token-taro-0001', 'Shift AI講師・YouTube発信'),
  ('テスト花子', 'test-token-hanako-02', 'X発信・デザイン系');

-- 太郎 4월: 기업연수 웨비나 120명 → 6만엔 → 해외송금 완료
INSERT INTO submissions (ambassador_id, type, payload, activity_date, suggested_amount, approved_amount, status, created_at, reviewed_at, paid_at) VALUES
  (1, 'webinar_post',
   '{"title":"企業AI研修","event_date":"2026-04-18","webinar_type":"targeted","participants":120,"memo":"Zoom参加者リストで確認"}',
   '2026-04-18', 60000, 60000, 'paid', '2026-04-19 03:00:00', '2026-04-22 03:00:00', '2026-05-30 03:00:00'),

-- 太郎 5월: 콘텐츠 → 아마존 기프트 완료
  (1, 'content',
   '{"category":"ai_slide","url":"https://youtube.com/watch?v=may1","channel":"YouTube","published_date":"2026-05-20"}',
   '2026-05-20', 10000, 10000, 'paid', '2026-05-21 03:00:00', '2026-05-25 03:00:00', '2026-06-30 03:00:00'),

-- 太郎 6월: 콘텐츠 + 운영정산 → 아마존 완료
  (1, 'content',
   '{"category":"ai_slide","url":"https://youtube.com/watch?v=jun1","channel":"YouTube","published_date":"2026-06-02"}',
   '2026-06-02', 10000, 10000, 'paid', '2026-06-02 03:00:00', '2026-06-03 03:00:00', '2026-06-05 03:00:00'),
  (1, 'adjustment',
   '{"title":"紹介成約の残金（佐藤AI子さん・初回活動完了）","memo":"紹介報酬 2.5万円の残金分"}',
   '2026-06-03', 25000, 25000, 'paid', '2026-06-04 03:00:00', '2026-06-04 03:00:00', '2026-06-05 03:00:00'),

-- 花子 5월: 콘텐츠 승인 → 지불 전 (支払予定 2026/6/30)
  (2, 'content',
   '{"category":"ai_slide","url":"https://note.com/hanako/may","channel":"note","published_date":"2026-05-15"}',
   '2026-05-15', 10000, 10000, 'approved', '2026-05-16 03:00:00', '2026-05-18 03:00:00', NULL),

-- 花子 6월: 운영정산 → 해외송금 완료
  (2, 'adjustment',
   '{"title":"紹介成約の残金","memo":"テスト"}',
   '2026-06-10', 25000, 25000, 'paid', '2026-06-10 03:00:00', '2026-06-10 03:00:00', '2026-07-31 03:00:00');

-- 확인중 제출 (승인 흐름 테스트용)
INSERT INTO submissions (ambassador_id, type, payload, activity_date, suggested_amount, status, created_at) VALUES
  (1, 'webinar_pre',
   '{"title":"AI資料作成セミナー","event_date":"2026-06-20T19:00","expected_participants":30,"webinar_type":"targeted","mc_duration":"40分","mc_content":"AIスライド機能のデモ","ai_tools":"ChatGPT"}',
   '2026-06-20', NULL, 'submitted', datetime('now','-1 days')),
  (2, 'referral',
   '{"referral_kind":"person","p_name":"佐藤AI子","p_sns_url":"https://x.com/example","p_main_channel":"X","p_track":"ai","reason":"AI資料作成の発信者でフォロワー3万人","relation":"同じコミュニティのメンバー","referral_date":"2026-06-04"}',
   '2026-06-04', NULL, 'submitted', datetime('now'));

-- 지불 기록 (앰버서더 × 월당 1건)
INSERT INTO payments (ambassador_id, month, method, gift_codes, transfer_date, amount, created_at) VALUES
  (1, '2026-04', 'transfer', NULL, '2026-05-30', 60000, '2026-05-30 03:00:00'),
  (1, '2026-05', 'amazon', '["AMZN-TEST-AAAA-1111","AMZN-TEST-BBBB-2222"]', NULL, 10000, '2026-06-30 03:00:00'),
  (1, '2026-06', 'amazon', '["AMZN-JUN-0001","AMZN-JUN-0002","AMZN-JUN-0003"]', NULL, 35000, '2026-06-05 03:00:00'),
  (2, '2026-06', 'transfer', NULL, '2026-07-31', 25000, '2026-07-31 03:00:00');
