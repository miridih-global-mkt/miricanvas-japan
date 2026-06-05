// PATCH /api/admin/submissions/:id — 검토 처리
// body: {action: 'approve'|'reject'|'paid'|'reopen', approved_amount?, admin_note?, activity_date?}
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

  const sub = await env.DB.prepare('SELECT id, status FROM submissions WHERE id = ?').bind(id).first();
  if (!sub) return err('not found', 404);

  const note = body.admin_note ?? null;
  // 승인 시 실행일 수정 가능 (소개 성사일 등 운영자가 확정)
  const activityDate = isDate(body.activity_date) ? body.activity_date : null;

  switch (body.action) {
    case 'approve': {
      const amount = Number(body.approved_amount);
      if (!Number.isFinite(amount) || amount < 0) return err('approved_amount required');
      await env.DB.prepare(
        `UPDATE submissions SET status = 'approved', approved_amount = ?,
         admin_note = COALESCE(?, admin_note), activity_date = COALESCE(?, activity_date),
         reviewed_at = datetime('now'), paid_at = NULL
         WHERE id = ?`
      ).bind(amount, note, activityDate, id).run();
      break;
    }
    case 'reject':
      await env.DB.prepare(
        `UPDATE submissions SET status = 'rejected', approved_amount = NULL,
         admin_note = COALESCE(?, admin_note), reviewed_at = datetime('now'), paid_at = NULL
         WHERE id = ?`
      ).bind(note, id).run();
      break;
    case 'paid':
      if (sub.status !== 'approved') return err('approved 상태만 지급 처리 가능');
      await env.DB.prepare(
        "UPDATE submissions SET status = 'paid', paid_at = datetime('now') WHERE id = ?"
      ).bind(id).run();
      break;
    case 'reopen':
      await env.DB.prepare(
        `UPDATE submissions SET status = 'submitted', approved_amount = NULL,
         reviewed_at = NULL, paid_at = NULL WHERE id = ?`
      ).bind(id).run();
      break;
    default:
      return err('invalid action');
  }

  const updated = await env.DB.prepare('SELECT * FROM submissions WHERE id = ?').bind(id).first();
  return json({ ok: true, submission: { ...updated, payload: JSON.parse(updated.payload || '{}') } });
}
