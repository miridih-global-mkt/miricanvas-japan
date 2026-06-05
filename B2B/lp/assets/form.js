/* ============================================================
   form.js — B2B 공용 문의폼 컴포넌트 (단일 소스)
   사용: <div id="b2b-form"></div> + B2BForm.mount('#b2b-form')
   제출처: config.js의 B2B_CONFIG.FORM_ENDPOINT (앱스크립트 웹앱)
   ============================================================ */

const B2B_FORM_SCHEMA = {
  types: [
    { id: "company",   label: "企業として導入を検討" },
    { id: "community", label: "コミュニティで紹介・活用" },
    { id: "education", label: "教育機関・講座で活用" },
    { id: "partner",   label: "DX/AXパートナーとして協業" }
  ],
  questions: {
    company: [
      { id: "industry", label: "業種", options: ["IT・ソフトウェア", "製造", "小売・サービス", "医療・福祉", "金融・保険", "行政・公共", "その他"] },
      { id: "scale",    label: "ご利用予定人数", options: ["〜10名", "11〜50名", "51〜300名", "301名〜"] },
      { id: "intent",   label: "主な活用領域", options: ["営業・提案資料", "マーケティング・SNS", "社内資料・広報", "全社で幅広く"] }
    ],
    community: [
      { id: "industry", label: "コミュニティの分野", options: ["リスキリング・キャリア", "AI・IT学習", "女性向けキャリア", "クリエイティブ・趣味", "地域・その他"] },
      { id: "scale",    label: "メンバー規模", options: ["〜100名", "101〜1,000名", "1,001名〜"] },
      { id: "intent",   label: "ご希望の協力形態", options: ["メンバーに紹介したい", "コンテンツ・講座で活用したい", "イベントの共同開催", "アンバサダー・提携"] }
    ],
    education: [
      { id: "industry", label: "機関のタイプ", options: ["大学・専門学校・高校など学校教育機関", "職業訓練・リスキリング講座", "パソコン教室・民間スクール", "オンライン講座（Udemyなど）", "個人で講座・レッスンを運営"] },
      { id: "scale",    label: "受講生の規模（年間）", options: ["〜30名", "31〜100名", "101名〜"] },
      { id: "intent",   label: "教えたい分野", options: ["デザイン・資料作成", "PC・ITの基礎", "マーケティング・起業", "その他"] }
    ],
    partner: [
      { id: "industry", label: "事業形態", options: ["コンサルティング", "SIer・ツール導入支援", "研修・教育事業者", "フリーランス・個人"] },
      { id: "scale",    label: "現在のお取り扱い", options: ["生成AI研修を提供中", "業務ツールの導入支援を提供中", "自社SaaS・サービスあり", "これからラインアップを検討"] },
      { id: "intent",   label: "ご希望の協業形態", options: ["再販（リセラー）", "顧客紹介（リファラル）", "研修・内製化プログラムへの組み込み", "共同での商品化"] }
    ]
  },
  wishes: [
    { id: "docs",  label: "資料請求" },
    { id: "talk",  label: "オンライン相談" },
    { id: "trial", label: "無料トライアル（PoC）" }
  ]
};

