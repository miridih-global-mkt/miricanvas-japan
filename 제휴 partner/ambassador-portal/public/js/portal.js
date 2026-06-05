// アンバサダー活動・精算ダッシュボード
const token = (location.pathname.match(/\/a\/([^/]+)/) || [])[1];

const TYPE_LABELS = {
  content: 'コンテンツ報告',
  webinar: 'ウェビナー・セミナー報告',
  referral: '紹介',
  adjustment: '運営精算',
};
const STATUS_LABELS = {
  submitted: '確認中',
  approved: '承認済み',
  rejected: '差し戻し',
};
const CATEGORY_LABELS = { ai_slide: 'AIスライド関連', other_feature: 'その他の機能', repost: '転載' };
const WTYPE_LABELS = { targeted: 'ターゲット向け', general: '不特定多数向け' };
const TRACK_LABELS = { ai: 'AI・資料作成系', design: 'デザイン系' };

const FIELD_LABELS = {
  category: 'カテゴリ', url: 'URL', channel: 'チャネル', published_date: '公開日', memo: '補足',
  title: 'タイトル', event_date: '開催日', webinar_type: '形式',
  participants: '実参加人数', ai_tools: '併用AIツール',
  exposure_minutes: 'MC紹介時間(分)', photo_consent: '写真二次利用同意',
  referral_kind: '紹介種類', referral_date: '紹介日',
  p_name: '名前', p_sns_url: 'SNS URL', p_main_channel: 'メインチャネル', p_track: '得意分野',
  c_name: 'コミュニティ名', c_size: '規模', c_field: '分野', c_owner: '運営者',
  reason: '紹介理由', relation: '関係',
};
const VALUE_LABELS = { ...CATEGORY_LABELS, ...WTYPE_LABELS, ...TRACK_LABELS, person: '個人', community: 'コミュニティ', yes: '同意あり' };
const METHOD_LABELS = { amazon: 'Amazonギフト', transfer: '海外送金（口座へ）' };

const $ = (s) => document.querySelector(s);
const yen = (n) => n == null ? '—' : Number(n).toLocaleString('ja-JP') + '円';
const fmtDate = (s) => {
  if (!s) return '—';
  const [y, m, d] = s.slice(0, 10).split('-');
  return `${Number(m)}/${Number(d)}`;
};
const fmtMonth = (m) => m ? m.replace('-', '年') + '月' : '';

function actDate(s) {
  if (s.activity_date) return s.activity_date;
  const d = new Date(s.created_at.replace(' ', 'T') + (s.created_at.endsWith('Z') ? '' : 'Z'));
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}
const actMonth = (s) => actDate(s).slice(0, 7);

let toastTimer;
function toast(msg, isError = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ''), 3500);
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let DATA = null;

async function load() {
  if (!token) return showError();
  const res = await fetch(`/api/me?token=${encodeURIComponent(token)}`);
  if (!res.ok) return showError();
  DATA = await res.json();
  render();
}

function showError() {
  $('#app').style.display = 'none';
  $('#error-view').style.display = 'flex';
  $('#greeting').textContent = '';
}

function summaryLine(s) {
  const p = s.payload || {};
  switch (s.type) {
    case 'content': return `${CATEGORY_LABELS[p.category] || ''}・${p.channel || ''}`;
    case 'webinar': return `${p.title || ''}・参加 ${p.participants ?? '?'}名`;
    case 'referral': return p.referral_kind === 'community' ? `コミュニティ：${p.c_name || ''}` : `個人：${p.p_name || ''}`;
    case 'adjustment': return p.title || '運営による精算';
    default: return '';
  }
}

// ── サマリー（金額重視3スタット） ──
function statsOf(subs) {
  const mk = () => ({ n: 0, amt: 0 });
  const st = { content: mk(), webinar: mk(), referral: mk() };
  for (const s of subs) {
    if (s.status === 'rejected') continue;
    const key = s.type === 'content' ? 'content' : s.type === 'webinar' ? 'webinar' : 'referral';
    st[key].n++;
    if (s.status === 'approved') st[key].amt += s.approved_amount || 0;
  }
  st.totalAmt = st.content.amt + st.webinar.amt + st.referral.amt;
  return st;
}

