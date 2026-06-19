// PATCH /api/admin/submissions/:id — 검토 처리
// body: {action: 'approve'|'reject'|'reopen', approved_amount?, admin_note?(連絡事項), private_note?(非公開メモ), activity_date?}
// 지불건(bill)에 편성된 제출은 변경 불가 — 먼저 지불건에서 제외(지불건 삭제) 필요
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

  const sub = await env.DB.prepare('SELECT id, status, bill_id FROM submissions WHERE id = ?').bind(id).first();
  if (!sub) return err('not found', 404);
  if (sub.bill_id != null) return err('지불건에 포함된 제출건입니다. 변경하려면 먼저 해당 지불건을 삭제하세요.');

  // 連絡事項(노출)·非公開メ모(비노출): 빈 문자열도 명시적 삭제로 허용
  const note = 'admin_note' in body ? (body.admin_note || null) : undefined;
  const priv = 'private_note' in body ? (body.private_note || null) : undefined;
  // 승인 시 실행일 수정 가능 (소개 성사일 등 운영자가 확정)
  const activityDate = isDate(body.activity_date) ? body.activity_date : null;

  switch (body.action) {
    case 'approve': {
      const amount = Number(body.approved_amount);
      if (!Number.isFinite(amount) || amount < 0) return err('approved_amount required');
      await env.DB.prepare(
        `UPDATE submissions SET status = 'approved', approved_amount = ?,
         admin_note = CASE WHEN ?2 THEN ?3 ELSE admin_note END,
         private_note = CASE WHEN ?4 THEN ?5 ELSE private_note END,
         activity_date = COALESCE(?6, activity_date),
         reviewed_at = datetime('now')
         WHERE id = ?1`
      ).bind(id, note !== undefined ? 1 : 0, note ?? null, priv !== undefined ? 1 : 0, priv ?? null, activityDate).run();
      break;
    }
    case 'reject':
      await env.DB.prepare(
        `UPDATE submissions SET status = 'rejected', approved_amount = NULL,
         admin_note = CASE WHEN ?2 THEN ?3 ELSE admin_note END,
         private_note = CASE WHEN ?4 THEN ?5 ELSE private_note END,
         reviewed_at = datetime('now')
         WHERE id = ?1`
      ).bind(id, note !== undefined ? 1 : 0, note ?? null, priv !== undefined ? 1 : 0, priv ?? null).run();
      break;
    case 'reopen':
      await env.DB.prepare(
        `UPDATE submissions SET status = 'submitted', approved_amount = NULL,
         reviewed_at = NULL WHERE id = ?`
      ).bind(id).run();
      break;
    default:
      return err('invalid action');
  }

  const updated = await env.DB.prepare('SELECT * FROM submissions WHERE id = ?').bind(id).first();
  return json({ ok: true, submission: { ...updated, payload: JSON.parse(updated.payload || '{}') } });
}