const B2BForm = (() => {
  function mount(selector) {
    const root = document.querySelector(selector);
    if (!root) return;
    root.innerHTML = render();
    bind(root);
  }

  function render() {
    const typeCards = B2B_FORM_SCHEMA.types.map(t =>
      `<label class="type-card"><input type="radio" name="b2b_type" value="${t.id}"><span>${t.label}</span></label>`
    ).join("");
    const wishes = B2B_FORM_SCHEMA.wishes.map(w =>
      `<label><input type="checkbox" name="b2b_wish" value="${w.id}"> ${w.label}</label>`
    ).join("");
    return `
    <form class="b2b-form" novalidate>
      <fieldset>
        <legend>1. お問い合わせの種別 <span class="req">必須</span></legend>
        <div class="type-grid">${typeCards}</div>
      </fieldset>
      <fieldset class="dyn-questions" hidden>
        <legend>2. 詳しくお聞かせください <span class="req">必須</span></legend>
        <div class="dyn-slot"></div>
      </fieldset>
      <fieldset>
        <legend>3. ご希望の内容（複数選択可） <span class="req">必須</span></legend>
        <div class="wish-row">${wishes}</div>
      </fieldset>
      <fieldset>
        <legend>4. お問い合わせ内容 <span class="opt">任意</span></legend>
        <textarea name="b2b_message" rows="4" placeholder="ご質問・ご要望などがあればご記入ください"></textarea>
      </fieldset>
      <fieldset>
        <legend>5. ご連絡先</legend>
        <label>会社名・団体名 <span class="req">必須</span><input type="text" name="b2b_org" placeholder="例：株式会社○○" required></label>
        <label>お名前 <span class="req">必須</span><input type="text" name="b2b_name" placeholder="例：佐藤 美咲" required></label>
        <label>メールアドレス <span class="req">必須</span><input type="email" name="b2b_email" placeholder="例：sato@example.co.jp" required></label>
        <label>部署・役職 <span class="opt">任意</span><input type="text" name="b2b_role" placeholder="例：マーケティング部 リーダー"></label>
        <input class="hp-field" type="text" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
      </fieldset>
      <label class="agree"><input type="checkbox" name="b2b_agree">
        <span><a href="https://www.miricanvas.com/privacy-policy" target="_blank" rel="noopener">個人情報保護方針</a>に同意する <span class="req">必須</span></span></label>
      <button type="submit" class="submit-btn">送信する</button>
      <p class="form-status" role="status"></p>
    </form>`;
  }

  function bind(root) {
    const form = root.querySelector("form");
    form.addEventListener("change", e => {
      if (e.target.name === "b2b_type") {
        const qs = B2B_FORM_SCHEMA.questions[e.target.value];
        const slot = form.querySelector(".dyn-slot");
        slot.innerHTML = qs.map(q => `
          <label>${q.label} <span class="req">必須</span>
            <select name="q_${q.id}" required>
              <option value="">選択してください</option>
              ${q.options.map(o => `<option>${o}</option>`).join("")}
            </select></label>`).join("");
        form.querySelector(".dyn-questions").hidden = false;
      }
    });
    form.addEventListener("submit", async e => {
      e.preventDefault();
      const status = form.querySelector(".form-status");
      const err = validate(form);
      if (err) { status.textContent = err; status.className = "form-status error"; return; }
      if (!window.B2B_CONFIG || !window.B2B_CONFIG.FORM_ENDPOINT) {
        status.textContent = "フォームは現在準備中です。" + (window.B2B_CONFIG && window.B2B_CONFIG.CONTACT_EMAIL ? `恐れ入りますが ${window.B2B_CONFIG.CONTACT_EMAIL} までメールにてお問い合わせください。` : "");
        status.className = "form-status error";
        return;
      }
      const data = new URLSearchParams(new FormData(form));
      data.append("page", location.pathname);
      data.append("ua", navigator.userAgent);
      const btn = form.querySelector(".submit-btn");
      btn.disabled = true; btn.textContent = "送信中…";
      try {
        await fetch(window.B2B_CONFIG.FORM_ENDPOINT, { method: "POST", mode: "no-cors", body: data });
        form.querySelectorAll("fieldset, .agree, .submit-btn").forEach(el => el.hidden = true);
        status.textContent = window.B2B_CONFIG.THANKS_MESSAGE;
        status.className = "form-status success";
      } catch {
        btn.disabled = false; btn.textContent = "送信する";
        status.textContent = "送信に失敗しました。時間をおいて再度お試しください。";
        status.className = "form-status error";
      }
    });
  }

  function validate(form) {
    const f = new FormData(form);
    if (f.get("website")) return null; // 허니팟: 봇 입력 시 조용히 통과시켜 무시
    if (!f.get("b2b_type")) return "お問い合わせの種別を選択してください。";
    for (const sel of form.querySelectorAll(".dyn-slot select")) {
      if (!sel.value) return "「詳しくお聞かせください」の項目をすべて選択してください。";
    }
    if (!f.getAll("b2b_wish").length) return "ご希望の内容を1つ以上選択してください。";
    if (!f.get("b2b_org")) return "会社名・団体名を入力してください。";
    if (!f.get("b2b_name")) return "お名前を入力してください。";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.get("b2b_email") || "")) return "メールアドレスの形式をご確認ください。";
    if (!f.get("b2b_agree")) return "個人情報保護方針への同意が必要です。";
    return null;
  }

  return { mount };
})();
window.B2BForm = B2BForm;
