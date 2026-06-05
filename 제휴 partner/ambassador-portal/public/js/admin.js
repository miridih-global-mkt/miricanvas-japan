// 運営管理画面
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

// payload キーの日本語ラベル（詳細表示用）
const FIELD_LABELS = {
  category: 'カテゴリ', url: 'URL', channel: 'チャネル', published_date: '公開日', memo: '補足',
  title: 'タイトル', event_date: '開催日時', webinar_type: '形式',
  expected_participants: '予想参加人数', participants: '実参加人数',
  mc_duration: 'MC講義時間', mc_content: 'MC講義内容', ai_tools: '併用AIツール',
  exposure_minutes: 'MC紹介時間(分)', photo_consent: '写真二次利用同意',
  linked_submission_id: '事前申請ID', referral_kind: '紹介種類', referral_date: '紹介日',
  p_name: '名前', p_sns_url: 'SNS URL', p_main_channel: 'メインチャネル', p_track: '得意分野',
  c_name: 'コミュニティ名', c_size: '規模', c_field: '分野', c_owner: '運営者',
  reason: '紹介理由', relation: '関係',
};
const VALUE_LABELS = { ...CATEGORY_LABELS, ...WTYPE_LABELS, ...TRACK_LABELS, person: '個人', community: 'コミュニティ', yes: '同意あり' };

const $ = (s) => document.querySelector(s);
const yen = (n) => n == null ? '—' : Number(n).toLocaleString('ja-JP') + '円';
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (s) => {
  if (!s) return '—';
  const [y, m, d] = s.slice(0, 10).split('-');
  return `${y}/${Number(m)}/${Number(d)}`;
};
const fmtMonth = (m) => m ? m.replace('-', '年') + '月' : '';

// 実施日（なければ提出日をJSTで）
function actDate(s) {
  if (s.activity_date) return s.activity_date;
  const d = new Date(s.created_at.replace(' ', 'T') + (s.created_at.endsWith('Z') ? '' : 'Z'));
  return d.toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
}

// 支払予定日 = 実施月の翌月末
function dueDate(month) {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(y, m + 1, 0);
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

async function api(path, opts = {}) {
  const res = await fetch(path, {
    headers: opts.body ? { 'Content-Type': 'application/json' } : {},
    ...opts,
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  if (res.status === 401) { showLogin(); throw new Error('unauthorized'); }
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'error');
  return data;
}

// ── ログイン ──
function showLogin() {
  $('#login-view').style.display = 'flex';
  $('#main-view').style.display = 'none';
}
function showMain() {
  $('#login-view').style.display = 'none';
  $('#main-view').style.display = '';
}

$('#login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    await api('/api/admin/login', { method: 'POST', body: { password: $('#login-pw').value } });
    showMain();
    init();
  } catch (err) {
    toast(err.message === 'unauthorized' ? 'パスワードが違います' : err.message, true);
  }
});

$('#logout-btn').addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST', body: {} });
  showLogin();
});

// ── タブ ──
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-panel').forEach((p) => (p.style.display = 'none'));
    $(`#panel-${btn.dataset.tab}`).style.display = '';
    if (btn.dataset.tab === 'summary') loadSummary();
    if (btn.dataset.tab === 'ambs') loadAmbassadors();
  });
});

// ══════════ 提出一覧 ══════════
let SUBS = { submissions: [], files: [] };
let AMBS = [];

async function loadSubs() {
  const q = new URLSearchParams();
  if ($('#f-month').value) q.set('month', $('#f-month').value);
  if ($('#f-type').value) q.set('type', $('#f-type').value);
  if ($('#f-status').value) q.set('status', $('#f-status').value);
  if ($('#f-amb').value) q.set('ambassador_id', $('#f-amb').value);
  SUBS = await api('/api/admin/submissions?' + q);
  renderSubs();
}

