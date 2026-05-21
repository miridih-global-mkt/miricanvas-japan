# lpBridge 사용 가이드라인

Braze 랜딩 페이지 Custom Code에서 lpBridge로 데이터를 저장할 때 오류 없이 쓰기 위한 체크리스트.

---

## 1. 버튼 설정 (Braze 에디터)

| 항목 | 설정값 | 이유 |
|------|--------|------|
| Submit form when button is clicked | **ON** | 퍼블리시 조건. 없으면 페이지 발행 불가 |
| On-click behavior | **None** | URL 리다이렉트가 있으면 lpBridge 저장 완료 전에 페이지 이동 |

---

## 2. 버튼 ID 확인 방법

1. Braze 에디터 → **미리보기** 열기
2. Submit 버튼 우클릭 → **Inspect**
3. `<button ... id="xxxxx" ...>` 에서 id 값 복사
4. 스크립트의 `SUBMIT_BUTTON_ID = "xxxxx"` 에 붙여넣기

> **주의**: 버튼 블록을 **삭제 후 재추가**하거나 **페이지를 복제**하면 ID가 바뀐다.  
> 그때마다 다시 Inspect해서 업데이트해야 한다.

---

## 3. 메일 발송 설정

랜딩 페이지 링크는 반드시 Liquid 태그로 삽입해야 클릭한 사용자의 기존 프로필에 데이터가 저장된다.

```
{% landing_page_url "페이지명" %}
```

URL을 직접 복사해서 넣으면 익명 프로필로 저장되어 이후 추적 불가.

---

## 4. 스크립트 패턴 (안전한 구조)

```html
<script async="true">
  const SUBMIT_BUTTON_ID = "여기에 ID";
  let submitted = false;  // 중복 제출 방지 플래그

  document.addEventListener("DOMContentLoaded", () => {
    const btn = document.getElementById(SUBMIT_BUTTON_ID);
    if (!btn) return;

    btn.addEventListener("click", async () => {
      if (submitted) return;  // 두 번째 클릭 차단
      submitted = true;
      btn.disabled = true;

      try {
        const lp = window.lpBridge;
        // ... 저장 로직 ...
        await lp.requestImmediateDataFlush();
        // ... 감사 화면 표시 ...
      } catch (err) {
        submitted = false;       // 실패 시 재시도 허용
        btn.disabled = false;
        alert("送信に失敗しました。しばらくしてから再度お試しください。");
      }
    });
  });
</script>
```

### 왜 이 구조인가

- `e.preventDefault()` **쓰지 않는다**: Braze 버튼의 자체 핸들러를 막을 수 있음
- `submitted` 플래그로 중복 제출 차단 (버튼 disabled만으론 부족)
- `try/catch` 필수: 저장 실패 시 사용자에게 알리고 재시도 가능하게
- `async="true"` 속성 필수: 없으면 `await` 동작 보장 안 됨

---

## 5. 속성 타입별 저장 방법

### 단일 값 (String / Number / Boolean)
```js
await lp.setCustomUserAttribute("속성명", "값");
```

### 배열 (Array 타입으로 생성한 속성)
```js
const vals = [...document.querySelectorAll('input[name="xxx"]:checked')].map(el => el.value);
await lp.setCustomUserAttribute("속성명", vals);  // JS 배열 그대로 전달
// ⚠️ vals.join(",") 하면 안 됨 — Array 타입과 맞지 않음
```

### 기본 프로필 속성
```js
await lp.setFirstName("이름");
await lp.setEmail("email@example.com");
```

### flush는 마지막에 한 번만
```js
// 모든 setCustomUserAttribute 완료 후
await lp.requestImmediateDataFlush();
```

---

## 6. 제출 후 UX

리다이렉트 없이 인라인 감사 화면으로 전환하는 방식이 가장 안전.

```js
// 폼 숨기기
document.getElementById("lp-form").setAttribute("style", "display:none");
// 감사 화면 표시
document.getElementById("lp-thanks").setAttribute("style", "display:block");
window.scrollTo({ top: 0, behavior: "smooth" });
```

`style` 속성 조작은 `setAttribute` 사용. `.style.display =` 로 해도 되지만 Braze 에디터 내부 CSS와 충돌할 경우 `setAttribute`가 더 확실함.

---

## 7. 체크리스트 (배포 전)

- [ ] 버튼 On-click behavior → None
- [ ] 버튼 Submit form 토글 → ON
- [ ] `SUBMIT_BUTTON_ID` 값이 현재 버튼 id와 일치하는지 Inspect로 확인
- [ ] 메일 발송 링크가 `{% landing_page_url %}` 태그로 삽입되어 있는지 확인
- [ ] Braze 대시보드에서 Array 타입 속성(supporters_usage 등)이 Array 타입으로 생성되어 있는지 확인
- [ ] 미리보기에서 제출 시 감사 화면 표시되는지 확인 (lpBridge 없어도 화면 전환은 동작)
