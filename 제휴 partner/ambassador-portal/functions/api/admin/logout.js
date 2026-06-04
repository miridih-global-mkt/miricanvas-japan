// POST /api/admin/logout
import { json, getCookie } from '../_utils.js';

export async function onRequestPost({ request, env }) {
  const session = getCookie(request, 'admin_session');
  if (session) {
    await env.DB.prepare('DELETE FROM admin_sessions WHERE token = ?').bind(session).run();
  }
  return json({ ok: true }, 200, {
    'Set-Cookie': 'admin_session=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0',
  });
}
