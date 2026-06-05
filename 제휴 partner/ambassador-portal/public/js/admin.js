// 運営管理画面（日本語）
const TYPE_LABELS = {
  content: 'コンテンツ',
  webinar: 'セミナー',
  referral: '紹介',
  adjustment: '手動追加',
};
const STATUS_LABELS = {
  submitted: '確認中',
  approved: '承認済み',
  rejected: '差し戻し',
};
const CATEGORY_LABELS = { ai_slide: 'AIスライド関連', other_feature: 'その他の機能', repost: '転載' };
const WTYPE_LABELS = { targeted: 'ターゲット向け', general: '不特定多数向け' };
const TRACK_LABELS = { ai: 'AI・資料作成系', design: 'デザイン系' };

// payload キーの日本語ラベル（詳細表示用）
const FIELD_LABELS = {
  category: 'カテゴリ', url: 'URL', channel: 'チャネル', published_date: '公開日', memo: '補足',
  title: 'タイトル', event_date: '開催日', webinar_type: '形式',
  participants: '実参加人数', ai_tools: '併用AIツール',
  exposure_minutes: 'MC紹介時間(分)', photo_consent: '写真の二次利用',
  referral_kind: '紹介種類', referral_date: '紹介日',
  name: '名前', channels: '活動チャネル', tracks: '得意分野',
  p_name: '名前', p_sns_url: 'SNS URL', p_main_channel: 'メインチャネル', p_track: '得意分野',
  c_name: 'コミュニティ名', c_size: '規模', c_field: '分野', c_owner: '運営者',
  reason: '紹介理由', relation: '関係',
};
const VALUE_LABELS = {
  ...CATEGORY_LABELS, ...WTYPE_LABELS,
  person: '個人', community: 'コミュニティ', yes: '同意あり', no: '許可しない',
  corp_seminar: '企業講演・コンサル', seminar: '勉強会・セミナー', sns: 'SNS・YouTube', blog: 'ブログ・note', community_mgmt: 'コミュニティ運営',
  ai: 'AI活用', docs: '資料作成・PPT', design: 'デザイン', efficiency: '業務効率化',
};
const dispValue = (v) => Array.isArray(v)
  ? v.map((x) => VALUE_LABELS[x] ?? x).join('・')
  : (VALUE_LABELS[v] ?? v);
const urlHost = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

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
    if (btn.dataset.tab === 'bills') loadBills();
    if (btn.dataset.tab === 'ambs') loadAmbassadors();
  });
});

// ══════════ 活動管理 ══════════
let SUBS = { submissions: [], files: [] };
let AMBS = [];
let SELECT_MODE = false;          // リワード案件作成の選択モード
const SELECTED = new Set();

async function loadSubs() {
  const q = new URLSearchParams();
  if ($('#f-month').value) q.set('month', $('#f-month').value);
  if ($('#f-type').value) q.set('type', $('#f-type').value);
  if ($('#f-status').value) q.set('status', $('#f-status').value);
  if ($('#f-amb').value) q.set('ambassador_id', $('#f-amb').value);
  SUBS = await api('/api/admin/submissions?' + q);
  SELECTED.clear();
  renderSubs();
}

function payloadSummary(s) {
  const p = s.payload || {};
  switch (s.type) {
    case 'content': {
      const host = p.channel || urlHost(p.url);
      return `${CATEGORY_LABELS[p.category] || ''}${host ? '・' + host : ''}`;
    }
    case 'webinar': return `${p.title || ''}${p.participants ? `・${p.participants}名` : ''}`;
    case 'referral': {
      const nm = p.name || p.p_name || p.c_name || '';
      return `${p.referral_kind === 'community' ? 'コミュニティ' : '個人'}：${nm}`;
    }
    case 'adjustment': return p.title || '運営精算';
    default: return '';
  }
}

