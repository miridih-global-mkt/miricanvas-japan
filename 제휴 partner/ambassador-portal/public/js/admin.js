// 運営管理画面
const TYPE_LABELS = {
  content: 'コンテンツ報告',
  webinar_pre: 'ウェビナー事前申請',
  webinar_post: 'ウェビナー事後報告',
  referral: '紹介',
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
  linked_submission_id: '事前申請ID', referral_kind: '紹介種類',
  p_name: '名前', p_sns_url: 'SNS URL', p_main_channel: 'メインチャネル', p_track: '得意分野',
  c_name: 'コミュニティ名', c_size: '規模', c_field: '分野', c_owner: '運営者',
  reason: '紹介理由', relation: '関係',
};
const VALUE_LABELS = { ...CATEGORY_LABELS, ...WTYPE_LABELS, ...TRACK_LABELS, person: '個人', community: 'コミュニティ', yes: '同意あり' };

const $ = (s) => document.querySelector(s);
const yen = (n) => n == null ? '—' : Number(n).toLocaleString('ja-JP') + '円';
const jstDate = (s) => {
  if (!s) return '';
  const d = new Date(s.replace(' ', 'T') + (s.endsWith('Z') ? '' : 'Z'));
  return d.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', month: 'short', day: 'numeric' });
};
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

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

// ── 提出一覧 ──
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
    default: return '';
  }
}

function renderSubs() {
  const tbody = $('#subs-table tbody');
  if (!SUBS.submissions.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">該当する提出はありません</td></tr>';
    return;
  }
  tbody.innerHTML = SUBS.submissions.map((s) => `
    <tr class="clickable" data-id="${s.id}">
      <td>${jstDate(s.created_at)}</td>
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
      <dt>提出日</dt><dd>${jstDate(s.created_at)}</dd>
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
    <label class="field">運営メモ（差し戻し理由など）<textarea id="rv-note">${escapeHtml(s.admin_note || '')}</textarea></label>
    <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
      <button class="primary" style="width:auto;margin:0;padding:10px 18px" id="rv-approve">承認する</button>
      <button class="danger" id="rv-reject">差し戻す</button>
      ${s.status === 'approved' ? '<button class="ghost" id="rv-paid">支払い済みにする</button>' : ''}
      ${s.status !== 'submitted' ? '<button class="ghost" id="rv-reopen">確認中に戻す</button>' : ''}
    </div>
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
    act('approve', { approved_amount: v });
  });
  $('#rv-reject').addEventListener('click', () => act('reject'));
  $('#rv-paid')?.addEventListener('click', () => act('paid'));
  $('#rv-reopen')?.addEventListener('click', () => act('reopen'));

  $('#modal-bg').classList.add('open');
}

function closeModal() { $('#modal-bg').classList.remove('open'); }
$('#modal-close').addEventListener('click', closeModal);
$('#modal-bg').addEventListener('click', (e) => { if (e.target === $('#modal-bg')) closeModal(); });

// ── 支払いサマリー ──
async function loadSummary() {
  const q = $('#s-month').value ? `?month=${$('#s-month').value}` : '';
  const { summary } = await api('/api/admin/summary' + q);
  const tbody = $('#summary-table tbody');
  if (!summary.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">データがありません</td></tr>';
    return;
  }
  tbody.innerHTML = summary.map((r) => `
    <tr>
      <td>${r.month}</td>
      <td>${escapeHtml(r.ambassador_name)}</td>
      <td>${r.count}</td>
      <td><b>${yen(r.total)}</b></td>
      <td>${yen(r.paid_total)}</td>
      <td>${r.overseas_transfer ? '<span class="badge flag">海外送金</span>' : 'Amazonギフト'}</td>
      <td>${r.unpaid_count > 0 ? `<button class="ghost" data-amb="${r.ambassador_id}" data-month="${r.month}">一括支払い (${r.unpaid_count}件)</button>` : '<span class="muted">完了</span>'}</td>
    </tr>`).join('');
  tbody.querySelectorAll('button[data-amb]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm(`${btn.dataset.month} の承認済み案件をすべて支払い済みにしますか？`)) return;
      try {
        const r = await api('/api/admin/pay', { method: 'POST', body: { ambassador_id: Number(btn.dataset.amb), month: btn.dataset.month } });
        toast(`${r.updated}件を支払い済みにしました`);
        loadSummary();
      } catch (e) { toast(e.message, true); }
    });
  });
}
$('#s-month').addEventListener('change', loadSummary);

// ── アンバサダー管理 ──
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
      <td>${escapeHtml(a.channel || '')}</td>
      <td>${a.submission_count}</td>
      <td>${a.active ? '<span class="badge approved">有効</span>' : '<span class="badge rejected">無効</span>'}</td>
      <td><button class="ghost" data-copy="${a.token}">リンクをコピー</button></td>
      <td style="white-space:nowrap">
        <button class="ghost" data-reissue="${a.id}">再発行</button>
        <button class="ghost" data-toggle="${a.id}" data-active="${a.active}">${a.active ? '無効化' : '有効化'}</button>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const url = `${location.origin}/a/${btn.dataset.copy}`;
      await navigator.clipboard.writeText(url);
      toast('コピーしました：' + url);
    });
  });
  tbody.querySelectorAll('[data-reissue]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('トークンを再発行しますか？古いリンクは使えなくなります。')) return;
      const r = await api(`/api/admin/ambassadors/${btn.dataset.reissue}`, { method: 'PATCH', body: { reissue_token: true } });
      await navigator.clipboard.writeText(`${location.origin}/a/${r.token}`);
      toast('再発行し、新しいリンクをコピーしました');
      loadAmbassadors();
    });
  });
  tbody.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await api(`/api/admin/ambassadors/${btn.dataset.toggle}`, { method: 'PATCH', body: { active: btn.dataset.active !== '1' } });
      loadAmbassadors();
    });
  });
}

$('#amb-add').addEventListener('submit', async (e) => {
  e.preventDefault();
  try {
    const r = await api('/api/admin/ambassadors', { method: 'POST', body: { name: $('#amb-name').value, channel: $('#amb-channel').value } });
    await navigator.clipboard.writeText(`${location.origin}/a/${r.token}`);
    toast('登録しました。専用リンクをコピーしました');
    $('#amb-add').reset();
    loadAmbassadors();
  } catch (err) { toast(err.message, true); }
});

// ── 初期化 ──
async function init() {
  // 今月をデフォルトに
  const nowMonth = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 7);
  if (!$('#f-month').value) $('#f-month').value = '';
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
