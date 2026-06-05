// アンバサダーポータル
const token = (location.pathname.match(/\/a\/([^/]+)/) || [])[1];

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
const CATEGORY_LABELS = { ai_slide: 'AIスライド関連', other_feature: 'その他の機能', repost: '転載' };
const WTYPE_LABELS = { targeted: 'ターゲット向け', general: '不特定多数向け' };
const TRACK_LABELS = { ai: 'AI・資料作成系', design: 'デザイン系' };

// payload キーの日本語ラベル（内訳ポップアップ用）
const FIELD_LABELS = {
  category: 'カテゴリ', url: 'URL', channel: 'チャネル', published_date: '公開日', memo: '補足',
  title: 'タイトル', event_date: '開催日時', webinar_type: '形式',
  expected_participants: '予想参加人数', participants: '実参加人数',
  mc_duration: 'MC講義時間', mc_content: 'MC講義内容', ai_tools: '併用AIツール',
  exposure_minutes: 'MC紹介時間(分)', photo_consent: '写真二次利用同意',
  linked_submission_id: '事前申請', referral_kind: '紹介種類', referral_date: '紹介日',
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

// 実施日（なければ提出日をJSTで）
function actDate(s) {
  if (s.activity_date) return s.activity_date;
  const d = new Date(s.created_at.replace(' ', 'T') + (s.created_at.endsWith('Z') ? '' : 'Z'));
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}
const actMonth = (s) => actDate(s).slice(0, 7);

// 支払予定日 = 実施月の翌月末
function dueDate(month) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m + 1, 0); // m(1-based)+1の月の0日目 = 翌月末
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

let toastTimer;
function toast(msg, isError = false) {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'show' + (isError ? ' error' : '');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (t.className = ''), 3500);
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
    case 'content':
      return `${CATEGORY_LABELS[p.category] || ''}・${p.channel || ''}`;
    case 'webinar_pre':
      return `${p.title || ''}（${p.event_date ? p.event_date.replace('T', ' ') : ''}）`;
    case 'webinar_post':
      return `${p.title || ''}・参加 ${p.participants ?? '?'}名`;
    case 'referral':
      return p.referral_kind === 'community' ? `コミュニティ：${p.c_name || ''}` : `個人：${p.p_name || ''}`;
    case 'adjustment':
      return p.title || '運営による精算';
    default:
      return '';
  }
}

// 集計：確定金額（承認+支払）と種別件数（差し戻し除く）
function calcStats(subs) {
  const st = { amount: 0, content: 0, webinar: 0, referral: 0 };
  for (const s of subs) {
    if (s.status === 'approved' || s.status === 'paid') st.amount += s.approved_amount || 0;
    if (s.status === 'rejected') continue;
    if (s.type === 'content') st.content++;
    else if (s.type === 'webinar_pre' || s.type === 'webinar_post') st.webinar++;
    else if (s.type === 'referral' || s.type === 'adjustment') st.referral++;
  }
  return st;
}

function countsHtml(st, capNote) {
  const cap = capNote != null
    ? `<b class="${capNote >= 5 ? 'over' : ''}">${capNote}/5件</b>`
    : `<b>${st.content}</b>`;
  return `コンテンツ ${cap} ・ セミナー <b>${st.webinar}</b> ・ 紹介 <b>${st.referral}</b>`;
}

