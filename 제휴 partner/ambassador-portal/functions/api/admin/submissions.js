// GET  /api/admin/submissions?month=YYYY-MM&type=&status=&ambassador_id= — 목록 (month는 실행월 기준)
// POST /api/admin/submissions — 운영 정산 등록 (자동 승인: 소개 잔금 등)
import { json, err, requireAdmin, isDate } from '../_utils.js';

export async function onRequestGet({ request, env }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);

  const url = new URL(request.url);
  const conds = [];
  const binds = [];

  const month = url.searchParams.get('month');
  if (month) {
    conds.push("substr(s.activity_date, 1, 7) = ?");
    binds.push(month);
  }
  const type = url.searchParams.get('type');
  if (type) { conds.push('s.type = ?'); binds.push(type); }
  const status = url.searchParams.get('status');
  if (status) { conds.push('s.status = ?'); binds.push(status); }
  const ambassadorId = url.searchParams.get('ambassador_id');
  if (ambassadorId) { conds.push('s.ambassador_id = ?'); binds.push(Number(ambassadorId)); }

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const { results } = await env.DB.prepare(
    `SELECT s.*, a.name AS ambassador_name, b.title AS bill_title
     FROM submissions s
     JOIN ambassadors a ON a.id = s.ambassador_id
     LEFT JOIN bills b ON b.id = s.bill_id
     ${where} ORDER BY COALESCE(s.activity_date, s.created_at) DESC, s.id DESC LIMIT 500`
  ).bind(...binds).all();

  const ids = results.map(r => r.id);
  let files = [];
  if (ids.length) {
    const ph = ids.map(() => '?').join(',');
    const fr = await env.DB.prepare(
      `SELECT id, submission_id, kind, filename, size FROM files WHERE submission_id IN (${ph})`
    ).bind(...ids).all();
    files = fr.results;
  }

  return json({
    submissions: results.map(s => ({ ...s, payload: JSON.parse(s.payload || '{}') })),
    files,
  });
}

// 운영 정산 등록 — {ambassador_id, title, amount, activity_date, memo?} → 자동 승인
export async function onRequestPost({ request, env }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return err('JSON body required');
  }

  const ambassadorId = Number(body.ambassador_id);
  const amount = Number(body.amount);
  const title = (body.title || '').trim();
  if (!ambassadorId) return err('ambassador_id required');
  if (!title) return err('내용(title)을 입력하세요');
  if (!Number.isFinite(amount) || amount < 0) return err('금액이 올바르지 않습니다');
  if (!isDate(body.activity_date)) return err('실시일(YYYY-MM-DD)이 필요합니다');

  const amb = await env.DB.prepare('SELECT id FROM ambassadors WHERE id = ?').bind(ambassadorId).first();
  if (!amb) return err('ambassador not found', 404);

  const payload = JSON.stringify({ title, memo: body.memo || '' });
  const ins = await env.DB.prepare(
    `INSERT INTO submissions (ambassador_id, type, payload, activity_date, suggested_amount,
       approved_amount, status, reviewed_at)
     VALUES (?, 'adjustment', ?, ?, ?, ?, 'approved', datetime('now'))`
  ).bind(ambassadorId, payload, body.activity_date, amount, amount).run();

  return json({ ok: true, id: ins.meta.last_row_id });
}
