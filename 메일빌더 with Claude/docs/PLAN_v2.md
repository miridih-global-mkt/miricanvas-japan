# CRM 메일 빌더 v2 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** v1의 4단 구조 빌더를 폐기하고 모듈 시퀀스 모델 기반 v2 빌더로 재작성. v2 완료 기준(DESIGN_v2 §10) 모두 통과.

**Architecture:** 기존 Flask + 바닐라 SPA 구조 유지. 데이터 모델만 `tree.layouts[].cells[].items[]` → `modules[]` 1단으로 단순화. 서버/클라이언트 렌더 정합성 테스트 v1 패턴 유지.

**Tech Stack:** Python 3.14, Flask, Sortable.js (CDN), pytest. 빌드 도구 없음.

**관련 문서:** [`docs/DESIGN_v2.md`](./DESIGN_v2.md), [`docs/PRD.md`](./PRD.md)

---

## Phase 0 — 정리 및 마이그레이션

### Task 0.1: v1 메일 데이터 백업 스크립트 + 실행

**Files:**
- Create: `_builder/migrate_v1_to_v2.py`

- [ ] **Step 1: 마이그레이션 스크립트 작성**

`_builder/migrate_v1_to_v2.py`:
```python
"""v1 메일(tree 구조)을 .v1backup/으로 이동. 1회성."""
import json
import shutil
from pathlib import Path

MAILS = Path(__file__).parent / "mails"
BACKUP = MAILS / ".v1backup"
BACKUP.mkdir(exist_ok=True)

moved = 0
for f in MAILS.glob("*.json"):
    data = json.loads(f.read_text(encoding="utf-8"))
    if "tree" in data and "modules" not in data:
        shutil.move(str(f), str(BACKUP / f.name))
        moved += 1
        print(f"백업됨: {f.name}")

print(f"\n총 {moved}개 v1 메일을 .v1backup/으로 이동.")
```

- [ ] **Step 2: 스크립트 실행**

```bash
cd _builder
python migrate_v1_to_v2.py
```

