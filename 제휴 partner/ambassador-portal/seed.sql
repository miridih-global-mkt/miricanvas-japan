-- 로컬 테스트용 시드 데이터 v2 (운영 DB에는 실행하지 말 것)

INSERT INTO ambassadors (name, token, description) VALUES
  ('テスト太郎', 'test-token-taro-0001', 'Shift AI講師・YouTube発信'),
  ('テスト花子', 'test-token-hanako-02', 'X発信・デザイン系');

-- 5월: 지급 완료된 콘텐츠 1건 (정산 탭 「支払い済み」 행 확인용)
INSERT INTO submissions (ambassador_id, type, payload, activity_date, suggested_amount, approved_amount, status, created_at, reviewed_at, paid_at) VALUES
  (1, 'content',
   '{"category":"ai_slide","url":"https://youtube.com/watch?v=may1","channel":"YouTube","published_date":"2026-05-20"}',
   '2026-05-20', 10000, 10000, 'paid', '2026-05-21 03:00:00', '2026-05-25 03:00:00', '2026-06-30 03:00:00');

-- 6월: 승인 1건 + 확인중 2건 + 운영 정산(자동승인) 1건
INSERT INTO submissions (ambassador_id, type, payload, activity_date, suggested_amount, approved_amount, status, created_at, reviewed_at) VALUES
  (1, 'content',
   '{"category":"ai_slide","url":"https://youtube.com/watch?v=jun1","channel":"YouTube","published_date":"2026-06-02"}',
   '2026-06-02', 10000, 10000, 'approved', datetime('now','-3 days'), datetime('now','-2 days'));

INSERT INTO submissions (ambassador_id, type, payload, activity_date, suggested_amount, status, created_at) VALUES
  (1, 'webinar_pre',
   '{"title":"AI資料作成セミナー","event_date":"2026-06-20T19:00","expected_participants":30,"webinar_type":"targeted","mc_duration":"40分","mc_content":"AIスライド機能のデモ","ai_tools":"ChatGPT"}',
   '2026-06-20', NULL, 'submitted', datetime('now','-1 days')),
  (2, 'referral',
   '{"referral_kind":"person","p_name":"佐藤AI子","p_sns_url":"https://x.com/example","p_main_channel":"X","p_track":"ai","reason":"AI資料作成の発信者でフォロワー3万人","relation":"同じコミュニティのメンバー","referral_date":"2026-06-04"}',
   '2026-06-04', NULL, 'submitted', datetime('now'));

INSERT INTO submissions (ambassador_id, type, payload, activity_date, suggested_amount, approved_amount, status, created_at, reviewed_at) VALUES
  (1, 'adjustment',
   '{"title":"紹介成約の残金（佐藤AI子さん・初回活動完了）","memo":"紹介報酬 2.5万円の残金分"}',
   '2026-06-03', 25000, 25000, 'approved', datetime('now'), datetime('now'));

-- 5월분 지불 기록 (아마존 기프트 2장)
INSERT INTO payments (ambassador_id, month, method, gift_codes, amount, created_at) VALUES
  (1, '2026-05', 'amazon', '["AMZN-TEST-AAAA-1111","AMZN-TEST-BBBB-2222"]', 10000, '2026-06-30 03:00:00');
