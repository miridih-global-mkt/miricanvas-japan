# CRM 메일 빌더 (v2)

로컬 단일 사용자 이메일 빌더 — **모듈 시퀀스 모델**.

## 실행
```bash
pip install -r requirements.txt
python app.py
# http://localhost:5001
```

## 테스트
```bash
python -m pytest tests/
```

## 문서
- 설계: `../docs/DESIGN_v2.md`
- 구현 계획: `../docs/PLAN_v2.md`
- 매뉴얼 체크: `tests/manual.md`

## v1 → v2 핵심 변경
- 데이터 모델: `tree.layouts[].cells[].items[]` 4단 → `modules[]` 1단 시퀀스
- 좌측: 모듈 라이브러리 + 시퀀스 카드 (인라인 슬롯 폼). `[모듈]` `[코드]` 모드 토글
- 우측: iframe 렌더링 전용 (비주얼/코드 토글 폐기)
- 코드 모드: 자동 생성 HTML 읽기전용 + 📋 복사 (직접 편집은 v2.1)
- 12개 모듈 (Hero / Body 3 / CTA 3 / Card 3 / Footer 2)
- 슬롯 3종 (필수 / 선택 / 반복)
- 옵션 2티어 (공통 항상 노출 / 고급 토글로 켜고 끔)
- 드래그앤드롭: 라이브러리→시퀀스 + 카드 재정렬. 스크롤 위치 보존
- 닫기 버튼 항상 활성, 미저장 시 confirm
- 미리보기에서 편집 중인 모듈에 outline + 자동 스크롤

## 폴더
```
_builder/
├── app.py                  # Flask 진입점
├── server/
│   ├── library.py          # 12 모듈 카탈로그 (단일 진실 소스)
│   ├── renderer.py         # 모듈 시퀀스 → 이메일 HTML
│   ├── routes.py           # API + /api/render
│   ├── storage.py          # JSON 파일 저장 + 백업 회전
│   └── sanitizer.py        # richtext 위생 처리
├── static/
│   ├── css/style.css
│   └── js/
│       ├── app.js, api.js, intro.js, sidebar.js, compare.js
│       └── editor/
│           ├── index.js    # 모드 토글 + 저장/닫기
│           ├── library.js  # 카테고리별 모듈 목록
│           ├── sequence.js # 시퀀스 카드 + 드래그
│           ├── slotForm.js # 슬롯/옵션 인라인 편집 폼
│           ├── codeView.js # 읽기전용 HTML + 복사
│           ├── preview.js  # iframe + postMessage 포커싱
│           ├── richtext.js # contentEditable 툴바
│           └── undo.js     # 시퀀스 단위 undo 스택
├── mails/
│   └── .v1backup/          # v1 데이터 (참고용 보존)
└── tests/
    ├── test_modules_v2.py  # 카탈로그 + 12 모듈 렌더 (27개)
    ├── test_api_*.py       # API 라우트
    └── ...
```