function render() {
  $('#app').style.display = '';
  $('#error-view').style.display = 'none';
  $('#greeting').textContent = `こんにちは、${DATA.ambassador.name} さん`;

  // ── サマリー：先月・今月・累計（実施月ベース） ──
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const nowMonth = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('sv-SE').slice(0, 7);

  const stThis = calcStats(DATA.submissions.filter((s) => actMonth(s) === nowMonth));
  const stLast = calcStats(DATA.submissions.filter((s) => actMonth(s) === lastMonth));
  const stAll = calcStats(DATA.submissions);

  $('#sum-last').textContent = yen(stLast.amount);
  $('#cnt-last').innerHTML = countsHtml(stLast);
  $('#sum-month').textContent = yen(stThis.amount);
  $('#cnt-month').innerHTML = countsHtml(stThis, DATA.content_count_this_month ?? stThis.content);
  $('#sum-total').textContent = yen(stAll.amount);
  $('#cnt-total').innerHTML = countsHtml(stAll);

  // ── 履歴：月フィルター選択肢（データに存在する実施月） ──
  const monthSel = $('#hist-month');
  const months = [...new Set(DATA.submissions.map(actMonth))].sort().reverse();
  const cur = monthSel.value;
  monthSel.innerHTML = '<option value="">全期間</option>' +
    months.map((m) => `<option value="${m}">${fmtMonth(m)}</option>`).join('');
  if (months.includes(cur)) monthSel.value = cur;

  renderHistory();
  renderSettle();

  // 事後報告フォームの事前申請プルダウン
  const sel = document.querySelector('#form-webinar_post select[name=linked_submission_id]');
  const pres = DATA.submissions.filter((s) => s.type === 'webinar_pre');
  sel.innerHTML = '<option value="">（事前申請なし／選択しない）</option>' +
    pres.map((s) => `<option value="${s.id}">${escapeHtml((s.payload.title || '') + ' / ' + (s.payload.event_date || '').replace('T', ' '))}</option>`).join('');

  // 紹介日デフォルト＝今日
  const refDate = document.querySelector('#form-referral input[name=referral_date]');
  if (refDate && !refDate.value) refDate.value = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}

