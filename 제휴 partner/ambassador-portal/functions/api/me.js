// GET /api/me?token=xxx — 앰버서더 본인 정보 + 활동내역 + 지불 기록
import { json, err, getAmbassadorByToken, extractToken } from './_utils.js';

export async function onRequestGet({ request, env }) {
  const amb = await getAmbassadorByToken(env, extractToken(request));
  if (!amb) return err('invalid token', 401);

  const { results: submissions } = await env.DB.prepare(
    `SELECT id, type, payload, activity_date, suggested_amount, approved_amount, status,
            admin_note, linked_submission_id, created_at, reviewed_at, paid_at
     FROM submissions WHERE ambassador_id = ? ORDER BY COALESCE(activity_date, created_at) DESC, id DESC`
  ).bind(amb.id).all();

  const { results: files } = await env.DB.prepare(
    `SELECT f.id, f.submission_id, f.kind, f.filename, f.size
     FROM files f JOIN submissions s ON s.id = f.submission_id
     WHERE s.ambassador_id = ?`
  ).bind(amb.id).all();

  // 이번 달(JST, 실행월 기준) 콘텐츠 건수 (월 5건 상한 게이지용, 반려 제외)
  const capRow = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM submissions
     WHERE ambassador_id = ? AND type = 'content' AND status != 'rejected'
       AND substr(activity_date, 1, 7) = substr(datetime('now', '+9 hours'), 1, 7)`
  ).bind(amb.id).first();

  // 지불 기록 (정산 탭용)
  const { results: payments } = await env.DB.prepare(
    `SELECT id, month, method, gift_codes, transfer_date, amount, created_at
     FROM payments WHERE ambassador_id = ? ORDER BY month DESC, id`
  ).bind(amb.id).all();

  return json({
    ambassador: { id: amb.id, name: amb.name },
    submissions: submissions.map(s => ({ ...s, payload: JSON.parse(s.payload || '{}') })),
    files,
    content_count_this_month: capRow?.n ?? 0,
    payments: payments.map(p => ({ ...p, gift_codes: p.gift_codes ? JSON.parse(p.gift_codes) : [] })),
  });
}
