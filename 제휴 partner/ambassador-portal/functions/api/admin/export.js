// GET /api/admin/export?month=YYYY-MM — 제출 전체 CSV 내보내기 (UTF-8 BOM, Excel 호환)
import { err, requireAdmin } from '../_utils.js';

const TYPE_LABELS = {
  content: '콘텐츠 보고',
  webinar: '웨비나·세미나 보고',
  referral: '소개',
  adjustment: '운영정산',
};
const STATUS_LABELS = {
  submitted: '확인중',
  approved: '승인완료',
  rejected: '반려',
};

function csvCell(v) {
  if (v == null) return '';
  const s = String(v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

export async function onRequestGet({ request, env }) {
  if (!(await requireAdmin(env, request))) return err('unauthorized', 401);

  const url = new URL(request.url);
  const month = url.searchParams.get('month');
  const conds = [];
  const binds = [];
  if (month) {
    conds.push('substr(s.activity_date, 1, 7) = ?');
    binds.push(month);
  }
  const where = conds.length ? 'WHERE ' + conds.join(' AND ') : '';

  const { results } = await env.DB.prepare(
    `SELECT s.*, a.name AS ambassador_name, b.title AS bill_title
     FROM submissions s
     JOIN ambassadors a ON a.id = s.ambassador_id
     LEFT JOIN bills b ON b.id = s.bill_id
     ${where} ORDER BY COALESCE(s.activity_date, s.created_at)`
  ).bind(...binds).all();

  const header = ['ID', '앰버서더', '유형', '실시일', '제출일(UTC)', '상태',
    '제안금액', '확정금액', '지불건', '내용(JSON)', '운영메모'];
  const rows = results.map(s => [
    s.id, s.ambassador_name, TYPE_LABELS[s.type] || s.type,
    s.activity_date ?? '', s.created_at, STATUS_LABELS[s.status] || s.status,
    s.suggested_amount ?? '', s.approved_amount ?? '', s.bill_title ?? '',
    s.payload, s.admin_note ?? '',
  ].map(csvCell).join(','));

  const csv = String.fromCharCode(0xfeff) + header.join(',') + '\n' + rows.join('\n');
  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="submissions${month ? '-' + month : ''}.csv"`,
    },
  });
}