// ── 履歴リスト＋小計（実施月フィルター適用） ──
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
    const isFixed = s.status === 'approved' || s.status === 'paid';
    const amountHtml = isFixed
      ? yen(s.approved_amount)
      : s.suggested_amount != null
        ? `<span class="est">目安 ${yen(s.suggested_amount)}</span>`
        : '<span class="est">—</span>';
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
      </div>
      ${extra ? `<div class="hist-extra">${extra}</div>` : ''}
    </div>`;
  }).join('');

  // 行クリック → 提出内訳ポップアップ
  list.querySelectorAll('.hist-row').forEach((row) => {
    row.addEventListener('click', () => openSubmissionDetail(Number(row.dataset.id)));
  });

  // 小計（種別ごと）＋合計
  const groups = [
    ['コンテンツ報告', subs.filter((s) => s.type === 'content')],
    ['ウェビナー・セミナー', subs.filter((s) => s.type === 'webinar_pre' || s.type === 'webinar_post')],
    ['紹介・運営精算', subs.filter((s) => s.type === 'referral' || s.type === 'adjustment')],
  ];
  const confirmed = (arr) => arr.reduce((a, s) => a + ((s.status === 'approved' || s.status === 'paid') ? (s.approved_amount || 0) : 0), 0);
  const liveCount = (arr) => arr.filter((s) => s.status !== 'rejected').length;

  const rows = groups
    .filter(([, arr]) => arr.length)
    .map(([label, arr]) => `<div class="sub-row"><span>${label}</span><span>${liveCount(arr)}件</span><span>${yen(confirmed(arr))}</span></div>`)
    .join('');
  const totalRow = `<div class="sub-row total"><span>合計${month ? `（${fmtMonth(month)}）` : '（全期間）'}</span><span>${liveCount(subs)}件</span><span>${yen(confirmed(subs))}</span></div>`;
  $('#hist-subtotal').innerHTML = rows + totalRow +
    '<div class="caption">金額は承認済み・支払い済みの確定分のみ。件数は差し戻しを除く。</div>';
}

// ── 精算タブ：実施月ごとに1行 ──
function renderSettle() {
  const tbody = $('#settle-table tbody');
  const confirmed = DATA.submissions.filter((s) => s.status === 'approved' || s.status === 'paid');
  if (!confirmed.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="muted">確定した精算はまだありません。</td></tr>';
    return;
  }

  const months = [...new Set(confirmed.map(actMonth))].sort().reverse();
  tbody.innerHTML = months.map((m) => {
    const items = confirmed.filter((s) => actMonth(s) === m);
    const total = items.reduce((a, s) => a + (s.approved_amount || 0), 0);
    const allPaid = items.every((s) => s.status === 'paid');
    const pays = (DATA.payments || []).filter((p) => p.month === m);

    const detailRows = items.map((s) => `
      <div class="settle-detail-row">
        <span>${fmtDate(actDate(s))}</span>
        <span><span class="badge type">${TYPE_LABELS[s.type]}</span></span>
        <span class="h-title">${escapeHtml(summaryLine(s))}</span>
        <span style="text-align:right;font-weight:600">${yen(s.approved_amount)}</span>
      </div>`).join('');

    return `
      <tr class="clickable settle-row" data-month="${m}">
        <td><b>${fmtMonth(m)}</b></td>
        <td>${items.length}件</td>
        <td><b>${yen(total)}</b></td>
        <td>${dueDate(m)}</td>
        <td><span class="badge ${allPaid ? 'paid' : 'submitted'}">${allPaid ? '支払い済み' : '支払い前'}</span></td>
        <td>${pays.length ? `<button class="ghost btn-sm btn-paydetail" data-month="${m}">内容を見る</button>` : '<span class="muted">—</span>'}</td>
      </tr>
      <tr class="settle-detail" id="detail-${m}" style="display:none">
        <td colspan="6">${detailRows}</td>
      </tr>`;
  }).join('');

  // 行クリック → 内訳トグル
  tbody.querySelectorAll('.settle-row').forEach((tr) => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('.btn-paydetail')) return; // 支払い内容ボタンは別処理
      const detail = document.getElementById('detail-' + tr.dataset.month);
      detail.style.display = detail.style.display === 'none' ? '' : 'none';
    });
  });
  // 支払い内容ポップアップ
  tbody.querySelectorAll('.btn-paydetail').forEach((btn) => {
    btn.addEventListener('click', () => openPaymentDetail(btn.dataset.month));
  });
}

// ── 支払い内容ポップアップ ──
function openPaymentDetail(month) {
  const pays = (DATA.payments || []).filter((p) => p.month === month);
  const body = pays.map((p) => `
    <dl class="kv">
      <dt>支払い方法</dt><dd>${p.method === 'amazon' ? '🎁 ' : '🏦 '}${METHOD_LABELS[p.method]}</dd>
      <dt>金額</dt><dd><b>${yen(p.amount)}</b></dd>
      ${p.method === 'transfer' && p.transfer_date ? `<dt>送金日</dt><dd>${p.transfer_date.replaceAll('-', '/')}</dd>` : ''}
    </dl>
    ${p.method === 'amazon' ? `
    <div class="codes-block">
      <b>Amazonギフトカード番号（${p.gift_codes.length}枚）</b>
      <ul>${p.gift_codes.map((c) => `<li><code>${escapeHtml(c)}</code></li>`).join('')}</ul>
    </div>` : ''}
  `).join('<hr style="border:none;border-top:1px solid var(--border);margin:14px 0">');
  openModal(`支払い内容（${fmtMonth(month)}分）`, body);
}

// ── 提出内訳ポップアップ（履歴の行クリック） ──
function openSubmissionDetail(id) {
  const s = DATA.submissions.find((x) => x.id === id);
  if (!s) return;
  const files = (DATA.files || []).filter((f) => f.submission_id === id);

  const rows = Object.entries(s.payload || {})
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `<dt>${escapeHtml(FIELD_LABELS[k] || k)}</dt><dd>${
      /^https?:\/\//.test(String(v)) ? `<a href="${escapeHtml(v)}" target="_blank">${escapeHtml(v)}</a>` : escapeHtml(VALUE_LABELS[v] ?? v)
    }</dd>`).join('');

  const isFixed = s.status === 'approved' || s.status === 'paid';
  const body = `
    <p><span class="badge type">${TYPE_LABELS[s.type]}</span> <span class="badge ${s.status}">${STATUS_LABELS[s.status]}</span></p>
    <dl class="kv">
      <dt>実施日</dt><dd>${fmtDate(actDate(s))}</dd>
      <dt>金額</dt><dd>${isFixed ? `<b>${yen(s.approved_amount)}</b>（確定）` : s.suggested_amount != null ? `目安 ${yen(s.suggested_amount)}（確認中）` : '確認中'}</dd>
      ${rows}
      ${s.status === 'rejected' && s.admin_note ? `<dt>運営より</dt><dd>${escapeHtml(s.admin_note)}</dd>` : ''}
    </dl>
    ${files.length ? `<p>📎 ${files.map((f) => `<a href="/api/files/${f.id}?token=${encodeURIComponent(token)}" target="_blank">${escapeHtml(f.filename)}</a>`).join(' / ')}</p>` : ''}
  `;
  openModal('提出内容', body);
}

// ── 汎用モーダル ──
function openModal(title, html) {
  $('#p-modal-title').textContent = title;
  $('#p-modal-body').innerHTML = html;
  $('#p-modal-bg').classList.add('open');
}
$('#p-modal-close').addEventListener('click', () => $('#p-modal-bg').classList.remove('open'));
$('#p-modal-bg').addEventListener('click', (e) => { if (e.target === $('#p-modal-bg')) $('#p-modal-bg').classList.remove('open'); });

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── モード切替 ──
function setMode(mode) {
  document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  $('#mode-submit').style.display = mode === 'submit' ? '' : 'none';
  $('#mode-history').style.display = mode === 'history' ? '' : 'none';
  $('#mode-settle').style.display = mode === 'settle' ? '' : 'none';
  if (mode === 'submit') showMenu(); // 提出モードに入るときはメニューから
}
document.querySelectorAll('.mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

// ── 提出メニュー ⇄ フォーム ──
function showMenu() {
  $('#submit-menu').style.display = '';
  document.querySelectorAll('.form-panel').forEach((p) => (p.style.display = 'none'));
}
function showForm(type) {
  $('#submit-menu').style.display = 'none';
  document.querySelectorAll('.form-panel').forEach((p) => (p.style.display = 'none'));
  $(`#panel-${type}`).style.display = '';
  window.scrollTo({ top: 0 });
}
document.querySelectorAll('.menu-card').forEach((card) => {
  card.addEventListener('click', () => showForm(card.dataset.form));
});
document.querySelectorAll('.back-btn').forEach((btn) => {
  btn.addEventListener('click', showMenu);
});