function bigYen(n) {
  return `${Number(n).toLocaleString('ja-JP')}<small> 円</small>`;
}

function breakdownHtml(st, cap) {
  const row = (label, c, capStr) => `<div class="bd-row"><span>${label}</span><span>${capStr ?? c.n + '件'}・<b>${yen(c.amt)}</b></span></div>`;
  return row('コンテンツ', st.content, cap != null ? `<span class="${cap >= 5 ? 'over' : ''}">${cap}/5件</span>・<b>${yen(st.content.amt)}</b>` : null)
    + row('セミナー', st.webinar)
    + row('紹介・他', st.referral);
}

function renderSummary() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const nowMonth = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('sv-SE').slice(0, 7);

  const all = statsOf(DATA.submissions);
  const last = statsOf(DATA.submissions.filter((s) => actMonth(s) === lastMonth));
  const cur = statsOf(DATA.submissions.filter((s) => actMonth(s) === nowMonth));

  $('#st-all').innerHTML = bigYen(all.totalAmt);
  $('#st-all-bd').innerHTML = breakdownHtml(all);
  $('#st-last').innerHTML = bigYen(last.totalAmt);
  $('#st-last-bd').innerHTML = breakdownHtml(last);
  $('#st-cur').innerHTML = bigYen(cur.totalAmt);
  $('#st-cur-bd').innerHTML = breakdownHtml(cur, DATA.content_count_this_month ?? cur.content.n);
}

function render() {
  $('#app').style.display = '';
  $('#error-view').style.display = 'none';
  $('#greeting').textContent = `こんにちは、${DATA.ambassador.name} さん`;
  renderSummary();
  renderHistory();
  renderRewards();
  renderDrafts();
}

// ══════════ 活動報告（まとめて提出） ══════════
let DRAFTS = [];          // {tmpId, type, payload, photos: File[], slides: File[]}
let draftSeq = 1;
// フォームの利用モード: {kind:'draft-new'|'draft-edit'|'sub-edit', id}
let FORM_MODE = { kind: 'draft-new', id: null };

function draftLine(d) {
  return summaryLine({ type: d.type, payload: d.payload });
}

function renderDrafts() {
  const list = $('#draft-list');
  if (!DRAFTS.length) {
    list.innerHTML = '<p class="muted">まだ追加されていません。上のボタンから活動を追加してください。</p>';
    $('#btn-submit-all').style.display = 'none';
    return;
  }
  list.innerHTML = DRAFTS.map((d) => {
    const nFiles = (d.photos?.length || 0) + (d.slides?.length || 0);
    return `<div class="draft-item">
      <span class="badge type">${TYPE_LABELS[d.type]}</span>
      <span class="d-title">${escapeHtml(draftLine(d))}</span>
      ${nFiles ? `<span class="d-files">📎${nFiles}</span>` : ''}
      <button class="ghost btn-sm" data-edit="${d.tmpId}">修正</button>
      <button class="danger btn-sm" data-del="${d.tmpId}">削除</button>
    </div>`;
  }).join('');
  const btn = $('#btn-submit-all');
  btn.style.display = '';
  btn.textContent = `まとめて提出する（${DRAFTS.length}件）`;

  list.querySelectorAll('[data-edit]').forEach((b) => {
    b.addEventListener('click', () => {
      const d = DRAFTS.find((x) => x.tmpId === Number(b.dataset.edit));
      if (d) openForm(d.type, { kind: 'draft-edit', id: d.tmpId }, d.payload);
    });
  });
  list.querySelectorAll('[data-del]').forEach((b) => {
    b.addEventListener('click', () => {
      DRAFTS = DRAFTS.filter((x) => x.tmpId !== Number(b.dataset.del));
      renderDrafts();
    });
  });
}

