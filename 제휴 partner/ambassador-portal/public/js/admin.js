// 운영 관리 화면 (한국어)
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
const CATEGORY_LABELS = { ai_slide: 'AI슬라이드 관련', other_feature: '기타 기능', repost: '전재(복붙)' };
const WTYPE_LABELS = { targeted: '타겟형', general: '불특정 다수형' };
const TRACK_LABELS = { ai: 'AI·자료작성계', design: '디자인계' };

// payload 키의 한국어 라벨 (상세 표시용)
const FIELD_LABELS = {
  category: '카테고리', url: 'URL', channel: '채널', published_date: '공개일', memo: '비고',
  title: '제목', event_date: '개최일', webinar_type: '형식',
  participants: '실참가 인원',
  mc_duration: '미캔 강의시간', mc_content: '미캔 강의내용', ai_tools: '병용 AI툴',
  exposure_minutes: '미캔 소개시간(분)', photo_consent: '사진 2차활용 동의',
  referral_kind: '소개 종류', referral_date: '소개일',
  p_name: '이름', p_sns_url: 'SNS URL', p_main_channel: '메인 채널', p_track: '분야',
  c_name: '커뮤니티명', c_size: '규모', c_field: '분야', c_owner: '운영자',
  reason: '소개 이유', relation: '관계',
};
const VALUE_LABELS = { ...CATEGORY_LABELS, ...WTYPE_LABELS, ...TRACK_LABELS, person: '개인', community: '커뮤니티', yes: '동의함' };

const $ = (s) => document.querySelector(s);
const yen = (n) => n == null ? '—' : Number(n).toLocaleString('ja-JP') + '円';
const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmtDate = (s) => {
  if (!s) return '—';
  const [y, m, d] = s.slice(0, 10).split('-');
  return `${y}/${Number(m)}/${Number(d)}`;
};
const fmtMonth = (m) => m ? `${m.slice(0, 4)}년 ${Number(m.slice(5, 7))}월` : '';

// 실시일 (없으면 제출일을 JST로)
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

// ── 로그인 ──
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
    toast(err.message === 'unauthorized' ? '비밀번호가 다릅니다' : err.message, true);
  }
});

$('#logout-btn').addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST', body: {} });
  showLogin();
});

// ── 탭 ──
document.querySelectorAll('.tab-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b === btn));
    document.querySelectorAll('.tab-panel').forEach((p) => (p.style.display = 'none'));
    $(`#panel-${btn.dataset.tab}`).style.display = '';
    if (btn.dataset.tab === 'bills') loadBills();
    if (btn.dataset.tab === 'ambs') loadAmbassadors();
  });
});

// ══════════ 제출 관리 ══════════
let SUBS = { submissions: [], files: [] };
let AMBS = [];
const SELECTED = new Set(); // 지불건 생성용 선택 (제출 id)

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
    case 'content': return `${CATEGORY_LABELS[p.category] || ''}・${p.channel || ''}`;
    case 'webinar': return `${p.title || ''}・${p.participants ?? '?'}명`;
    case 'referral': return p.referral_kind === 'community' ? `커뮤니티: ${p.c_name || ''}` : `개인: ${p.p_name || ''}`;
    case 'adjustment': return p.title || '운영 정산';
    default: return '';
  }
}

