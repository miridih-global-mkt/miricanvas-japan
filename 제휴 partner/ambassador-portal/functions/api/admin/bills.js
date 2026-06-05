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

// 지불방법 관련 필드 검증·정규화 (생성/수정 공용. method 자체는 선택)
export function normalizePayment(body) {
  const method = body.method || null;
  if (method && method !== 'amazon' && method !== 'transfer') {
    return { error: 'method must be amazon or transfer' };
  }
  const giftCodes = method === 'amazon'
    ? (body.gift_codes || []).map(s => String(s).trim()).filter(Boolean)
    : [];
  const transferDate = method === 'transfer' && /^\d{4}-\d{2}-\d{2}$/.test(body.transfer_date || '')
    ? body.transfer_date : null;
  const payMonth = /^\d{4}-\d{2}$/.test(body.pay_month || '') ? body.pay_month : null;
  return { method, giftCodes, transferDate, payMonth };
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
  if (!ids.length) return err('活動を1件以上選択してください');
  if (!title) return err('タイトルを入力してください');

  const pay = normalizePayment(body);
  if (pay.error) return err(pay.error);

  // 검증: 전부 존재 + 승인완료 + 미편성 + 동일 앰버서더
  const ph = ids.map(() => '?').join(',');
  const { results: subs } = await env.DB.prepare(
    `SELECT id, ambassador_id, status, bill_id FROM submissions WHERE id IN (${ph})`
  ).bind(...ids).all();

  if (subs.length !== ids.length) return err('存在しない活動が含まれています');
  const notApproved = subs.filter(s => s.status !== 'approved');
  if (notApproved.length) return err(`承認済みでない活動があります (ID: ${notApproved.map(s => s.id).join(', ')})`);
  const billed = subs.filter(s => s.bill_id != null);
  if (billed.length) return err(`既に他のリワード案件に含まれる活動があります (ID: ${billed.map(s => s.id).join(', ')})`);
  const ambIds = [...new Set(subs.map(s => s.ambassador_id))];
  if (ambIds.length > 1) return err('異なるアンバサダーの活動を一つの案件にまとめることはできません');

  const ins = await env.DB.prepare(
    `INSERT INTO bills (ambassador_id, title, memo, pay_month, method, gift_codes, transfer_date)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  ).bind(ambIds[0], title, (body.memo || '').trim() || null,
    pay.payMonth, pay.method, pay.giftCodes.length ? JSON.stringify(pay.giftCodes) : null, pay.transferDate).run();
  const billId = ins.meta.last_row_id;

  await env.DB.prepare(
    `UPDATE submissions SET bill_id = ? WHERE id IN (${ph})`
  ).bind(billId, ...ids).run();

  return json({ ok: true, id: billId });
}
