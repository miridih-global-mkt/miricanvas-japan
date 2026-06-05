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

// payload キーの日本語ラベル（内訳ポップアップ用）
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

// 実施日（なければ提出日をJSTで）
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
    case 'webinar':
      return `${p.title || ''}・参加 ${p.participants ?? '?'}名`;
    case 'referral':
      return p.referral_kind === 'community' ? `コミュニティ：${p.c_name || ''}` : `個人：${p.p_name || ''}`;
    case 'adjustment':
      return p.title || '運営による精算';
    default:
      return '';
  }
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function billOf(s) {
  return s.bill_id ? (DATA.bills || []).find((b) => b.id === s.bill_id) : null;
}

// ── サマリー：種別×期間（件数＋確定金額） ──
function statsOf(subs) {
  const mk = () => ({ n: 0, amt: 0 });
  const st = { content: mk(), webinar: mk(), referral: mk() };
  for (const s of subs) {
    if (s.status === 'rejected') continue;
    const key = s.type === 'content' ? 'content' : s.type === 'webinar' ? 'webinar' : 'referral';
    st[key].n++;
    if (s.status === 'approved') st[key].amt += s.approved_amount || 0;
  }
  st.total = { n: st.content.n + st.webinar.n + st.referral.n, amt: st.content.amt + st.webinar.amt + st.referral.amt };
  return st;
}

function renderSummary() {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const nowMonth = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 7);
  const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toLocaleDateString('sv-SE').slice(0, 7);

  const all = statsOf(DATA.submissions);
  const last = statsOf(DATA.submissions.filter((s) => actMonth(s) === lastMonth));
  const cur = statsOf(DATA.submissions.filter((s) => actMonth(s) === nowMonth));

  const cell = (c) => `<td><span class="cnt">${c.n}件</span> ${yen(c.amt)}</td>`;
  const cap = DATA.content_count_this_month ?? cur.content.n;
  const capHtml = `<span class="cnt ${cap >= 5 ? 'over' : ''}" style="${cap >= 5 ? 'color:var(--red);font-weight:700' : ''}">${cap}/5件</span> ${yen(cur.content.amt)}`;

  $('#sum-body').innerHTML = `
    <tr><td>コンテンツ</td>${cell(all.content)}${cell(last.content)}<td>${capHtml}</td></tr>
    <tr><td>ウェビナー・セミナー</td>${cell(all.webinar)}${cell(last.webinar)}${cell(cur.webinar)}</tr>
    <tr><td>紹介・その他</td>${cell(all.referral)}${cell(last.referral)}${cell(cur.referral)}</tr>
    <tr class="total"><td>リワード小計</td><td>${yen(all.total.amt)}</td><td>${yen(last.total.amt)}</td><td>${yen(cur.total.amt)}</td></tr>
  `;
}

function render() {
  $('#app').style.display = '';
  $('#error-view').style.display = 'none';
  $('#greeting').textContent = `こんにちは、${DATA.ambassador.name} さん`;

  renderSummary();

  // 履歴：月フィルター選択肢（データに存在する実施月）
  const monthSel = $('#hist-month');
  const months = [...new Set(DATA.submissions.map(actMonth))].sort().reverse();
  const cur = monthSel.value;
  monthSel.innerHTML = '<option value="">全期間</option>' +
    months.map((m) => `<option value="${m}">${fmtMonth(m)}</option>`).join('');
  if (months.includes(cur)) monthSel.value = cur;

  renderHistory();
  renderRewards();

  // 紹介日デフォルト＝今日
  const refDate = document.querySelector('#form-referral input[name=referral_date]');
  if (refDate && !refDate.value) refDate.value = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}

