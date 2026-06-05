// PATCH /api/submissions/:id — 앰버서더 본인 제출 수정 (確認中 상태만, 필드만 수정·파일 유지)
// body: JSON {token, payload}
import { json, err, getAmbassadorByToken, calcSuggestedAmount, deriveActivityDate } from '../_utils.js';

export async function onRequestPatch({ request, env, params }) {
  const id = Number(params.id);
  let body;
  try {
    body = await request.json();
  } catch {
    return err('JSON body required');
  }

  const amb = await getAmbassadorByToken(env, body.token);
  if (!amb) return err('invalid token', 401);

  const sub = await env.DB.prepare(
    'SELECT id, type, status FROM submissions WHERE id = ? AND ambassador_id = ?'
  ).bind(id, amb.id).first();
  if (!sub) return err('not found', 404);
  if (sub.status !== 'submitted') return err('確認中の活動のみ修正できます');

  const payload = body.payload || {};
  const activityDate = deriveActivityDate(sub.type, payload);
  if (!activityDate) return err('実施日（公開日・開催日・紹介日）が必要です');

  const suggested = await calcSuggestedAmount(env, amb.id, sub.type, payload, activityDate, id);

  await env.DB.prepare(
    'UPDATE submissions SET payload = ?, activity_date = ?, suggested_amount = ? WHERE id = ?'
  ).bind(JSON.stringify(payload), activityDate, suggested, id).run();

  return json({ ok: true, suggested_amount: suggested });
}
