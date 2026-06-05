// POST /api/admin/pay — 지불 내용 입력/수정 (앰버서더 × 실행월당 1건 upsert)
// body: {ambassador_id, month, method: 'amazon'|'transfer', gift_codes?: string[], transfer_date?: 'YYYY-MM-DD'}
// 동작: 지불 기록을 생성/갱신하고, 해당 월의 승인(미지급) 건을 모두 지불완료로 전환.
//       금액은 해당 월 확정분(승인+지급) 합계로 자동 갱신 — 늦게 승인된 건도 수정 시 합산됨.
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

  // 해당 실행월의 확정분 합계 (승인 + 기지급)
  const totals = await env.DB.prepare(
    `SELECT COUNT(*) AS n, SUM(COALESCE(approved_amount, 0)) AS total FROM submissions
     WHERE ambassador_id = ? AND status IN ('approved', 'paid') AND substr(activity_date, 1, 7) = ?`
  ).bind(ambassadorId, month).first();
  if (!totals?.n) return err('対象となる確定項目（承認済み・支払い済み）がありません');

  const existing = await env.DB.prepare(
    'SELECT id FROM payments WHERE ambassador_id = ? AND month = ?'
  ).bind(ambassadorId, month).first();

  if (existing) {
    await env.DB.prepare(
      `UPDATE payments SET method = ?, gift_codes = ?, transfer_date = ?, amount = ?,
       updated_at = datetime('now') WHERE id = ?`
    ).bind(method, giftCodes ? JSON.stringify(giftCodes) : null, transferDate, totals.total, existing.id).run();
  } else {
    await env.DB.prepare(
      `INSERT INTO payments (ambassador_id, month, method, gift_codes, transfer_date, amount)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).bind(ambassadorId, month, method, giftCodes ? JSON.stringify(giftCodes) : null, transferDate, totals.total).run();
  }

  // 해당 월의 승인(미지급) 건 → 지불완료
  const res = await env.DB.prepare(
    `UPDATE submissions SET status = 'paid', paid_at = datetime('now')
     WHERE ambassador_id = ? AND status = 'approved' AND substr(activity_date, 1, 7) = ?`
  ).bind(ambassadorId, month).run();

  return json({ ok: true, mode: existing ? 'updated' : 'created', updated: res.meta.changes, amount: totals.total });
}
