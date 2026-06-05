/* ============================================================
   components.js — 공통 헤더/푸터 (전 페이지 단일 소스)
   ISO 인증 표기는 게시규정(범위·유효기간 병기) 준수 — 변경 금지
   ============================================================ */
(function () {
  const NAV = [
    { href: "index.html",    label: "ホーム" },
    { href: "plans.html",    label: "機能・料金プラン" },
    { href: "security.html", label: "セキュリティ" }
  ];
  const here = location.pathname.split("/").pop() || "index.html";

  const header = `
  <header class="site-header">
    <a class="brand" href="index.html">MiriCanvas <span>法人向け</span></a>
    <nav>${NAV.map(n => `<a href="${n.href}" ${n.href === here ? 'class="active"' : ""}>${n.label}</a>`).join("")}</nav>
    <a class="header-cta" href="contact.html">相談・資料請求</a>
    <button class="nav-toggle" aria-label="メニュー">☰</button>
  </header>`;

  const footer = `
  <footer class="site-footer">
    <div class="foot-inner">
      <div class="foot-nav">
        ${NAV.map(n => `<a href="${n.href}">${n.label}</a>`).join("")}
        <a href="contact.html">相談・資料請求</a>
      </div>
      <div class="foot-cert">
        <p><strong>ISO/IEC 27001（情報セキュリティ）・ISO/IEC 27701（プライバシー情報）認証取得</strong></p>
        <p class="cert-scope">認証範囲：The provision of online graphic design and visual content printing platform（ISO 27701はPII Controllerとして）／有効期間：2026年5月12日〜2029年5月11日</p>
      </div>
      <div class="foot-legal">
        <a href="https://www.miricanvas.com/privacy-policy" target="_blank" rel="noopener">個人情報保護方針</a>
        <a href="https://help.miricanvas.com/hc/ja" target="_blank" rel="noopener">ヘルプセンター</a>
        <a href="https://www.miricanvas.com/ja" target="_blank" rel="noopener">MiriCanvas公式サイト</a>
        <span>運営：株式会社ミリディー（MIRIDIH Co., Ltd.）</span>
        <span>© MIRIDIH Co., Ltd.</span>
      </div>
    </div>
  </footer>`;

  document.addEventListener("DOMContentLoaded", () => {
    document.body.insertAdjacentHTML("afterbegin", header);
    document.body.insertAdjacentHTML("beforeend", footer);
    const t = document.querySelector(".nav-toggle");
    if (t) t.addEventListener("click", () => document.querySelector(".site-header nav").classList.toggle("open"));
  });
})();