기대: 기존 mails/*.json이 mails/.v1backup/으로 이동. 0개여도 OK.

- [ ] **Step 3: 커밋**

```bash
cd _builder
git add migrate_v1_to_v2.py mails/
git commit -m "chore(builder): backup v1 mails to .v1backup/ before v2 rewrite"
```

---

### Task 0.2: v1 폐기 파일 삭제

**Files:**
- Delete: `_builder/static/js/editor/canvas.js`
- Delete: `_builder/static/js/editor/presets.js`
- Delete: `_builder/tests/test_presets.py` (있는 경우)
- Delete: `_builder/tests/sample_complete.json` (v1 스키마)
- Delete: `_builder/tests/sample_complete.html`
- Delete: `_builder/tests/test_renderer_fidelity.py` (v1 sample 의존)

- [ ] **Step 1: v1 파일 삭제**

```bash
cd _builder
rm static/js/editor/canvas.js static/js/editor/presets.js
rm -f tests/test_presets.py tests/sample_complete.json tests/sample_complete.html tests/test_renderer_fidelity.py
```

- [ ] **Step 2: 다른 v1 의존 파일 그렙으로 확인**

```bash
grep -rn "from server.library import" _builder/server/ _builder/tests/ 2>&1 || true
grep -rn "presets\|canvas\.js" _builder/static/js/ 2>&1 || true
```

기대: 매칭이 있더라도 다음 Phase에서 처리될 것들. 없으면 더 좋음.

- [ ] **Step 3: 커밋**

```bash
cd _builder
git add -A
git commit -m "chore(builder): remove v1 canvas/presets/fidelity files for v2 rewrite"
```

---

## Phase 1 — 백엔드: 모듈 카탈로그

### Task 1.1: MODULE_CATALOG 스키마 정의 + Hero 모듈

**Files:**
- Modify: `_builder/server/library.py` (전체 재작성)
- Create: `_builder/tests/test_module_catalog.py`

- [ ] **Step 1: 실패 테스트 먼저**

`_builder/tests/test_module_catalog.py`:
```python
from server.library import MODULE_CATALOG, get_module_def

def test_hero_module_exists():
    assert "hero" in MODULE_CATALOG

def test_hero_has_required_slots():
    hero = get_module_def("hero")
    assert hero["slots"]["heading"]["required"] is True
    assert hero["slots"]["subtitle"].get("optional") is True

def test_hero_options_have_tiers():
    hero = get_module_def("hero")
    assert hero["options"]["padding"]["tier"] == "common"
    assert hero["options"]["marginBottom"]["tier"] == "advanced"

def test_get_module_def_unknown_returns_none():
    assert get_module_def("nonexistent") is None
```

- [ ] **Step 2: 테스트 실행해서 실패 확인**

```bash
cd _builder
python -m pytest tests/test_module_catalog.py -v
```

기대: ImportError 또는 KeyError로 실패.

- [ ] **Step 3: library.py 재작성 — 스키마 + Hero**

`_builder/server/library.py`:
```python
"""모듈 카탈로그 v2 — 단일 진실 소스."""

MODULE_CATALOG = {
    "hero": {
        "type": "hero",
        "label": "Hero (로고 + 헤드라인)",
        "category": "hero",
        "icon": "🎯",
        "slots": {
            "heading":  {"type": "text",  "required": True,  "default": "메인 타이틀"},
            "subtitle": {"type": "text",  "optional": True,  "default": "서브 카피"},
            "logoSrc":  {"type": "url",   "optional": True,
                         "default": "https://placehold.co/120x40?text=LOGO"},
        },
        "options": {
            "padding":      {"type": "number", "tier": "common",   "default": 30},
            "bgColor":      {"type": "color",  "tier": "common",   "default": None},
            "headingSize":  {"type": "select", "tier": "common",
                             "choices": [24, 28, 32], "default": 28},
            "marginBottom": {"type": "number", "tier": "advanced", "default": None},
            "logoWidth":    {"type": "number", "tier": "advanced", "default": 120},
        },
    },
}

CATEGORIES = ["hero", "body", "cta", "card", "footer"]


def get_module_def(module_type):
    """모듈 type으로 정의 dict 반환. 없으면 None."""
    return MODULE_CATALOG.get(module_type)


def get_default_slots(module_type):
    """모듈의 required 슬롯 기본값으로 채워진 dict 반환 (신규 모듈 추가 시)."""
    md = get_module_def(module_type)
    if not md:
        return {}
    return {
        k: v.get("default", "")
        for k, v in md.get("slots", {}).items()
        if v.get("required") and v.get("default") is not None
    }
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
python -m pytest tests/test_module_catalog.py -v
```

기대: 4개 테스트 모두 PASS.

- [ ] **Step 5: 커밋**

```bash
git add server/library.py tests/test_module_catalog.py
git commit -m "feat(builder): module catalog skeleton with Hero module"
```

---

### Task 1.2: Body/Body+Image/Box 모듈 추가

**Files:**
- Modify: `_builder/server/library.py` (MODULE_CATALOG에 3개 추가)
- Modify: `_builder/tests/test_module_catalog.py`

- [ ] **Step 1: 테스트 추가**

`_builder/tests/test_module_catalog.py` 끝에 추가:
```python
def test_body_modules_exist():
    for t in ["body", "body_image", "box"]:
        assert t in MODULE_CATALOG, f"{t} 누락"

def test_body_image_caption_is_optional():
    bi = get_module_def("body_image")
    assert bi["slots"]["caption"].get("optional") is True

def test_box_default_bg_is_light_teal():
    box = get_module_def("box")
    assert box["options"]["bgColor"]["default"] == "#e9f9fb"
```

- [ ] **Step 2: 실패 확인**

```bash
python -m pytest tests/test_module_catalog.py::test_body_modules_exist -v
```

기대: KeyError 실패.

- [ ] **Step 3: library.py에 3개 모듈 추가**

`MODULE_CATALOG`의 `"hero": {...},` 뒤에 다음 추가:
```python
    "body": {
        "type": "body",
        "label": "본문 (텍스트)",
        "category": "body",
        "icon": "📝",
        "slots": {
            "heading": {"type": "text",     "optional": True, "default": "섹션 제목"},
            "body":    {"type": "richtext", "required": True, "default": "<p>본문 내용을 여기에 작성합니다.</p>"},
        },
        "options": {
            "padding":      {"type": "number", "tier": "common",   "default": 30},
            "bgColor":      {"type": "color",  "tier": "common",   "default": None},
            "alignment":    {"type": "select", "tier": "common",
                             "choices": ["left", "center"], "default": "left"},
            "marginBottom": {"type": "number", "tier": "advanced", "default": None},
        },
    },
    "body_image": {
        "type": "body_image",
        "label": "본문 + 이미지",
        "category": "body",
        "icon": "🖼️",
        "slots": {
            "heading":  {"type": "text",     "optional": True, "default": "섹션 제목"},
            "body":     {"type": "richtext", "required": True, "default": "<p>본문</p>"},
            "imageSrc": {"type": "url",      "required": True,
                         "default": "https://placehold.co/600x300?text=이미지"},
            "imageAlt": {"type": "text",     "optional": True, "default": ""},
            "caption":  {"type": "text",     "optional": True, "default": ""},
        },
        "options": {
            "padding":      {"type": "number", "tier": "common",   "default": 30},
            "bgColor":      {"type": "color",  "tier": "common",   "default": None},
            "imagePos":     {"type": "select", "tier": "common",
                             "choices": ["above", "below"], "default": "above"},
            "imageWidth":   {"type": "number", "tier": "advanced", "default": 600},
            "marginBottom": {"type": "number", "tier": "advanced", "default": None},
        },
    },
    "box": {
        "type": "box",
        "label": "강조 박스",
        "category": "body",
        "icon": "📦",
        "slots": {
            "body": {"type": "richtext", "required": True,
                     "default": "<p>강조하고 싶은 내용</p>"},
        },
        "options": {
            "padding":      {"type": "number", "tier": "common",   "default": 20},
            "bgColor":      {"type": "color",  "tier": "common",   "default": "#e9f9fb"},
            "borderColor":  {"type": "color",  "tier": "common",   "default": "#26c7d9"},
            "borderWidth":  {"type": "number", "tier": "advanced", "default": 1},
            "borderRadius": {"type": "number", "tier": "advanced", "default": 4},
            "marginBottom": {"type": "number", "tier": "advanced", "default": None},
        },
    },
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
python -m pytest tests/test_module_catalog.py -v
```

기대: 7개 테스트 PASS.

- [ ] **Step 5: 커밋**

```bash
git add server/library.py tests/test_module_catalog.py
git commit -m "feat(builder): add body/body_image/box modules"
```

---

### Task 1.3: CTA 모듈 3개 추가

**Files:**
- Modify: `_builder/server/library.py`
- Modify: `_builder/tests/test_module_catalog.py`

- [ ] **Step 1: 테스트 추가**

```python
def test_cta_modules_exist():
    for t in ["cta_solo", "cta_microcopy", "cta_headline_body"]:
        assert t in MODULE_CATALOG

def test_cta_solo_default_color_is_brand_teal():
    cta = get_module_def("cta_solo")
    assert cta["options"]["bgColor"]["default"] == "#26c7d9"

def test_cta_solo_label_and_href_required():
    cta = get_module_def("cta_solo")
    assert cta["slots"]["label"]["required"] is True
    assert cta["slots"]["href"]["required"] is True
```

- [ ] **Step 2: 실패 확인**

```bash
python -m pytest tests/test_module_catalog.py::test_cta_modules_exist -v
```

- [ ] **Step 3: library.py에 3개 추가**

`MODULE_CATALOG`에 `box` 다음에:
```python
    "cta_solo": {
        "type": "cta_solo",
        "label": "CTA 버튼",
        "category": "cta",
        "icon": "🔘",
        "slots": {
            "label": {"type": "text", "required": True, "default": "지금 사용해보기"},
            "href":  {"type": "url",  "required": True, "default": "https://"},
        },
        "options": {
            "bgColor":      {"type": "color",  "tier": "common",   "default": "#26c7d9"},
            "size":         {"type": "select", "tier": "common",
                             "choices": ["small", "medium", "large"], "default": "medium"},
            "alignment":    {"type": "select", "tier": "common",
                             "choices": ["left", "center", "right"], "default": "center"},
            "marginBottom": {"type": "number", "tier": "advanced", "default": None},
        },
    },
    "cta_microcopy": {
        "type": "cta_microcopy",
        "label": "마이크로카피 + CTA",
        "category": "cta",
        "icon": "💬",
        "slots": {
            "microcopy": {"type": "text", "required": True, "default": "지금 시작하면 더 효율적!"},
            "label":     {"type": "text", "required": True, "default": "지금 사용해보기"},
            "href":      {"type": "url",  "required": True, "default": "https://"},
        },
        "options": {
            "bgColor":        {"type": "color",  "tier": "common",   "default": "#26c7d9"},
            "size":           {"type": "select", "tier": "common",
                               "choices": ["small", "medium", "large"], "default": "medium"},
            "alignment":      {"type": "select", "tier": "common",
                               "choices": ["left", "center", "right"], "default": "center"},
            "microcopySize":  {"type": "number", "tier": "advanced", "default": 13},
            "marginBottom":   {"type": "number", "tier": "advanced", "default": None},
        },
    },
    "cta_headline_body": {
        "type": "cta_headline_body",
        "label": "헤드라인 + 본문 + CTA",
        "category": "cta",
        "icon": "📣",
        "slots": {
            "headline": {"type": "text",     "required": True, "default": "강력한 헤드라인"},
            "body":     {"type": "richtext", "required": True, "default": "<p>설명 본문</p>"},
            "label":    {"type": "text",     "required": True, "default": "자세히 보기"},
            "href":     {"type": "url",      "required": True, "default": "https://"},
        },
        "options": {
            "bgColor":      {"type": "color",  "tier": "common",   "default": "#e9f9fb"},
            "alignment":    {"type": "select", "tier": "common",
                             "choices": ["left", "center"], "default": "center"},
            "marginBottom": {"type": "number", "tier": "advanced", "default": None},
        },
    },
```

- [ ] **Step 4: 테스트 통과**

```bash
python -m pytest tests/test_module_catalog.py -v
```

- [ ] **Step 5: 커밋**

```bash
git add server/library.py tests/test_module_catalog.py
git commit -m "feat(builder): add 3 CTA modules"
```

---

### Task 1.4: Card 모듈 3개 (반복 슬롯 포함)

**Files:**
- Modify: `_builder/server/library.py`
- Modify: `_builder/tests/test_module_catalog.py`

- [ ] **Step 1: 테스트 추가**

```python
def test_card_modules_exist():
    for t in ["card_1col_full", "card_1col_half", "card_grid"]:
        assert t in MODULE_CATALOG

def test_card_grid_has_repeatable_slot():
    cg = get_module_def("card_grid")
    assert "repeatableSlot" in cg
    assert cg["repeatableSlot"]["key"] == "cards"
    assert cg["repeatableSlot"]["minItems"] == 1
    assert cg["repeatableSlot"]["maxItems"] == 6
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: library.py에 추가**

```python
    "card_1col_full": {
        "type": "card_1col_full",
        "label": "1단 카드 (이미지 풀폭)",
        "category": "card",
        "icon": "🎴",
        "slots": {
            "imageSrc": {"type": "url",      "required": True,
                         "default": "https://placehold.co/600x300?text=카드+이미지"},
            "heading":  {"type": "text",     "required": True, "default": "카드 제목"},
            "body":     {"type": "richtext", "required": True, "default": "<p>카드 본문</p>"},
            "linkHref": {"type": "url",      "optional": True, "default": ""},
        },
        "options": {
            "padding":      {"type": "number", "tier": "common",   "default": 20},
            "bgColor":      {"type": "color",  "tier": "common",   "default": None},
            "imageWidth":   {"type": "number", "tier": "advanced", "default": 600},
            "marginBottom": {"type": "number", "tier": "advanced", "default": None},
        },
    },
    "card_1col_half": {
        "type": "card_1col_half",
        "label": "1단 카드 (이미지 좌·텍스트 우)",
        "category": "card",
        "icon": "🃏",
        "slots": {
            "imageSrc": {"type": "url",      "required": True,
                         "default": "https://placehold.co/280x200?text=이미지"},
            "heading":  {"type": "text",     "required": True, "default": "카드 제목"},
            "body":     {"type": "richtext", "required": True, "default": "<p>카드 본문</p>"},
            "linkHref": {"type": "url",      "optional": True, "default": ""},
        },
        "options": {
            "padding":      {"type": "number", "tier": "common",   "default": 20},
            "bgColor":      {"type": "color",  "tier": "common",   "default": None},
            "imagePos":     {"type": "select", "tier": "common",
                             "choices": ["left", "right"], "default": "left"},
            "marginBottom": {"type": "number", "tier": "advanced", "default": None},
        },
    },
    "card_grid": {
        "type": "card_grid",
        "label": "카드 그리드",
        "category": "card",
        "icon": "🗂️",
        "repeatableSlot": {
            "key": "cards",
            "label": "카드",
            "minItems": 1,
            "maxItems": 6,
            "defaultCount": 2,
            "perItemSlots": {
                "title":    {"type": "text", "required": True, "default": "카드 제목"},
                "body":     {"type": "text", "required": True, "default": "짧은 설명"},
                "imageSrc": {"type": "url",  "optional": True,
                             "default": "https://placehold.co/280x180?text=이미지"},
                "linkHref": {"type": "url",  "optional": True, "default": ""},
            },
        },
        "options": {
            "columns":      {"type": "select", "tier": "common",   "choices": [2, 3], "default": 2},
            "gap":          {"type": "number", "tier": "advanced", "default": 16},
            "marginBottom": {"type": "number", "tier": "advanced", "default": None},
        },
    },
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: 커밋**

```bash
git commit -m "feat(builder): add 3 card modules incl. card_grid with repeatable slot"
```

---

### Task 1.5: Footer 모듈 2개 (다국어)

**Files:**
- Modify: `_builder/server/library.py`
- Modify: `_builder/tests/test_module_catalog.py`

- [ ] **Step 1: 테스트 추가**

```python
def test_footer_modules_exist():
    for t in ["footer_company", "footer_unsubscribe"]:
        assert t in MODULE_CATALOG

def test_total_module_count_is_12():
    assert len(MODULE_CATALOG) == 12

def test_categories_match_design():
    from server.library import CATEGORIES
    assert CATEGORIES == ["hero", "body", "cta", "card", "footer"]
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: library.py에 추가**

```python
    "footer_company": {
        "type": "footer_company",
        "label": "회사 정보 푸터",
        "category": "footer",
        "icon": "🏢",
        "slots": {
            "companyName":  {"type": "text", "optional": True, "default": "株式会社Miridih"},
            "contactEmail": {"type": "text", "optional": True, "default": "team.miricanvas.jp@miricanvas.com"},
        },
        "options": {
            "padding":      {"type": "number", "tier": "common",   "default": 24},
            "bgColor":      {"type": "color",  "tier": "common",   "default": "#ffffff"},
            "marginBottom": {"type": "number", "tier": "advanced", "default": None},
        },
    },
    "footer_unsubscribe": {
        "type": "footer_unsubscribe",
        "label": "구독해제 푸터",
        "category": "footer",
        "icon": "📭",
        "slots": {},  # 텍스트 고정, lang prop으로 결정
        "options": {
            "padding": {"type": "number", "tier": "common", "default": 16},
        },
    },
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: 커밋**

```bash
git commit -m "feat(builder): add 2 footer modules — total 12 modules ready"
```

---

## Phase 2 — 백엔드: 렌더러

### Task 2.1: 렌더러 진입점 + Hero 렌더

**Files:**
- Modify: `_builder/server/renderer.py` (전체 재작성)
- Create: `_builder/tests/test_renderer_hero.py`

- [ ] **Step 1: 실패 테스트**

`_builder/tests/test_renderer_hero.py`:
```python
from server.renderer import render_mail, render_module

def test_render_hero_required_slot_only():
    mod = {"id": "m1", "type": "hero",
           "slots": {"heading": "안녕하세요"}, "options": {}}
    html = render_module(mod, language="ko")
    assert "안녕하세요" in html
    assert 'data-module-id="m1"' in html  # 포커싱용 속성
    assert "<h1" in html

def test_render_hero_with_subtitle():
    mod = {"id": "m1", "type": "hero",
           "slots": {"heading": "타이틀", "subtitle": "부제"}, "options": {}}
    html = render_module(mod, language="ko")
    assert "부제" in html

def test_render_mail_wraps_modules_in_table():
    mail = {"id": "test", "language": "ko", "modules": [
        {"id": "m1", "type": "hero", "slots": {"heading": "T"}, "options": {}},
    ]}
    html = render_mail(mail)
    assert "<!DOCTYPE html>" in html
    assert "<table" in html
    assert "T" in html
```

- [ ] **Step 2: 실패 확인**

```bash
python -m pytest tests/test_renderer_hero.py -v
```

- [ ] **Step 3: renderer.py 작성**

`_builder/server/renderer.py`:
```python
"""모듈 시퀀스 → 이메일 세이프 HTML 렌더러."""
from server.library import get_module_def

FONT_STACKS = {
    "ko":    "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
    "ja":    "'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Meiryo', sans-serif",
    "en":    "Arial, Helvetica, sans-serif",
    "pt-BR": "Arial, Helvetica, sans-serif",
}


def esc(s):
    """HTML 텍스트 escape."""
    if s is None:
        return ""
    return (str(s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def get_slot(mod, key, default=""):
    """모듈 인스턴스에서 슬롯 값 꺼내기. 없으면 default."""
    return mod.get("slots", {}).get(key, default)


def get_option(mod, key, default=None):
    """모듈 인스턴스에서 옵션 값 꺼내기. 없으면 카탈로그 default."""
    if key in mod.get("options", {}):
        return mod["options"][key]
    md = get_module_def(mod["type"])
    if md and key in md.get("options", {}):
        return md["options"][key].get("default", default)
    return default


def render_module(mod, language="ko"):
    """모듈 1개 렌더링. data-module-id 속성 포함."""
    fn = MODULE_RENDERERS.get(mod["type"])
    if not fn:
        return f'<!-- unknown module: {mod["type"]} -->'
    return fn(mod, language)


def render_mail(mail):
    """전체 메일 렌더링."""
    lang = mail.get("language", "ko")
    font = FONT_STACKS.get(lang, FONT_STACKS["ko"])
    inner = "\n".join(render_module(m, lang) for m in mail.get("modules", []))
    return f"""<!DOCTYPE html>
<html lang="{lang}"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>{esc(mail.get("title",""))}</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:{font};color:#333;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
           style="width:600px;max-width:600px;background:#ffffff;">
      {inner}
    </table>
  </td></tr>
</table>
</body></html>"""


# === 모듈별 렌더러 ===

def render_hero(mod, lang):
    heading = esc(get_slot(mod, "heading", "메인 타이틀"))
    subtitle = get_slot(mod, "subtitle")  # optional
    logo_src = get_slot(mod, "logoSrc")
    padding = get_option(mod, "padding", 30)
    bg = get_option(mod, "bgColor")
    h_size = get_option(mod, "headingSize", 28)
    logo_w = get_option(mod, "logoWidth", 120)
    mb = get_option(mod, "marginBottom")

    bg_attr = f' bgcolor="{esc(bg)}"' if bg else ""
    mb_style = f"padding-bottom:{mb}px;" if mb else ""

    logo_html = (f'<img src="{esc(logo_src)}" width="{logo_w}" alt="logo"'
                 f' style="display:block;margin-bottom:16px;">') if logo_src else ""
    subtitle_html = (f'<p style="margin:8px 0 0;font-size:15px;color:#666;">'
                     f'{esc(subtitle)}</p>') if subtitle else ""

    return f"""
<tr><td data-module-id="{esc(mod["id"])}"{bg_attr}
        style="padding:{padding}px;{mb_style}">
  {logo_html}
  <h1 style="margin:0;font-size:{h_size}px;line-height:1.3;color:#222;">{heading}</h1>
  {subtitle_html}
</td></tr>"""


MODULE_RENDERERS = {
    "hero": render_hero,
}
```

- [ ] **Step 4: 테스트 통과**

```bash
python -m pytest tests/test_renderer_hero.py -v
```

기대: 3개 모두 PASS.

- [ ] **Step 5: 커밋**

```bash
git add server/renderer.py tests/test_renderer_hero.py
git commit -m "feat(builder): renderer with Hero module + data-module-id for focus"
```

---

### Task 2.2: Body/Body+Image/Box 렌더러

**Files:**
- Modify: `_builder/server/renderer.py`
- Create: `_builder/tests/test_renderer_body.py`

- [ ] **Step 1: 실패 테스트**

`_builder/tests/test_renderer_body.py`:
```python
from server.renderer import render_module

def test_body_renders_richtext_html_as_is():
    mod = {"id": "b1", "type": "body",
           "slots": {"body": "<p>안녕</p><strong>강조</strong>"}, "options": {}}
    out = render_module(mod, "ko")
    assert "<p>안녕</p>" in out
    assert "<strong>강조</strong>" in out

def test_body_image_above_position():
    mod = {"id": "bi1", "type": "body_image",
           "slots": {"body": "<p>본문</p>",
                     "imageSrc": "https://example.com/i.jpg",
                     "caption": "▼ 캡션"},
           "options": {"imagePos": "above"}}
    out = render_module(mod, "ko")
    img_idx = out.index("https://example.com/i.jpg")
    body_idx = out.index("본문")
    assert img_idx < body_idx, "이미지가 본문 위에 와야"
    assert "▼ 캡션" in out

def test_box_default_bg_is_light_teal():
    mod = {"id": "x1", "type": "box",
           "slots": {"body": "<p>강조</p>"}, "options": {}}
    out = render_module(mod, "ko")
    assert "#e9f9fb" in out
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 렌더러 함수 추가**

`renderer.py` 끝의 `MODULE_RENDERERS` dict 직전에 다음 추가:
```python
def render_body(mod, lang):
    heading = get_slot(mod, "heading")  # optional
    body_html = get_slot(mod, "body", "")  # richtext
    padding = get_option(mod, "padding", 30)
    bg = get_option(mod, "bgColor")
    align = get_option(mod, "alignment", "left")
    mb = get_option(mod, "marginBottom")

    bg_attr = f' bgcolor="{esc(bg)}"' if bg else ""
    mb_style = f"padding-bottom:{mb}px;" if mb else ""
    heading_html = (f'<h2 style="margin:0 0 12px;font-size:20px;color:#222;">'
                    f'{esc(heading)}</h2>') if heading else ""

    return f"""
<tr><td data-module-id="{esc(mod["id"])}"{bg_attr}
        style="padding:{padding}px;{mb_style}text-align:{align};">
  {heading_html}
  <div style="font-size:15px;line-height:1.7;color:#333;">{body_html}</div>
</td></tr>"""


def render_body_image(mod, lang):
    heading = get_slot(mod, "heading")
    body_html = get_slot(mod, "body", "")
    img_src = get_slot(mod, "imageSrc")
    img_alt = get_slot(mod, "imageAlt", "")
    caption = get_slot(mod, "caption")
    padding = get_option(mod, "padding", 30)
    bg = get_option(mod, "bgColor")
    img_pos = get_option(mod, "imagePos", "above")
    img_w = get_option(mod, "imageWidth", 600)
    mb = get_option(mod, "marginBottom")

    bg_attr = f' bgcolor="{esc(bg)}"' if bg else ""
    mb_style = f"padding-bottom:{mb}px;" if mb else ""
    img_html = (f'<img src="{esc(img_src)}" alt="{esc(img_alt)}" width="{img_w}"'
                f' style="display:block;width:100%;max-width:{img_w}px;margin:0 auto;">') if img_src else ""
    caption_html = (f'<p style="margin:8px 0 0;font-size:13px;font-weight:bold;color:#555;">'
                    f'{esc(caption)}</p>') if caption else ""
    heading_html = (f'<h2 style="margin:0 0 12px;font-size:20px;color:#222;">'
                    f'{esc(heading)}</h2>') if heading else ""

    img_block = f'{img_html}{caption_html}'
    body_block = f'<div style="font-size:15px;line-height:1.7;color:#333;margin-top:12px;">{body_html}</div>'

    if img_pos == "above":
        content = f'{heading_html}{img_block}{body_block}'
    else:
        content = f'{heading_html}{body_block}{img_block}'

    return f"""
<tr><td data-module-id="{esc(mod["id"])}"{bg_attr}
        style="padding:{padding}px;{mb_style}">
  {content}
</td></tr>"""


def render_box(mod, lang):
    body_html = get_slot(mod, "body", "")
    padding = get_option(mod, "padding", 20)
    bg = get_option(mod, "bgColor", "#e9f9fb")
    bc = get_option(mod, "borderColor", "#26c7d9")
    bw = get_option(mod, "borderWidth", 1)
    br = get_option(mod, "borderRadius", 4)
    mb = get_option(mod, "marginBottom")

    mb_style = f"margin-bottom:{mb}px;" if mb else ""

    return f"""
<tr><td data-module-id="{esc(mod["id"])}" style="padding:0 30px;">
  <div style="background:{esc(bg)};border:{bw}px solid {esc(bc)};
              border-radius:{br}px;padding:{padding}px;{mb_style}
              font-size:15px;line-height:1.7;color:#333;">
    {body_html}
  </div>
</td></tr>"""
```

`MODULE_RENDERERS`를 다음과 같이 갱신:
```python
MODULE_RENDERERS = {
    "hero": render_hero,
    "body": render_body,
    "body_image": render_body_image,
    "box": render_box,
}
```

- [ ] **Step 4: 테스트 통과**

```bash
python -m pytest tests/test_renderer_body.py -v
```

- [ ] **Step 5: 커밋**

```bash
git add server/renderer.py tests/test_renderer_body.py
git commit -m "feat(builder): render body/body_image/box modules"
```

---

### Task 2.3: CTA 모듈 렌더러 3개

**Files:**
- Modify: `_builder/server/renderer.py`
- Create: `_builder/tests/test_renderer_cta.py`

- [ ] **Step 1: 테스트**

`_builder/tests/test_renderer_cta.py`:
```python
from server.renderer import render_module

def test_cta_solo_renders_button_link():
    mod = {"id": "c1", "type": "cta_solo",
           "slots": {"label": "지금 가입", "href": "https://example.com"},
           "options": {}}
    out = render_module(mod, "ko")
    assert "지금 가입" in out
    assert 'href="https://example.com"' in out
    assert "#26c7d9" in out  # 기본 색상

def test_cta_microcopy_includes_microcopy_above_button():
    mod = {"id": "c2", "type": "cta_microcopy",
           "slots": {"microcopy": "추가요금 없음", "label": "구독", "href": "https://x"},
           "options": {}}
    out = render_module(mod, "ko")
    assert "추가요금 없음" in out
    micro_idx = out.index("추가요금 없음")
    btn_idx = out.index("구독")
    assert micro_idx < btn_idx

def test_cta_headline_body_renders_all_slots():
    mod = {"id": "c3", "type": "cta_headline_body",
           "slots": {"headline": "더 알아보기", "body": "<p>설명</p>",
                     "label": "보기", "href": "https://y"},
           "options": {}}
    out = render_module(mod, "ko")
    assert "더 알아보기" in out
    assert "<p>설명</p>" in out
    assert "보기" in out
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 렌더러 추가**

```python
SIZE_PADDING = {"small": "8px 18px", "medium": "12px 28px", "large": "16px 40px"}
SIZE_FONT = {"small": 12, "medium": 14, "large": 16}


def _render_button(label, href, bg, size, align):
    pad = SIZE_PADDING.get(size, SIZE_PADDING["medium"])
    fs = SIZE_FONT.get(size, SIZE_FONT["medium"])
    return f"""<table role="presentation" cellpadding="0" cellspacing="0" border="0"
              align="{align}" style="margin:0 auto;">
  <tr><td bgcolor="{esc(bg)}" style="border-radius:4px;">
    <a href="{esc(href)}" target="_blank"
       style="display:inline-block;padding:{pad};font-size:{fs}px;
              color:#ffffff;text-decoration:none;font-weight:bold;
              border-radius:4px;">{esc(label)}</a>
  </td></tr>
</table>"""


def render_cta_solo(mod, lang):
    label = get_slot(mod, "label", "")
    href = get_slot(mod, "href", "#")
    bg = get_option(mod, "bgColor", "#26c7d9")
    size = get_option(mod, "size", "medium")
    align = get_option(mod, "alignment", "center")
    mb = get_option(mod, "marginBottom")
    mb_style = f"padding-bottom:{mb}px;" if mb else ""
    btn = _render_button(label, href, bg, size, align)
    return f"""
<tr><td data-module-id="{esc(mod["id"])}" align="{align}"
        style="padding:24px 30px;{mb_style}">{btn}</td></tr>"""


def render_cta_microcopy(mod, lang):
    micro = esc(get_slot(mod, "microcopy", ""))
    label = get_slot(mod, "label", "")
    href = get_slot(mod, "href", "#")
    bg = get_option(mod, "bgColor", "#26c7d9")
    size = get_option(mod, "size", "medium")
    align = get_option(mod, "alignment", "center")
    micro_size = get_option(mod, "microcopySize", 13)
    mb = get_option(mod, "marginBottom")
    mb_style = f"padding-bottom:{mb}px;" if mb else ""
    btn = _render_button(label, href, bg, size, align)
    return f"""
<tr><td data-module-id="{esc(mod["id"])}" align="{align}"
        style="padding:24px 30px;{mb_style}">
  <p style="margin:0 0 10px;font-size:{micro_size}px;color:#666;">{micro}</p>
  {btn}
</td></tr>"""


def render_cta_headline_body(mod, lang):
    headline = esc(get_slot(mod, "headline", ""))
    body_html = get_slot(mod, "body", "")
    label = get_slot(mod, "label", "")
    href = get_slot(mod, "href", "#")
    bg = get_option(mod, "bgColor", "#e9f9fb")
    align = get_option(mod, "alignment", "center")
    mb = get_option(mod, "marginBottom")
    mb_style = f"padding-bottom:{mb}px;" if mb else ""
    btn = _render_button(label, href, "#26c7d9", "medium", align)
    return f"""
<tr><td data-module-id="{esc(mod["id"])}" bgcolor="{esc(bg)}" align="{align}"
        style="padding:32px;{mb_style}">
  <h2 style="margin:0 0 12px;font-size:22px;color:#222;">{headline}</h2>
  <div style="font-size:15px;line-height:1.7;color:#444;margin-bottom:20px;">{body_html}</div>
  {btn}
</td></tr>"""
```

`MODULE_RENDERERS`에 추가:
```python
    "cta_solo": render_cta_solo,
    "cta_microcopy": render_cta_microcopy,
    "cta_headline_body": render_cta_headline_body,
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: 커밋**

```bash
git commit -m "feat(builder): render 3 CTA modules"
```

---

### Task 2.4: Card 모듈 3개 렌더 (반복 슬롯 포함)

**Files:**
- Modify: `_builder/server/renderer.py`
- Create: `_builder/tests/test_renderer_card.py`

- [ ] **Step 1: 테스트**

`_builder/tests/test_renderer_card.py`:
```python
from server.renderer import render_module

def test_card_grid_renders_n_cards():
    mod = {"id": "g1", "type": "card_grid",
           "slots": {"cards": [
               {"title": "A", "body": "AA"},
               {"title": "B", "body": "BB"},
               {"title": "C", "body": "CC"},
           ]},
           "options": {"columns": 3}}
    out = render_module(mod, "ko")
    assert out.count("<td") >= 3  # 컬럼 셀들
    for t in ["A", "B", "C"]:
        assert t in out

def test_card_1col_half_image_position_left():
    mod = {"id": "h1", "type": "card_1col_half",
           "slots": {"imageSrc": "https://x/i.jpg", "heading": "T", "body": "<p>B</p>"},
           "options": {"imagePos": "left"}}
    out = render_module(mod, "ko")
    img_idx = out.index("https://x/i.jpg")
    text_idx = out.index("<p>B</p>")
    assert img_idx < text_idx

def test_card_1col_full_renders_image_and_text():
    mod = {"id": "f1", "type": "card_1col_full",
           "slots": {"imageSrc": "https://x/c.jpg", "heading": "Card",
                     "body": "<p>설명</p>"},
           "options": {}}
    out = render_module(mod, "ko")
    assert "https://x/c.jpg" in out
    assert "Card" in out
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 렌더러 추가**

```python
def render_card_1col_full(mod, lang):
    img_src = get_slot(mod, "imageSrc", "")
    heading = esc(get_slot(mod, "heading", ""))
    body_html = get_slot(mod, "body", "")
    link = get_slot(mod, "linkHref")
    padding = get_option(mod, "padding", 20)
    bg = get_option(mod, "bgColor")
    img_w = get_option(mod, "imageWidth", 600)
    mb = get_option(mod, "marginBottom")

    bg_attr = f' bgcolor="{esc(bg)}"' if bg else ""
    mb_style = f"padding-bottom:{mb}px;" if mb else ""
    img_html = (f'<img src="{esc(img_src)}" width="{img_w}" alt="{esc(heading)}"'
                f' style="display:block;width:100%;max-width:{img_w}px;">') if img_src else ""
    if link:
        img_html = f'<a href="{esc(link)}" target="_blank">{img_html}</a>'

    return f"""
<tr><td data-module-id="{esc(mod["id"])}"{bg_attr}
        style="padding:{padding}px;{mb_style}">
  {img_html}
  <h3 style="margin:12px 0 8px;font-size:18px;">{heading}</h3>
  <div style="font-size:14px;line-height:1.6;color:#444;">{body_html}</div>
</td></tr>"""


def render_card_1col_half(mod, lang):
    img_src = get_slot(mod, "imageSrc", "")
    heading = esc(get_slot(mod, "heading", ""))
    body_html = get_slot(mod, "body", "")
    padding = get_option(mod, "padding", 20)
    bg = get_option(mod, "bgColor")
    pos = get_option(mod, "imagePos", "left")
    mb = get_option(mod, "marginBottom")

    bg_attr = f' bgcolor="{esc(bg)}"' if bg else ""
    mb_style = f"padding-bottom:{mb}px;" if mb else ""
    img_cell = f'''<td width="280" valign="top" style="padding:0;">
      <img src="{esc(img_src)}" width="280" alt="{heading}" style="display:block;width:100%;">
    </td>'''
    text_cell = f'''<td valign="top" style="padding:0 0 0 16px;">
      <h3 style="margin:0 0 8px;font-size:18px;">{heading}</h3>
      <div style="font-size:14px;line-height:1.6;color:#444;">{body_html}</div>
    </td>'''

    cells = f"{img_cell}{text_cell}" if pos == "left" else f"{text_cell}{img_cell}"
    return f"""
<tr><td data-module-id="{esc(mod["id"])}"{bg_attr}
        style="padding:{padding}px;{mb_style}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>{cells}</tr>
  </table>
</td></tr>"""


def render_card_grid(mod, lang):
    cards = get_slot(mod, "cards", []) or []
    cols = get_option(mod, "columns", 2)
    gap = get_option(mod, "gap", 16)
    mb = get_option(mod, "marginBottom")
    mb_style = f"padding-bottom:{mb}px;" if mb else ""

    cell_width = (600 - gap * (cols - 1)) // cols

    rows = []
    for i in range(0, len(cards), cols):
        row_cards = cards[i:i + cols]
        cells = []
        for j, c in enumerate(row_cards):
            title = esc(c.get("title", ""))
            body = esc(c.get("body", ""))
            img = c.get("imageSrc")
            link = c.get("linkHref")
            img_html = (f'<img src="{esc(img)}" width="{cell_width}" alt="{title}"'
                        f' style="display:block;width:100%;">') if img else ""
            if link and img_html:
                img_html = f'<a href="{esc(link)}" target="_blank">{img_html}</a>'
            spacer = f' style="padding-left:{gap}px;"' if j > 0 else ""
            cells.append(f'''<td valign="top" width="{cell_width}"{spacer}>
              {img_html}
              <h4 style="margin:8px 0 4px;font-size:15px;">{title}</h4>
              <p style="margin:0;font-size:13px;color:#555;line-height:1.5;">{body}</p>
            </td>''')
        # 빈 셀로 채우기
        while len(cells) < cols:
            cells.append(f'<td width="{cell_width}"></td>')
        rows.append(f'<tr>{"".join(cells)}</tr>')

    return f"""
<tr><td data-module-id="{esc(mod["id"])}" style="padding:30px;{mb_style}">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    {"".join(rows)}
  </table>
</td></tr>"""
```

`MODULE_RENDERERS`에 추가:
```python
    "card_1col_full": render_card_1col_full,
    "card_1col_half": render_card_1col_half,
    "card_grid": render_card_grid,
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: 커밋**

```bash
git commit -m "feat(builder): render 3 card modules incl. card_grid w/ repeatable"
```

---

### Task 2.5: Footer 2개 렌더 (다국어 텍스트)

**Files:**
- Modify: `_builder/server/renderer.py`
- Create: `_builder/tests/test_renderer_footer.py`

- [ ] **Step 1: 테스트**

`_builder/tests/test_renderer_footer.py`:
```python
from server.renderer import render_module

def test_footer_company_includes_default_company_name():
    mod = {"id": "fc1", "type": "footer_company",
           "slots": {}, "options": {}}
    out = render_module(mod, "ja")
    assert "株式会社Miridih" in out

def test_footer_unsubscribe_preserves_braze_token():
    mod = {"id": "fu1", "type": "footer_unsubscribe",
           "slots": {}, "options": {}}
    out = render_module(mod, "ko")
    assert "{{${set_user_to_unsubscribed_url}}}" in out

def test_footer_unsubscribe_korean_text():
    mod = {"id": "fu2", "type": "footer_unsubscribe",
           "slots": {}, "options": {}}
    out = render_module(mod, "ko")
    assert "수신거부" in out

def test_footer_unsubscribe_japanese_text():
    out = render_module({"id": "fu3", "type": "footer_unsubscribe",
                          "slots": {}, "options": {}}, "ja")
    assert "配信停止" in out
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: 렌더러 추가**

```python
UNSUBSCRIBE_TEXT = {
    "ko": "수신을 원하지 않으시면 이곳에서 수신거부 신청해주세요.",
    "ja": "メール配信を希望されない場合は、こちらから配信停止のお手続きをお願いいたします。",
    "en": "If you no longer wish to receive these emails, please unsubscribe here.",
    "pt-BR": "Se não deseja mais receber estes e-mails, cancele a inscrição aqui.",
}

UNSUBSCRIBE_LINK_TEXT = {
    "ko": "수신거부",
    "ja": "配信停止",
    "en": "Unsubscribe",
    "pt-BR": "Cancelar inscrição",
}


def render_footer_company(mod, lang):
    company = esc(get_slot(mod, "companyName", "株式会社Miridih"))
    email = esc(get_slot(mod, "contactEmail", "team.miricanvas.jp@miricanvas.com"))
    padding = get_option(mod, "padding", 24)
    bg = get_option(mod, "bgColor", "#ffffff")
    mb = get_option(mod, "marginBottom")
    mb_style = f"padding-bottom:{mb}px;" if mb else ""

    return f"""
<tr><td data-module-id="{esc(mod["id"])}" bgcolor="{bg}"
        style="padding:{padding}px;{mb_style}border-top:1px solid #eee;
              font-size:12px;color:#888;text-align:center;line-height:1.6;">
  <strong>{company}</strong><br>
  お問い合わせ: <a href="mailto:{email}" style="color:#888;">{email}</a>
</td></tr>"""


def render_footer_unsubscribe(mod, lang):
    text = UNSUBSCRIBE_TEXT.get(lang, UNSUBSCRIBE_TEXT["ko"])
    link_text = UNSUBSCRIBE_LINK_TEXT.get(lang, UNSUBSCRIBE_LINK_TEXT["ko"])
    padding = get_option(mod, "padding", 16)
    return f"""
<tr><td data-module-id="{esc(mod["id"])}" bgcolor="#fafafa"
        style="padding:{padding}px;font-size:11px;color:#999;
              text-align:center;line-height:1.5;">
  {esc(text)}<br>
  <a href="{{{{${{set_user_to_unsubscribed_url}}}}}}"
     style="color:#999;text-decoration:underline;">{esc(link_text)}</a>
</td></tr>"""
```

`MODULE_RENDERERS` 최종:
```python
    "footer_company": render_footer_company,
    "footer_unsubscribe": render_footer_unsubscribe,
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: 커밋**

```bash
git commit -m "feat(builder): render 2 footer modules with multilingual text"
```

---

## Phase 3 — 백엔드 API 업데이트

### Task 3.1: GET /api/library 응답 형식

**Files:**
- Modify: `_builder/server/routes.py`
- Modify: `_builder/tests/test_api_library.py`

- [ ] **Step 1: 테스트 갱신**

`_builder/tests/test_api_library.py` 전체 교체:
```python
from app import app


def test_library_returns_modules_dict():
    client = app.test_client()
    res = client.get("/api/library")
    assert res.status_code == 200
    data = res.get_json()
    assert "modules" in data
    assert "categories" in data

def test_library_has_12_modules():
    client = app.test_client()
    data = client.get("/api/library").get_json()
    assert len(data["modules"]) == 12

def test_library_categories_in_order():
    client = app.test_client()
    data = client.get("/api/library").get_json()
    assert data["categories"] == ["hero", "body", "cta", "card", "footer"]

def test_library_module_has_slots_and_options():
    client = app.test_client()
    data = client.get("/api/library").get_json()
    hero = data["modules"]["hero"]
    assert "slots" in hero
    assert "options" in hero
    assert "label" in hero
```

- [ ] **Step 2: 실패 확인**

```bash
python -m pytest tests/test_api_library.py -v
```

- [ ] **Step 3: routes.py에서 라이브러리 엔드포인트 갱신**

`_builder/server/routes.py`에서 `@api_bp.route("/library")` 핸들러를 찾아 교체:
```python
from server.library import MODULE_CATALOG, CATEGORIES

@api_bp.route("/library", methods=["GET"])
def get_library():
    return jsonify({"modules": MODULE_CATALOG, "categories": CATEGORIES})
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: 커밋**

```bash
git commit -m "feat(builder): GET /api/library returns v2 modules dict"
```

---

### Task 3.2: 신규 메일 기본 시퀀스

**Files:**
- Modify: `_builder/server/storage.py`
- Modify: `_builder/tests/test_api_mails.py`

- [ ] **Step 1: 테스트 갱신**

`_builder/tests/test_api_mails.py`에 추가 (또는 기존 신규생성 테스트 갱신):
```python
def test_create_mail_starts_with_5_modules():
    client = app.test_client()
    res = client.post("/api/mails", json={"title": "test", "language": "ko"})
    assert res.status_code in (200, 201)
    mail = res.get_json()
    assert "modules" in mail
    types = [m["type"] for m in mail["modules"]]
    assert types == ["hero", "body", "cta_solo", "footer_company", "footer_unsubscribe"]
    assert "tree" not in mail  # v1 필드 없어야

def test_create_mail_has_unique_module_ids():
    client = app.test_client()
    mail = client.post("/api/mails", json={"title": "x", "language": "ko"}).get_json()
    ids = [m["id"] for m in mail["modules"]]
    assert len(ids) == len(set(ids))
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: storage.py 갱신 — 기본 시퀀스 생성**

`_builder/server/storage.py`에서 신규 메일 생성 함수에 적용:
```python
import uuid

DEFAULT_MODULES = [
    {"type": "hero",                "slots": {"heading": "메인 타이틀"}, "options": {}},
    {"type": "body",                "slots": {"body": "<p>본문 내용을 여기에 작성합니다.</p>"}, "options": {}},
    {"type": "cta_solo",            "slots": {"label": "지금 사용해보기", "href": "https://"}, "options": {}},
    {"type": "footer_company",      "slots": {}, "options": {}},
    {"type": "footer_unsubscribe",  "slots": {}, "options": {}},
]

def _short_id():
    return uuid.uuid4().hex[:8]

def create_default_modules():
    """신규 메일에 들어갈 모듈 인스턴스 5개 생성 (각 id 부여)."""
    out = []
    for tmpl in DEFAULT_MODULES:
        out.append({
            "id": f"mod_{_short_id()}",
            "type": tmpl["type"],
            "slots": dict(tmpl["slots"]),
            "options": dict(tmpl["options"]),
        })
    return out
```

기존 `create_mail` 함수에서 신규 메일 dict 생성 시 `"modules": create_default_modules()`로 갱신하고, `"tree"` 필드는 제거.

- [ ] **Step 4: 테스트 통과**

```bash
python -m pytest tests/test_api_mails.py -v
```

- [ ] **Step 5: 커밋**

```bash
git commit -m "feat(builder): new mail starts with 5 default modules (v2)"
```

---

### Task 3.3: 기존 mails 라우트가 .v1backup 무시 + storage 정리

**Files:**
- Modify: `_builder/server/storage.py`
- Add test: `_builder/tests/test_storage.py` (있으면 갱신)

- [ ] **Step 1: 테스트**

`_builder/tests/test_storage.py`에 추가:
```python
import os
from pathlib import Path
from server.storage import list_mails, MAILS_DIR

def test_list_mails_ignores_v1backup_dir():
    backup = MAILS_DIR / ".v1backup"
    backup.mkdir(exist_ok=True)
    (backup / "fake_v1.json").write_text('{"id":"x","tree":{}}', encoding="utf-8")
    try:
        ids = [m["id"] for m in list_mails()]
        assert "x" not in ids
    finally:
        (backup / "fake_v1.json").unlink(missing_ok=True)
```

- [ ] **Step 2: 실패 확인**

- [ ] **Step 3: storage.py에서 list_mails이 `.v1backup` 디렉토리 건너뛰게**

기존 `list_mails`에서 `glob("*.json")` 사용한다면 그대로 OK (glob은 하위 디렉토리 무시함). 만약 `rglob` 사용 중이라면 `glob`로 교체 + `.startswith(".")` 필터.

확인:
```python
def list_mails():
    out = []
    for f in MAILS_DIR.glob("*.json"):  # 하위 디렉토리는 자동 무시
        if f.name.startswith("."):
            continue
        try:
            data = json.loads(f.read_text(encoding="utf-8"))
            out.append(data)
        except (json.JSONDecodeError, OSError):
            continue
    return sorted(out, key=lambda m: m.get("createdAt", ""), reverse=True)
```

- [ ] **Step 4: 테스트 통과**

- [ ] **Step 5: 커밋**

```bash
git commit -m "fix(builder): list_mails ignores .v1backup/"
```

---

## Phase 4 — 프론트엔드: 골격 + 모드 토글

### Task 4.1: editor/index.js 모드 토글 + 닫기 confirm

**Files:**
- Modify: `_builder/static/js/editor/index.js` (전체 재작성)
- Create: `_builder/static/js/editor/sequence.js` (스텁)
- Create: `_builder/static/js/editor/codeView.js` (스텁)
- Modify: `_builder/static/js/editor/preview.js` (단순화)
- Modify: `_builder/static/css/style.css`

- [ ] **Step 1: 스텁 파일 작성**

`_builder/static/js/editor/sequence.js`:
```js
// 시퀀스 패널 (Phase 5에서 본격 구현)
export function createSequencePanel(host, state, onChange) {
  host.innerHTML = `<div style="padding:20px;color:#888;">시퀀스 패널 준비 중...</div>`;
  return { rerender: () => {} };
}
```

`_builder/static/js/editor/codeView.js`:
```js
// 코드 모드 (읽기 전용 + 복사). Phase 7에서 본격 구현
import { renderMail } from "./renderer.js";

export function createCodeView(host, state) {
  function render() {
    if (!state.currentMail) { host.innerHTML = ""; return; }
    const html = renderMail(state.currentMail, state.library);
    host.innerHTML = `
      <div class="code-view">
        <div class="code-view-header">
          <span style="font-size:12px;color:#666;">자동 생성된 HTML (읽기전용 · 직접 편집은 v2.1 예정)</span>
          <button id="copy-html-btn" class="primary" style="padding:4px 10px;font-size:11px;">📋 복사</button>
        </div>
        <pre class="code-view-content"><code></code></pre>
      </div>
    `;
    host.querySelector("code").textContent = html;
    host.querySelector("#copy-html-btn").addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(html);
        alert("HTML 코드가 클립보드에 복사되었습니다");
      } catch (e) {
        alert("복사 실패: " + e.message);
      }
    });
  }
  render();
  return { rerender: render };
}
```

- [ ] **Step 2: editor/index.js 재작성**

```js
import { api } from "../api.js";
import { createLibraryPanel } from "./library.js";
import { createSequencePanel } from "./sequence.js";
import { createCodeView } from "./codeView.js";
import { createPreview } from "./preview.js";

let preview, libraryPanel, sequencePanel, codeView;

export async function renderEditorTab(container, state, onStateChange) {
  if (!state.editingMailId) {
    container.innerHTML = `
      <div style="overflow:auto;height:100%;">
        <div style="text-align:center;padding:80px 20px;color:#888;">
          <p style="margin-bottom:14px;font-size:14px;">사이드바에서 편집할 메일의 '편집' 버튼을 눌러주세요</p>
          <div style="margin-top:20px;">
            <input id="new-mail-title" type="text" placeholder="제목"
                   style="padding:6px 10px;border:1px solid #ccc;border-radius:4px;margin-right:6px;">
            <select id="new-mail-lang" style="padding:6px 10px;border:1px solid #ccc;border-radius:4px;margin-right:6px;">
              <option value="ja">🇯🇵 일본어</option>
              <option value="ko" selected>🇰🇷 한국어</option>
              <option value="en">🇺🇸 영어</option>
              <option value="pt-BR">🇧🇷 포르투갈어(브라질)</option>
            </select>
            <button id="new-mail-create" class="primary">신규메일제작</button>
          </div>
        </div>
      </div>
    `;
    document.getElementById("new-mail-create").addEventListener("click", async () => {
      const title = document.getElementById("new-mail-title").value.trim() || "(제목 없음)";
      const language = document.getElementById("new-mail-lang").value;
      const created = await api.createMail(title, language);
      state.editingMailId = created.id;
      state.currentMail = created;
      state.unsavedChanges = false;
      onStateChange();
    });
    return;
  }

  if (!state.currentMail || state.currentMail.id !== state.editingMailId) {
    state.currentMail = await api.getMail(state.editingMailId);
    state.unsavedChanges = false;
  }

  if (!state.editorMode) state.editorMode = "modules";  // modules | code

  container.innerHTML = `
    <div class="editor">
      <div class="editor-toolbar">
        <span>#${state.currentMail.number}</span>
        <span class="title">${state.currentMail.title}</span>
        <span style="font-size:11px;color:#888;">${(state.currentMail.createdAt||"").slice(0,10)}</span>
        <button id="save-btn" class="primary" ${!state.unsavedChanges ? "disabled" : ""}>저장</button>
        <button id="close-btn">닫기</button>
      </div>
      <div class="editor-mode-tabs">
        <button data-mode="modules" class="${state.editorMode === "modules" ? "active" : ""}">모듈</button>
        <button data-mode="code" class="${state.editorMode === "code" ? "active" : ""}">코드</button>
      </div>
      <div class="editor-body">
        <div class="editor-left">
          ${state.editorMode === "modules"
              ? `<div id="library-host"></div><div id="sequence-host"></div>`
              : `<div id="codeview-host"></div>`}
        </div>
        <div id="preview-host"></div>
      </div>
    </div>
  `;

  function onChange() {
    onStateChange();
    if (preview) preview.rerender();
    document.getElementById("save-btn")?.removeAttribute("disabled");
  }

  if (state.editorMode === "modules") {
    libraryPanel = createLibraryPanel(document.getElementById("library-host"), state);
    sequencePanel = createSequencePanel(document.getElementById("sequence-host"), state, onChange);
  } else {
    codeView = createCodeView(document.getElementById("codeview-host"), state);
  }
  preview = createPreview(document.getElementById("preview-host"), state);
  preview.rerender();

  // 모드 토글
  container.querySelectorAll(".editor-mode-tabs button").forEach(b => {
    b.addEventListener("click", () => {
      state.editorMode = b.dataset.mode;
      onStateChange();
    });
  });

  document.getElementById("save-btn").addEventListener("click", async () => {
    await api.saveMail(state.currentMail.id, state.currentMail);
    state.unsavedChanges = false;
    alert("저장됨");
    onStateChange();
  });

  document.getElementById("close-btn").addEventListener("click", () => {
    if (state.unsavedChanges &&
        !confirm("아직 변경사항이 저장되지 않았습니다. 그래도 닫으시겠습니까?")) {
      return;
    }
    state.editingMailId = null;
    state.currentMail = null;
    state.unsavedChanges = false;
    state.editorMode = "modules";
    onStateChange();
  });
}
```

- [ ] **Step 3: preview.js 단순화 (비주얼/코드 토글 제거)**

`_builder/static/js/editor/preview.js` 전체 교체:
```js
import { renderMail } from "./renderer.js";

export function createPreview(container, state) {
  container.innerHTML = `
    <div class="preview-pane">
      <iframe id="preview-iframe" sandbox="allow-same-origin allow-scripts"></iframe>
    </div>
  `;
  const iframe = container.querySelector("#preview-iframe");

  function rerender() {
    if (!state.currentMail || !state.library) return;
    const html = renderMail(state.currentMail, state.library);
    iframe.srcdoc = html + `<script>
      window.addEventListener("message", e => {
        if (e.data && e.data.type === "focus") {
          document.querySelectorAll("[data-module-id]").forEach(el => {
            el.style.outline = el.dataset.moduleId === e.data.id ? "2px solid #26c7d9" : "";
            el.style.outlineOffset = el.dataset.moduleId === e.data.id ? "-2px" : "";
          });
          if (e.data.id) {
            const t = document.querySelector('[data-module-id="' + e.data.id + '"]');
            if (t) t.scrollIntoView({behavior:"smooth", block:"center"});
          }
        }
      });
    </script>`;
  }

  function focus(moduleId) {
    if (!iframe.contentWindow) return;
    iframe.contentWindow.postMessage({type: "focus", id: moduleId}, "*");
  }

  return { rerender, focus };
}
```

- [ ] **Step 4: CSS 추가**

`_builder/static/css/style.css` 끝에 추가:
```css
.editor-mode-tabs {
  display: flex; gap: 0; background: white; border-bottom: 1px solid #ddd;
}
.editor-mode-tabs button {
  padding: 8px 18px; border: none; background: none; cursor: pointer;
  font-size: 13px; color: #666;
}
.editor-mode-tabs button.active {
  border-bottom: 2px solid #26c7d9; color: #26c7d9; font-weight: bold;
}

#sequence-host { flex: 1; overflow: auto; background: white; padding: 12px; }
#codeview-host { flex: 1; overflow: hidden; display: flex; flex-direction: column; }

.code-view { display: flex; flex-direction: column; height: 100%; }
.code-view-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 8px 14px; background: white; border-bottom: 1px solid #ddd;
}
.code-view-content {
  flex: 1; overflow: auto; margin: 0; padding: 14px;
  font-family: ui-monospace, Consolas, monospace; font-size: 12px;
  background: #fafafa; color: #333; line-height: 1.5;
  white-space: pre-wrap; word-break: break-all;
}
```

- [ ] **Step 5: 테스트 — 수동**

서버 띄우고 브라우저에서:
- 새 메일 만들기 → 제작탭 진입
- 좌측 상단에 `[모듈] [코드]` 탭 보이는지
- 코드 탭 클릭 → 자동 생성된 HTML이 monospace로 보이는지
- 📋 복사 버튼 클릭 → 클립보드에 들어가는지
- 닫기 버튼 누르면 (저장 후) 닫힘
- 미저장 상태에서 닫기 → "아직 변경사항이 저장되지 않았습니다..." confirm

이 시점엔 시퀀스 패널은 스텁("준비 중")이라 모듈 편집은 아직 안 됨. 다음 Phase에서 본격 구현.

- [ ] **Step 6: 커밋**

```bash
git add static/js/editor/index.js static/js/editor/preview.js \
        static/js/editor/sequence.js static/js/editor/codeView.js \
        static/css/style.css
git commit -m "feat(builder): mode toggle + close confirm + simplified preview + code view stub"
```

---

## Phase 5 — 프론트엔드: 라이브러리 + 시퀀스 + 슬롯폼

### Task 5.1: library.js 카테고리별 모듈 목록

**Files:**
- Modify: `_builder/static/js/editor/library.js` (전체 재작성)

- [ ] **Step 1: 재작성**

```js
export function createLibraryPanel(host, state) {
  let activeCategory = "hero";

  function render() {
    const lib = state.library;
    if (!lib || !lib.modules) {
      host.innerHTML = `<div class="library-panel"><div class="library-header">📚 모듈</div><p style="color:#888;font-size:11px;">로딩 중...</p></div>`;
      return;
    }
    const cats = lib.categories || ["hero","body","cta","card","footer"];
    const tabs = cats.map(c =>
      `<button data-cat="${c}" class="${c===activeCategory?"active":""}">${categoryLabel(c)}</button>`
    ).join("");

    const items = Object.entries(lib.modules)
      .filter(([_, m]) => m.category === activeCategory)
      .map(([type, m]) =>
        `<div class="library-item" draggable="true" data-mod-type="${type}">
          <span style="font-size:14px;">${m.icon || ""}</span>
          <span>${m.label}</span>
        </div>`
      ).join("");

    host.innerHTML = `
      <div class="library-panel">
        <div class="library-header">📚 모듈</div>
        <div class="library-tabs">${tabs}</div>
        <div class="library-items">${items}</div>
      </div>
    `;
    attach();
  }

  function attach() {
    host.querySelectorAll(".library-tabs button").forEach(b => {
      b.addEventListener("click", () => { activeCategory = b.dataset.cat; render(); });
    });
    host.querySelectorAll(".library-item").forEach(it => {
      it.addEventListener("dragstart", e => {
        e.dataTransfer.setData("application/x-mod-type", it.dataset.modType);
        e.dataTransfer.effectAllowed = "copy";
      });
    });
  }

  function categoryLabel(cat) {
    return ({hero:"Hero", body:"Body", cta:"CTA", card:"Card", footer:"Footer"})[cat] || cat;
  }

  render();
  return { rerender: render };
}
```

- [ ] **Step 2: CSS 다듬기 — `style.css`에 추가**

```css
.library-items { display: flex; flex-direction: column; gap: 4px; margin-top: 8px; }
.library-item {
  display: flex; align-items: center; gap: 6px;
  background: white; border: 1px solid #ddd; border-radius: 4px;
  padding: 8px 10px; cursor: grab; font-size: 12px;
}
.library-item:hover { border-color: #26c7d9; background: #f0f9fb; }
.library-item:active { cursor: grabbing; }
```

- [ ] **Step 3: 수동 테스트**

브라우저: 모듈 모드에서 라이브러리 패널에 카테고리 탭(Hero/Body/CTA/Card/Footer)이 보이고, 각 탭 클릭 시 해당 모듈들이 나열되는지 확인.

- [ ] **Step 4: 커밋**

```bash
git commit -m "feat(builder): library panel with categorized modules"
```

---

### Task 5.2: sequence.js — 카드 리스트 + 추가/삭제

**Files:**
- Modify: `_builder/static/js/editor/sequence.js`

- [ ] **Step 1: 재작성 (드래그앤드롭은 다음 task)**

```js
import { createSlotForm } from "./slotForm.js";

let _shortIdCounter = 0;
function shortId() { return "mod_" + Date.now().toString(36) + (_shortIdCounter++).toString(36); }

export function createSequencePanel(host, state, onChange) {
  if (state.expandedModuleId === undefined) state.expandedModuleId = null;

  function render() {
    const mail = state.currentMail;
    if (!mail) { host.innerHTML = ""; return; }
    const mods = mail.modules || [];

    host.innerHTML = `
      <div class="sequence">
        <div class="sequence-header">시퀀스 (${mods.length})</div>
        <div class="sequence-list" id="seq-list">
          ${mods.map((m, i) => renderCard(m, i)).join("")}
        </div>
        <div class="sequence-add-hint">↑ 라이브러리에서 모듈을 끌어와 추가하세요</div>
      </div>
    `;
    attach();
  }

  function renderCard(mod, idx) {
    const def = state.library.modules[mod.type];
    if (!def) return `<div class="seq-card error">알 수 없는 모듈: ${mod.type}</div>`;
    const expanded = state.expandedModuleId === mod.id;
    return `
      <div class="seq-card ${expanded ? "expanded" : ""}" data-mod-id="${mod.id}" data-idx="${idx}">
        <div class="seq-card-header" data-action="toggle">
          <span class="seq-handle" data-action="handle">⋮⋮</span>
          <span class="seq-icon">${def.icon || ""}</span>
          <span class="seq-label">${def.label}</span>
          <button class="seq-delete" data-action="delete" title="삭제">✕</button>
        </div>
        ${expanded ? `<div class="seq-card-body" id="slot-host-${mod.id}"></div>` : ""}
      </div>
    `;
  }

  function attach() {
    // 카드 헤더 클릭 → 펼침/접힘
    host.querySelectorAll('[data-action="toggle"]').forEach(h => {
      h.addEventListener("click", e => {
        if (e.target.closest('[data-action]') !== h) return;
        const card = h.closest(".seq-card");
        const id = card.dataset.modId;
        state.expandedModuleId = state.expandedModuleId === id ? null : id;
        render();
        // 펼침 직후 슬롯 폼 마운트
        if (state.expandedModuleId === id) {
          const mod = state.currentMail.modules.find(m => m.id === id);
          createSlotForm(document.getElementById(`slot-host-${id}`), mod, state, onChange);
        }
      });
    });
    // 삭제
    host.querySelectorAll('[data-action="delete"]').forEach(b => {
      b.addEventListener("click", e => {
        e.stopPropagation();
        const card = b.closest(".seq-card");
        const id = card.dataset.modId;
        const idx = state.currentMail.modules.findIndex(m => m.id === id);
        if (idx >= 0) {
          state.currentMail.modules.splice(idx, 1);
          if (state.expandedModuleId === id) state.expandedModuleId = null;
          state.unsavedChanges = true;
          render();
          onChange();
        }
      });
    });
    // 라이브러리에서 드롭 받기
    const list = host.querySelector("#seq-list");
    list.addEventListener("dragover", e => {
      const t = e.dataTransfer.types;
      if (t && Array.from(t).includes("application/x-mod-type")) {
        e.preventDefault();
        e.dataTransfer.dropEffect = "copy";
      }
    });
    list.addEventListener("drop", e => {
      const modType = e.dataTransfer.getData("application/x-mod-type");
      if (!modType) return;
      e.preventDefault();
      const after = e.target.closest(".seq-card");
      const insertAt = after ? parseInt(after.dataset.idx) + 1 : state.currentMail.modules.length;
      const def = state.library.modules[modType];
      const newMod = {
        id: shortId(),
        type: modType,
        slots: defaultRequiredSlots(def),
        options: {},
      };
      state.currentMail.modules.splice(insertAt, 0, newMod);
      state.expandedModuleId = newMod.id;
      state.unsavedChanges = true;
      render();
      // 새로 펼친 카드의 슬롯 폼 마운트
      if (state.expandedModuleId) {
        createSlotForm(document.getElementById(`slot-host-${newMod.id}`), newMod, state, onChange);
      }
      onChange();
    });
    // 펼침 상태 카드의 슬롯 폼 (재렌더 후 마운트)
    if (state.expandedModuleId) {
      const mod = state.currentMail.modules.find(m => m.id === state.expandedModuleId);
      const slotHost = document.getElementById(`slot-host-${state.expandedModuleId}`);
      if (mod && slotHost && !slotHost.dataset.mounted) {
        createSlotForm(slotHost, mod, state, onChange);
        slotHost.dataset.mounted = "1";
      }
    }
  }

  function defaultRequiredSlots(def) {
    const out = {};
    Object.entries(def.slots || {}).forEach(([k, v]) => {
      if (v.required && v.default !== undefined && v.default !== null) {
        out[k] = v.default;
      }
    });
    if (def.repeatableSlot) {
      const cnt = def.repeatableSlot.defaultCount || 1;
      const item = {};
      Object.entries(def.repeatableSlot.perItemSlots || {}).forEach(([k, v]) => {
        if (v.required && v.default !== undefined) item[k] = v.default;
      });
      out[def.repeatableSlot.key] = Array.from({length: cnt}, () => ({...item}));
    }
    return out;
  }

  render();
  return { rerender: render };
}
```

- [ ] **Step 2: slotForm.js 스텁 만들기**

`_builder/static/js/editor/slotForm.js`:
```js
// Phase 5.3에서 본격 구현
export function createSlotForm(host, mod, state, onChange) {
  host.innerHTML = `<div style="padding:12px;color:#888;font-size:12px;">슬롯 폼 — Task 5.3에서 구현 예정. 현재 모듈 type: ${mod.type}</div>`;
}
```

- [ ] **Step 3: CSS 추가**

```css
.sequence { display: flex; flex-direction: column; height: 100%; }
.sequence-header {
  font-size: 12px; font-weight: bold; color: #555; padding: 0 0 8px 4px;
  border-bottom: 1px solid #eee; margin-bottom: 8px;
}
.sequence-list { display: flex; flex-direction: column; gap: 6px; min-height: 60px; }
.sequence-add-hint {
  text-align: center; padding: 12px; color: #aaa; font-size: 11px;
  border: 1px dashed #ddd; border-radius: 4px; margin-top: 8px;
}
.seq-card { background: white; border: 1px solid #ddd; border-radius: 5px; }
.seq-card.expanded { border-color: #26c7d9; }
.seq-card-header {
  display: flex; align-items: center; gap: 6px; padding: 8px 10px; cursor: pointer;
  font-size: 12px;
}
.seq-handle { color: #aaa; cursor: grab; user-select: none; }
.seq-icon { font-size: 14px; }
.seq-label { flex: 1; font-weight: 500; }
.seq-delete {
  background: none; border: none; color: #c00; cursor: pointer; font-size: 13px;
  padding: 0 4px;
}
.seq-card-body { border-top: 1px solid #eee; }
```

- [ ] **Step 4: 수동 테스트**

브라우저: 시퀀스 패널이 보이고, 라이브러리에서 모듈을 끌어다 드롭하면 시퀀스에 추가됨. ✕ 클릭 시 삭제. 카드 클릭 시 펼침/접힘.

- [ ] **Step 5: 커밋**

```bash
git commit -m "feat(builder): sequence panel with add/delete/expand"
```

---

### Task 5.3: slotForm.js — 필수/선택 슬롯 + 공통/고급 옵션

**Files:**
- Modify: `_builder/static/js/editor/slotForm.js` (전체 재작성)

- [ ] **Step 1: 작성**

```js
import { sanitize } from "../api.js";

export function createSlotForm(host, mod, state, onChange) {
  const def = state.library.modules[mod.type];
  if (!def) return;

  function render() {
    const slots = renderSlots(def, mod);
    const repeat = renderRepeatable(def, mod);
    const common = renderOptions(def, mod, "common");
    const advanced = renderOptions(def, mod, "advanced");

    host.innerHTML = `
      <div class="slot-form">
        ${slots ? `<div class="slot-section"><div class="slot-section-title">슬롯</div>${slots}</div>` : ""}
        ${repeat || ""}
        ${common ? `<div class="slot-section"><div class="slot-section-title">옵션</div>${common}</div>` : ""}
        ${advanced ? `<div class="slot-section">
            <div class="slot-section-title collapsible" data-target="advanced">▶ 고급 옵션</div>
            <div class="advanced-options" data-id="advanced" hidden>${advanced}</div>
          </div>` : ""}
      </div>
    `;
    attach();
  }

  function renderSlots(def, mod) {
    const entries = Object.entries(def.slots || {});
    if (!entries.length) return "";
    return entries.map(([key, s]) => {
      const value = mod.slots[key];
      const isPresent = value !== undefined;
      if (s.required) return slotInput(key, s, value !== undefined ? value : (s.default || ""));
      // optional
      if (!isPresent) {
        return `<div class="slot-row optional-off">
          <span class="slot-label">${labelOf(key)}</span>
          <button class="slot-add" data-add-slot="${key}">+ 추가</button>
        </div>`;
      }
      return `<div class="slot-row">
        ${slotInput(key, s, value)}
        <button class="slot-remove" data-remove-slot="${key}">✕</button>
      </div>`;
    }).join("");
  }

  function slotInput(key, s, value) {
    const id = `slot-${key}`;
    const v = value === null || value === undefined ? "" : String(value);
    if (s.type === "richtext") {
      return `<div class="slot-row column">
        <span class="slot-label">${labelOf(key)}${s.required ? ' <span style="color:#c00">*</span>' : ""}</span>
        <div class="slot-richtext" contenteditable="true" data-slot-key="${key}">${v}</div>
      </div>`;
    }
    if (s.type === "color") {
      return `<div class="slot-row">
        <span class="slot-label">${labelOf(key)}</span>
        <input type="color" data-slot-key="${key}" value="${v || "#000000"}">
        <button class="slot-clear" data-clear-slot="${key}">↻</button>
      </div>`;
    }
    if (s.type === "select") {
      const opts = (s.choices || []).map(c => `<option value="${c}" ${String(c)===v?"selected":""}>${c}</option>`).join("");
      return `<div class="slot-row">
        <span class="slot-label">${labelOf(key)}</span>
        <select data-slot-key="${key}">${opts}</select>
      </div>`;
    }
    const inputType = s.type === "number" ? "number" : (s.type === "url" ? "url" : "text");
    return `<div class="slot-row">
      <span class="slot-label">${labelOf(key)}${s.required ? ' <span style="color:#c00">*</span>' : ""}</span>
      <input type="${inputType}" data-slot-key="${key}" value="${esc(v)}">
    </div>`;
  }

  function renderRepeatable(def, mod) {
    if (!def.repeatableSlot) return "";
    const rs = def.repeatableSlot;
    const items = mod.slots[rs.key] || [];
    return `<div class="slot-section">
      <div class="slot-section-title">${rs.label} (${items.length})</div>
      <div class="repeatable-items">
        ${items.map((it, i) => `
          <div class="repeat-item" data-idx="${i}">
            <div class="repeat-item-header">
              <span>#${i+1}</span>
              <button class="repeat-up" data-action="up" data-idx="${i}" ${i===0?"disabled":""}>▲</button>
              <button class="repeat-down" data-action="down" data-idx="${i}" ${i===items.length-1?"disabled":""}>▼</button>
              <button class="repeat-remove" data-action="remove" data-idx="${i}" ${items.length<=rs.minItems?"disabled":""}>✕</button>
            </div>
            ${Object.entries(rs.perItemSlots).map(([k, s]) =>
              `<div class="slot-row">
                 <span class="slot-label">${labelOf(k)}</span>
                 <input type="${s.type==='url'?'url':'text'}" data-rep-key="${rs.key}" data-rep-idx="${i}" data-rep-field="${k}" value="${esc(it[k]||"")}">
               </div>`
            ).join("")}
          </div>
        `).join("")}
      </div>
      ${items.length < rs.maxItems ? `<button class="repeat-add" data-add-rep="${rs.key}">+ ${rs.label} 추가</button>` : ""}
    </div>`;
  }

  function renderOptions(def, mod, tier) {
    const entries = Object.entries(def.options || {}).filter(([_, o]) => o.tier === tier);
    if (!entries.length) return "";
    return entries.map(([key, o]) => {
      const present = key in mod.options;
      const value = present ? mod.options[key] : (o.default ?? "");

      if (tier === "advanced") {
        // 토글로 켜고 끄기
        return `<div class="opt-row">
          <label>
            <input type="checkbox" data-opt-toggle="${key}" ${present ? "checked" : ""}>
            ${labelOf(key)}
          </label>
          ${present ? optInput(key, o, value) : ""}
        </div>`;
      }
      return `<div class="opt-row">
        <span class="opt-label">${labelOf(key)}</span>
        ${optInput(key, o, value)}
      </div>`;
    }).join("");
  }

  function optInput(key, o, value) {
    if (o.type === "color") {
      return `<input type="color" data-opt-key="${key}" value="${value || "#ffffff"}">
              <button class="slot-clear" data-clear-opt="${key}">↻</button>`;
    }
    if (o.type === "select") {
      return `<select data-opt-key="${key}">${(o.choices||[]).map(c =>
        `<option value="${c}" ${String(c)===String(value)?"selected":""}>${c}</option>`).join("")}</select>`;
    }
    const t = o.type === "number" ? "number" : "text";
    return `<input type="${t}" data-opt-key="${key}" value="${esc(value)}">`;
  }

  function attach() {
    // 슬롯 input 변경
    host.querySelectorAll("[data-slot-key]").forEach(el => {
      const ev = el.tagName === "DIV" ? "blur" : "change";
      el.addEventListener(ev, async () => {
        const key = el.dataset.slotKey;
        let val;
        if (el.tagName === "DIV") {
          val = await sanitize(el.innerHTML);
        } else {
          val = el.type === "number" ? parseFloat(el.value) : el.value;
        }
        mod.slots[key] = val;
        state.unsavedChanges = true;
        onChange();
      });
    });
    // 옵션 슬롯 input 변경
    host.querySelectorAll("[data-opt-key]").forEach(el => {
      el.addEventListener("change", () => {
        const key = el.dataset.optKey;
        const val = el.type === "number" ? parseFloat(el.value) : el.value;
        mod.options[key] = val;
        state.unsavedChanges = true;
        onChange();
      });
    });
    // 슬롯 reset
    host.querySelectorAll("[data-clear-slot]").forEach(b => {
      b.addEventListener("click", () => {
        const key = b.dataset.clearSlot;
        delete mod.slots[key];
        state.unsavedChanges = true;
        render();
        onChange();
      });
    });
    host.querySelectorAll("[data-clear-opt]").forEach(b => {
      b.addEventListener("click", () => {
        const key = b.dataset.clearOpt;
        delete mod.options[key];
        state.unsavedChanges = true;
        render();
        onChange();
      });
    });
    // optional 슬롯 추가
    host.querySelectorAll("[data-add-slot]").forEach(b => {
      b.addEventListener("click", () => {
        const key = b.dataset.addSlot;
        mod.slots[key] = def.slots[key].default ?? "";
        state.unsavedChanges = true;
        render();
        onChange();
      });
    });
    host.querySelectorAll("[data-remove-slot]").forEach(b => {
      b.addEventListener("click", () => {
        delete mod.slots[b.dataset.removeSlot];
        state.unsavedChanges = true;
        render();
        onChange();
      });
    });
    // 고급 옵션 토글
    host.querySelectorAll("[data-opt-toggle]").forEach(cb => {
      cb.addEventListener("change", () => {
        const key = cb.dataset.optToggle;
        if (cb.checked) {
          mod.options[key] = def.options[key].default ?? 0;
        } else {
          delete mod.options[key];
        }
        state.unsavedChanges = true;
        render();
        onChange();
      });
    });
    // collapsible
    host.querySelectorAll(".collapsible").forEach(t => {
      t.addEventListener("click", () => {
        const target = host.querySelector(`[data-id="${t.dataset.target}"]`);
        if (target) {
          const open = !target.hidden;
          target.hidden = open;
          t.textContent = (open ? "▶" : "▼") + " 고급 옵션";
        }
      });
    });
    // 반복 슬롯
    host.querySelectorAll("[data-action]").forEach(b => {
      b.addEventListener("click", () => {
        const action = b.dataset.action;
        const idx = parseInt(b.dataset.idx);
        const repKey = def.repeatableSlot?.key;
        if (!repKey) return;
        const arr = mod.slots[repKey];
        if (action === "remove") arr.splice(idx, 1);
        else if (action === "up" && idx > 0) [arr[idx-1], arr[idx]] = [arr[idx], arr[idx-1]];
        else if (action === "down" && idx < arr.length - 1) [arr[idx], arr[idx+1]] = [arr[idx+1], arr[idx]];
        state.unsavedChanges = true;
        render();
        onChange();
      });
    });
    host.querySelectorAll("[data-add-rep]").forEach(b => {
      b.addEventListener("click", () => {
        const repKey = b.dataset.addRep;
        const rs = def.repeatableSlot;
        const newItem = {};
        Object.entries(rs.perItemSlots).forEach(([k, s]) => {
          if (s.required && s.default !== undefined) newItem[k] = s.default;
        });
        mod.slots[repKey] = (mod.slots[repKey] || []).concat([newItem]);
        state.unsavedChanges = true;
        render();
        onChange();
      });
    });
    // 반복 슬롯 input
    host.querySelectorAll("[data-rep-key]").forEach(el => {
      el.addEventListener("change", () => {
        const key = el.dataset.repKey;
        const idx = parseInt(el.dataset.repIdx);
        const field = el.dataset.repField;
        mod.slots[key][idx][field] = el.value;
        state.unsavedChanges = true;
        onChange();
      });
    });
  }

  function labelOf(key) {
    return ({
      heading:"제목", subtitle:"부제", body:"본문", logoSrc:"로고 URL",
      imageSrc:"이미지 URL", imageAlt:"대체 텍스트", caption:"캡션",
      label:"라벨", href:"URL", microcopy:"마이크로카피", headline:"헤드라인",
      linkHref:"링크 URL", title:"제목",
      companyName:"회사명", contactEmail:"문의 이메일",
      padding:"패딩", bgColor:"배경색", borderColor:"테두리 색", borderWidth:"테두리 두께",
      borderRadius:"모서리 둥글기", marginBottom:"하단 여백", alignment:"정렬",
      headingSize:"제목 크기", logoWidth:"로고 폭", imageWidth:"이미지 폭",
      imagePos:"이미지 위치", size:"크기", microcopySize:"마이크로카피 크기",
      columns:"컬럼 수", gap:"간격",
    })[key] || key;
  }

  function esc(s) {
    return String(s ?? "").replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  }

  render();
}
```

- [ ] **Step 2: api.js에 sanitize 함수 추가 (없다면)**

`_builder/static/js/api.js`에 다음이 없으면 추가:
```js
export async function sanitize(html) {
  const r = await fetch("/api/sanitize", {
    method: "POST", headers: {"Content-Type": "application/json"},
    body: JSON.stringify({ html })
  });
  if (!r.ok) return html;
  const d = await r.json();
  return d.html;
}
```

(`api` 객체에도 `sanitize` 멤버 추가 또는 named export 유지)

- [ ] **Step 3: CSS 추가**

```css
.slot-form { padding: 10px 12px; background: #fafafa; }
.slot-section { margin-bottom: 14px; }
.slot-section-title {
  font-size: 11px; font-weight: bold; color: #888; text-transform: uppercase;
  margin-bottom: 6px; letter-spacing: 0.5px;
}
.slot-section-title.collapsible { cursor: pointer; }
.slot-row {
  display: flex; align-items: center; gap: 8px; margin-bottom: 6px;
  font-size: 12px;
}
.slot-row.column { flex-direction: column; align-items: stretch; }
.slot-label { min-width: 80px; color: #555; flex-shrink: 0; }
.slot-row input[type="text"], .slot-row input[type="url"], .slot-row input[type="number"],
.slot-row select { flex: 1; padding: 4px 6px; border: 1px solid #ccc; border-radius: 3px; font-size: 12px; }
.slot-row input[type="color"] { width: 28px; height: 22px; padding: 0; border: none; cursor: pointer; }
.slot-richtext {
  flex: 1; min-height: 50px; padding: 6px; border: 1px solid #ccc; border-radius: 3px;
  background: white; font-size: 13px; line-height: 1.5;
}
.slot-richtext:focus { outline: 2px solid #26c7d9; outline-offset: -1px; }
.slot-add, .slot-remove, .slot-clear {
  background: none; border: 1px solid #ddd; border-radius: 3px; cursor: pointer;
  padding: 2px 8px; font-size: 11px; color: #666;
}
.slot-add:hover { background: #f0f9fb; border-color: #26c7d9; color: #26c7d9; }
.opt-row { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; font-size: 12px; }
.opt-row label { display: flex; align-items: center; gap: 6px; min-width: 110px; }
.repeatable-items { display: flex; flex-direction: column; gap: 8px; }
.repeat-item { background: white; border: 1px solid #ddd; border-radius: 4px; padding: 8px; }
.repeat-item-header { display: flex; gap: 4px; margin-bottom: 6px; align-items: center; font-size: 11px; }
.repeat-item-header button { padding: 1px 6px; font-size: 10px; cursor: pointer; }
.repeat-add {
  background: white; border: 1px dashed #aaa; border-radius: 4px; padding: 6px;
  font-size: 11px; cursor: pointer; width: 100%; margin-top: 6px;
}
.advanced-options { padding-left: 8px; border-left: 2px solid #eee; }
```

- [ ] **Step 4: 수동 테스트**

- 시퀀스 카드 클릭 → 슬롯 폼 펼침
- 필수 슬롯에 값 입력 → 미리보기 즉시 반영
- 선택 슬롯 "+ 추가" 클릭 → input 노출
- 고급 옵션 ▶ 클릭 → 펼침. margin-bottom 체크박스 켜고 값 입력 → HTML에 반영
- card_grid 모듈에서 카드 추가/삭제/순서변경 동작

- [ ] **Step 5: 커밋**

```bash
git commit -m "feat(builder): slot form with required/optional/repeatable + tiered options"
```

---

## Phase 6 — 클라이언트 렌더 + 정합성 테스트

### Task 6.1: editor/renderer.js 클라이언트 렌더

**Files:**
- Modify: `_builder/static/js/editor/renderer.js`

- [ ] **Step 1: 서버 렌더와 동일한 출력을 내는 JS 렌더러 작성**

서버 `renderer.py`의 각 함수 1:1 포팅. 길지만 단순 변환.

핵심: `renderMail(mail, library)`이 `<!DOCTYPE html>...` 문자열 반환.

(전체 코드 길이상 별첨 — 본 task 실행 시 서버 `renderer.py` 로직을 동일하게 JS로 작성. `data-module-id`, font 매핑, 슬롯/옵션 키, 기본값 모두 동일.)

- [ ] **Step 2: 정합성 테스트 — pytest로 두 렌더 비교**

`_builder/tests/test_renderer_fidelity_v2.py`:
```python
"""서버 vs 클라이언트 렌더가 동일 sample 메일에서 동일 HTML 내는지 검증."""
import json
import re
import subprocess
from pathlib import Path

SAMPLE = Path(__file__).parent / "sample_v2.json"
ROOT = Path(__file__).parent.parent

def test_server_render_matches_client_render():
    """sample_v2.json을 양쪽 렌더에 넣고 normalize한 결과 동일성 검증."""
    mail = json.loads(SAMPLE.read_text(encoding="utf-8"))

    from server.renderer import render_mail
    server_html = render_mail(mail)

    # node 또는 python으로 클라이언트 렌더러 실행 (간단 채널: tests/render_with_client.js)
    runner = ROOT / "tests" / "run_client_render.js"
    result = subprocess.run(
        ["node", str(runner)], input=json.dumps(mail).encode(),
        capture_output=True, check=True
    )
    client_html = result.stdout.decode()

    def norm(s):
        return re.sub(r"\s+", " ", s).strip()

    assert norm(server_html) == norm(client_html)
```

`_builder/tests/sample_v2.json`:
```json
{
  "id": "test", "title": "샘플", "language": "ko", "createdAt": "2026-04-30",
  "modules": [
    {"id": "m1", "type": "hero", "slots": {"heading": "안녕", "subtitle": "부제"}, "options": {"padding": 30}},
    {"id": "m2", "type": "body", "slots": {"body": "<p>본문</p>"}, "options": {}},
    {"id": "m3", "type": "cta_solo", "slots": {"label": "시작", "href": "https://x"}, "options": {}},
    {"id": "m4", "type": "footer_unsubscribe", "slots": {}, "options": {}}
  ]
}
```

`_builder/tests/run_client_render.js`:
```js
import fs from "node:fs";
import { renderMail } from "../static/js/editor/renderer.js";

const mail = JSON.parse(fs.readFileSync(0, "utf-8"));
// library를 catalog와 동기 처리: 서버 schema의 default 값들이 필요하므로 minimal stub
import { MODULE_CATALOG } from "../tests/library_stub.mjs";  // node-호환 ESM
process.stdout.write(renderMail(mail, { modules: MODULE_CATALOG }));
```

(node가 없는 환경이면 이 정합성 테스트는 매뉴얼 체크로 대체. v1처럼 sample HTML을 만들어두고 서버 렌더 결과만 검증해도 OK.)

- [ ] **Step 3: 테스트 통과 확인**

```bash
python -m pytest tests/test_renderer_fidelity_v2.py -v
```

(node 없으면 skip)

- [ ] **Step 4: 커밋**

```bash
git commit -m "feat(builder): client renderer + fidelity test against server"
```

---

## Phase 7 — 미리보기 포커싱 + 드래그앤드롭

### Task 7.1: 시퀀스 카드 클릭/슬롯 focus → iframe outline

**Files:**
- Modify: `_builder/static/js/editor/sequence.js`
- Modify: `_builder/static/js/editor/slotForm.js`
- Modify: `_builder/static/js/editor/index.js`

- [ ] **Step 1: index.js에서 preview를 sequence/slotForm에 전달**

`renderEditorTab` 안의 `onChange` 정의 부분 + 패널 생성 부분을 다음과 같이:

```js
function onChange() {
  onStateChange();
  if (preview) preview.rerender();
  document.getElementById("save-btn")?.removeAttribute("disabled");
}

function onFocusModule(modId) {
  if (preview) preview.focus(modId);
}

if (state.editorMode === "modules") {
  libraryPanel = createLibraryPanel(document.getElementById("library-host"), state);
  sequencePanel = createSequencePanel(
    document.getElementById("sequence-host"), state, onChange, onFocusModule
  );
} else { ... }
```

- [ ] **Step 2: sequence.js의 createSequencePanel 시그니처 갱신**

```js
export function createSequencePanel(host, state, onChange, onFocusModule = ()=>{}) {
  ...
}
```

펼침 시 `onFocusModule(id)` 호출, 접힘 시 `onFocusModule(null)`. 카드 클릭 외에도 펼친 상태 카드 클릭 시 focus 재호출.

slotForm 호출 시도 onFocusModule 전달:
```js
createSlotForm(slotHost, mod, state, onChange, () => onFocusModule(mod.id));
```

- [ ] **Step 3: slotForm.js에서 input focus 시 onFocusModule 호출**

`createSlotForm(host, mod, state, onChange, onFocusFire)` 시그니처. attach 끝부분에:
```js
host.querySelectorAll("input, select, .slot-richtext").forEach(el => {
  el.addEventListener("focus", () => onFocusFire && onFocusFire());
});
```

- [ ] **Step 4: 수동 테스트**

- 시퀀스 카드 클릭 → 우측 미리보기에서 해당 모듈에 시안색 outline + 자동 스크롤
- 슬롯 input 클릭 → 동일
- 다른 카드 클릭 → outline 이동
- 카드 접기 → outline 사라짐

- [ ] **Step 5: 커밋**

```bash
git commit -m "feat(builder): preview focus on module edit via postMessage"
```

---

### Task 7.2: Sortable.js로 시퀀스 카드 재정렬 (스크롤 보존)

**Files:**
- Modify: `_builder/static/js/editor/sequence.js`

- [ ] **Step 1: attach() 끝부분에 Sortable 초기화 추가**

```js
function initSortable() {
  if (!window.Sortable) return;
  const list = host.querySelector("#seq-list");
  if (!list) return;
  if (list._sortable) list._sortable.destroy();
  list._sortable = new Sortable(list, {
    handle: ".seq-handle",
    animation: 150,
    onEnd: (e) => {
      if (e.oldIndex === e.newIndex) return;
      const mods = state.currentMail.modules;
      const [moved] = mods.splice(e.oldIndex, 1);
      mods.splice(e.newIndex, 0, moved);
      state.unsavedChanges = true;
      // **재렌더 없이** 데이터만 갱신 — 스크롤 위치 보존
      // DOM은 Sortable.js가 이미 옮겼고, data-idx만 갱신 필요
      list.querySelectorAll(".seq-card").forEach((card, i) => {
        card.dataset.idx = i;
      });
      onChange();
    },
  });
}
```

`attach()` 마지막 줄에 `initSortable();` 호출 추가.

- [ ] **Step 2: 수동 테스트 — 스크롤 보존 확인**

- 시퀀스에 모듈 8~10개 추가 (스크롤 생기게)
- 아래쪽 카드를 드래그해서 순서 바꿈
- **드롭 후 스크롤 위치가 그대로 유지되는지** (v1 버그 재발 X) 확인

- [ ] **Step 3: 커밋**

```bash
git commit -m "feat(builder): drag&drop reorder with scroll preservation"
```

---

## Phase 8 — Undo + 통합 테스트 + 정리

### Task 8.1: Undo 통합 (시퀀스 단위 스냅샷)

**Files:**
- Modify: `_builder/static/js/editor/sequence.js`
- Modify: `_builder/static/js/editor/slotForm.js`

- [ ] **Step 1: snapshot 호출 추가**

`onChange` 호출 직전에 `state.undoStack.push(JSON.parse(JSON.stringify(state.currentMail.modules)))`. sequence.js의 모듈 추가/삭제/이동 + slotForm의 슬롯 변경 직전.

(undo.js는 v1 그대로 사용)

- [ ] **Step 2: 단축키 핸들러 — Ctrl+Z**

`editor/index.js` 안에 (이미 v1에 있는 패턴 재사용):
```js
function bindUndoShortcut() {
  if (window._builderUndoBound) return;
  window._builderUndoBound = true;
  document.addEventListener("keydown", e => {
    if (!(e.ctrlKey || e.metaKey) || e.key !== "z") return;
    if (!state.editingMailId) return;
    e.preventDefault();
    const prev = state.undoStack.pop();
    if (prev) {
      state.currentMail.modules = prev;
      state.unsavedChanges = true;
      onStateChange();
    }
  });
}
bindUndoShortcut();
```

- [ ] **Step 3: 수동 테스트**

모듈 추가 → Ctrl+Z → 추가 취소.

- [ ] **Step 4: 커밋**

```bash
git commit -m "feat(builder): undo on module sequence changes"
```

---

### Task 8.2: 매뉴얼 체크리스트 작성 + 통과

**Files:**
- Create: `_builder/tests/manual_v2.md`

- [ ] **Step 1: 체크리스트 작성**

`_builder/tests/manual_v2.md`:
```markdown
# v2 매뉴얼 통과 체크리스트

브라우저: Chrome/Edge 최신, http://localhost:5001/

## 모드 토글
- [ ] 신규 메일 만들면 좌측 [모듈]/[코드] 탭이 보임
- [ ] [코드] 탭 클릭 → 자동 생성 HTML이 monospace로 표시
- [ ] 코드 모드 우상단에 "📋 복사" 버튼이 있고 클릭 시 클립보드에 복사됨
- [ ] [모듈] 탭으로 돌아갈 때 데이터 유지

## 모듈 작업
- [ ] 라이브러리에 5개 카테고리 (Hero/Body/CTA/Card/Footer)
- [ ] 카테고리 별 모듈 합계 12개
- [ ] 라이브러리에서 모듈을 시퀀스에 드래그앤드롭 → 추가됨
- [ ] 시퀀스 카드 ✕ 클릭 → 모듈 삭제
- [ ] 카드 클릭 → 펼침. 다른 카드 클릭 시 이전 카드 자동 접힘

## 슬롯
- [ ] 필수 슬롯은 항상 input 노출
- [ ] 선택 슬롯 "+ 추가" 클릭 → input 노출, "✕"로 제거 가능
- [ ] richtext 슬롯에서 B/U/H1/H2/H3/링크 툴바 동작
- [ ] card_grid 모듈: 카드 추가/삭제/순서변경 (▲▼) 동작

## 옵션
- [ ] 공통 옵션 항상 보임
- [ ] "고급 옵션 ▶" 클릭 → 펼침
- [ ] 고급 옵션 체크박스 켬 → input 활성화 + 출력 HTML에 반영
- [ ] 체크 끔 → 출력 HTML에 해당 옵션 사라짐

## 미리보기 포커싱
- [ ] 시퀀스 카드 클릭 → 미리보기에서 해당 모듈에 시안색 outline
- [ ] 슬롯 input focus → 동일하게 outline
- [ ] 카드 접기 / 다른 영역 클릭 → outline 사라짐
- [ ] outline 표시 시 해당 모듈로 자동 스크롤

## 드래그앤드롭
- [ ] 카드 핸들 ⋮⋮ 잡고 위/아래 드래그 → 순서 변경
- [ ] 시퀀스 8개 이상 추가해 스크롤 생기게
- [ ] 아래쪽 카드를 위로 드래그 후 드롭 → **스크롤 위치 유지**

## 저장 / 닫기
- [ ] 변경 후 [저장] 클릭 → "저장됨" alert
- [ ] 미저장 상태에서 [닫기] 클릭 → "아직 변경사항이 저장되지 않았습니다. 그래도 닫으시겠습니까?" confirm
- [ ] 저장 상태에서 [닫기] 클릭 → 즉시 닫힘
- [ ] 새로고침/탭닫기 시 미저장이면 브라우저 경고

## Undo
- [ ] 모듈 추가 → Ctrl+Z → 취소됨
- [ ] 슬롯 값 변경 → Ctrl+Z → 이전 값 복원

## 비교탭
- [ ] 사이드바에서 메일 2개 비교 활성화 → 비교탭에서 나란히 보임
- [ ] 데스크톱 600 / 모바일 375 / 슬라이더 동작
- [ ] iframe 자동 높이로 메일 하단 흰 여백 없음 (Phase 0 픽스)
```

- [ ] **Step 2: 모든 항목 통과 확인**

브라우저에서 직접 체크리스트 따라가며 확인. 실패 항목은 코드 수정 후 재확인.

- [ ] **Step 3: 커밋**

```bash
git add tests/manual_v2.md
git commit -m "docs(builder): v2 manual test checklist"
```

---

### Task 8.3: README 갱신 + 최종 정리

**Files:**
- Modify: `_builder/README.md`

- [ ] **Step 1: README 갱신**

```markdown
# CRM 메일 빌더 v2

로컬 단일 사용자 이메일 빌더 — 모듈 시퀀스 모델.

## 실행

```bash
pip install -r requirements.txt
python app.py
# http://localhost:5001
```

## 문서
- 설계: `../docs/DESIGN_v2.md`
- 구현: `../docs/PLAN_v2.md`
- 매뉴얼 테스트: `tests/manual_v2.md`

## 테스트
```bash
python -m pytest tests/ -v
```
```

- [ ] **Step 2: 최종 모든 테스트 실행**

```bash
python -m pytest tests/ -v
```

기대: 전부 PASS.

- [ ] **Step 3: 커밋**

```bash
git commit -m "docs(builder): update README for v2"
```

---

## 자체 점검 (Self-Review)

### 1. 스펙 커버리지
- v2 §10.1 기능: Phase 1~8 전체에서 다룸 ✓
- v2 §10.2 비기능 (백업/렌더 정합성/pytest/매뉴얼): Task 0.1, 6.1, 8.2 ✓
- 12개 모듈: Phase 1 (Tasks 1.1~1.5) + Phase 2 (Tasks 2.1~2.5) ✓
- 슬롯 3종: 필수/선택은 Task 5.3, 반복은 Task 5.3의 renderRepeatable ✓
- 옵션 2티어: Task 5.3 renderOptions(tier) ✓
- 코드 모드 (읽기전용 + 복사): Task 4.1의 codeView.js ✓
- 닫기 confirm: Task 4.1 ✓
- 드래그앤드롭 + 스크롤 보존: Task 7.2 ✓
- 미리보기 포커싱: Task 7.1 ✓

### 2. Placeholder 스캔
없음. 모든 Task에 실제 코드 / 명령 / 기대 결과 포함.

(예외: Task 6.1 Step 1의 클라이언트 렌더러 본문은 "서버 1:1 포팅"으로만 명시. 실제 작업 시 server/renderer.py의 모든 함수를 JS로 그대로 옮겨야 함. 시간 추정 1시간.)

### 3. 타입 일관성
- 모듈 인스턴스: `{id, type, slots, options}` — 모든 Task 동일
- 슬롯 타입 키: `text|richtext|url|image|color|number|select` — DESIGN §3.3과 일치
- 옵션 tier: `"common"|"advanced"` — DESIGN §3.2와 일치
- `data-module-id` 속성 — Task 2.1 (renderer)과 Task 7.1 (focus)에서 동일

---

## 실행 핸드오프

플랜 완료. `docs/PLAN_v2.md`에 저장됨. 두 가지 실행 옵션:

**1. Subagent-Driven (권장)** — Task별로 fresh subagent 띄우고 사이마다 리뷰. 빠른 반복.

**2. Inline Execution** — 이 세션에서 executing-plans 스킬로 배치 실행 + 체크포인트.

어느 방식으로 갈까요?
