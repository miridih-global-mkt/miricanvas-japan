# Braze 랜딩 페이지 제작 가이드
> JP 서포터즈 폼 제작 과정에서 확인된 주의사항 종합. 다음 LP 만들 때 처음부터 여기 맞춰서 짜면 검수 통과 빠름.

---

## 1. 페이지 구조 원칙

**Braze LP 블록 순서:**
```
① Custom Code  (폼 전체 + lpBridge 스크립트)
② Braze Button (On-click: None)
③ Custom Code  (Footer — id="lp-footer")
```

- Custom Code 블록은 **자체 완결**로 작성. 한 블록에서 `<div>` 열고 다음 블록에서 닫으면 DOM이 끊겨 레이아웃 깨짐
- `<style>` 태그는 어느 블록에 있어도 **페이지 전체**에 적용됨 (Braze 네이티브 블록 포함)
- **max-width 필수**: `#lp-form, #lp-thanks { max-width:640px; margin:0 auto; background:#ffffff; }`

---

## 2. 색상 규칙 (WCAG 2.1 AA)

Braze 에디터에 자체 accessibility scan이 있어서 배포 전에 반드시 걸림. 처음부터 맞춰두면 수정 왕복 없음.

| 용도 | 색상 | 대비비 | 비고 |
|------|------|--------|------|
| 텍스트 (강조색) | `#0a7a87` | 4.65:1 ✅ | cyan `#26c7d9`는 텍스트 금지 (2:1) |
| 본문 텍스트 | `#333333` | 12.6:1 ✅ | |
| 보조 텍스트 (hint, optional, note) | `#666666` | 5.73:1 ✅ | `#999999`는 2.85:1로 실패 |
| 필수 빨간별 | `#e53e3e` | 4.5:1 ✅ | |
| 경고문 강조 | `#b04000` | 5.5:1 ✅ | `#e65100`은 실패 |
| 배경/테두리/데코 | `#26c7d9` | — | 배경·테두리·accent에만 사용 가능 |
| 섹션 번호 배지 배경 | `#0a7a87` | — | 흰 텍스트와 4.65:1 ✅ (`#26c7d9` 배경 + 흰 텍스트는 2:1로 실패) |
| 체크마크 `::before` | `#0a7a87` | 4.65:1 ✅ | |

**핵심 원칙:** `#26c7d9`는 배경·테두리·accent 전용. 텍스트 색으로 절대 쓰지 말 것.

---

## 3. lpBridge 구현 규칙

### 기본 구조 (이 패턴에서 벗어나지 말 것)
```html
<script async="true">                    <!-- async="true" 필수 -->
  const SUBMIT_BUTTON_ID = "xxxxx";      <!-- 버튼 ID 여기만 관리 -->
  let submitted = false;                  <!-- 중복 제출 방지 플래그 -->

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById(SUBMIT_BUTTON_ID);
    if (!btn) return;

    btn.addEventListener("click", async () => {
      if (submitted) return;
      submitted = true;
      btn.disabled = true;

      try {
        const lp = window.lpBridge;
        // ... 저장 로직 ...
        await lp.requestImmediateDataFlush(); // 마지막에 한 번만
        // ... 감사 화면 표시 ...
      } catch (err) {
        submitted = false;
        btn.disabled = false;
        alert("送信に失敗しました。しばらくしてから再度お試しください。");
      }
    });
  });
</script>
```

### 타입별 저장 방법
```js
// 기본 프로필 속성
await lp.setFirstName("이름");
await lp.setEmail("email@example.com");

// String 속성
await lp.setCustomUserAttribute("ja_spt_industry", "IT・ソフトウェア");

// Array 속성 — JS 배열 그대로. .join(",") 하면 안 됨
const vals = [...document.querySelectorAll('input[name="ja_spt_usage[]"]:checked')].map(el => el.value);
await lp.setCustomUserAttribute("ja_spt_usage", vals);

// Boolean 속성 — 따옴표 없는 true. "true" 문자열이면 세그먼트 필터링 안 됨
await lp.setCustomUserAttribute("ja_spt_agree_line", true);
```

