-- 로컬 테스트용 시드 데이터 (운영 DB에는 실행하지 말 것)

INSERT INTO ambassadors (name, token, channel) VALUES
  ('テスト太郎', 'test-token-taro-0001', 'YouTube'),
  ('テスト花子', 'test-token-hanako-02', 'X (Twitter)');

INSERT INTO submissions (ambassador_id, type, payload, suggested_amount, status, created_at) VALUES
  (1, 'content',
   '{"category":"ai_slide","url":"https://youtube.com/watch?v=xxxx","channel":"YouTube","published_date":"2026-06-02"}',
   10000, 'approved', datetime('now','-3 days')),
  (1, 'webinar_pre',
   '{"title":"AI資料作成セミナー","event_date":"2026-06-20","expected_participants":30,"webinar_type":"targeted","mc_duration":"40分","mc_content":"AIスライド機能のデモ","ai_tools":"ChatGPT"}',
   NULL, 'submitted', datetime('now','-1 days')),
  (2, 'referral',
   '{"referral_kind":"person","name":"佐藤AI子","sns_url":"https://x.com/example","main_channel":"X","track":"ai","reason":"AI資料作成の発信者でフォロワー3万人","relation":"同じコミュニティのメンバー"}',
   NULL, 'submitted', datetime('now'));

UPDATE submissions SET approved_amount = 10000, reviewed_at = datetime('now','-2 days') WHERE id = 1;
