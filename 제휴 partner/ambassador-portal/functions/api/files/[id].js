// GET /api/files/:id — R2 파일 프록시 (본인 토큰 또는 운영자 세션만 접근)
import { err, getAmbassadorByToken, extractToken, requireAdmin } from '../_utils.js';

export async function onRequestGet({ request, env, params }) {
  const fileId = Number(params.id);
  if (!fileId) return err('invalid file id');

  const row = await env.DB.prepare(
    `SELECT f.r2_key, f.filename, f.content_type, s.ambassador_id
     FROM files f JOIN submissions s ON s.id = f.submission_id WHERE f.id = ?`
  ).bind(fileId).first();
  if (!row) return err('not found', 404);

  // 권한: 운영자 세션 OR 해당 제출의 본인 토큰
  const isAdmin = await requireAdmin(env, request);
  if (!isAdmin) {
    const amb = await getAmbassadorByToken(env, extractToken(request));
    if (!amb || amb.id !== row.ambassador_id) return err('forbidden', 403);
  }

  const stream = await env.FILES.get(row.r2_key, 'stream');
  if (!stream) return err('file missing in storage', 404);

  return new Response(stream, {
    headers: {
      'Content-Type': row.content_type || 'application/octet-stream',
      'Content-Disposition': `inline; filename*=UTF-8''${encodeURIComponent(row.filename)}`,
      'Cache-Control': 'private, max-age=3600',
    },
  });
}