$('#btn-submit-all').addEventListener('click', async () => {
  const btn = $('#btn-submit-all');
  btn.disabled = true;
  const total = DRAFTS.length;
  let ok = 0;
  const failed = [];
  for (const d of [...DRAFTS]) {
    btn.textContent = `提出中... (${ok + failed.length + 1}/${total})`;
    const body = new FormData();
    body.set('token', token);
    body.set('type', d.type);
    body.set('payload', JSON.stringify(d.payload));
    for (const f of d.photos || []) body.append('photos', f);
    for (const f of d.slides || []) body.append('slides', f);
    try {
      const res = await fetch('/api/submissions', { method: 'POST', body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'error');
      DRAFTS = DRAFTS.filter((x) => x.tmpId !== d.tmpId);
      ok++;
    } catch (e) {
      failed.push(`${TYPE_LABELS[d.type]}：${e.message}`);
    }
  }
  btn.disabled = false;
  if (failed.length) {
    toast(`${ok}件提出、${failed.length}件失敗：${failed[0]}`, true);
    renderDrafts();
    await load();
  } else {
    toast(`${ok}件を提出しました。運営確認後にステータスが更新されます。`);
    await load();
    setMode('history');
  }
});

// ── フォームを開く（追加・下書き修正・提出済み修正 共通） ──
function setFormValues(form, payload) {
  for (const [k, v] of Object.entries(payload)) {
    const el = form.querySelector(`[name="${k}"]`);
    if (!el || el.type === 'file') continue;
    if (el.type === 'checkbox') el.checked = v === 'yes';
    else el.value = v;
  }
}

function openForm(type, mode, payload = null) {
  FORM_MODE = mode;
  const form = $(`#form-${type}`);
  form.reset();
  if (payload) setFormValues(form, payload);

  // タイトル・ボタン文言・ファイル欄の表示をモードに合わせる
  const isSubEdit = mode.kind === 'sub-edit';
  const isEdit = mode.kind !== 'draft-new';
  $(`#fm-${type}-title`).textContent = TYPE_LABELS[type] + (isEdit ? 'の修正' : '');
  form.querySelector('button.primary').textContent = isSubEdit ? '修正を保存する' : isEdit ? '修正してリストに戻す' : 'リストに追加';

  // 提出済みの修正ではファイル変更不可（既存ファイルは維持）
  form.querySelectorAll('.file-field').forEach((el) => {
    el.style.display = isSubEdit ? 'none' : '';
  });
  const photos = form.querySelector('[name=photos]');
  if (photos) photos.required = !isSubEdit && !(mode.kind === 'draft-edit');

  // 条件付きフィールドの状態を合わせる
  if (type === 'webinar') {
    const isGeneral = (payload?.webinar_type || form.querySelector('[name=webinar_type]').value) === 'general';
    $('#exposure-field').style.visibility = isGeneral ? 'visible' : 'hidden';
    $('#exposure-field input').required = isGeneral;
  }
  if (type === 'referral') {
    const isPerson = (payload?.referral_kind || 'person') === 'person';
    $('#referral-person').style.display = isPerson ? '' : 'none';
    $('#referral-community').style.display = isPerson ? 'none' : '';
    const refDate = form.querySelector('[name=referral_date]');
    if (!refDate.value) refDate.value = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  }

  document.getElementById(`fm-${type}-bg`).classList.add('open');
}

document.querySelectorAll('.submit-btn').forEach((btn) => {
  btn.addEventListener('click', () => openForm(btn.dataset.form, { kind: 'draft-new', id: null }));
});
document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => document.getElementById(btn.dataset.close).classList.remove('open'));
});
// ※ 誤操作防止のため、背景クリックでは閉じない（「閉じる」ボタンのみ）

// 条件付きフィールド切替
document.querySelector('#form-webinar select[name=webinar_type]').addEventListener('change', (e) => {
  const isGeneral = e.target.value === 'general';
  $('#exposure-field').style.visibility = isGeneral ? 'visible' : 'hidden';
  $('#exposure-field input').required = isGeneral;
});
$('#referral-kind').addEventListener('change', (e) => {
  const isPerson = e.target.value === 'person';
  $('#referral-person').style.display = isPerson ? '' : 'none';
  $('#referral-community').style.display = isPerson ? 'none' : '';
});

