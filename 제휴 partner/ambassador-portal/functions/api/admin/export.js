// GET /api/admin/export?month=YYYY-MM — 제출 전체 CSV 내보내기 (UTF-8 BOM, Excel 호환)
import { err, requireAdmin } from '../_utils.js';

const TYPE_LABELS = {
  content: 'コンテンツ報告',
  webinar_pre: 'ウェビナー事前申請',
  webinar_post: 'ウェビナー事後報告',
  referral: '紹介',
  adjustment: '運営精算',
};
const STATUS_LABELS = {
  submitted: '確認中',
  approved: '承認済み',
  rejected: '差し戻し',
  paid: '支払い済み',
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
    `SELECT s.*, a.name AS ambassador_name
     FROM submissions s JOIN ambassadors a ON a.id = s.ambassador_id
     ${where} ORDER BY COALESCE(s.activity_date, s.created_at)`
  ).bind(...binds).all();

  const header = ['ID', 'アンバサダー', '種別', '実施日', '提出日(UTC)', 'ステータス',
    '提案金額', '確定金額', '内容(JSON)', '運営メモ'];
  const rows = results.map(s => [
    s.id, s.ambassador_name, TYPE_LABELS[s.type] || s.type,
    s.activity_date ?? '', s.created_at, STATUS_LABELS[s.status] || s.status,
    s.suggested_amount ?? '', s.approved_amount ?? '',
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
