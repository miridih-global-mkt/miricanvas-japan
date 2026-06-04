// POST /api/admin/login {password} — 운영자 로그인 → 세션 쿠키
import { json, err, randomToken } from '../_utils.js';

const SESSION_DAYS = 7;

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD) return err('ADMIN_PASSWORD not configured', 500);

  let body;
  try {
    body = await request.json();
  } catch {
    return err('JSON body required');
  }
  if (!body.password || body.password !== env.ADMIN_PASSWORD) {
    return err('パスワードが違います', 401);
  }

  const token = randomToken(32);
  await env.DB.prepare(
    `INSERT INTO admin_sessions (token, expires_at) VALUES (?, datetime('now', '+${SESSION_DAYS} days'))`
  ).bind(token).run();
  // 만료 세션 청소 (기회적)
  await env.DB.prepare("DELETE FROM admin_sessions WHERE expires_at <= datetime('now')").run();

  return json({ ok: true }, 200, {
    'Set-Cookie': `admin_session=${token}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${SESSION_DAYS * 86400}`,
  });
}
