// アンバサダーポータル
const token = (location.pathname.match(/\/a\/([^/]+)/) || [])[1];

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

const $ = (s) => document.querySelector(s);
const yen = (n) => n == null ? '—' : Number(n).toLocaleString('ja-JP') + '円';
const jstDate = (s) => {
  if (!s) return '';
  const d = new Date(s.replace(' ', 'T') + (s.endsWith('Z') ? '' : 'Z'));
  return d.toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo', year: 'numeric', month: 'short', day: 'numeric' });
};

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
    default:
      return '';
  }
}

function render() {
  $('#app').style.display = '';
  $('#error-view').style.display = 'none';
  $('#greeting').textContent = `こんにちは、${DATA.ambassador.name} さん`;

  // サマリー
  const nowMonth = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' }).slice(0, 7);
  const monthRow = (DATA.monthly_totals || []).find((m) => m.month === nowMonth);
  const total = (DATA.monthly_totals || []).reduce((a, m) => a + (m.total || 0), 0);
  $('#sum-month').textContent = yen(monthRow ? monthRow.total : 0);
  $('#sum-total').textContent = yen(total);
  const cap = DATA.content_count_this_month || 0;
  $('#sum-cap').innerHTML = `${cap}<small> / 5件</small>`;
  const gauge = $('#cap-gauge');
  gauge.className = 'gauge' + (cap >= 5 ? ' full' : '');
  gauge.firstElementChild.style.width = Math.min(100, (cap / 5) * 100) + '%';

  // 履歴
  const list = $('#history-list');
  if (!DATA.submissions.length) {
    list.innerHTML = '<p class="muted">まだ提出はありません。上のタブから報告・申請ができます。</p>';
  } else {
    list.innerHTML = DATA.submissions.map((s) => {
      const files = (DATA.files || []).filter((f) => f.submission_id === s.id);
      const amount = s.status === 'approved' || s.status === 'paid'
        ? `<span class="amount">${yen(s.approved_amount)}</span>`
        : s.suggested_amount != null
          ? `<span class="muted">目安 ${yen(s.suggested_amount)}</span>` : '';
      return `<div class="sub-item">
        <div class="row1">
          <span><span class="badge type">${TYPE_LABELS[s.type]}</span> <span class="title">${escapeHtml(summaryLine(s))}</span></span>
          <span><span class="badge ${s.status}">${STATUS_LABELS[s.status]}</span> ${amount}</span>
        </div>
        <div class="meta">提出日：${jstDate(s.created_at)}${s.paid_at ? '　支払日：' + jstDate(s.paid_at) : ''}</div>
        ${files.length ? `<div class="files">📎 ${files.map((f) => `<a href="/api/files/${f.id}?token=${encodeURIComponent(token)}" target="_blank">${escapeHtml(f.filename)}</a>`).join(' / ')}</div>` : ''}
        ${s.status === 'rejected' && s.admin_note ? `<div class="note">運営より：${escapeHtml(s.admin_note)}</div>` : ''}
      </div>`;
    }).join('');
  }

  // 事後報告フォームの事前申請プルダウン
  const sel = document.querySelector('#form-webinar_post select[name=linked_submission_id]');
  const pres = DATA.submissions.filter((s) => s.type === 'webinar_pre');
  sel.innerHTML = '<option value="">（事前申請なし／選択しない）</option>' +
    pres.map((s) => `<option value="${s.id}">${escapeHtml((s.payload.title || '') + ' / ' + (s.payload.event_date || '').replace('T', ' '))}</option>`).join('');
}

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// ── タブ ──
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-panel').forEach((p) => (p.style.display = 'none'));
    $(`#panel-${btn.dataset.tab}`).style.display = '';
  });
});

// ── 事後報告：形式によって紹介時間フィールド切替 ──
document.querySelectorAll('#form-webinar_post input[name=webinar_type]').forEach((r) => {
  r.addEventListener('change', () => {
    const isGeneral = r.value === 'general' && r.checked;
    const field = $('#exposure-field');
    field.style.display = isGeneral ? '' : 'none';
    field.querySelector('input').required = isGeneral;
  });
});

// ── 紹介：個人/コミュニティ切替 ──
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
    document.querySelector('.tab-btn[data-tab=history]').click();
    await load();
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

load();
