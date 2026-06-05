// PATCH  /api/admin/bills/:id — 지불내용 입력/수정 또는 기본정보 수정
//   {action:'payment', method:'amazon'|'transfer', gift_codes?, transfer_date?}
//   {action:'edit', title?, memo?}
// DELETE /api/admin/bills/:id — 지불건 삭제 (소속 제출건은 미편성으로 복귀)
import { json, err, requireAdmin, isDate } from '../../_utils.js';

export async function onRequestPatch({ request, env, params }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);
  const id = Number(params.id);
  let body;
  try {
    body = await request.json();
  } catch {
    return err('JSON body required');
  }

  const bill = await env.DB.prepare('SELECT id FROM bills WHERE id = ?').bind(id).first();
  if (!bill) return err('not found', 404);

  if (body.action === 'payment') {
    const method = body.method;
    let giftCodes = null;
    let transferDate = null;
    if (method === 'amazon') {
      giftCodes = (body.gift_codes || []).map(s => String(s).trim()).filter(Boolean);
      if (!giftCodes.length) return err('기프트카드 번호를 입력하세요');
    } else if (method === 'transfer') {
      if (!isDate(body.transfer_date)) return err('송금일(YYYY-MM-DD)을 입력하세요');
      transferDate = body.transfer_date;
    } else {
      return err('method must be amazon or transfer');
    }
    await env.DB.prepare(
      `UPDATE bills SET method = ?, gift_codes = ?, transfer_date = ?,
       paid_at = COALESCE(paid_at, datetime('now')), updated_at = datetime('now')
       WHERE id = ?`
    ).bind(method, giftCodes ? JSON.stringify(giftCodes) : null, transferDate, id).run();
    return json({ ok: true });
  }

  if (body.action === 'edit') {
    const sets = [];
    const binds = [];
    if (typeof body.title === 'string' && body.title.trim()) { sets.push('title = ?'); binds.push(body.title.trim()); }
    if ('memo' in body) { sets.push('memo = ?'); binds.push((body.memo || '').trim() || null); }
    if (!sets.length) return err('nothing to update');
    sets.push("updated_at = datetime('now')");
    binds.push(id);
    await env.DB.prepare(`UPDATE bills SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run();
    return json({ ok: true });
  }

  return err('invalid action');
}

export async function onRequestDelete({ request, env, params }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);
  const id = Number(params.id);
  const bill = await env.DB.prepare('SELECT id FROM bills WHERE id = ?').bind(id).first();
  if (!bill) return err('not found', 404);

  await env.DB.prepare('UPDATE submissions SET bill_id = NULL WHERE bill_id = ?').bind(id).run();
  await env.DB.prepare('DELETE FROM bills WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