function renderSubs() {
  const tbody = $('#subs-table tbody');
  const subs = SUBS.submissions;
  if (!subs.length) {
    tbody.innerHTML = '<tr><td colspan="9" class="muted">해당하는 제출이 없습니다</td></tr>';
    $('#subs-subtotal').innerHTML = '';
    updateBillBar();
    return;
  }
  tbody.innerHTML = subs.map((s) => {
    // 체크박스: 승인완료 + 미편성만 선택 가능
    const selectable = s.status === 'approved' && s.bill_id == null;
    return `
    <tr class="clickable" data-id="${s.id}">
      <td onclick="event.stopPropagation()">${selectable ? `<input type="checkbox" class="sel" data-id="${s.id}" ${SELECTED.has(s.id) ? 'checked' : ''}>` : ''}</td>
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

  // 하단 소계 (유형별 + 합계, 필터 연동)
  const groups = [
    ['콘텐츠 보고', subs.filter((s) => s.type === 'content')],
    ['웨비나·세미나', subs.filter((s) => s.type === 'webinar')],
    ['소개·운영정산', subs.filter((s) => s.type === 'referral' || s.type === 'adjustment')],
  ];
  const confirmed = (arr) => arr.reduce((a, s) => a + (s.status === 'approved' ? (s.approved_amount || 0) : 0), 0);
  const liveCount = (arr) => arr.filter((s) => s.status !== 'rejected').length;
  const rows = groups
    .filter(([, arr]) => arr.length)
    .map(([label, arr]) => `<div class="sub-row"><span>${label}</span><span>${liveCount(arr)}건</span><span>${yen(confirmed(arr))}</span></div>`)
    .join('');
  const m = $('#f-month').value;
  const totalRow = `<div class="sub-row total"><span>합계${m ? ` (${fmtMonth(m)})` : ''}</span><span>${liveCount(subs)}건</span><span>${yen(confirmed(subs))}</span></div>`;
  $('#subs-subtotal').innerHTML = rows + totalRow +
    '<div class="caption">금액은 승인완료의 확정분만. 건수는 반려 제외. 표시 중인 필터 조건으로 집계.</div>';
}

// 선택 바 (지불건 생성)
function updateBillBar() {
  const bar = $('#bill-bar');
  if (!SELECTED.size) { bar.style.display = 'none'; return; }
  const sel = SUBS.submissions.filter((s) => SELECTED.has(s.id));
  const ambNames = [...new Set(sel.map((s) => s.ambassador_name))];
  const total = sel.reduce((a, s) => a + (s.approved_amount || 0), 0);
  bar.style.display = '';
  $('#bill-bar-info').innerHTML = ambNames.length > 1
    ? `<span style="color:var(--red)">⚠ 서로 다른 앰버서더가 선택되어 있습니다 (${ambNames.map(escapeHtml).join(', ')})</span>`
    : `<b>${escapeHtml(ambNames[0])}</b> · ${sel.length}건 · <b>${yen(total)}</b>`;
}

['f-month', 'f-type', 'f-status', 'f-amb'].forEach((id) => {
  $('#' + id).addEventListener('change', loadSubs);
});
$('#f-csv').addEventListener('click', () => {
  const month = $('#f-month').value;
  location.href = '/api/admin/export' + (month ? `?month=${month}` : '');
});

// ── 지불건 생성 모달 ──
$('#btn-make-bill').addEventListener('click', () => {
  const sel = SUBS.submissions.filter((s) => SELECTED.has(s.id));
  const ambNames = [...new Set(sel.map((s) => s.ambassador_name))];
  if (ambNames.length > 1) return toast('서로 다른 앰버서더의 제출건은 한 지불건으로 묶을 수 없습니다', true);
  const total = sel.reduce((a, s) => a + (s.approved_amount || 0), 0);
  $('#bill-info').innerHTML = `대상자: <b>${escapeHtml(ambNames[0])}</b><br>${sel.length}건 · 합계 <b>${yen(total)}</b>`;
  $('#bill-title').value = '';
  $('#bill-memo').value = '';
  $('#bill-modal-bg').classList.add('open');
});
$('#bill-close').addEventListener('click', () => $('#bill-modal-bg').classList.remove('open'));
$('#bill-modal-bg').addEventListener('click', (e) => { if (e.target === $('#bill-modal-bg')) $('#bill-modal-bg').classList.remove('open'); });

$('#bill-submit').addEventListener('click', async () => {
  if (!$('#bill-title').value.trim()) return toast('제목을 입력하세요', true);
  try {
    await api('/api/admin/bills', { method: 'POST', body: {
      submission_ids: [...SELECTED],
      title: $('#bill-title').value.trim(),
      memo: $('#bill-memo').value,
    } });
    toast('지불건을 생성했습니다');
    $('#bill-modal-bg').classList.remove('open');
    await loadSubs();
  } catch (e) { toast(e.message, true); }
});

// ── 제출 상세 모달 ──
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
      <dt>앰버서더</dt><dd>${escapeHtml(s.ambassador_name)}</dd>
      <dt>실시일</dt><dd>${fmtDate(s.activity_date)}</dd>
      <dt>제출일</dt><dd>${fmtDate(actDate({ activity_date: null, created_at: s.created_at }))}</dd>
      ${s.bill_title ? `<dt>지불건</dt><dd>${escapeHtml(s.bill_title)}</dd>` : ''}
      ${rows}
      ${s.admin_note ? `<dt>운영 메모</dt><dd>${escapeHtml(s.admin_note)}</dd>` : ''}
    </dl>
    ${imgs.length ? `<div class="file-thumbs">${imgs.map((f) => `<a href="/api/files/${f.id}" target="_blank"><img src="/api/files/${f.id}" alt="${escapeHtml(f.filename)}"></a>`).join('')}</div>` : ''}
    ${others.length ? `<p>📎 ${others.map((f) => `<a href="/api/files/${f.id}" target="_blank">${escapeHtml(f.filename)}</a>`).join(' / ')}</p>` : ''}
  `;

  if (s.bill_id != null) {
    $('#modal-review').innerHTML = '<p class="muted">지불건에 포함된 제출건입니다. 변경하려면 지불 관리에서 해당 지불건을 삭제하세요.</p>';
  } else {
    const amount = s.approved_amount ?? s.suggested_amount ?? '';
    $('#modal-review').innerHTML = `
      <h3>검토</h3>
      <label class="field">확정 금액 (엔)<input type="number" id="rv-amount" min="0" value="${amount}"></label>
      <p class="muted">자동 제안: ${yen(s.suggested_amount)}${s.type === 'referral' ? ' (소개는 보상안 확정 전이므로 수동 입력)' : ''}</p>
      <label class="field">실시일 (정산 기준일 조정이 필요한 경우 변경)
        <input type="date" id="rv-date" value="${s.activity_date || ''}"></label>
      <label class="field">운영 메모 (반려 사유 등 — 앰버서더에게 표시됨)<textarea id="rv-note">${escapeHtml(s.admin_note || '')}</textarea></label>
      <div style="display:flex;gap:8px;margin-top:14px;flex-wrap:wrap">
        <button class="primary" style="width:auto;margin:0;padding:10px 18px" id="rv-approve">승인</button>
        <button class="danger" id="rv-reject">반려</button>
        ${s.status !== 'submitted' ? '<button class="ghost" id="rv-reopen">확인중으로 되돌리기</button>' : ''}
      </div>
    `;

    const act = async (action, extra = {}) => {
      try {
        await api(`/api/admin/submissions/${id}`, { method: 'PATCH', body: { action, admin_note: $('#rv-note').value || null, ...extra } });
        toast('업데이트했습니다');
        closeModal();
        await loadSubs();
      } catch (e) {
        toast(e.message, true);
      }
    };
    $('#rv-approve').addEventListener('click', () => {
      const v = Number($('#rv-amount').value);
      if (!Number.isFinite(v) || $('#rv-amount').value === '') return toast('확정 금액을 입력하세요', true);
      act('approve', { approved_amount: v, activity_date: $('#rv-date').value || null });
    });
    $('#rv-reject').addEventListener('click', () => act('reject'));
    $('#rv-reopen')?.addEventListener('click', () => act('reopen'));
  }

  $('#modal-bg').classList.add('open');
}

function closeModal() { $('#modal-bg').classList.remove('open'); }
$('#modal-close').addEventListener('click', closeModal);
$('#modal-bg').addEventListener('click', (e) => { if (e.target === $('#modal-bg')) closeModal(); });

// ══════════ 운영정산 추가 ══════════
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
    if (!$('#adj-title').value.trim()) return toast('내용을 입력하세요', true);
    if (!Number.isFinite(amount) || $('#adj-amount').value === '') return toast('금액을 입력하세요', true);
    if (!$('#adj-date').value) return toast('실시일을 입력하세요', true);
    await api('/api/admin/submissions', { method: 'POST', body: {
      ambassador_id: Number($('#adj-amb').value),
      title: $('#adj-title').value.trim(),
      amount,
      activity_date: $('#adj-date').value,
      memo: $('#adj-memo').value || '',
    } });
    toast('운영정산을 등록했습니다 (자동 승인)');
    $('#adj-modal-bg').classList.remove('open');
    $('#adj-title').value = ''; $('#adj-amount').value = ''; $('#adj-memo').value = '';
    await loadSubs();
  } catch (e) { toast(e.message, true); }
});

