// POST /api/submissions — 앰버서더 제출 (multipart/form-data)
// fields: token, type, payload(JSON string), photos[](file), slides[](file)
import { json, err, getAmbassadorByToken, calcSuggestedAmount } from './_utils.js';

const TYPES = ['content', 'webinar_pre', 'webinar_post', 'referral'];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB/파일
const MAX_FILES = 12;

export async function onRequestPost({ request, env }) {
  let form;
  try {
    form = await request.formData();
  } catch {
    return err('multipart/form-data required');
  }

  const amb = await getAmbassadorByToken(env, form.get('token'));
  if (!amb) return err('invalid token', 401);

  const type = form.get('type');
  if (!TYPES.includes(type)) return err('invalid type');

  let payload;
  try {
    payload = JSON.parse(form.get('payload') || '{}');
  } catch {
    return err('invalid payload JSON');
  }

  // 사후보고 → 사전신청 연결 검증 (본인 것 + webinar_pre만)
  let linkedId = null;
  if (type === 'webinar_post' && payload.linked_submission_id) {
    const linked = await env.DB.prepare(
      "SELECT id FROM submissions WHERE id = ? AND ambassador_id = ? AND type = 'webinar_pre'"
    ).bind(Number(payload.linked_submission_id), amb.id).first();
    if (!linked) return err('linked submission not found');
    linkedId = linked.id;
  }

  // 파일 수집 및 검증
  const fileEntries = [];
  for (const kind of ['photo', 'slide']) {
    for (const f of form.getAll(kind === 'photo' ? 'photos' : 'slides')) {
      if (!(f instanceof File) || f.size === 0) continue;
      if (f.size > MAX_FILE_SIZE) return err(`file too large: ${f.name} (max 15MB)`);
      fileEntries.push({ kind, file: f });
    }
  }
  if (fileEntries.length > MAX_FILES) return err(`too many files (max ${MAX_FILES})`);

  const suggested = await calcSuggestedAmount(env, amb.id, type, payload);

  const ins = await env.DB.prepare(
    `INSERT INTO submissions (ambassador_id, type, payload, suggested_amount, linked_submission_id)
     VALUES (?, ?, ?, ?, ?)`
  ).bind(amb.id, type, JSON.stringify(payload), suggested, linkedId).run();
  const submissionId = ins.meta.last_row_id;

  for (const { kind, file } of fileEntries) {
    const safeName = file.name.replace(/[^\w.\-ぁ-んァ-ヶ一-龠]/g, '_');
    const key = `submissions/${submissionId}/${crypto.randomUUID()}-${safeName}`;
    await env.FILES.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || 'application/octet-stream' },
    });
    await env.DB.prepare(
      'INSERT INTO files (submission_id, kind, r2_key, filename, size, content_type) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(submissionId, kind, key, file.name, file.size, file.type || null).run();
  }

  return json({ ok: true, id: submissionId, suggested_amount: suggested });
}