// ── フォーム submit：モードに応じて 下書き保存 or 修正PATCH ──
async function handleFormSubmit(type, form) {
  const fd = new FormData(form);
  const payload = {};
  for (const [k, v] of fd.entries()) {
    if (v instanceof File) continue;
    payload[k] = v;
  }

  if (type === 'referral') {
    const required = payload.referral_kind === 'person'
      ? ['p_name', 'p_sns_url', 'p_main_channel', 'p_track']
      : ['c_name', 'c_size', 'c_field'];
    for (const f of required) {
      if (!payload[f]) { toast('必須項目が未入力です', true); return; }
    }
  }

  if (FORM_MODE.kind === 'sub-edit') {
    // 提出済み（確認中）の修正
    try {
      const res = await fetch(`/api/submissions/${FORM_MODE.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'error');
      toast('修正しました');
      document.getElementById(`fm-${type}-bg`).classList.remove('open');
      await load();
    } catch (e) {
      toast('修正に失敗しました：' + e.message, true);
    }
    return;
  }

  // 下書き（新規 or 修正）
  const photos = [...(form.querySelector('[name=photos]')?.files || [])];
  const slides = [...(form.querySelector('[name=slides]')?.files || [])];

  if (FORM_MODE.kind === 'draft-edit') {
    const d = DRAFTS.find((x) => x.tmpId === FORM_MODE.id);
    if (d) {
      d.payload = payload;
      if (photos.length) d.photos = photos;   // 再選択時のみ差し替え
      if (slides.length) d.slides = slides;
    }
  } else {
    DRAFTS.push({ tmpId: draftSeq++, type, payload, photos, slides });
  }
  document.getElementById(`fm-${type}-bg`).classList.remove('open');
  renderDrafts();
}

for (const type of ['content', 'webinar', 'referral']) {
  $(`#form-${type}`).addEventListener('submit', (e) => {
    e.preventDefault();
    handleFormSubmit(type, e.target);
  });
}

// ══════════ 活動履歴 ══════════
function renderHistory() {
  const month = $('#hist-month').value;
  const subs = month ? DATA.submissions.filter((s) => actMonth(s) === month) : DATA.submissions;

  const list = $('#history-list');
  if (!subs.length) {
    list.innerHTML = '<p class="muted" style="padding:12px 10px">該当する提出はありません。</p>';
    $('#hist-subtotal').innerHTML = '';
    return;
  }

  list.innerHTML = subs.map((s) => {
    const files = (DATA.files || []).filter((f) => f.submission_id === s.id);
    const isFixed = s.status === 'approved';
    const amountHtml = isFixed
      ? yen(s.approved_amount)
      : s.suggested_amount != null
        ? `<span class="est">目安 ${yen(s.suggested_amount)}</span>`
        : '<span class="est">—</span>';
    // リワード受領日（発送済みの案件に含まれる場合のみ）
    const bill = s.bill_id ? (DATA.bills || []).find((b) => b.id === s.bill_id) : null;
    const recv = bill ? fmtDate((bill.method === 'transfer' && bill.transfer_date) ? bill.transfer_date : bill.sent_at) : '';
    const extra = [
      files.length ? `<div class="files">📎 ${files.map((f) => `<a href="/api/files/${f.id}?token=${encodeURIComponent(token)}" target="_blank">${escapeHtml(f.filename)}</a>`).join(' / ')}</div>` : '',
      s.status === 'rejected' && s.admin_note ? `<div class="note">運営より：${escapeHtml(s.admin_note)}</div>` : '',
    ].join('');
    return `<div class="hist-item">
      <div class="hist-row" data-id="${s.id}">
        <span class="h-date">${fmtDate(actDate(s))}</span>
        <span class="h-type"><span class="badge type">${TYPE_LABELS[s.type]}</span></span>
        <span class="h-title" title="${escapeHtml(summaryLine(s))}">${escapeHtml(summaryLine(s))}</span>
        <span class="h-amount">${amountHtml}</span>
        <span class="h-status"><span class="badge ${s.status}">${STATUS_LABELS[s.status]}</span></span>
        <span class="h-recv">${recv ? '🎁 ' + recv : '<span class="muted">—</span>'}</span>
      </div>
      ${extra ? `<div class="hist-extra">${extra}</div>` : ''}
    </div>`;
  }).join('');

  list.querySelectorAll('.hist-row').forEach((row) => {
    row.addEventListener('click', () => openSubmissionDetail(Number(row.dataset.id)));
  });

  // 小計（種別ごと）＋合計
  const groups = [
    ['コンテンツ報告', subs.filter((s) => s.type === 'content')],
    ['ウェビナー・セミナー', subs.filter((s) => s.type === 'webinar')],
    ['紹介・運営精算', subs.filter((s) => s.type === 'referral' || s.type === 'adjustment')],
  ];
  const confirmed = (arr) => arr.reduce((a, s) => a + (s.status === 'approved' ? (s.approved_amount || 0) : 0), 0);
  const liveCount = (arr) => arr.filter((s) => s.status !== 'rejected').length;

  const rows = groups
    .filter(([, arr]) => arr.length)
    .map(([label, arr]) => `<div class="sub-row"><span>${label}</span><span>${liveCount(arr)}件</span><span>${yen(confirmed(arr))}</span></div>`)
    .join('');
  const totalRow = `<div class="sub-row total"><span>合計${month ? `（${fmtMonth(month)}）` : '（全期間）'}</span><span>${liveCount(subs)}件</span><span>${yen(confirmed(subs))}</span></div>`;
  $('#hist-subtotal').innerHTML = rows + totalRow +
    '<div class="caption">金額は承認済みの確定分のみ。件数は差し戻しを除く。</div>';
}

$('#hist-month').addEventListener('change', renderHistory);

// ══════════ リワード確認（発送済みのみ） ══════════
function renderRewards() {
  const tbody = $('#settle-table tbody');
  const bills = DATA.bills || [];
  if (!bills.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="muted">お渡し済みのリワードはまだありません。</td></tr>';
    return;
  }

  tbody.innerHTML = bills.map((b) => {
    const items = DATA.submissions.filter((s) => s.bill_id === b.id);
    const total = items.reduce((a, s) => a + (s.approved_amount || 0), 0);
    // 受領日：海外送金は送金日、それ以外は発送日
    const receivedDate = (b.method === 'transfer' && b.transfer_date) ? b.transfer_date : b.sent_at;

    const childRows = items.map((s) => `
      <tr class="hoverable child-act" data-id="${s.id}">
        <td style="width:64px">${fmtDate(actDate(s))}</td>
        <td style="width:170px"><span class="badge type">${TYPE_LABELS[s.type]}</span></td>
        <td>${escapeHtml(summaryLine(s))}</td>
        <td style="text-align:right;font-weight:600;width:100px">${yen(s.approved_amount)}</td>
      </tr>`).join('');

    return `
      <tr class="clickable settle-row" data-id="${b.id}" id="bill-row-${b.id}">
        <td>${fmtDate(receivedDate)}</td>
        <td><b>${escapeHtml(b.title)}</b>${b.memo ? `<br><span class="muted" style="font-size:12px">${escapeHtml(b.memo)}</span>` : ''}</td>
        <td>${items.length}件</td>
        <td><b>${yen(total)}</b></td>
        <td><button class="ghost btn-sm btn-paydetail" data-id="${b.id}">詳細確認</button></td>
      </tr>
      <tr class="settle-detail" id="detail-${b.id}" style="display:none">
        <td colspan="5">
          <div class="nested-wrap"><table class="nested-table"><tbody>${childRows || ''}</tbody></table></div>
        </td>
      </tr>`;
  }).join('');

  tbody.querySelectorAll('.settle-row').forEach((tr) => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('.btn-paydetail')) return;
      const detail = document.getElementById('detail-' + tr.dataset.id);
      const willOpen = detail.style.display === 'none';
      detail.style.display = willOpen ? '' : 'none';
      tr.classList.toggle('bill-open', willOpen);
    });
  });
  tbody.querySelectorAll('.btn-paydetail').forEach((btn) => {
    btn.addEventListener('click', () => openPaymentDetail(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll('.child-act').forEach((row) => {
    row.addEventListener('click', () => openSubmissionDetail(Number(row.dataset.id)));
  });
}

// ── リワード詳細ポップアップ ──
function openPaymentDetail(billId) {
  const b = (DATA.bills || []).find((x) => x.id === billId);
  if (!b) return;
  const items = DATA.submissions.filter((s) => s.bill_id === b.id);
  const total = items.reduce((a, s) => a + (s.approved_amount || 0), 0);
  const body = `
    <dl class="kv">
      <dt>お渡し方法</dt><dd>${b.method === 'amazon' ? '🎁 ' : '🏦 '}${METHOD_LABELS[b.method]}</dd>
      <dt>金額</dt><dd><b>${yen(total)}</b></dd>
      ${b.method === 'transfer' && b.transfer_date ? `<dt>送金日</dt><dd>${b.transfer_date.replaceAll('-', '/')}</dd>` : ''}
    </dl>
    ${b.method === 'amazon' ? `
    <div class="codes-block">
      <b>Amazonギフトカード番号（${b.gift_codes.length}枚）</b>
      <ul>${b.gift_codes.map((c) => `<li><code>${escapeHtml(c)}</code></li>`).join('')}</ul>
    </div>` : ''}
  `;
  openModal('リワード詳細', body);
}

// ── 提出内訳ポップアップ（確認中なら修正可能） ──
function openSubmissionDetail(id) {
  const s = DATA.submissions.find((x) => x.id === id);
  if (!s) return;
  const files = (DATA.files || []).filter((f) => f.submission_id === id);

  const rows = Object.entries(s.payload || {})
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `<dt>${escapeHtml(FIELD_LABELS[k] || k)}</dt><dd>${
      /^https?:\/\//.test(String(v)) ? `<a href="${escapeHtml(v)}" target="_blank">${escapeHtml(v)}</a>` : escapeHtml(VALUE_LABELS[v] ?? v)
    }</dd>`).join('');

  const isFixed = s.status === 'approved';
  const canEdit = s.status === 'submitted' && s.type !== 'adjustment';
  const body = `
    <p><span class="badge type">${TYPE_LABELS[s.type]}</span> <span class="badge ${s.status}">${STATUS_LABELS[s.status]}</span></p>
    <dl class="kv">
      <dt>実施日</dt><dd>${fmtDate(actDate(s))}</dd>
      <dt>金額</dt><dd>${isFixed ? `<b>${yen(s.approved_amount)}</b>（確定）` : s.suggested_amount != null ? `目安 ${yen(s.suggested_amount)}（確認中）` : '確認中'}</dd>
      ${rows}
      ${s.status === 'rejected' && s.admin_note ? `<dt>運営より</dt><dd>${escapeHtml(s.admin_note)}</dd>` : ''}
    </dl>
    ${files.length ? `<p>📎 ${files.map((f) => `<a href="/api/files/${f.id}?token=${encodeURIComponent(token)}" target="_blank">${escapeHtml(f.filename)}</a>`).join(' / ')}</p>` : ''}
    ${canEdit ? `<button class="primary" id="btn-edit-sub" style="margin-top:14px">修正する</button>` : ''}
  `;
  openModal('提出内容', body);

  if (canEdit) {
    $('#btn-edit-sub').addEventListener('click', () => {
      $('#p-modal-bg').classList.remove('open');
      openForm(s.type, { kind: 'sub-edit', id: s.id }, s.payload);
    });
  }
}

// ── 汎用モーダル ──
function openModal(title, html) {
  $('#p-modal-title').textContent = title;
  $('#p-modal-body').innerHTML = html;
  $('#p-modal-bg').classList.add('open');
}
$('#p-modal-close').addEventListener('click', () => $('#p-modal-bg').classList.remove('open'));

// ── タブ切替 ──
function setMode(mode) {
  document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  $('#mode-report').style.display = mode === 'report' ? '' : 'none';
  $('#mode-history').style.display = mode === 'history' ? '' : 'none';
  $('#mode-reward').style.display = mode === 'reward' ? '' : 'none';
}
document.querySelectorAll('.mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

load();
