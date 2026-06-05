// PATCH  /api/admin/bills/:id
//   {action:'edit', title?, memo?, pay_month?, method?, gift_codes?, transfer_date?}  ※発送前のみ
//   {action:'send'}  — 발송 (지불방법 필수, 이후 수정·삭제 불가)
// DELETE /api/admin/bills/:id — 삭제 (발송 전만, 소속 활동은 미편성으로 복귀)
import { json, err, requireAdmin } from '../../_utils.js';
import { normalizePayment } from '../bills.js';

export async function onRequestPatch({ request, env, params }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);
  const id = Number(params.id);
  let body;
  try {
    body = await request.json();
  } catch {
    return err('JSON body required');
  }

  const bill = await env.DB.prepare('SELECT * FROM bills WHERE id = ?').bind(id).first();
  if (!bill) return err('not found', 404);

  if (body.action === 'edit') {
    if (bill.sent_at) return err('発送済みの案件は修正できません');
    const title = (body.title || '').trim();
    if (!title) return err('タイトルを入力してください');
    const pay = normalizePayment(body);
    if (pay.error) return err(pay.error);
    await env.DB.prepare(
      `UPDATE bills SET title = ?, memo = ?, pay_month = ?, method = ?, gift_codes = ?, transfer_date = ?,
       updated_at = datetime('now') WHERE id = ?`
    ).bind(title, (body.memo || '').trim() || null, pay.payMonth, pay.method,
      pay.giftCodes.length ? JSON.stringify(pay.giftCodes) : null, pay.transferDate, id).run();
    return json({ ok: true });
  }

  if (body.action === 'send') {
    if (bill.sent_at) return err('既に発送済みです');
    // 발송하려면 지불방법과 그 내용이 필요
    if (!bill.method) return err('発送するには支払い方法の入力が必要です（修正から入力してください）');
    if (bill.method === 'amazon') {
      const codes = bill.gift_codes ? JSON.parse(bill.gift_codes) : [];
      if (!codes.length) return err('発送するにはギフトカード番号が必要です');
    }
    if (bill.method === 'transfer' && !bill.transfer_date) {
      return err('発送するには送金日が必要です');
    }
    await env.DB.prepare(
      "UPDATE bills SET sent_at = datetime('now'), updated_at = datetime('now') WHERE id = ?"
    ).bind(id).run();
    return json({ ok: true });
  }

  return err('invalid action');
}

export async function onRequestDelete({ request, env, params }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);
  const id = Number(params.id);
  const bill = await env.DB.prepare('SELECT id, sent_at FROM bills WHERE id = ?').bind(id).first();
  if (!bill) return err('not found', 404);
  if (bill.sent_at) return err('発送済みの案件は削除できません');

  await env.DB.prepare('UPDATE submissions SET bill_id = NULL WHERE bill_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM bills WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
