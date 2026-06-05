// POST /api/admin/pay — 해당 실행월의 승인 건 일괄 지불 + 지불 기록 생성
// body: {ambassador_id, month, method: 'amazon'|'transfer', gift_codes?: string[], transfer_date?: 'YYYY-MM-DD'}
import { json, err, requireAdmin, isDate } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return err('JSON body required');
  }
  const ambassadorId = Number(body.ambassador_id);
  const month = body.month;
  if (!ambassadorId || !/^\d{4}-\d{2}$/.test(month || '')) return err('ambassador_id and month required');

  // 지불 방법 검증
  const method = body.method;
  let giftCodes = null;
  let transferDate = null;
  if (method === 'amazon') {
    giftCodes = (body.gift_codes || []).map(s => String(s).trim()).filter(Boolean);
    if (!giftCodes.length) return err('ギフトカード番号を入力してください');
  } else if (method === 'transfer') {
    if (!isDate(body.transfer_date)) return err('送金日(YYYY-MM-DD)を入力してください');
    transferDate = body.transfer_date;
  } else {
    return err('method must be amazon or transfer');
  }

  // 지불 대상: 해당 실행월의 승인(미지급) 건
  const target = await env.DB.prepare(
    `SELECT COUNT(*) AS n, SUM(COALESCE(approved_amount, 0)) AS total FROM submissions
     WHERE ambassador_id = ? AND status = 'approved' AND substr(activity_date, 1, 7) = ?`
  ).bind(ambassadorId, month).first();
  if (!target?.n) return err('支払い対象（承認済み）がありません');

  await env.DB.prepare(
    `INSERT INTO payments (ambassador_id, month, method, gift_codes, transfer_date, amount)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).bind(ambassadorId, month, method, giftCodes ? JSON.stringify(giftCodes) : null, transferDate, target.total).run();

  const res = await env.DB.prepare(
    `UPDATE submissions SET status = 'paid', paid_at = datetime('now')
     WHERE ambassador_id = ? AND status = 'approved' AND substr(activity_date, 1, 7) = ?`
  ).bind(ambassadorId, month).run();

  return json({ ok: true, updated: res.meta.changes, amount: target.total });
}
