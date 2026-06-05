// ============================================================
// B2B LP 문의 수신 → 시트 기록 + Braze 발신 (Apps Script)
// 배포: 공유드라이브의 「B2B_LP_문의기록」 시트에 컨테이너 바인드로 생성
// 비밀값: 프로젝트 설정 > 스크립트 속성에 BRAZE_API_KEY, BRAZE_ENDPOINT
//        (BRAZE_ENDPOINT 예: https://rest.iad-XX.braze.com — 기존 폼과 동일 값 사용)
// ⚠ external_id 정책은 기존 폼 파이프라인(braze_lp_guide 참고)과 반드시 일치시킬 것
// ============================================================

const SHEET_NAME = "기록"; // 실제 시트 탭명으로 교체

function doPost(e) {
  try {
    const p = e.parameter;
    // 허니팟·필수값 검증 (프런트와 이중) — 실패 시에도 조용히 200 반환
    if (p.website) return ok();
    if (!p.b2b_type || !p.b2b_org || !p.b2b_name) return ok();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(p.b2b_email || "")) return ok();

    const wishes = e.parameters.b2b_wish || [];
    const row = [
      new Date(),                 // A: timestamp
      p.b2b_type,                 // B: type (company/community/education/partner)
      p.q_industry || "",         // C: 속성
      p.q_scale || "",            // D: 규모
      p.q_intent || "",           // E: 의도
      wishes.join(", "),          // F: 희망사항 (docs/talk/trial)
      p.b2b_message || "",        // G: 문의내용
      p.b2b_org,                  // H: 소속
      p.b2b_name,                 // I: 성함
      p.b2b_email,                // J: 이메일
      p.b2b_role || "",           // K: 부서·역할
      p.page || "",               // L: 제출 페이지
      p.ua || ""                  // M: User-Agent
    ];
    SpreadsheetApp.getActive().getSheetByName(SHEET_NAME).appendRow(row);
    sendToBraze(p, wishes);
    return ok();
  } catch (err) {
    console.error(err);
    return ok(); // 프런트는 no-cors라 응답 본문 미사용 — 항상 200
  }
}

function sendToBraze(p, wishes) {
  const props = PropertiesService.getScriptProperties();
  const key = props.getProperty("BRAZE_API_KEY");
  const endpoint = props.getProperty("BRAZE_ENDPOINT");
  if (!key || !endpoint) return;
  const payload = {
    attributes: [{
      external_id: p.b2b_email, // ⚠ 기존 폼들의 키 정책과 일치 확인 후 사용
      email: p.b2b_email,
      b2b_inquiry_type: p.b2b_type,
      b2b_org: p.b2b_org,
      b2b_wishes: wishes
    }],
    events: [{
      external_id: p.b2b_email,
      name: "b2b_inquiry_submitted",
      time: new Date().toISOString(),
      properties: { type: p.b2b_type, wishes: wishes.join(",") }
    }]
  };
  UrlFetchApp.fetch(endpoint + "/users/track", {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + key },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}

function ok() {
  return ContentService.createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
