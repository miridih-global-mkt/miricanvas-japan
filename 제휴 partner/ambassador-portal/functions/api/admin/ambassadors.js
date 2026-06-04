// GET /api/admin/ambassadors — 목록
// POST /api/admin/ambassadors {name, channel} — 등록 (토큰 자동 발급)
import { json, err, requireAdmin, randomToken } from '../_utils.js';

export async function onRequestGet({ request, env }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);
  const { results } = await env.DB.prepare(
    `SELECT a.id, a.name, a.token, a.channel, a.active, a.created_at,
            COUNT(s.id) AS submission_count
     FROM ambassadors a LEFT JOIN submissions s ON s.ambassador_id = a.id
     GROUP BY a.id ORDER BY a.created_at`
  ).all();
  return json({ ambassadors: results });
}

export async function onRequestPost({ request, env }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);
  let body;
  try {
    body = await request.json();
  } catch {
    return err('JSON body required');
  }
  const name = (body.name || '').trim();
  if (!name) return err('name required');

  const token = randomToken(24);
  const ins = await env.DB.prepare(
    'INSERT INTO ambassadors (name, token, channel) VALUES (?, ?, ?)'
  ).bind(name, token, body.channel || null).run();

  return json({ ok: true, id: ins.meta.last_row_id, token });
}
