// GET /api/admin/submissions?month=YYYY-MM&type=&status=&ambassador_id=
import { json, err, requireAdmin } from '../_utils.js';

export async function onRequestGet({ request, env }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);

  const url = new URL(request.url);
  const conds = [];
  const binds = [];

  const month = url.searchParams.get('month');
  if (month) {
    conds.push("substr(datetime(s.created_at, '+9 hours'), 1, 7) = ?");
    binds.push(month);
  }
  const type = url.searchParams.get('type');
  if (type) { conds.push('s.type = ?'); binds.push(type); }
  const status = url.searchParams.get('status');
  if (status) { conds.push('s.status = ?'); binds.push(status); }
  const ambassadorId = url.searchParams.get('ambassador_id');
  if (ambassadorId) { conds.push('s.ambassador_id = ?'); binds.push(Number(ambassadorId)); }

  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';
  const { results } = await env.DB.prepare(
    `SELECT s.*, a.name AS ambassador_name
     FROM submissions s JOIN ambassadors a ON a.id = s.ambassador_id
     ${where} ORDER BY s.created_at DESC LIMIT 500`
  ).bind(...binds).all();

  const ids = results.map(r => r.id);
  let files = [];
  if (ids.length) {
    const ph = ids.map(() => '?').join(',');
    const fr = await env.DB.prepare(
      `SELECT id, submission_id, kind, filename, size FROM files WHERE submission_id IN (${ph})`
    ).bind(...ids).all();
    files = fr.results;
  }

  return json({
    submissions: results.map(s => ({ ...s, payload: JSON.parse(s.payload || '{}') })),
    files,
  });
}
