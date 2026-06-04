// POST /api/admin/pay {ambassador_id, month} — 해당 월 승인 건 일괄 지급완료
import { json, err, requireAdmin } from '../_utils.js';

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

  const res = await env.DB.prepare(
    `UPDATE submissions SET status = 'paid', paid_at = datetime('now')
     WHERE ambassador_id = ? AND status = 'approved'
       AND substr(datetime(created_at, '+9 hours'), 1, 7) = ?`
  ).bind(ambassadorId, month).run();

  return json({ ok: true, updated: res.meta.changes });
}
