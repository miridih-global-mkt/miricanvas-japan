# CRM 캠페인 뷰어

Claude Code(대화형)가 생성한 캠페인 기획서/HTML을 브라우저에서 비교·선택하기 위한 로컬 Flask 뷰어.
**API 호출 없음, API 키 불필요.** 생성은 Claude Code 채팅창에서 직접 요청한다.

## 사전 준비

```bash
cd _pipeline
pip install -r requirements.txt
```

## 실행

```bash
python app.py
# http://localhost:5000
```

## 사용법

### 1) 새 캠페인 생성 (채팅창에서)

Claude Code 채팅창에 이렇게 말한다:

```
새 캠페인 시작: 타겟 = "가입 후 7일차 사용자", 주제 = "폰트 바꾸기"
```

Claude Code가 `runs/{YYYYMMDD-HHMMSS-주제}/brief.md`를 작성해준다.

### 2) 기획서 검토 (뷰어)

브라우저에서 http://localhost:5000 → 해당 캠페인 "기획서" 클릭.
필요시 채팅창에서 "이 기획서 이렇게 수정해줘" 라고 다시 요청.

### 3) HTML 3버전 생성 (채팅창)

```
이제 HTML 3버전 만들어줘
```

### 4) HTML 비교·선택 (뷰어)

"비교" 클릭 → iframe 3분할로 나란히 비교 → "이 버전 최종 선택" → `final.html` 저장.

마음에 안 들면 채팅창에 "v2를 더 캐주얼하게" 또는 "3버전 다시" 요청.

## 폴더 구조

- `app.py` — Flask 뷰어 (LLM 호출 없음)
- `generator.py` — 파일 I/O 헬퍼 (Claude Code가 사용)
- `indexer.py` — 상위 폴더 HTML 인덱싱
- `prompts/` — 기획서/HTML 작성 규칙 (Claude Code가 참고)
- `templates/`, `static/` — Flask 뷰어 UI
- `runs/{run_id}/` — 실행별 산출물
  - `input.json`, `brief.md`
  - `versions/v1.html`, `v2.html`, `v3.html`, `meta.json`
  - `final.html`

## 상위 폴더 `CLAUDE.md`

Claude Code가 어떻게 캠페인을 생성해야 하는지 자세한 규칙은 `../CLAUDE.md`에 문서화되어 있다.