// ── 活動履歴（リワード案件列つき） ──
function renderHistory() {
  const month = $('#hist-month').value;
  const subs = month ? DATA.submissions.filter((s) => actMonth(s) === month) : DATA.submissions;

  const list = $('#history-list');
  if (!subs.length) {
    list.innerHTML = '<p class="muted" style="padding:12px 10px">該当する提出はありません。上のボタンから報告できます。</p>';
    $('#hist-subtotal').innerHTML = '';
    return;
  }

  list.innerHTML = subs.map((s) => {
    const files = (DATA.files || []).filter((f) => f.submission_id === s.id);
    const bill = billOf(s);
    const isFixed = s.status === 'approved';
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
        <span class="h-bill" style="text-align:center">${bill ? `<span class="bill-link" data-bill="${bill.id}">${escapeHtml(bill.title)}</span>` : '<span class="muted">—</span>'}</span>
      </div>
      ${extra ? `<div class="hist-extra">${extra}</div>` : ''}
    </div>`;
  }).join('');

  // 行クリック → 提出内訳ポップアップ／リワード案件クリック → リワード確認タブへフォーカス
  list.querySelectorAll('.hist-row').forEach((row) => {
    row.addEventListener('click', (e) => {
      const link = e.target.closest('.bill-link');
      if (link) { focusBill(Number(link.dataset.bill)); return; }
      openSubmissionDetail(Number(row.dataset.id));
    });
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

// ── リワード確認タブ ──
function renderRewards() {
  const tbody = $('#settle-table tbody');
  const bills = DATA.bills || [];
  if (!bills.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="muted">リワード案件はまだありません。承認済みの活動は運営側でまとめられ、こちらに表示されます。</td></tr>';
    return;
  }

  tbody.innerHTML = bills.map((b) => {
    const items = DATA.submissions.filter((s) => s.bill_id === b.id);
    const total = items.reduce((a, s) => a + (s.approved_amount || 0), 0);
    const isPaid = !!b.method;

    const childRows = items.map((s) => `
      <div class="settle-detail-row child-act" data-id="${s.id}" style="cursor:pointer">
        <span>${fmtDate(actDate(s))}</span>
        <span><span class="badge type">${TYPE_LABELS[s.type]}</span></span>
        <span class="h-title">${escapeHtml(summaryLine(s))}</span>
        <span style="text-align:right;font-weight:600">${yen(s.approved_amount)}</span>
      </div>`).join('');

    return `
      <tr class="clickable settle-row" data-id="${b.id}" id="bill-row-${b.id}">
        <td>${fmtDate(b.created_at)}</td>
        <td><b>${escapeHtml(b.title)}</b></td>
        <td>${items.length}件</td>
        <td><b>${yen(total)}</b></td>
        <td><span class="badge ${isPaid ? 'paid' : 'submitted'}">${isPaid ? '支払い済み' : '支払い前'}</span></td>
        <td>${isPaid ? `<button class="ghost btn-sm btn-paydetail" data-id="${b.id}">詳細確認</button>` : '<span class="muted">—</span>'}</td>
      </tr>
      <tr class="settle-detail" id="detail-${b.id}" style="display:none">
        <td colspan="6" style="padding:6px 10px 12px">
          <div class="bill-children">
            <div class="bc-head">▼ このリワード案件の対象活動（${items.length}件）— タップで詳細</div>
            ${childRows || '<span class="muted">内訳がありません</span>'}
          </div>
        </td>
      </tr>`;
  }).join('');

  // 行クリック → 内訳トグル＋フォーカス表示
  tbody.querySelectorAll('.settle-row').forEach((tr) => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('.btn-paydetail')) return;
      toggleBill(Number(tr.dataset.id));
    });
  });
  // リワード詳細ポップアップ
  tbody.querySelectorAll('.btn-paydetail').forEach((btn) => {
    btn.addEventListener('click', () => openPaymentDetail(Number(btn.dataset.id)));
  });
  // 対象活動クリック → 提出内訳ポップアップ
  tbody.querySelectorAll('.child-act').forEach((row) => {
    row.addEventListener('click', () => openSubmissionDetail(Number(row.dataset.id)));
  });
}

// 開閉＋フォーカス（開いている行 = focused 表示）
function toggleBill(billId, forceOpen = false) {
  const row = document.getElementById('bill-row-' + billId);
  const detail = document.getElementById('detail-' + billId);
  if (!row || !detail) return;
  const willOpen = forceOpen || detail.style.display === 'none';
  // 他の行のフォーカスを解除
  document.querySelectorAll('#settle-table .settle-row.focused').forEach((r) => {
    if (r !== row) {
      r.classList.remove('focused');
      const d = document.getElementById('detail-' + r.dataset.id);
      if (d) d.style.display = 'none';
    }
  });
  detail.style.display = willOpen ? '' : 'none';
  row.classList.toggle('focused', willOpen);
}

// 履歴のリワード案件クリック → リワード確認タブへ移動してフォーカス
function focusBill(billId) {
  setMode('reward');
  toggleBill(billId, true);
  document.getElementById('bill-row-' + billId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── リワード詳細ポップアップ ──
function openPaymentDetail(billId) {
  const b = (DATA.bills || []).find((x) => x.id === billId);
  if (!b) return;
  const items = DATA.submissions.filter((s) => s.bill_id === b.id);
  const total = items.reduce((a, s) => a + (s.approved_amount || 0), 0);
  const body = `
    <dl class="kv">
      <dt>支払い方法</dt><dd>${b.method === 'amazon' ? '🎁 ' : '🏦 '}${METHOD_LABELS[b.method]}</dd>
      <dt>金額</dt><dd><b>${yen(total)}</b></dd>
      ${b.method === 'transfer' && b.transfer_date ? `<dt>送金日</dt><dd>${b.transfer_date.replaceAll('-', '/')}</dd>` : ''}
    </dl>
    ${b.method === 'amazon' ? `
    <div class="codes-block">
      <b>Amazonギフトカード番号（${b.gift_codes.length}枚）</b>
      <ul>${b.gift_codes.map((c) => `<li><code>${escapeHtml(c)}</code></li>`).join('')}</ul>
    </div>` : ''}
  `;
  openModal(`リワード（${escapeHtml(b.title)}）`, body);
}

// ── 提出内訳ポップアップ ──
function openSubmissionDetail(id) {
  const s = DATA.submissions.find((x) => x.id === id);
  if (!s) return;
  const files = (DATA.files || []).filter((f) => f.submission_id === id);
  const bill = billOf(s);

  const rows = Object.entries(s.payload || {})
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `<dt>${escapeHtml(FIELD_LABELS[k] || k)}</dt><dd>${
      /^https?:\/\//.test(String(v)) ? `<a href="${escapeHtml(v)}" target="_blank">${escapeHtml(v)}</a>` : escapeHtml(VALUE_LABELS[v] ?? v)
    }</dd>`).join('');

  const isFixed = s.status === 'approved';
  const body = `
    <p><span class="badge type">${TYPE_LABELS[s.type]}</span> <span class="badge ${s.status}">${STATUS_LABELS[s.status]}</span></p>
    <dl class="kv">
      <dt>実施日</dt><dd>${fmtDate(actDate(s))}</dd>
      <dt>金額</dt><dd>${isFixed ? `<b>${yen(s.approved_amount)}</b>（確定）` : s.suggested_amount != null ? `目安 ${yen(s.suggested_amount)}（確認中）` : '確認中'}</dd>
      ${bill ? `<dt>リワード案件</dt><dd>${escapeHtml(bill.title)}</dd>` : ''}
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

// ── タブ切替 ──
function setMode(mode) {
  document.querySelectorAll('.mode-btn').forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
  $('#mode-report').style.display = mode === 'report' ? '' : 'none';
  $('#mode-reward').style.display = mode === 'reward' ? '' : 'none';
}
document.querySelectorAll('.mode-btn').forEach((btn) => {
  btn.addEventListener('click', () => setMode(btn.dataset.mode));
});

// ── 提出フォーム（ポップアップ）開閉 ──
document.querySelectorAll('.submit-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.getElementById(`fm-${btn.dataset.form}-bg`).classList.add('open');
  });
});
document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => document.getElementById(btn.dataset.close).classList.remove('open'));
});
document.querySelectorAll('#fm-content-bg, #fm-webinar-bg, #fm-referral-bg').forEach((bg) => {
  bg.addEventListener('click', (e) => { if (e.target === bg) bg.classList.remove('open'); });
});

