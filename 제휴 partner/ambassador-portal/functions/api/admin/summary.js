// GET /api/admin/summary?month=YYYY-MM — 월별×앰버서더별 지급 집계 (5만엔 이상 해외송금 플래그)
import { json, err, requireAdmin } from '../_utils.js';

const OVERSEAS_THRESHOLD = 50000; // 월 5만엔 이상 → 해외송금

export async function onRequestGet({ request, env }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);

  const url = new URL(request.url);
  const month = url.searchParams.get('month'); // 없으면 전체 월

  const conds = ["s.status IN ('approved', 'paid')"];
  const binds = [];
  if (month) {
    conds.push("substr(datetime(s.created_at, '+9 hours'), 1, 7) = ?");
    binds.push(month);
  }

  const { results } = await env.DB.prepare(
    `SELECT substr(datetime(s.created_at, '+9 hours'), 1, 7) AS month,
            s.ambassador_id, a.name AS ambassador_name,
            SUM(COALESCE(s.approved_amount, 0)) AS total,
            SUM(CASE WHEN s.status = 'paid' THEN COALESCE(s.approved_amount, 0) ELSE 0 END) AS paid_total,
            COUNT(*) AS count,
            SUM(CASE WHEN s.status = 'approved' THEN 1 ELSE 0 END) AS unpaid_count
     FROM submissions s JOIN ambassadors a ON a.id = s.ambassador_id
     WHERE ${conds.join(' AND ')}
     GROUP BY month, s.ambassador_id
     ORDER BY month DESC, total DESC`
  ).bind(...binds).all();

  return json({
    summary: results.map(r => ({ ...r, overseas_transfer: r.total >= OVERSEAS_THRESHOLD })),
  });
}
