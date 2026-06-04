// GET /api/me?token=xxx — 앰버서더 본인 정보 + 활동내역 + 월별 집계
import { json, err, getAmbassadorByToken, extractToken } from './_utils.js';

export async function onRequestGet({ request, env }) {
  const amb = await getAmbassadorByToken(env, extractToken(request));
  if (!amb) return err('invalid token', 401);

  const { results: submissions } = await env.DB.prepare(
    `SELECT id, type, payload, suggested_amount, approved_amount, status,
            admin_note, linked_submission_id, created_at, reviewed_at, paid_at
     FROM submissions WHERE ambassador_id = ? ORDER BY created_at DESC`
  ).bind(amb.id).all();

  const { results: files } = await env.DB.prepare(
    `SELECT f.id, f.submission_id, f.kind, f.filename, f.size
     FROM files f JOIN submissions s ON s.id = f.submission_id
     WHERE s.ambassador_id = ?`
  ).bind(amb.id).all();

  // 이번 달(JST) 콘텐츠 건수 (월 5건 상한 게이지용, 반려 제외)
  const capRow = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM submissions
     WHERE ambassador_id = ? AND type = 'content' AND status != 'rejected'
       AND substr(datetime(created_at, '+9 hours'), 1, 7) = substr(datetime('now', '+9 hours'), 1, 7)`
  ).bind(amb.id).first();

  // 월별 합계 (승인/지급 기준)
  const { results: monthly } = await env.DB.prepare(
    `SELECT substr(datetime(created_at, '+9 hours'), 1, 7) AS month,
            SUM(COALESCE(approved_amount, 0)) AS total
     FROM submissions
     WHERE ambassador_id = ? AND status IN ('approved', 'paid')
     GROUP BY month ORDER BY month DESC`
  ).bind(amb.id).all();

  return json({
    ambassador: { id: amb.id, name: amb.name, channel: amb.channel },
    submissions: submissions.map(s => ({ ...s, payload: JSON.parse(s.payload || '{}') })),
    files,
    content_count_this_month: capRow?.n ?? 0,
    monthly_totals: monthly,
  });
}