// ── 事後報告:形式によって紹介時間フィールド切替 ──
document.querySelectorAll('#form-webinar_post input[name=webinar_type]').forEach((r) => {
  r.addEventListener('change', () => {
    const isGeneral = r.value === 'general' && r.checked;
    const field = $('#exposure-field');
    field.style.display = isGeneral ? '' : 'none';
    field.querySelector('input').required = isGeneral;
  });
});

// ── 紹介:個人/コミュニティ切替 ──
document.querySelectorAll('#form-referral input[name=referral_kind]').forEach((r) => {
  r.addEventListener('change', () => {
    const isPerson = document.querySelector('#form-referral input[name=referral_kind]:checked').value === 'person';
    $('#referral-person').style.display = isPerson ? '' : 'none';
    $('#referral-community').style.display = isPerson ? 'none' : '';
  });
});

// ── 送信 ──
async function submitForm(type, form) {
  const fd = new FormData(form);
  const payload = {};
  for (const [k, v] of fd.entries()) {
    if (v instanceof File) continue;
    payload[k] = v;
  }

  // 紹介フォーム:種類別の必須チェック
  if (type === 'referral') {
    const kind = payload.referral_kind;
    const required = kind === 'person'
      ? ['p_name', 'p_sns_url', 'p_main_channel', 'p_track']
      : ['c_name', 'c_size', 'c_field'];
    for (const f of required) {
      if (!payload[f]) { toast('必須項目が未入力です', true); return; }
    }
  }

  const body = new FormData();
  body.set('token', token);
  body.set('type', type);
  body.set('payload', JSON.stringify(payload));
  if (type === 'webinar_post') {
    for (const f of form.querySelector('[name=photos]').files) body.append('photos', f);
    const slides = form.querySelector('[name=slides]');
    if (slides) for (const f of slides.files) body.append('slides', f);
  }

  const btn = form.querySelector('button.primary');
  btn.disabled = true;
  btn.textContent = '送信中...';
  try {
    const res = await fetch('/api/submissions', { method: 'POST', body });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'error');
    toast('送信しました。運営確認後にステータスが更新されます。');
    form.reset();
    await load();
    setMode('history'); // 送信後は活動履歴へ
  } catch (e) {
    toast('送信に失敗しました：' + e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = btn.dataset.label || '送信する';
  }
}

for (const type of ['content', 'webinar_pre', 'webinar_post', 'referral']) {
  const form = $(`#form-${type}`);
  form.querySelector('button.primary').dataset.label = form.querySelector('button.primary').textContent;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(type, form);
  });
}

$('#hist-month').addEventListener('change', renderHistory);

load();