// ── ウェビナー：形式によって紹介時間フィールド切替 ──
document.querySelector('#form-webinar select[name=webinar_type]').addEventListener('change', (e) => {
  const isGeneral = e.target.value === 'general';
  const field = $('#exposure-field');
  field.style.visibility = isGeneral ? 'visible' : 'hidden';
  field.querySelector('input').required = isGeneral;
});

// ── 紹介：個人/コミュニティ切替 ──
$('#referral-kind').addEventListener('change', (e) => {
  const isPerson = e.target.value === 'person';
  $('#referral-person').style.display = isPerson ? '' : 'none';
  $('#referral-community').style.display = isPerson ? 'none' : '';
});

// ── 送信 ──
async function submitForm(type, form) {
  const fd = new FormData(form);
  const payload = {};
  for (const [k, v] of fd.entries()) {
    if (v instanceof File) continue;
    payload[k] = v;
  }

  // 紹介フォーム：種類別の必須チェック
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
  if (type === 'webinar') {
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
    document.getElementById(`fm-${type}-bg`).classList.remove('open');
    await load();
    setMode('report');
  } catch (e) {
    toast('送信に失敗しました：' + e.message, true);
  } finally {
    btn.disabled = false;
    btn.textContent = btn.dataset.label || '送信する';
  }
}

for (const type of ['content', 'webinar', 'referral']) {
  const form = $(`#form-${type}`);
  form.querySelector('button.primary').dataset.label = form.querySelector('button.primary').textContent;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm(type, form);
  });
}

$('#hist-month').addEventListener('change', renderHistory);

load();
