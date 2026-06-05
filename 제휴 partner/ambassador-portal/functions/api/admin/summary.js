// GET /api/admin/summary?month=YYYY-MM — 실행월 × 앰버서더별 정산 집계 + 지불 기록
import { json, err, requireAdmin } from '../_utils.js';

const OVERSEAS_THRESHOLD = 50000; // 월 5만엔 이상 → 해외송금 권장

export async function onRequestGet({ request, env }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);

  const url = new URL(request.url);
  const month = url.searchParams.get('month'); // 없으면 전체 월

  const conds = ["s.status IN ('approved', 'paid')", 's.activity_date IS NOT NULL'];
  const binds = [];
  if (month) {
    conds.push('substr(s.activity_date, 1, 7) = ?');
    binds.push(month);
  }

  const { results } = await env.DB.prepare(
    `SELECT substr(s.activity_date, 1, 7) AS month,
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

  // 지불 기록 (클라이언트에서 amb×month로 매칭)
  const payConds = month ? 'WHERE month = ?' : '';
  const { results: payments } = await env.DB.prepare(
    `SELECT id, ambassador_id, month, method, gift_codes, transfer_date, amount, created_at
     FROM payments ${payConds} ORDER BY month DESC, id`
  ).bind(...(month ? [month] : [])).all();

  return json({
    summary: results.map(r => ({ ...r, overseas_recommended: r.total >= OVERSEAS_THRESHOLD })),
    payments: payments.map(p => ({ ...p, gift_codes: p.gift_codes ? JSON.parse(p.gift_codes) : [] })),
  });
}
