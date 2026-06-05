// B2B LP 전역 설정 — 앱스크립트 재배포 시 FORM_ENDPOINT 한 줄만 교체
window.B2B_CONFIG = {
  // 앱스크립트 웹앱 URL (배포 후 교체. 빈 문자열이면 제출 버튼이 준비중 안내를 표시)
  FORM_ENDPOINT: "",
  // 제출 성공 후 표시 메시지
  THANKS_MESSAGE: "送信ありがとうございました。担当者より1〜2営業日以内にご連絡いたします。",
  // 보조 문의처 (폼 불가 시 안내)
  CONTACT_EMAIL: "team.miricanvas.jp@miridih.com"
};
// Braze 이벤트명("b2b_inquiry_submitted")은 앱스크립트(gas/Code.gs) 측에서 관리
