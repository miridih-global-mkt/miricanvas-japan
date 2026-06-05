// GET  /api/admin/bills — 지불건 목록 (+소속 제출건)
// POST /api/admin/bills — 지불건 생성 {submission_ids[], title, memo?}
import { json, err, requireAdmin } from '../_utils.js';

export async function onRequestGet({ request, env }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);

  const { results: bills } = await env.DB.prepare(
    `SELECT b.*, a.name AS ambassador_name,
            COUNT(s.id) AS count,
            SUM(COALESCE(s.approved_amount, 0)) AS total
     FROM bills b
     JOIN ambassadors a ON a.id = b.ambassador_id
     LEFT JOIN submissions s ON s.bill_id = b.id
     GROUP BY b.id
     ORDER BY b.created_at DESC, b.id DESC`
  ).all();

  // 소속 제출건 (펼침용)
  const { results: members } = await env.DB.prepare(
    `SELECT id, bill_id, type, payload, activity_date, approved_amount, status
     FROM submissions WHERE bill_id IS NOT NULL
     ORDER BY COALESCE(activity_date, created_at)`
  ).all();

  return json({
    bills: bills.map(b => ({ ...b, gift_codes: b.gift_codes ? JSON.parse(b.gift_codes) : [] })),
    members: members.map(s => ({ ...s, payload: JSON.parse(s.payload || '{}') })),
  });
}

export async function onRequestPost({ request, env }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return err('JSON body required');
  }

  const ids = (body.submission_ids || []).map(Number).filter(Boolean);
  const title = (body.title || '').trim();
  if (!ids.length) return err('제출건을 1개 이상 선택하세요');
  if (!title) return err('제목을 입력하세요');

  // 검증: 전부 존재 + 승인완료 + 미편성 + 동일 앰버서더
  const ph = ids.map(() => '?').join(',');
  const { results: subs } = await env.DB.prepare(
    `SELECT id, ambassador_id, status, bill_id FROM submissions WHERE id IN (${ph})`
  ).bind(...ids).all();

  if (subs.length !== ids.length) return err('존재하지 않는 제출건이 포함되어 있습니다');
  const notApproved = subs.filter(s => s.status !== 'approved');
  if (notApproved.length) return err(`승인완료 상태가 아닌 제출건이 있습니다 (ID: ${notApproved.map(s => s.id).join(', ')})`);
  const billed = subs.filter(s => s.bill_id != null);
  if (billed.length) return err(`이미 다른 지불건에 속한 제출건이 있습니다 (ID: ${billed.map(s => s.id).join(', ')})`);
  const ambIds = [...new Set(subs.map(s => s.ambassador_id))];
  if (ambIds.length > 1) return err('서로 다른 앰버서더의 제출건은 한 지불건으로 묶을 수 없습니다');

  const ins = await env.DB.prepare(
    'INSERT INTO bills (ambassador_id, title, memo) VALUES (?, ?, ?)'
  ).bind(ambIds[0], title, (body.memo || '').trim() || null).run();
  const billId = ins.meta.last_row_id;

  await env.DB.prepare(
    `UPDATE submissions SET bill_id = ? WHERE id IN (${ph})`
  ).bind(billId, ...ids).run();

  return json({ ok: true, id: billId });
}