function payloadSummary(s) {
  const p = s.payload || {};
  switch (s.type) {
    case 'content': return `${CATEGORY_LABELS[p.category] || ''}・${p.channel || ''}`;
    case 'webinar_pre': return p.title || '';
    case 'webinar_post': return `${p.title || ''}・${p.participants ?? '?'}名`;
    case 'referral': return p.referral_kind === 'community' ? `コミュニティ：${p.c_name || ''}` : `個人：${p.p_name || ''}`;
    case 'adjustment': return p.title || '運営による精算';
    default: return '';
  }
}

function renderSubs() {
  const tbody = $('#subs-table tbody');
  const subs = SUBS.submissions;
  if (!subs.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">該当する提出はありません</td></tr>';
    $('#subs-subtotal').innerHTML = '';
    return;
  }
  tbody.innerHTML = subs.map((s) => `
    <tr class="clickable" data-id="${s.id}">
      <td>${fmtDate(actDate(s))}</td>
      <td>${escapeHtml(s.ambassador_name)}</td>
      <td><span class="badge type">${TYPE_LABELS[s.type]}</span></td>
      <td>${escapeHtml(payloadSummary(s))}</td>
      <td>${yen(s.suggested_amount)}</td>
      <td>${yen(s.approved_amount)}</td>
      <td><span class="badge ${s.status}">${STATUS_LABELS[s.status]}</span></td>
    </tr>`).join('');
  tbody.querySelectorAll('tr.clickable').forEach((tr) => {
    tr.addEventListener('click', () => openDetail(Number(tr.dataset.id)));
  });

  // 下部小計（種別ごと＋合計、フィルター連動）
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
  const m = $('#f-month').value;
  const totalRow = `<div class="sub-row total"><span>合計${m ? `（${fmtMonth(m)}）` : ''}</span><span>${liveCount(subs)}件</span><span>${yen(confirmed(subs))}</span></div>`;
  $('#subs-subtotal').innerHTML = rows + totalRow +
    '<div class="caption">金額は承認済み・支払い済みの確定分のみ。件数は差し戻しを除く。表示中のフィルター条件で集計。</div>';
}

['f-month', 'f-type', 'f-status', 'f-amb'].forEach((id) => {
  $('#' + id).addEventListener('change', loadSubs);
});
$('#f-csv').addEventListener('click', () => {
  const month = $('#f-month').value;
  location.href = '/api/admin/export' + (month ? `?month=${month}` : '');
});

