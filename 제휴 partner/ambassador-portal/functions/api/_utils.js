// 공용 유틸 — 파일명이 _로 시작하면 Pages Functions 라우팅에서 제외됨

export function json(data, status = 200, headers = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', ...headers },
  });
}

export function err(message, status = 400) {
  return json({ error: message }, status);
}

const TOKEN_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
export function randomToken(len = 24) {
  const buf = new Uint8Array(len);
  crypto.getRandomValues(buf);
  let out = '';
  for (const b of buf) out += TOKEN_CHARS[b % TOKEN_CHARS.length];
  return out;
}

export const isDate = (s) => /^\d{4}-\d{2}-\d{2}$/.test(s || '');

// ── 앰버서더 인증 (URL 토큰) ──────────────────────────────
export async function getAmbassadorByToken(env, token) {
  if (!token) return null;
  return await env.DB.prepare(
    'SELECT id, name, description, active FROM ambassadors WHERE token = ? AND active = 1'
  ).bind(token).first();
}

export function extractToken(request) {
  const url = new URL(request.url);
  return url.searchParams.get('token') || request.headers.get('X-Token') || null;
}

// ── 운영자 인증 (세션 쿠키) ──────────────────────────────
export function getCookie(request, name) {
  const cookie = request.headers.get('Cookie') || '';
  const m = cookie.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]+)'));
  return m ? m[1] : null;
}

export async function requireAdmin(env, request) {
  const session = getCookie(request, 'admin_session');
  if (!session) return false;
  const row = await env.DB.prepare(
    "SELECT token FROM admin_sessions WHERE token = ? AND expires_at > datetime('now')"
  ).bind(session).first();
  return !!row;
}

// ── 실행일 도출 (정산 월 합산 기준 — 전 폼에 일자 필수) ──
export function deriveActivityDate(type, payload) {
  let d = null;
  if (type === 'content') d = payload.published_date;
  else if (type === 'webinar_pre' || type === 'webinar_post') d = String(payload.event_date || '').slice(0, 10);
  else if (type === 'referral') d = payload.referral_date;
  return isDate(d) ? d : null;
}

// ── 보상 금액 자동 제안 ──────────────────────────────────
// 콘텐츠 단가 (계약서 2026-06 기준)
const CONTENT_PRICES = { ai_slide: 10000, other_feature: 5000, repost: 3000 };
const CONTENT_MONTHLY_CAP = 5;

export async function calcSuggestedAmount(env, ambassadorId, type, payload, activityDate) {
  if (type === 'content') {
    const unit = CONTENT_PRICES[payload.category];
    if (unit == null) return null;
    // 같은 실행월의 기제출 콘텐츠 건수 — 반려 제외 (월 상한 5건)
    const month = String(activityDate || '').slice(0, 7);
    const row = await env.DB.prepare(
      `SELECT COUNT(*) AS n FROM submissions
       WHERE ambassador_id = ? AND type = 'content' AND status != 'rejected'
         AND substr(activity_date, 1, 7) = ?`
    ).bind(ambassadorId, month).first();
    if ((row?.n ?? 0) >= CONTENT_MONTHLY_CAP) return 0; // 월 상한 초과 → 0엔 제안
    return unit;
  }

  if (type === 'webinar_post') {
    const participants = Number(payload.participants) || 0;
    if (payload.webinar_type === 'targeted') {
      // 명확한 타겟 대상: 참가자 × 500엔, 10명 미만 지급 불가
      return participants >= 10 ? participants * 500 : 0;
    }
    if (payload.webinar_type === 'general') {
      // 불특정 다수: 미캔 노출 시간 구간별
      const min = Number(payload.exposure_minutes) || 0;
      if (min <= 0) return null;
      if (min <= 10) return 10000;
      if (min <= 30) return 30000;
      return 50000;
    }
    return null;
  }

  // webinar_pre(신청), referral(보상안 미확정) → 자동 제안 없음
  return null;
}