function renderSubs() {
  const tbody = $('#subs-table tbody');
  const subs = SUBS.submissions;
  $('#sel-th').style.display = SELECT_MODE ? '' : 'none';

  if (!subs.length) {
    tbody.innerHTML = `<tr><td colspan="${SELECT_MODE ? 9 : 8}" class="muted">該当する活動はありません</td></tr>`;
    $('#subs-subtotal').innerHTML = '';
    updateBillBar();
    return;
  }
  tbody.innerHTML = subs.map((s) => {
    // 選択モード時のみチェックボックス表示。承認済み＆未編成のみ有効、編成済みは無効表示
    const selectable = s.status === 'approved' && s.bill_id == null;
    const selCell = SELECT_MODE
      ? `<td onclick="event.stopPropagation()"><input type="checkbox" class="sel" data-id="${s.id}" ${selectable ? '' : 'disabled'} ${SELECTED.has(s.id) ? 'checked' : ''}></td>`
      : '';
    return `
    <tr class="clickable" data-id="${s.id}">
      ${selCell}
      <td>${fmtDate(actDate(s))}</td>
      <td>${escapeHtml(s.ambassador_name)}</td>
      <td><span class="badge type">${TYPE_LABELS[s.type]}</span></td>
      <td>${escapeHtml(payloadSummary(s))}</td>
      <td>${yen(s.suggested_amount)}</td>
      <td>${yen(s.approved_amount)}</td>
      <td><span class="badge ${s.status}">${STATUS_LABELS[s.status]}</span></td>
      <td>${s.bill_title ? escapeHtml(s.bill_title) : '<span class="muted">—</span>'}</td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('tr.clickable').forEach((tr) => {
    tr.addEventListener('click', () => openDetail(Number(tr.dataset.id)));
  });
  tbody.querySelectorAll('input.sel').forEach((cb) => {
    cb.addEventListener('change', () => {
      const id = Number(cb.dataset.id);
      cb.checked ? SELECTED.add(id) : SELECTED.delete(id);
      updateBillBar();
    });
  });
  updateBillBar();

  // 下部小計（種別ごと＋合計、フィルター連動）
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
  const m = $('#f-month').value;
  const totalRow = `<div class="sub-row total"><span>合計${m ? `（${fmtMonth(m)}）` : ''}</span><span>${liveCount(subs)}件</span><span>${yen(confirmed(subs))}</span></div>`;
  $('#subs-subtotal').innerHTML = rows + totalRow +
    '<div class="caption">金額は承認済みの確定分のみ。件数は差し戻しを除く。表示中のフィルター条件で集計。</div>';
}

// ── 選択モード（リワード案件作成） ──
function setSelectMode(on) {
  SELECT_MODE = on;
  if (!on) SELECTED.clear();
  renderSubs();
}

$('#btn-select-mode').addEventListener('click', () => {
  if (!SELECT_MODE) setSelectMode(true);
});
$('#btn-cancel-select').addEventListener('click', () => setSelectMode(false));

function updateBillBar() {
  const bar = $('#bill-bar');
  if (!SELECT_MODE) { bar.style.display = 'none'; return; }
  bar.style.display = '';
  if (!SELECTED.size) {
    $('#bill-bar-info').innerHTML = '対象の活動（承認済み・未編成）にチェックを入れてください';
    $('#btn-make-bill').disabled = true;
    return;
  }
  const sel = SUBS.submissions.filter((s) => SELECTED.has(s.id));
  const ambNames = [...new Set(sel.map((s) => s.ambassador_name))];
  const total = sel.reduce((a, s) => a + (s.approved_amount || 0), 0);
  if (ambNames.length > 1) {
    $('#bill-bar-info').innerHTML = `<span style="color:var(--red)">⚠ 異なるアンバサダーが選択されています（${ambNames.map(escapeHtml).join('、')}）</span>`;
    $('#btn-make-bill').disabled = true;
  } else {
    $('#bill-bar-info').innerHTML = `<b>${escapeHtml(ambNames[0])}</b> ・ ${sel.length}件 ・ <b>${yen(total)}</b>`;
    $('#btn-make-bill').disabled = false;
  }
}

['f-month', 'f-type', 'f-status', 'f-amb'].forEach((id) => {
  $('#' + id).addEventListener('change', loadSubs);
});

// ── リワード案件 作成・修正モーダル（共通） ──
let BILL_MODE = { kind: 'create', id: null };

function billFormValues() {
  const method = $('#bill-method').value || null;
  return {
    title: $('#bill-title').value.trim(),
    memo: $('#bill-memo').value,
    pay_month: $('#bill-paymonth').value || null,
    method,
    gift_codes: method === 'amazon'
      ? $('#bill-codes').value.split('\n').map((s) => s.trim()).filter(Boolean) : [],
    transfer_date: method === 'transfer' ? ($('#bill-date').value || null) : null,
  };
}

function toggleBillFields() {
  const method = $('#bill-method').value;
  $('#bill-codes-field').style.display = method === 'amazon' ? '' : 'none';
  $('#bill-date-field').style.display = method === 'transfer' ? '' : 'none';
}
$('#bill-method').addEventListener('change', toggleBillFields);

function openBillModal(mode, bill = null) {
  BILL_MODE = mode;
  if (mode.kind === 'create') {
    const sel = SUBS.submissions.filter((s) => SELECTED.has(s.id));
    const ambNames = [...new Set(sel.map((s) => s.ambassador_name))];
    if (ambNames.length !== 1) return;
    const total = sel.reduce((a, s) => a + (s.approved_amount || 0), 0);
    $('#bill-modal-title').textContent = 'リワード案件の作成';
    $('#bill-info').innerHTML = `対象：<b>${escapeHtml(ambNames[0])}</b><br>${sel.length}件 ・ 合計 <b>${yen(total)}</b>`;
    $('#bill-title').value = '';
    $('#bill-paymonth').value = '';
    $('#bill-method').value = '';
    $('#bill-codes').value = '';
    $('#bill-date').value = '';
    $('#bill-memo').value = '';
    $('#bill-submit').textContent = '作成する';
  } else {
    $('#bill-modal-title').textContent = 'リワード案件の修正';
    $('#bill-info').innerHTML = `対象：<b>${escapeHtml(bill.ambassador_name)}</b><br>${bill.count}件 ・ 合計 <b>${yen(bill.total)}</b>`;
    $('#bill-title').value = bill.title;
    $('#bill-paymonth').value = bill.pay_month || '';
    $('#bill-method').value = bill.method || '';
    $('#bill-codes').value = bill.method === 'amazon' ? bill.gift_codes.join('\n') : '';
    $('#bill-date').value = bill.transfer_date || '';
    $('#bill-memo').value = bill.memo || '';
    $('#bill-submit').textContent = '修正を保存する';
  }
  toggleBillFields();
  $('#bill-modal-bg').classList.add('open');
}

$('#btn-make-bill').addEventListener('click', () => openBillModal({ kind: 'create', id: null }));

$('#bill-submit').addEventListener('click', async () => {
  const v = billFormValues();
  if (!v.title) return toast('タイトルを入力してください', true);
  try {
    if (BILL_MODE.kind === 'create') {
      await api('/api/admin/bills', { method: 'POST', body: { ...v, submission_ids: [...SELECTED] } });
      toast('リワード案件を作成しました');
      $('#bill-modal-bg').classList.remove('open');
      setSelectMode(false);
      await loadSubs();
    } else {
      await api(`/api/admin/bills/${BILL_MODE.id}`, { method: 'PATCH', body: { ...v, action: 'edit' } });
      toast('修正しました');
      $('#bill-modal-bg').classList.remove('open');
      await loadBills();
    }
  } catch (e) { toast(e.message, true); }
});

// ── 提出詳細モーダル ──
function openDetail(id) {
  const s = SUBS.submissions.find((x) => x.id === id);
  if (!s) return;
  const files = SUBS.files.filter((f) => f.submission_id === id);

  $('#modal-title').innerHTML = `${TYPE_LABELS[s.type]} <span class="badge ${s.status}">${STATUS_LABELS[s.status]}</span>`;

  const rows = Object.entries(s.payload || {})
    .filter(([, v]) => v !== '' && v != null && !(Array.isArray(v) && !v.length))
    .map(([k, v]) => `<dt>${escapeHtml(FIELD_LABELS[k] || k)}</dt><dd>${
      /^https?:\/\//.test(String(v)) ? `<a href="${escapeHtml(v)}" target="_blank">${escapeHtml(v)}</a>` : escapeHtml(dispValue(v))
    }</dd>`).join('');

  const imgs = files.filter((f) => /\.(png|jpe?g|gif|webp|heic)$/i.test(f.filename));
  const others = files.filter((f) => !imgs.includes(f));

  $('#modal-body').innerHTML = `
    <dl class="kv">
      <dt>アンバサダー</dt><dd>${escapeHtml(s.ambassador_name)}</dd>
      <dt>提出日</dt><dd>${fmtDate(actDate({ activity_date: null, created_at: s.created_at }))}</dd>
      ${s.bill_title ? `<dt>リワード案件</dt><dd>${escapeHtml(s.bill_title)}</dd>` : ''}
      ${rows}
      ${s.admin_note ? `<dt>運営メモ</dt><dd>${escapeHtml(s.admin_note)}</dd>` : ''}
    </dl>
    ${imgs.length ? `<div class="file-thumbs">${imgs.map((f) => `<a href="/api/files/${f.id}" target="_blank"><img src="/api/files/${f.id}" alt="${escapeHtml(f.filename)}"></a>`).join('')}</div>` : ''}
    ${others.length ? `<p>📎 ${others.map((f) => `<a href="/api/files/${f.id}" target="_blank">${escapeHtml(f.filename)}</a>`).join(' / ')}</p>` : ''}
  `;

  if (s.bill_id != null) {
    $('#modal-review').innerHTML = '<p class="muted">リワード案件に含まれている活動です。変更するには、リワード管理で該当案件を削除してください。</p>';
    setModalActions();
  } else {
    const amount = s.approved_amount ?? s.suggested_amount ?? '';
    $('#modal-review').innerHTML = `
      <h3>審査</h3>
      <label class="field">確定金額（円）<input type="number" id="rv-amount" min="0" value="${amount}"></label>
      <p class="muted">自動提案：${yen(s.suggested_amount)}${s.type === 'referral' ? '（紹介は報酬案確定前のため手動入力）' : ''}</p>
      <label class="field">運営メモ（差し戻し理由など — アンバサダーに表示されます）<textarea id="rv-note">${escapeHtml(s.admin_note || '')}</textarea></label>
    `;
    setModalActions(`
      ${s.status !== 'submitted' ? '<button class="ghost" id="rv-reopen">確認中に戻す</button>' : ''}
      <button class="danger" id="rv-reject">差し戻す</button>
      <button class="primary" id="rv-approve">承認する</button>
    `);

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
    $('#rv-reopen')?.addEventListener('click', () => act('reopen'));
  }

  $('#modal-bg').classList.add('open');
}

function closeModal() { $('#modal-bg').classList.remove('open'); }
// アクション行（均等幅）— 閉じるは静的な下段ボタンと右上の×が担当
function setModalActions(extraHtml = '') {
  $('#modal-actions').innerHTML = extraHtml;
}
// 閉じる・× 共通ハンドラ
document.querySelectorAll('[data-close]').forEach((btn) => {
  btn.addEventListener('click', () => document.getElementById(btn.dataset.close).classList.remove('open'));
});
// ※ 誤操作防止のため、背景クリックでは閉じない（閉じる・×のみ）

// ══════════ 手動追加（運営精算） ══════════
$('#btn-adj').addEventListener('click', () => {
  $('#adj-amb').innerHTML = AMBS.filter((a) => a.active)
    .map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');
  $('#adj-modal-bg').classList.add('open');
});

$('#adj-submit').addEventListener('click', async () => {
  try {
    const amount = Number($('#adj-amount').value);
    if (!$('#adj-title').value.trim()) return toast('内容を入力してください', true);
    if (!Number.isFinite(amount) || $('#adj-amount').value === '') return toast('金額を入力してください', true);
    await api('/api/admin/submissions', { method: 'POST', body: {
      ambassador_id: Number($('#adj-amb').value),
      title: $('#adj-title').value.trim(),
      amount,
      memo: $('#adj-memo').value || '',
    } });
    toast('登録しました（自動承認）');
    $('#adj-modal-bg').classList.remove('open');
    $('#adj-title').value = ''; $('#adj-amount').value = ''; $('#adj-memo').value = '';
    await loadSubs();
  } catch (e) { toast(e.message, true); }
});

// ══════════ リワード管理 ══════════
let BILLS = { bills: [], members: [] };

async function loadBills() {
  BILLS = await api('/api/admin/bills');
  renderBills();
}

const memberLine = payloadSummary;

function renderBills() {
  const tbody = $('#bills-table tbody');
  const { bills } = BILLS;
  if (!bills.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">リワード案件がありません。活動管理から承認済みの活動を選択して作成してください。</td></tr>';
    return;
  }
  tbody.innerHTML = bills.map((b) => {
    const isSent = !!b.sent_at;
    return `
    <tr class="clickable bill-row" data-id="${b.id}">
      <td>${fmtDate(b.created_at)}</td>
      <td>${escapeHtml(b.ambassador_name)}</td>
      <td><b>${escapeHtml(b.title)}</b>${b.memo ? `<br><span class="muted">${escapeHtml(b.memo)}</span>` : ''}</td>
      <td>${b.count}件</td>
      <td><b>${yen(b.total)}</b></td>
      <td>${b.pay_month ? fmtMonth(b.pay_month) : '<span class="muted">—</span>'}</td>
      <td>${isSent ? fmtDate(b.sent_at) : `<button class="primary btn-sm btn-bill-send" data-id="${b.id}" style="width:auto;margin:0">発送</button>`}</td>
    </tr>`;
  }).join('');

  // 行クリック → 詳細ポップアップ（対象活動リスト＋修正・削除）
  tbody.querySelectorAll('.bill-row').forEach((tr) => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const b = BILLS.bills.find((x) => x.id === Number(tr.dataset.id));
      if (b) openBillDetail(b);
    });
  });
  tbody.querySelectorAll('.btn-bill-send').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('発送しますか？発送後はアンバサダーに表示され、修正・削除ができなくなります。')) return;
      try {
        await api(`/api/admin/bills/${btn.dataset.id}`, { method: 'PATCH', body: { action: 'send' } });
        toast('発送しました');
        loadBills();
      } catch (e) { toast(e.message, true); }
    });
  });
}

// ── リワード案件 詳細ポップアップ（対象活動リスト＋修正・削除） ──
const METHOD_LABELS = { amazon: 'Amazonギフト', transfer: '海外送金' };

function openBillDetail(b) {
  const isSent = !!b.sent_at;
  const items = BILLS.members.filter((s) => s.bill_id === b.id);
  const childRows = items.map((s) => `
    <tr>
      <td style="width:72px">${fmtDate(actDate(s))}</td>
      <td style="width:110px"><span class="badge type">${TYPE_LABELS[s.type]}</span></td>
      <td>${escapeHtml(memberLine(s))}</td>
      <td style="text-align:right;font-weight:600;width:90px">${yen(s.approved_amount)}</td>
    </tr>`).join('');

  $('#modal-title').textContent = `リワード案件：${b.title}`;
  $('#modal-body').innerHTML = `
    <dl class="kv">
      <dt>アンバサダー</dt><dd>${escapeHtml(b.ambassador_name)}</dd>
      <dt>合計</dt><dd><b>${yen(b.total)}</b>（${b.count}件）</dd>
      <dt>支払い月</dt><dd>${b.pay_month ? fmtMonth(b.pay_month) : '—'}</dd>
      <dt>支払い方法</dt><dd>${b.method ? METHOD_LABELS[b.method] : '未定'}</dd>
      ${b.method === 'transfer' ? `<dt>送金日</dt><dd>${b.transfer_date ? b.transfer_date.replaceAll('-', '/') : '—'}</dd>` : ''}
      ${b.memo ? `<dt>メモ</dt><dd>${escapeHtml(b.memo)}</dd>` : ''}
      <dt>作成日</dt><dd>${fmtDate(b.created_at)}</dd>
      <dt>発送日</dt><dd>${isSent ? fmtDate(b.sent_at) : '未発送'}</dd>
    </dl>
    ${b.method === 'amazon' && b.gift_codes.length ? `
    <div class="codes-block">
      <b>Amazonギフトカード番号（${b.gift_codes.length}枚）</b>
      <ul>${b.gift_codes.map((c) => `<li><code>${escapeHtml(c)}</code></li>`).join('')}</ul>
    </div>` : ''}
    <h3>対象活動（${items.length}件）</h3>
    <table class="nested-table">
      <thead><tr><th>日付</th><th>種別</th><th>内容</th><th style="text-align:right">金額</th></tr></thead>
      <tbody>${childRows || '<tr><td colspan="4" class="muted">対象活動がありません</td></tr>'}</tbody>
    </table>
  `;
  $('#modal-review').innerHTML = '';
  setModalActions(isSent ? '' : `
    <button class="danger" id="btn-bill-delete">削除する</button>
    <button class="primary" id="btn-bill-modify">修正する</button>
  `);
  if (!isSent) {
    $('#btn-bill-modify').addEventListener('click', () => {
      closeModal();
      openBillModal({ kind: 'edit', id: b.id }, b);
    });
    $('#btn-bill-delete').addEventListener('click', async () => {
      if (!confirm('このリワード案件を削除しますか？対象活動は未編成に戻ります。')) return;
      try {
        await api(`/api/admin/bills/${b.id}`, { method: 'DELETE' });
        toast('削除しました');
        closeModal();
        loadBills();
      } catch (e) { toast(e.message, true); }
    });
  }
  $('#modal-bg').classList.add('open');
}

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
      <td>${a.active ? '<span class="badge approved">有効</span>' : '<span class="badge rejected">無効</span>'}</td>
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(a.description || '')}</td>
      <td style="white-space:nowrap"><button class="ghost btn-sm btn-edit-desc" data-id="${a.id}">編集</button></td>
      <td style="white-space:nowrap">
        <button class="ghost btn-sm" data-copy="${a.token}">コピー</button>
        <button class="ghost btn-sm" data-reissue="${a.id}">再発行</button>
        <button class="${a.active ? 'danger' : 'ghost'} btn-sm" data-toggle="${a.id}" data-active="${a.active}">${a.active ? '無効化' : '有効化'}</button>
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
    btn.addEventListener('click', () => {
      const a = AMBS.find((x) => x.id === Number(btn.dataset.id));
      if (a) openAmbEditModal(a);
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

// ── アンバサダー編集モーダル ──
let AMB_EDIT_ID = null;

function openAmbEditModal(a) {
  AMB_EDIT_ID = a.id;
  $('#amb-edit-name').value = a.name;
  $('#amb-edit-desc').value = a.description || '';
  $('#amb-modal-bg').classList.add('open');
}

$('#amb-edit-submit').addEventListener('click', async () => {
  if (!AMB_EDIT_ID) return;
  const name = $('#amb-edit-name').value.trim();
  if (!name) return toast('名前を入力してください', true);
  try {
    await api(`/api/admin/ambassadors/${AMB_EDIT_ID}`, { method: 'PATCH', body: { name, description: $('#amb-edit-desc').value } });
    toast('更新しました');
    $('#amb-modal-bg').classList.remove('open');
    loadAmbassadors();
  } catch (e) { toast(e.message, true); }
});

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