// ══════════ 지불 관리 ══════════
let BILLS = { bills: [], members: [] };

async function loadBills() {
  BILLS = await api('/api/admin/bills');
  renderBills();
}

function memberLine(s) {
  const p = s.payload || {};
  switch (s.type) {
    case 'content': return `${CATEGORY_LABELS[p.category] || ''}・${p.channel || ''}`;
    case 'webinar': return `${p.title || ''}`;
    case 'referral': return p.referral_kind === 'community' ? `커뮤니티: ${p.c_name || ''}` : `개인: ${p.p_name || ''}`;
    case 'adjustment': return p.title || '운영 정산';
    default: return '';
  }
}

function renderBills() {
  const tbody = $('#bills-table tbody');
  const { bills, members } = BILLS;
  if (!bills.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="muted">지불건이 없습니다. 제출 관리에서 승인완료 항목을 선택해 생성하세요.</td></tr>';
    return;
  }
  tbody.innerHTML = bills.map((b) => {
    const isPaid = !!b.method;
    const items = members.filter((s) => s.bill_id === b.id);
    const detailRows = items.map((s) => `
      <div class="settle-detail-row">
        <span>${fmtDate(actDate(s))}</span>
        <span><span class="badge type">${TYPE_LABELS[s.type]}</span></span>
        <span class="h-title">${escapeHtml(memberLine(s))}</span>
        <span style="text-align:right;font-weight:600">${yen(s.approved_amount)}</span>
      </div>`).join('');
    const payDetail = isPaid
      ? (b.method === 'amazon'
          ? `🎁 아마존 기프트 ${b.gift_codes.length}장`
          : `🏦 해외송금 ${b.transfer_date ? b.transfer_date.replaceAll('-', '/') : ''}`)
      : '';
    return `
    <tr class="clickable bill-row" data-id="${b.id}">
      <td>${fmtDate(b.created_at)}</td>
      <td>${escapeHtml(b.ambassador_name)}</td>
      <td><b>${escapeHtml(b.title)}</b>${b.memo ? `<br><span class="muted">${escapeHtml(b.memo)}</span>` : ''}</td>
      <td>${b.count}건</td>
      <td><b>${yen(b.total)}</b></td>
      <td><span class="badge ${isPaid ? 'approved' : 'submitted'}">${isPaid ? '지불완료' : '지불전'}</span></td>
      <td style="white-space:nowrap">
        <button class="ghost btn-sm btn-pay" data-id="${b.id}">${isPaid ? '지불내용 수정' : '지불내용 입력'}</button>
        ${payDetail ? `<br><span class="muted" style="font-size:12px">${payDetail}</span>` : ''}
      </td>
    </tr>
    <tr class="settle-detail" id="bill-detail-${b.id}" style="display:none">
      <td colspan="7">
        ${detailRows || '<span class="muted">소속 제출건이 없습니다</span>'}
        <div style="margin-top:10px;text-align:right">
          <button class="ghost btn-sm btn-bill-edit" data-id="${b.id}">제목·메모 수정</button>
          <button class="danger btn-sm btn-bill-del" data-id="${b.id}">지불건 삭제</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  // 행 클릭 → 소속 제출건 펼침
  tbody.querySelectorAll('.bill-row').forEach((tr) => {
    tr.addEventListener('click', (e) => {
      if (e.target.closest('button')) return;
      const detail = document.getElementById('bill-detail-' + tr.dataset.id);
      detail.style.display = detail.style.display === 'none' ? '' : 'none';
    });
  });
  tbody.querySelectorAll('.btn-pay').forEach((btn) => {
    btn.addEventListener('click', () => openPayModal(Number(btn.dataset.id)));
  });
  tbody.querySelectorAll('.btn-bill-edit').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const b = BILLS.bills.find((x) => x.id === Number(btn.dataset.id));
      const title = prompt('제목', b.title);
      if (title === null) return;
      const memo = prompt('메모', b.memo || '');
      if (memo === null) return;
      await api(`/api/admin/bills/${b.id}`, { method: 'PATCH', body: { action: 'edit', title, memo } });
      toast('수정했습니다');
      loadBills();
    });
  });
  tbody.querySelectorAll('.btn-bill-del').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('이 지불건을 삭제할까요? 소속 제출건은 미편성 상태로 돌아갑니다.')) return;
      await api(`/api/admin/bills/${btn.dataset.id}`, { method: 'DELETE' });
      toast('삭제했습니다');
      loadBills();
    });
  });
}

// ── 지불내용 모달 (입력/수정 공통, 기존 내용 프리필) ──
let PAY_BILL_ID = null;

function openPayModal(billId) {
  PAY_BILL_ID = billId;
  const b = BILLS.bills.find((x) => x.id === billId);
  if (!b) return;
  $('#pay-info').innerHTML = `<b>${escapeHtml(b.ambassador_name)}</b> · ${escapeHtml(b.title)}<br>${b.count}건 · <b>${yen(b.total)}</b>`;
  const method = b.method || 'amazon';
  document.querySelector(`input[name=pay_method][value=${method}]`).checked = true;
  $('#pay-codes').value = b.method === 'amazon' ? b.gift_codes.join('\n') : '';
  $('#pay-date').value = b.transfer_date || new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tokyo' });
  $('#pay-submit').textContent = b.method ? '지불내용 수정' : '지불내용 저장 (지불완료 처리)';
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
  if (!PAY_BILL_ID) return;
  const method = document.querySelector('input[name=pay_method]:checked').value;
  const body = { action: 'payment', method };
  if (method === 'amazon') {
    body.gift_codes = $('#pay-codes').value.split('\n').map((s) => s.trim()).filter(Boolean);
    if (!body.gift_codes.length) return toast('기프트카드 번호를 입력하세요', true);
  } else {
    if (!$('#pay-date').value) return toast('송금일을 입력하세요', true);
    body.transfer_date = $('#pay-date').value;
  }
  try {
    await api(`/api/admin/bills/${PAY_BILL_ID}`, { method: 'PATCH', body });
    toast('저장했습니다 (지불완료)');
    $('#pay-modal-bg').classList.remove('open');
    loadBills();
  } catch (e) { toast(e.message, true); }
});

// ══════════ 앰버서더 관리 ══════════
async function loadAmbassadors() {
  const { ambassadors } = await api('/api/admin/ambassadors');
  AMBS = ambassadors;

  // 필터용 풀다운도 갱신
  $('#f-amb').innerHTML = '<option value="">전체</option>' +
    ambassadors.map((a) => `<option value="${a.id}">${escapeHtml(a.name)}</option>`).join('');

  const tbody = $('#ambs-table tbody');
  tbody.innerHTML = ambassadors.map((a) => `
    <tr>
      <td>${escapeHtml(a.name)}</td>
      <td>${escapeHtml(a.description || '')}</td>
      <td><button class="ghost btn-sm btn-edit-desc" data-id="${a.id}" data-desc="${escapeHtml(a.description || '')}">편집</button></td>
      <td>${a.submission_count}</td>
      <td>${a.active ? '<span class="badge approved">유효</span>' : '<span class="badge rejected">무효</span>'}</td>
      <td style="white-space:nowrap">
        <button class="ghost btn-sm" data-copy="${a.token}">복사</button>
        <button class="ghost btn-sm" data-reissue="${a.id}">재발급</button>
        <button class="${a.active ? 'danger' : 'ghost'} btn-sm" data-toggle="${a.id}" data-active="${a.active}">${a.active ? '무효화' : '유효화'}</button>
      </td>
    </tr>`).join('');

  tbody.querySelectorAll('[data-copy]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const url = `${location.origin}/a/${btn.dataset.copy}`;
      await navigator.clipboard.writeText(url);
      toast('복사했습니다: ' + url);
    });
  });
  tbody.querySelectorAll('.btn-edit-desc').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const next = prompt('설명 편집', btn.dataset.desc);
      if (next === null) return;
      await api(`/api/admin/ambassadors/${btn.dataset.id}`, { method: 'PATCH', body: { description: next } });
      toast('설명을 업데이트했습니다');
      loadAmbassadors();
    });
  });
  tbody.querySelectorAll('[data-reissue]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      if (!confirm('전용 링크를 재발급할까요? 기존 링크는 사용할 수 없게 됩니다.')) return;
      const r = await api(`/api/admin/ambassadors/${btn.dataset.reissue}`, { method: 'PATCH', body: { reissue_token: true } });
      await navigator.clipboard.writeText(`${location.origin}/a/${r.token}`);
      toast('재발급하고 새 링크를 복사했습니다');
      loadAmbassadors();
    });
  });
  tbody.querySelectorAll('[data-toggle]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const activating = btn.dataset.active !== '1';
      if (!activating && !confirm('링크를 무효화할까요? 이 앰버서더는 접속할 수 없게 됩니다.')) return;
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
    toast('등록했습니다. 전용 링크를 복사했습니다');
    $('#amb-add').reset();
    loadAmbassadors();
  } catch (err) { toast(err.message, true); }
});

// ══════════ 초기화 ══════════
async function init() {
  await loadAmbassadors();
  await loadSubs();
}

// 세션이 살아있으면 바로 메인 표시
(async () => {
  try {
    await api('/api/admin/ambassadors');
    showMain();
    init();
  } catch {
    showLogin();
  }
})();