// ── 詳細モーダル ──
function openDetail(id) {
  const s = SUBS.submissions.find((x) => x.id === id);
  if (!s) return;
  const files = SUBS.files.filter((f) => f.submission_id === id);

  $('#modal-title').innerHTML = `${TYPE_LABELS[s.type]} <span class="badge ${s.status}">${STATUS_LABELS[s.status]}</span>`;

  const rows = Object.entries(s.payload || {})
    .filter(([, v]) => v !== '' && v != null)
    .map(([k, v]) => `<dt>${escapeHtml(FIELD_LABELS[k] || k)}</dt><dd>${
      /^https?:\/\//.test(String(v)) ? `<a href="${escapeHtml(v)}" target="_blank">${escapeHtml(v)}</a>` : escapeHtml(VALUE_LABELS[v] ?? v)
    }</dd>`).join('');

  const imgs = files.filter((f) => /\.(png|jpe?g|gif|webp|heic)$/i.test(f.filename));
  const others = files.filter((f) => !imgs.includes(f));

  $('#modal-body').innerHTML = `
    <dl class="kv">
      <dt>アンバサダー</dt><dd>${escapeHtml(s.ambassador_name)}</dd>
      <dt>実施日</dt><dd>${fmtDate(s.activity_date)}</dd>
      <dt>提出日</dt><dd>${fmtDate(actDate({ activity_date: null, created_at: s.created_at }))}</dd>
      ${rows}
      ${s.admin_note ? `<dt>運営メモ</dt><dd>${escapeHtml(s.admin_note)}</dd>` : ''}
    </dl>
    ${imgs.length ? `<div class="file-thumbs">${imgs.map((f) => `<a href="/api/files/${f.id}" target="_blank"><img src="/api/files/${f.id}" alt="${escapeHtml(f.filename)}"></a>`).join('')}</div>` : ''}
    ${others.length ? `<p>📎 ${others.map((f) => `<a href="/api/files/${f.id}" target="_blank">${escapeHtml(f.filename)}</a>`).join(' / ')}</p>` : ''}
  `;

  const amount = s.approved_amount ?? s.suggested_amount ?? '';
  $('#modal-review').innerHTML = `
    <h3>審査</h3>
    <label class="field">確定金額（円）<input type="number" id="rv-amount" min="0" value="${amount}"></label>
    <p class="muted">自動提案：${yen(s.suggested_amount)}${s.type === 'referral' ? '（紹介は報酬案確定前のため手動入力）' : ''}</p>
    <label class="field">実施日（精算基準月の調整が必要な場合に変更）
      <input type="date" id="rv-date" value="${s.activity_date || ''}"></label>
    <label class="field">運営メモ（差し戻し理由など）<textarea id="rv-note">${escapeHtml(s.admin_note || '')}</textarea></label>
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
      <button class="primary" style="width:auto;margin:0;padding:10px 18px" id="rv-approve">承認する</button>
      <button class="danger" id="rv-reject">差し戻す</button>
      ${s.status !== 'submitted' ? '<button class="ghost" id="rv-reopen">確認中に戻す</button>' : ''}
    </div>
    <p class="muted" style="margin-top:10px">※ 支払い処理は「支払い管理」タブから月単位で行います。</p>
  `;

  const act = async (action, extra = {}) => {
    try {
      await api(`/api/admin/submissions/${id}`, { method: 'PATCH', body: { action, admin_note: $('#rv-note').value || null, ...extra } });
      toast('更新しました');
      closeModal();
      await loadSubs();
    } catch (e) {
      toast(e.message, true);
    }
  };
  $('#rv-approve').addEventListener('click', () => {
    const v = Number($('#rv-amount').value);
    if (!Number.isFinite(v) || $('#rv-amount').value === '') return toast('確定金額を入力してください', true);
    act('approve', { approved_amount: v, activity_date: $('#rv-date').value || null });
  });
  $('#rv-reject').addEventListener('click', () => act('reject'));
  $('#rv-reopen')?.addEventListener('click', () => act('reopen'));

  $('#modal-bg').classList.add('open');
}

function closeModal() { $('#modal-bg').classList.remove('open'); }
$('#modal-close').addEventListener('click', closeModal);
$('#modal-bg').addEventListener('click', (e) => { if (e.target === $('#modal-bg')) closeModal(); });

// ══════════ 運営精算の追加 ══════════
$('#btn-adj').addEventListener('click', () => {
  $('#adj-amb').innerHTML = AMBS.filter((a) => a.active)
    .map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');
  $('#adj-date').value = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  $('#adj-modal-bg').classList.add('open');
});
$('#adj-close').addEventListener('click', () => $('#adj-modal-bg').classList.remove('open'));
$('#adj-modal-bg').addEventListener('click', (e) => { if (e.target === $('#adj-modal-bg')) $('#adj-modal-bg').classList.remove('open'); });

$('#adj-submit').addEventListener('click', async () => {
  try {
    const amount = Number($('#adj-amount').value);
    if (!$('#adj-title').value.trim()) return toast('内容を入力してください', true);
    if (!Number.isFinite(amount) || $('#adj-amount').value === '') return toast('金額を入力してください', true);
    if (!$('#adj-date').value) return toast('実施日を入力してください', true);
    await api('/api/admin/submissions', { method: 'POST', body: {
      ambassador_id: Number($('#adj-amb').value),
      title: $('#adj-title').value.trim(),
      amount,
      activity_date: $('#adj-date').value,
      memo: $('#adj-memo').value || '',
    } });
    toast('運営精算を登録しました（自動承認）');
    $('#adj-modal-bg').classList.remove('open');
    $('#adj-title').value = ''; $('#adj-amount').value = ''; $('#adj-memo').value = '';
    await loadSubs();
  } catch (e) { toast(e.message, true); }
});