### 금지 패턴
| 금지 | 이유 |
|------|------|
| `e.preventDefault()` | Braze 버튼 자체 핸들러 방해 |
| `.join(",")` 으로 배열 저장 | Array 타입 속성과 맞지 않음 |
| `"true"` 문자열로 boolean 저장 | 세그먼트 필터 = is true 조건 안 먹힘 |
| `requestImmediateDataFlush()` 중간에 여러 번 호출 | 마지막에 한 번만 |
| `async="true"` 없이 script 작성 | await 동작 보장 안 됨 |

---

## 4. 버튼 ID 관리

- Braze 버튼 블록을 **추가/삭제/복제**할 때마다 ID가 바뀜
- 변경 방법: 미리보기 → Submit 버튼 우클릭 → Inspect → `id="xxxxx"` 확인
- 스크립트의 `const SUBMIT_BUTTON_ID = "xxxxx"` 한 줄만 수정

---

## 5. Braze 버튼 설정

| 설정 항목 | 값 | 주의 |
|-----------|-----|------|
| On-click behavior | **None** | URI + 빈 URL 상태면 퍼블리시 에러 발생 |
| Submit form when button is clicked | OFF (사실상 불가) | 네이티브 폼 블록 없으면 켤 수 없음. lpBridge가 저장을 대신 처리하므로 OFF여도 무방 |

---

## 6. 메일 CTA 링크

```html
<!-- ✅ 올바른 방법 — Liquid 태그로 삽입 -->
<a href="{% landing_page_url jp-supporters-2605 %}">申し込みはこちら</a>

<!-- ❌ 잘못된 방법 — 고정 URL 복붙 -->
<a href="https://pages.braze.com/jp-supporters-2605">申し込みはこちら</a>
```

- 고정 URL로 넣으면 클릭한 유저가 기존 프로필에 연결 안 되고 익명/신규 프로필로 저장됨
- 기존 고객 대상 캠페인에서는 Liquid 태그가 **필수**
- **핸들은 메일 발송 후 절대 변경 금지** — 바꾸는 순간 기발송 링크 전부 404

---

## 7. 커스텀 속성 네이밍 규칙

- 소문자 + 언더바(`_`)만 사용. 대문자·공백·하이픈 금지
- 프리픽스: `ja_spt_` (ja=Japan, spt=supporters)
- 생성 후 반드시 Description 입력: `YYYY-MM-DD / 이름 / 목적`
- Array 속성은 Braze 대시보드에서 타입을 **Array**로 선택해서 생성

| 타입 | 해당 속성 |
|------|-----------|
| Array | `ja_spt_usage`, `ja_spt_features`, `ja_spt_target`, `ja_spt_channels` |
| Boolean | `ja_spt_agree_line`, `ja_spt_agree_privacy` |
| String | 나머지 14개 전부 |

---

## 8. 제출 후 감사 화면

리다이렉트 없이 인라인 전환. 성공 시 폼·버튼·푸터 모두 숨기고 감사 div 표시:

```js
document.getElementById("lp-form").style.display          = "none";
document.getElementById(SUBMIT_BUTTON_ID).style.display   = "none";
document.getElementById("lp-footer").style.display        = "none";
document.getElementById("lp-thanks").style.display        = "block";
window.scrollTo({ top: 0, behavior: "smooth" });
```

---

## 9. 배포 전 최종 체크리스트

- [ ] WCAG scan 통과 (Braze 에디터 내 accessibility scan 결과 0건)
- [ ] 버튼 On-click behavior → **None**
- [ ] `SUBMIT_BUTTON_ID` 값이 현재 버튼 id와 일치하는지 Inspect 확인
- [ ] Array 타입 속성 4개가 Braze 대시보드에서 **Array** 타입으로 생성되어 있는지 확인
- [ ] Boolean 속성 2개 (`agree_line`, `agree_privacy`) 코드에서 `true` (따옴표 없음)로 저장하는지 확인
- [ ] 메일 CTA 링크가 `{% landing_page_url 핸들값 %}` 태그로 삽입되어 있는지 확인
- [ ] URL 핸들값이 에디터 실제 설정값과 일치하는지 확인 (현재: `jp-supporters-2605`)
- [ ] 미리보기에서 제출 시 감사 화면 정상 표시되는지 확인
- [ ] 커스텀 속성 전체에 Description 입력 완료
