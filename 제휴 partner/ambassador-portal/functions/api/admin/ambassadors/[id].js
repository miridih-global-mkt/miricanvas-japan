// PATCH /api/admin/ambassadors/:id — {name?, description?, active?, reissue_token?}
import { json, err, requireAdmin, randomToken } from '../../_utils.js';

export async function onRequestPatch({ request, env, params }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);
  const id = Number(params.id);
  let body;
  try {
    body = await request.json();
  } catch {
    return err('JSON body required');
  }

  const amb = await env.DB.prepare('SELECT id FROM ambassadors WHERE id = ?').bind(id).first();
  if (!amb) return err('not found', 404);

  const sets = [];
  const binds = [];
  if (typeof body.name === 'string' && body.name.trim()) { sets.push('name = ?'); binds.push(body.name.trim()); }
  if ('description' in body) { sets.push('description = ?'); binds.push((body.description || '').trim() || null); }
  if ('active' in body) { sets.push('active = ?'); binds.push(body.active ? 1 : 0); }

  let newToken = null;
  if (body.reissue_token) {
    newToken = randomToken(24);
    sets.push('token = ?');
    binds.push(newToken);
  }

  if (!sets.length) return err('nothing to update');
  binds.push(id);
  await env.DB.prepare(`UPDATE ambassadors SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run();

  return json({ ok: true, token: newToken });
}