// ══════════ 支払い管理 ══════════
let SUMMARY = { summary: [], payments: [] };

async function loadSummary() {
  const q = $('#s-month').value ? `?month=${$('#s-month').value}` : '';
  SUMMARY = await api('/api/admin/summary' + q);
  renderSummary();
}

function renderSummary() {
  const tbody = $('#summary-table tbody');
  const { summary, payments } = SUMMARY;
  if (!summary.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">データがありません</td></tr>';
    return;
  }
  tbody.innerHTML = summary.map((r) => {
    const pays = payments.filter((p) => p.ambassador_id === r.ambassador_id && p.month === r.month);
    const payInfo = pays.length
      ? pays.map((p) => p.method === 'amazon'
          ? `🎁 ギフト${p.gift_codes.length}枚（${yen(p.amount)}）`
          : `🏦 海外送金 ${p.transfer_date ? p.transfer_date.replaceAll('-', '/') : ''}（${yen(p.amount)}）`
        ).join('<br>')
      : `<span class="muted">${r.overseas_recommended ? '推奨：海外送金' : '推奨：Amazonギフト'}</span>`;
    const action = r.unpaid_count > 0
      ? `<button class="ghost btn-pay" data-amb="${r.ambassador_id}" data-month="${r.month}" data-name="${escapeHtml(r.ambassador_name)}" data-unpaid="${r.unpaid_count}">支払い前（${r.unpaid_count}件）→ 支払う</button>`
      : '<span class="badge paid">支払い済み</span>';
    return `
    <tr>
      <td>${fmtMonth(r.month)}</td>
      <td>${escapeHtml(r.ambassador_name)}</td>
      <td>${r.count}件</td>
      <td><b>${yen(r.total)}</b>${r.overseas_recommended ? ' <span class="badge flag">5万円以上</span>' : ''}</td>
      <td>${dueDate(r.month)}</td>
      <td>${payInfo}</td>
      <td>${action}</td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.btn-pay').forEach((btn) => {
    btn.addEventListener('click', () => openPayModal(btn.dataset));
  });
}
$('#s-month').addEventListener('change', loadSummary);

// ── 支払いモーダル ──
let PAY_TARGET = null;

function openPayModal(ds) {
  PAY_TARGET = { ambassador_id: Number(ds.amb), month: ds.month };
  const row = SUMMARY.summary.find((r) => r.ambassador_id === Number(ds.amb) && r.month === ds.month);
  const unpaidAmount = row ? row.total - row.paid_total : 0;
  $('#pay-info').innerHTML = `<b>${escapeHtml(ds.name)}</b> さん／${fmtMonth(ds.month)}分（支払予定 ${dueDate(ds.month)}）<br>未払い ${ds.unpaid}件・<b>${yen(unpaidAmount)}</b> を支払い済みにします。`;
  $('#pay-codes').value = '';
  $('#pay-date').value = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  document.querySelector('input[name=pay_method][value=amazon]').checked = true;
  togglePayFields();
  $('#pay-modal-bg').classList.add('open');
}

function togglePayFields() {
  const method = document.querySelector('input[name=pay_method]:checked').value;
  $('#pay-codes-field').style.display = method === 'amazon' ? '' : 'none';
  $('#pay-date-field').style.display = method === 'transfer' ? '' : 'none';
}
document.querySelectorAll('input[name=pay_method]').forEach((r) => r.addEventListener('change', togglePayFields));

$('#pay-close').addEventListener('click', () => $('#pay-modal-bg').classList.remove('open'));
$('#pay-modal-bg').addEventListener('click', (e) => { if (e.target === $('#pay-modal-bg')) $('#pay-modal-bg').classList.remove('open'); });

$('#pay-submit').addEventListener('click', async () => {
  if (!PAY_TARGET) return;
  const method = document.querySelector('input[name=pay_method]:checked').value;
  const body = { ...PAY_TARGET, method };
  if (method === 'amazon') {
    body.gift_codes = $('#pay-codes').value.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!body.gift_codes.length) return toast('ギフトカード番号を入力してください', true);
  } else {
    if (!$('#pay-date').value) return toast('送金日を入力してください', true);
    body.transfer_date = $('#pay-date').value;
  }
  try {
    const r = await api('/api/admin/pay', { method: 'POST', body });
    toast(`${r.updated}件・${yen(r.amount)}を支払い済みにしました`);
    $('#pay-modal-bg').classList.remove('open');
    loadSummary();
  } catch (e) { toast(e.message, true); }
});

// ══════════ アンバサダー管理 ══════════
async function loadAmbassadors() {
  const { ambassadors } = await api('/api/admin/ambassadors');
  AMBS = ambassadors;

  // フィルター用プルダウンも更新
  $('#f-amb').innerHTML = '<option value="">すべて</option>' +
    ambassadors.map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');

  const tbody = $('#ambs-table tbody');
  tbody.innerHTML = ambassadors.map((a) => `
    <tr>
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(a.description || '')} <button class="ghost btn-edit-desc" data-id="${a.id}" data-desc="${escapeHtml(a.description || '')}" style="padding:2px 8px;font-size:11px">編集</button></td>
      <td>${a.submission_count}</td>
      <td>${a.active ? '<span class="badge approved">有効</span>' : '<span class="badge rejected">無効</span>'}</td>
      <td><button class="ghost" data-copy="${a.token}">リンクをコピー</button></td>
      <td style="white-space:nowrap">
        <button class="ghost" data-reissue="${a.id}">リンク再発行</button>
        <button class="${a.active ? 'danger' : 'ghost'}" data-toggle="${a.id}" data-active="${a.active}">${a.active ? 'リンク無効化' : 'リンク有効化'}</button>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const url = `${location.origin}/a/${btn.dataset.copy}`;
      await navigator.clipboard.writeText(url);
      toast('コピーしました：' + url);
    });
  });
  tbody.querySelectorAll('.btn-edit-desc').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const next = prompt('説明を編集', btn.dataset.desc);
      if (next === null) return;
      await api(`/api/admin/ambassadors/${btn.dataset.id}`, { method: 'PATCH', body: { description: next } });
      toast('説明を更新しました');
      loadAmbassadors();
    });
  });
  tbody.querySelectorAll('[data-reissue]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('専用リンクを再発行しますか？古いリンクは使えなくなります。')) return;
      const r = await api(`/api/admin/ambassadors/${btn.dataset.reissue}`, { method: 'PATCH', body: { reissue_token: true } });
      await navigator.clipboard.writeText(`${location.origin}/a/${r.token}`);
      toast('再発行し、新しいリンクをコピーしました');
      loadAmbassadors();
    });
  });
  tbody.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const activating = btn.dataset.active !== '1';
      if (!activating && !confirm('リンクを無効化しますか？このアンバサダーはアクセスできなくなります。')) return;
      await api(`/api/admin/ambassadors/${btn.dataset.toggle}`, { method: 'PATCH', body: { active: activating } });
      loadAmbassadors();
    });
  });
}

$('#amb-add').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await api('/api/admin/ambassadors', { method: 'POST', body: { name: $('#amb-name').value, description: $('#amb-desc').value } });
    await navigator.clipboard.writeText(`${location.origin}/a/${r.token}`);
    toast('登録しました。専用リンクをコピーしました');
    $('#amb-add').reset();
    loadAmbassadors();
  } catch (err) { toast(err.message, true); }
});

// ══════════ 初期化 ══════════
async function init() {
  const nowMonth = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 7);
  if (!$('#s-month').value) $('#s-month').value = nowMonth;
  await loadAmbassadors();
  await loadSubs();
}

// セッションが生きていればそのままメイン表示
(async () => {
  try {
    await api('/api/admin/ambassadors');
    showMain();
    init();
  } catch {
    showLogin();
  }
})();
