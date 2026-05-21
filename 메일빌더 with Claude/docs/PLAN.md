# CRM 메일 빌더 구현 플랜

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** PRD/DESIGN 기반으로 `_builder/` Flask 앱을 단계별 TDD로 구축. v1 완료 기준 (PRD §12) 모두 통과.

**Architecture:** Flask(API) + 단일 SPA(static HTML+CSS+JS). 데이터는 메일당 1 JSON 파일. 렌더러는 서버·프론트 양쪽 구현하고 자동 정합성 테스트.

**Tech Stack:** Python 3.14, Flask, Sortable.js (CDN), pytest. 빌드 도구 없음.

**관련 문서:** [`docs/PRD.md`](./PRD.md), [`docs/DESIGN.md`](./DESIGN.md)

---

## Phase 0 — 프로젝트 셋업

### Task 0.1: 디렉토리 구조 + git 초기화

**Files:**
- Create: `_builder/`, `_builder/server/`, `_builder/static/css/`, `_builder/static/js/editor/`, `_builder/mails/`, `_builder/tests/`
- Create: `_builder/.gitignore`
- Create: `_builder/requirements.txt`
- Create: `_builder/README.md`

- [ ] **Step 1: 폴더 만들기**

```bash
cd _builder
mkdir -p server static/css static/js/editor mails tests
```

- [ ] **Step 2: `_builder/.gitignore` 작성**

```gitignore
__pycache__/
*.pyc
.pytest_cache/
mails/*.json
mails/.backup/
.superpowers/
```

- [ ] **Step 3: `_builder/requirements.txt` 작성**

```
flask>=3.0.0
pytest>=8.0.0
beautifulsoup4>=4.12.0
```

- [ ] **Step 4: `_builder/README.md` 작성**

```markdown
# CRM 메일 빌더

로컬 단일 사용자 이메일 빌더. PRD: `../docs/PRD.md`, 설계: `../docs/DESIGN.md`.

## 실행
\`\`\`bash
pip install -r requirements.txt
python app.py
# http://localhost:5001 접속
\`\`\`

## 테스트
\`\`\`bash
pytest
\`\`\`
```

- [ ] **Step 5: 의존성 설치**

```bash
cd _builder
pip install -r requirements.txt
```
Expected: Flask + pytest + bs4 설치 (또는 이미 설치됨)

- [ ] **Step 6: 저장소 루트에서 git init (없으면)**

```bash
cd ..  # crm/ 루트로
git init 2>/dev/null || echo "already a repo or skip"
git add docs/ _builder/
git commit -m "feat: scaffold _builder project structure"
```

---

## Phase 1 — Flask 백엔드 골격

### Task 1.1: 최소 Flask 앱 + 정적 파일 서빙

**Files:**
- Create: `_builder/app.py`
- Create: `_builder/static/index.html`
- Create: `_builder/server/__init__.py`
- Test: `_builder/tests/test_app.py`

- [ ] **Step 1: `_builder/server/__init__.py` 빈 파일**

```python
# Empty package marker
```

- [ ] **Step 2: 최소 `_builder/static/index.html`**

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>CRM 메일 빌더</title>
</head>
<body>
  <div id="app">로딩 중...</div>
</body>
</html>
```

- [ ] **Step 3: 실패 테스트 작성 — `_builder/tests/test_app.py`**

```python
from app import app

def test_root_serves_index():
    client = app.test_client()
    rv = client.get("/")
    assert rv.status_code == 200
    assert b"CRM" in rv.data

def test_static_css_path_exists():
    client = app.test_client()
    rv = client.get("/static/css/style.css")
    # 빈 파일이라도 200이 와야
    assert rv.status_code in (200, 304)
```

- [ ] **Step 4: 테스트 실행 (실패 확인)**

```bash
cd _builder
pytest tests/test_app.py -v
```
Expected: import error (app 없음)

- [ ] **Step 5: `_builder/app.py` 최소 구현**

```python
from pathlib import Path
from flask import Flask, send_from_directory

PIPELINE_DIR = Path(__file__).parent
STATIC_DIR = PIPELINE_DIR / "static"

app = Flask(__name__, static_folder=str(STATIC_DIR), static_url_path="/static")


@app.route("/")
def index():
    return send_from_directory(str(STATIC_DIR), "index.html")


if __name__ == "__main__":
    print("http://localhost:5001 에서 접속하세요.")
    app.run(host="127.0.0.1", port=5001, debug=True)
```

- [ ] **Step 6: 빈 css 파일 생성**

```bash
touch _builder/static/css/style.css
```

- [ ] **Step 7: 테스트 통과 확인**

```bash
pytest tests/test_app.py -v
```
Expected: PASS

- [ ] **Step 8: 수동 실행 확인**

```bash
python app.py
```
브라우저에서 http://localhost:5001 → "로딩 중..." 표시 확인. Ctrl+C로 종료.

- [ ] **Step 9: 커밋**

```bash
git add _builder/
git commit -m "feat(builder): minimal Flask app serves index.html"
```

---

## Phase 2 — 라이브러리 정의 + API

### Task 2.1: `server/library.py` 작성 (레이아웃 5 + 박스 1 + 요소 5)

**Files:**
- Create: `_builder/server/library.py`
- Test: `_builder/tests/test_library.py`

- [ ] **Step 1: 실패 테스트 — `_builder/tests/test_library.py`**

```python
from server.library import LAYOUTS, ELEMENTS, BOXES, PRESETS, get_library


def test_layouts_count():
    assert len(LAYOUTS) == 5
    assert set(LAYOUTS.keys()) == {"1col", "2col-50-50", "2col-33-67", "2col-67-33", "3col"}


def test_layout_1col_has_required_fields():
    layout = LAYOUTS["1col"]
    assert layout["label"] == "1열"
    assert layout["cells"] == 1
    assert "default_padding" in layout


def test_elements_count():
    assert len(ELEMENTS) == 5
    assert set(ELEMENTS.keys()) == {"text", "image", "button", "divider", "spacer"}


def test_box_exists():
    assert "box" in BOXES
    assert BOXES["box"]["label"] == "박스"


def test_get_library_returns_full_dict():
    lib = get_library()
    assert "layouts" in lib
    assert "boxes" in lib
    assert "elements" in lib
    assert "presets" in lib
    assert len(lib["presets"]) == 14
```

- [ ] **Step 2: 테스트 실행 (실패 확인)**

```bash
pytest tests/test_library.py -v
```
Expected: ImportError

- [ ] **Step 3: `_builder/server/library.py` 구현**

```python
"""레이아웃·박스·요소·프리셋 정의. 하드코딩된 라이브러리."""

LAYOUTS = {
    "1col": {
        "label": "1열",
        "cells": 1,
        "default_padding": {"top": 30, "right": 20, "bottom": 30, "left": 20},
        "default_bg": None,
    },
    "2col-50-50": {
        "label": "2열 50:50",
        "cells": 2,
        "cell_widths": ["50%", "50%"],
        "default_padding": {"top": 30, "right": 20, "bottom": 30, "left": 20},
        "default_bg": None,
    },
    "2col-33-67": {
        "label": "2열 33:67",
        "cells": 2,
        "cell_widths": ["33%", "67%"],
        "default_padding": {"top": 30, "right": 20, "bottom": 30, "left": 20},
        "default_bg": None,
    },
    "2col-67-33": {
        "label": "2열 67:33",
        "cells": 2,
        "cell_widths": ["67%", "33%"],
        "default_padding": {"top": 30, "right": 20, "bottom": 30, "left": 20},
        "default_bg": None,
    },
    "3col": {
        "label": "3열 33:33:33",
        "cells": 3,
        "cell_widths": ["33%", "33%", "34%"],
        "default_padding": {"top": 30, "right": 20, "bottom": 30, "left": 20},
        "default_bg": None,
    },
}

BOXES = {
    "box": {
        "label": "박스",
        "default_padding": {"top": 16, "right": 16, "bottom": 16, "left": 16},
        "default_bg": "#ffffff",
        "default_border_color": "#dddddd",
        "default_border_width": 1,
        "default_border_radius": 4,
    },
}

ELEMENTS = {
    "text": {
        "label": "텍스트",
        "icon": "📝",
        "default": {"html": "<p>텍스트를 입력하세요</p>"},
    },
    "image": {
        "label": "이미지",
        "icon": "🖼",
        "default": {
            "src": "https://placehold.co/600x300?text=이미지",
            "alt": "이미지",
            "width": 600,
            "align": "center",
        },
    },
    "button": {
        "label": "버튼",
        "icon": "🔘",
        "default": {
            "label": "버튼",
            "href": "https://example.com",
            "bgColor": "#26c7d9",
            "size": "medium",
            "align": "center",
        },
    },
    "divider": {
        "label": "구분선",
        "icon": "━",
        "default": {"color": "#dddddd", "thickness": 1, "width": "100%"},
    },
    "spacer": {
        "label": "여백",
        "icon": "↕",
        "default": {"height": 24},
    },
}

# 프리셋은 Task 5.1에서 채움
PRESETS = {}


def get_library():
    """API에서 사용할 라이브러리 전체 반환."""
    return {
        "layouts": LAYOUTS,
        "boxes": BOXES,
        "elements": ELEMENTS,
        "presets": PRESETS,
    }
```

- [ ] **Step 4: 14 프리셋 미정이라 테스트 14개 expectation 임시 조정**

테스트의 `len(lib["presets"]) == 14` 부분이 실패할 것. **이 단계에선 프리셋 0개를 허용하도록 일시 변경.**

```python
# tests/test_library.py 의 test_get_library_returns_full_dict 수정
def test_get_library_returns_full_dict():
    lib = get_library()
    assert "layouts" in lib
    assert "boxes" in lib
    assert "elements" in lib
    assert "presets" in lib
    # 프리셋은 Phase 5에서 14개로 채울 예정
    assert isinstance(lib["presets"], dict)
```

- [ ] **Step 5: 테스트 통과**

```bash
pytest tests/test_library.py -v
```
Expected: PASS

- [ ] **Step 6: 커밋**

```bash
git add _builder/server/library.py _builder/tests/test_library.py
git commit -m "feat(builder): define layout/box/element library (presets pending)"
```

---

### Task 2.2: API 라우트 — `GET /api/library`

**Files:**
- Create: `_builder/server/routes.py`
- Modify: `_builder/app.py`
- Test: `_builder/tests/test_api_library.py`

- [ ] **Step 1: 실패 테스트**

```python
# tests/test_api_library.py
from app import app


def test_get_library_returns_json():
    client = app.test_client()
    rv = client.get("/api/library")
    assert rv.status_code == 200
    data = rv.get_json()
    assert "layouts" in data
    assert "elements" in data
    assert len(data["layouts"]) == 5
```

- [ ] **Step 2: 테스트 실행 (실패)**

```bash
pytest tests/test_api_library.py -v
```
Expected: 404

- [ ] **Step 3: `_builder/server/routes.py` 작성**

```python
from flask import Blueprint, jsonify

from . import library

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.route("/library", methods=["GET"])
def get_library():
    return jsonify(library.get_library())
```

- [ ] **Step 4: `_builder/app.py`에 블루프린트 등록**

```python
# app.py 의 app 생성 직후 추가
from server.routes import api_bp
app.register_blueprint(api_bp)
```

- [ ] **Step 5: 테스트 통과**

```bash
pytest tests/test_api_library.py -v
```
Expected: PASS

- [ ] **Step 6: 수동 확인**

```bash
python app.py
# 다른 터미널: curl http://localhost:5001/api/library
```
JSON 응답 확인. Ctrl+C 종료.

- [ ] **Step 7: 커밋**

```bash
git add _builder/server/routes.py _builder/app.py _builder/tests/test_api_library.py
git commit -m "feat(builder): GET /api/library endpoint"
```

---

## Phase 3 — 데이터 모델 + 렌더러

### Task 3.1: 메일 트리 → HTML 렌더러 (1열 + 텍스트만)

**Files:**
- Create: `_builder/server/renderer.py`
- Test: `_builder/tests/test_renderer_basic.py`

- [ ] **Step 1: 실패 테스트**

```python
# tests/test_renderer_basic.py
from server.renderer import render_mail


SAMPLE_TREE = {
    "id": "test-001",
    "title": "테스트",
    "language": "ko",
    "tree": {
        "layouts": [
            {
                "id": "lay-1",
                "type": "1col",
                "padding": None,
                "bgColor": None,
                "cells": [
                    {
                        "id": "cell-1",
                        "items": [
                            {
                                "kind": "element",
                                "id": "el-1",
                                "type": "text",
                                "html": "<h1>안녕하세요</h1>"
                            }
                        ]
                    }
                ]
            }
        ]
    }
}


def test_render_includes_doctype():
    html = render_mail(SAMPLE_TREE)
    assert html.startswith("<!DOCTYPE html>")


def test_render_includes_title():
    html = render_mail(SAMPLE_TREE)
    assert "<title>테스트</title>" in html


def test_render_includes_text_content():
    html = render_mail(SAMPLE_TREE)
    assert "안녕하세요" in html


def test_render_uses_table_layout():
    html = render_mail(SAMPLE_TREE)
    # 이메일 호환성: 외곽 테이블 + 600px 폭
    assert "<table" in html
    assert "max-width:600px" in html or "max-width: 600px" in html


def test_render_korean_lang():
    html = render_mail(SAMPLE_TREE)
    assert 'lang="ko"' in html
```

- [ ] **Step 2: 테스트 실행 (실패)**

```bash
pytest tests/test_renderer_basic.py -v
```

- [ ] **Step 3: `_builder/server/renderer.py` 구현**

```python
"""JSON 트리 → 이메일 HTML 렌더러."""
from . import library


FONT_STACKS = {
    "ja": "'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Meiryo', sans-serif",
    "ko": "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
    "en": "Arial, Helvetica, sans-serif",
    "pt-BR": "Arial, Helvetica, sans-serif",
}


def render_mail(mail: dict) -> str:
    title = mail.get("title", "메일")
    language = mail.get("language", "ko")
    font_stack = FONT_STACKS.get(language, FONT_STACKS["ko"])
    tree = mail.get("tree", {"layouts": []})

    body_html = _render_layouts(tree.get("layouts", []))

    return f'''<!DOCTYPE html>
<html lang="{language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>{title}</title>
  <style>
    @media screen and (max-width: 600px) {{
      .mobile-stack {{ display: block !important; width: 100% !important; }}
    }}
  </style>
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family:{font_stack}; color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#fff;">
{body_html}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>'''


def _render_layouts(layouts: list) -> str:
    return "\n".join(_render_layout(l) for l in layouts)


def _render_layout(layout: dict) -> str:
    layout_def = library.LAYOUTS[layout["type"]]
    padding = _resolve_padding(layout.get("padding"), layout_def["default_padding"])
    bg = layout.get("bgColor") or layout_def.get("default_bg")
    style = _padding_style(padding) + (f"background-color:{bg};" if bg else "")

    cells_html = "".join(_render_cell(c, layout_def, i) for i, c in enumerate(layout["cells"]))

    if layout_def["cells"] == 1:
        return f'          <tr><td style="{style}">{cells_html}</td></tr>'
    # 다열은 nested table
    return (
        f'          <tr><td style="{style}">'
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>{cells_html}</tr></table>'
        f'</td></tr>'
    )


def _render_cell(cell: dict, layout_def: dict, idx: int) -> str:
    if layout_def["cells"] == 1:
        # 1열은 td 하나, items만 직접
        return _render_items(cell.get("items", []))
    width = layout_def["cell_widths"][idx]
    items_html = _render_items(cell.get("items", []))
    return f'<td width="{width}" valign="top" class="mobile-stack">{items_html}</td>'


def _render_items(items: list) -> str:
    return "".join(_render_item(it) for it in items)


def _render_item(item: dict) -> str:
    if item["kind"] == "element":
        return _render_element(item)
    if item["kind"] == "box":
        return _render_box(item)
    return ""


def _render_element(el: dict) -> str:
    t = el["type"]
    if t == "text":
        return el.get("html", "")
    # 다른 타입은 Task 3.2에서
    return f'<!-- {t} not yet -->'


def _render_box(box: dict) -> str:
    box_def = library.BOXES["box"]
    padding = _resolve_padding(box.get("padding"), box_def["default_padding"])
    bg = box.get("bgColor") or box_def["default_bg"]
    border_color = box.get("borderColor") or box_def["default_border_color"]
    border_width = box.get("borderWidth", box_def["default_border_width"])
    radius = box.get("borderRadius", box_def["default_border_radius"])
    style = (
        _padding_style(padding)
        + f"background-color:{bg};"
        + f"border:{border_width}px solid {border_color};"
        + f"border-radius:{radius}px;"
    )
    inner = _render_items(box.get("items", []))
    return (
        f'<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>'
        f'<td style="{style}">{inner}</td></tr></table>'
    )


def _resolve_padding(override: dict | None, default: dict) -> dict:
    if override is None:
        return default
    return {**default, **{k: v for k, v in override.items() if v is not None}}


def _padding_style(padding: dict) -> str:
    return f'padding:{padding["top"]}px {padding["right"]}px {padding["bottom"]}px {padding["left"]}px;'
```

- [ ] **Step 4: 테스트 통과**

```bash
pytest tests/test_renderer_basic.py -v
```
Expected: 5 PASSED

- [ ] **Step 5: 커밋**

```bash
git add _builder/server/renderer.py _builder/tests/test_renderer_basic.py
git commit -m "feat(builder): renderer for 1col layout + text element"
```

---

### Task 3.2: 렌더러 확장 — 5 요소 모두

**Files:**
- Modify: `_builder/server/renderer.py`
- Test: `_builder/tests/test_renderer_elements.py`

- [ ] **Step 1: 실패 테스트**

```python
# tests/test_renderer_elements.py
from server.renderer import render_mail


def _make_mail(items):
    return {
        "id": "t", "title": "T", "language": "ko",
        "tree": {"layouts": [{
            "id": "l1", "type": "1col", "padding": None, "bgColor": None,
            "cells": [{"id": "c1", "items": items}]
        }]}
    }


def test_image_element():
    mail = _make_mail([{
        "kind": "element", "id": "i1", "type": "image",
        "src": "https://example.com/x.png", "alt": "X", "width": 400, "align": "center"
    }])
    html = render_mail(mail)
    assert 'src="https://example.com/x.png"' in html
    assert 'alt="X"' in html
    assert 'width="400"' in html


def test_button_element():
    mail = _make_mail([{
        "kind": "element", "id": "b1", "type": "button",
        "label": "지금 사용", "href": "https://x.com",
        "bgColor": "#26c7d9", "size": "medium", "align": "center"
    }])
    html = render_mail(mail)
    assert "지금 사용" in html
    assert 'href="https://x.com"' in html
    assert "#26c7d9" in html


def test_divider_element():
    mail = _make_mail([{
        "kind": "element", "id": "d1", "type": "divider",
        "color": "#cccccc", "thickness": 2, "width": "80%"
    }])
    html = render_mail(mail)
    # 구분선은 <hr> 또는 background-color cell
    assert "#cccccc" in html


def test_spacer_element():
    mail = _make_mail([{
        "kind": "element", "id": "s1", "type": "spacer", "height": 40
    }])
    html = render_mail(mail)
    assert "height:40px" in html or 'height="40"' in html
```

- [ ] **Step 2: 테스트 실행 (실패)**

```bash
pytest tests/test_renderer_elements.py -v
```

- [ ] **Step 3: `_builder/server/renderer.py`의 `_render_element` 확장**

```python
def _render_element(el: dict) -> str:
    t = el["type"]
    if t == "text":
        return el.get("html", "")
    if t == "image":
        return _render_image(el)
    if t == "button":
        return _render_button(el)
    if t == "divider":
        return _render_divider(el)
    if t == "spacer":
        return _render_spacer(el)
    return f'<!-- unknown element {t} -->'


def _render_image(el: dict) -> str:
    src = el.get("src", "")
    alt = el.get("alt", "")
    width = el.get("width", 600)
    align = el.get("align", "center")
    img = f'<img src="{src}" alt="{alt}" width="{width}" style="display:block; max-width:100%; height:auto; border:0;">'
    if el.get("link"):
        img = f'<a href="{el["link"]}">{img}</a>'
    return f'<div style="text-align:{align};">{img}</div>'


def _render_button(el: dict) -> str:
    label = el.get("label", "버튼")
    href = el.get("href", "#")
    bg = el.get("bgColor", "#26c7d9")
    align = el.get("align", "center")
    sizes = {"small": "8px 16px", "medium": "12px 24px", "large": "16px 32px"}
    pad = sizes.get(el.get("size", "medium"), sizes["medium"])
    return (
        f'<table cellpadding="0" cellspacing="0" border="0" align="{align}" '
        f'style="margin:0 auto;"><tr><td style="background-color:{bg}; '
        f'border-radius:4px; padding:{pad};">'
        f'<a href="{href}" style="color:#fff; text-decoration:none; '
        f'font-weight:bold;">{label}</a></td></tr></table>'
    )


def _render_divider(el: dict) -> str:
    color = el.get("color", "#dddddd")
    thickness = el.get("thickness", 1)
    width = el.get("width", "100%")
    return (
        f'<table width="{width}" cellpadding="0" cellspacing="0" border="0" '
        f'style="margin:0 auto;"><tr>'
        f'<td style="background-color:{color}; height:{thickness}px; '
        f'line-height:{thickness}px; font-size:0;">&nbsp;</td></tr></table>'
    )


def _render_spacer(el: dict) -> str:
    height = el.get("height", 24)
    return f'<div style="height:{height}px; line-height:{height}px; font-size:0;">&nbsp;</div>'
```

- [ ] **Step 4: 테스트 통과**

```bash
pytest tests/test_renderer_elements.py -v
```

- [ ] **Step 5: 커밋**

```bash
git add _builder/server/renderer.py _builder/tests/test_renderer_elements.py
git commit -m "feat(builder): renderer supports image/button/divider/spacer"
```

---

### Task 3.3: 렌더러 확장 — 다열 레이아웃 + 박스 중첩

**Files:**
- Test: `_builder/tests/test_renderer_layouts.py`
- (기존 renderer.py가 이미 다열 지원하므로 검증만)

- [ ] **Step 1: 테스트 작성 + 실행**

```python
# tests/test_renderer_layouts.py
from server.renderer import render_mail


def _wrap(layouts):
    return {"id": "t", "title": "T", "language": "ko", "tree": {"layouts": layouts}}


def test_2col_50_50():
    mail = _wrap([{
        "id": "l", "type": "2col-50-50", "padding": None, "bgColor": None,
        "cells": [
            {"id": "c1", "items": [{"kind": "element", "id": "t1", "type": "text", "html": "<p>왼쪽</p>"}]},
            {"id": "c2", "items": [{"kind": "element", "id": "t2", "type": "text", "html": "<p>오른쪽</p>"}]},
        ]
    }])
    html = render_mail(mail)
    assert "왼쪽" in html and "오른쪽" in html
    assert 'width="50%"' in html


def test_3col():
    mail = _wrap([{
        "id": "l", "type": "3col", "padding": None, "bgColor": None,
        "cells": [
            {"id": f"c{i}", "items": [{"kind": "element", "id": f"t{i}", "type": "text", "html": f"<p>{i}</p>"}]}
            for i in range(3)
        ]
    }])
    html = render_mail(mail)
    assert html.count('width="33%"') == 2  # 두 칸 33%
    assert 'width="34%"' in html  # 마지막은 34%


def test_box_in_layout():
    mail = _wrap([{
        "id": "l", "type": "1col", "padding": None, "bgColor": None,
        "cells": [{"id": "c1", "items": [{
            "kind": "box", "id": "b1",
            "padding": None, "bgColor": "#ffffff", "borderColor": "#dddddd",
            "borderWidth": 1, "borderRadius": 4,
            "items": [{"kind": "element", "id": "t1", "type": "text", "html": "<p>박스 안</p>"}]
        }]}]
    }])
    html = render_mail(mail)
    assert "박스 안" in html
    assert "border:1px solid #dddddd" in html


def test_box_in_box():
    mail = _wrap([{
        "id": "l", "type": "1col", "padding": None, "bgColor": "#e9f9fb",
        "cells": [{"id": "c1", "items": [{
            "kind": "box", "id": "outer",
            "padding": None, "bgColor": "#ffffff",
            "borderColor": "#dddddd", "borderWidth": 1, "borderRadius": 8,
            "items": [{
                "kind": "box", "id": "inner",
                "padding": None, "bgColor": "#fff7e0",
                "borderColor": "#f5c842", "borderWidth": 1, "borderRadius": 4,
                "items": [{"kind": "element", "id": "t", "type": "text", "html": "<p>중첩</p>"}]
            }]
        }]}]
    }])
    html = render_mail(mail)
    assert "중첩" in html
    assert html.count("border-radius:") >= 2  # 외부·내부 박스 둘 다
```

- [ ] **Step 2: 실행**

```bash
pytest tests/test_renderer_layouts.py -v
```
Expected: PASS (renderer.py가 이미 지원)

- [ ] **Step 3: 커밋**

```bash
git add _builder/tests/test_renderer_layouts.py
git commit -m "test(builder): renderer multi-column and nested box"
```

---

## Phase 4 — 저장소 (Storage) + 메일 CRUD API

### Task 4.1: `server/storage.py` — 메일 JSON 저장/로딩 + 백업

**Files:**
- Create: `_builder/server/storage.py`
- Test: `_builder/tests/test_storage.py`

- [ ] **Step 1: 실패 테스트**

```python
# tests/test_storage.py
import json
import shutil
from pathlib import Path
import pytest

from server import storage


@pytest.fixture
def tmp_mails(tmp_path, monkeypatch):
    mails_dir = tmp_path / "mails"
    mails_dir.mkdir()
    monkeypatch.setattr(storage, "MAILS_DIR", mails_dir)
    monkeypatch.setattr(storage, "BACKUP_DIR", mails_dir / ".backup")
    return mails_dir


def test_save_and_load(tmp_mails):
    mail = {"id": "abc", "title": "T", "tree": {"layouts": []}, "language": "ko"}
    storage.save_mail("abc", mail)
    loaded = storage.load_mail("abc")
    assert loaded["title"] == "T"


def test_save_creates_backup(tmp_mails):
    mail1 = {"id": "abc", "title": "v1", "tree": {"layouts": []}, "language": "ko"}
    mail2 = {"id": "abc", "title": "v2", "tree": {"layouts": []}, "language": "ko"}
    storage.save_mail("abc", mail1)
    storage.save_mail("abc", mail2)
    backups = list(storage.BACKUP_DIR.glob("abc-*.json"))
    assert len(backups) == 1  # 첫 저장 후 v1이 백업됨


def test_backup_keeps_only_3(tmp_mails):
    for i in range(5):
        storage.save_mail("abc", {"id": "abc", "title": f"v{i}", "tree": {"layouts": []}, "language": "ko"})
    backups = list(storage.BACKUP_DIR.glob("abc-*.json"))
    assert len(backups) == 3  # 최근 3개만


def test_list_mails_returns_metadata(tmp_mails):
    storage.save_mail("a", {"id": "a", "title": "T1", "number": 1, "language": "ko",
                            "createdAt": "2026-01-01", "lastSavedAt": "2026-01-02",
                            "tree": {"layouts": []}})
    storage.save_mail("b", {"id": "b", "title": "T2", "number": 2, "language": "ja",
                            "createdAt": "2026-01-02", "lastSavedAt": "2026-01-03",
                            "tree": {"layouts": []}})
    mails = storage.list_mails()
    assert len(mails) == 2
    assert {m["id"] for m in mails} == {"a", "b"}
    assert "tree" not in mails[0]  # 메타데이터만


def test_delete_mail_removes_file_and_backups(tmp_mails):
    storage.save_mail("a", {"id": "a", "title": "T", "tree": {"layouts": []}, "language": "ko"})
    storage.save_mail("a", {"id": "a", "title": "T2", "tree": {"layouts": []}, "language": "ko"})
    storage.delete_mail("a")
    assert not (storage.MAILS_DIR / "a.json").exists()
    assert len(list(storage.BACKUP_DIR.glob("a-*.json"))) == 0


def test_load_missing_returns_none(tmp_mails):
    assert storage.load_mail("nonexistent") is None
```

- [ ] **Step 2: 실행 (실패)**

```bash
pytest tests/test_storage.py -v
```

- [ ] **Step 3: `_builder/server/storage.py` 구현**

```python
"""메일 JSON 파일 저장/로딩 + 백업 회전."""
import json
import time
from pathlib import Path

PIPELINE_DIR = Path(__file__).parent.parent
MAILS_DIR = PIPELINE_DIR / "mails"
BACKUP_DIR = MAILS_DIR / ".backup"
MAX_BACKUPS = 3


def _ensure_dirs():
    MAILS_DIR.mkdir(parents=True, exist_ok=True)
    BACKUP_DIR.mkdir(parents=True, exist_ok=True)


def _file_path(mail_id: str) -> Path:
    if "/" in mail_id or "\\" in mail_id or ".." in mail_id:
        raise ValueError(f"invalid mail id: {mail_id}")
    return MAILS_DIR / f"{mail_id}.json"


def save_mail(mail_id: str, mail: dict) -> None:
    _ensure_dirs()
    path = _file_path(mail_id)
    if path.exists():
        # 기존 파일을 백업으로 이동
        ts = int(time.time() * 1000)
        backup_path = BACKUP_DIR / f"{mail_id}-{ts}.json"
        path.rename(backup_path)
        _rotate_backups(mail_id)
    path.write_text(json.dumps(mail, ensure_ascii=False, indent=2), encoding="utf-8")


def load_mail(mail_id: str) -> dict | None:
    path = _file_path(mail_id)
    if not path.exists():
        return None
    return json.loads(path.read_text(encoding="utf-8"))


def list_mails() -> list[dict]:
    _ensure_dirs()
    out = []
    for p in MAILS_DIR.glob("*.json"):
        try:
            data = json.loads(p.read_text(encoding="utf-8"))
        except Exception:
            continue
        out.append({
            "id": data.get("id"),
            "title": data.get("title"),
            "number": data.get("number"),
            "language": data.get("language"),
            "createdAt": data.get("createdAt"),
            "lastSavedAt": data.get("lastSavedAt"),
        })
    out.sort(key=lambda m: m.get("createdAt") or "", reverse=True)
    return out


def delete_mail(mail_id: str) -> bool:
    path = _file_path(mail_id)
    existed = path.exists()
    if existed:
        path.unlink()
    # 백업도 정리
    for bp in BACKUP_DIR.glob(f"{mail_id}-*.json"):
        bp.unlink()
    return existed


def _rotate_backups(mail_id: str) -> None:
    backups = sorted(BACKUP_DIR.glob(f"{mail_id}-*.json"))
    while len(backups) > MAX_BACKUPS:
        backups[0].unlink()
        backups = sorted(BACKUP_DIR.glob(f"{mail_id}-*.json"))
```

- [ ] **Step 4: 테스트 통과**

```bash
pytest tests/test_storage.py -v
```
Expected: 6 PASSED

- [ ] **Step 5: 커밋**

```bash
git add _builder/server/storage.py _builder/tests/test_storage.py
git commit -m "feat(builder): storage with backup rotation"
```

---

### Task 4.2: 메일 CRUD API 라우트

**Files:**
- Modify: `_builder/server/routes.py`
- Test: `_builder/tests/test_api_mails.py`

- [ ] **Step 1: 실패 테스트**

```python
# tests/test_api_mails.py
import pytest
from app import app
from server import storage


@pytest.fixture(autouse=True)
def clean_mails(tmp_path, monkeypatch):
    mails_dir = tmp_path / "mails"
    mails_dir.mkdir()
    monkeypatch.setattr(storage, "MAILS_DIR", mails_dir)
    monkeypatch.setattr(storage, "BACKUP_DIR", mails_dir / ".backup")
    yield


def test_post_creates_mail():
    client = app.test_client()
    rv = client.post("/api/mails", json={"title": "신규", "language": "ja"})
    assert rv.status_code == 201
    data = rv.get_json()
    assert data["title"] == "신규"
    assert data["language"] == "ja"
    assert data["id"]
    assert data["number"] == 1


def test_post_increments_number():
    client = app.test_client()
    client.post("/api/mails", json={"title": "1", "language": "ko"})
    rv = client.post("/api/mails", json={"title": "2", "language": "ko"})
    assert rv.get_json()["number"] == 2


def test_list_mails():
    client = app.test_client()
    client.post("/api/mails", json={"title": "A", "language": "ko"})
    rv = client.get("/api/mails")
    data = rv.get_json()
    assert len(data) == 1
    assert data[0]["title"] == "A"


def test_get_mail_by_id():
    client = app.test_client()
    created = client.post("/api/mails", json={"title": "X", "language": "ko"}).get_json()
    rv = client.get(f"/api/mails/{created['id']}")
    assert rv.status_code == 200
    assert rv.get_json()["title"] == "X"


def test_get_404():
    client = app.test_client()
    rv = client.get("/api/mails/nonexistent")
    assert rv.status_code == 404


def test_put_updates():
    client = app.test_client()
    created = client.post("/api/mails", json={"title": "X", "language": "ko"}).get_json()
    created["title"] = "Updated"
    rv = client.put(f"/api/mails/{created['id']}", json=created)
    assert rv.status_code == 200
    fetched = client.get(f"/api/mails/{created['id']}").get_json()
    assert fetched["title"] == "Updated"


def test_delete():
    client = app.test_client()
    created = client.post("/api/mails", json={"title": "X", "language": "ko"}).get_json()
    rv = client.delete(f"/api/mails/{created['id']}")
    assert rv.status_code == 204
    assert client.get(f"/api/mails/{created['id']}").status_code == 404


def test_duplicate():
    client = app.test_client()
    created = client.post("/api/mails", json={"title": "Original", "language": "ko"}).get_json()
    rv = client.post(f"/api/mails/{created['id']}/duplicate")
    assert rv.status_code == 201
    dup = rv.get_json()
    assert dup["id"] != created["id"]
    assert "(복사본)" in dup["title"]
    assert dup["number"] == 2


def test_patch_title():
    client = app.test_client()
    created = client.post("/api/mails", json={"title": "X", "language": "ko"}).get_json()
    rv = client.patch(f"/api/mails/{created['id']}/title", json={"title": "New"})
    assert rv.status_code == 200
    assert client.get(f"/api/mails/{created['id']}").get_json()["title"] == "New"
```

- [ ] **Step 2: 실행 (실패)**

```bash
pytest tests/test_api_mails.py -v
```

- [ ] **Step 3: `_builder/server/routes.py` 확장**

```python
import uuid
from datetime import datetime, timezone
from flask import Blueprint, jsonify, request, abort

from . import library, storage

api_bp = Blueprint("api", __name__, url_prefix="/api")


@api_bp.route("/library", methods=["GET"])
def get_library():
    return jsonify(library.get_library())


@api_bp.route("/mails", methods=["GET"])
def list_mails():
    return jsonify(storage.list_mails())


@api_bp.route("/mails", methods=["POST"])
def create_mail():
    body = request.get_json() or {}
    title = body.get("title", "(제목 없음)")
    language = body.get("language", "ko")
    if language not in ("ja", "ko", "en", "pt-BR"):
        abort(400, "invalid language")

    existing = storage.list_mails()
    next_number = max((m.get("number") or 0 for m in existing), default=0) + 1
    now = datetime.now(timezone.utc).isoformat()
    mail = {
        "id": str(uuid.uuid4()),
        "title": title,
        "number": next_number,
        "language": language,
        "createdAt": now,
        "lastSavedAt": now,
        "tree": {"layouts": []},
    }
    storage.save_mail(mail["id"], mail)
    return jsonify(mail), 201


@api_bp.route("/mails/<mail_id>", methods=["GET"])
def get_mail(mail_id):
    mail = storage.load_mail(mail_id)
    if mail is None:
        abort(404)
    return jsonify(mail)


@api_bp.route("/mails/<mail_id>", methods=["PUT"])
def update_mail(mail_id):
    body = request.get_json() or {}
    body["id"] = mail_id  # 강제 보정
    body["lastSavedAt"] = datetime.now(timezone.utc).isoformat()
    storage.save_mail(mail_id, body)
    return jsonify(body)


@api_bp.route("/mails/<mail_id>", methods=["DELETE"])
def delete_mail(mail_id):
    storage.delete_mail(mail_id)
    return ("", 204)


@api_bp.route("/mails/<mail_id>/duplicate", methods=["POST"])
def duplicate_mail(mail_id):
    src = storage.load_mail(mail_id)
    if src is None:
        abort(404)
    existing = storage.list_mails()
    next_number = max((m.get("number") or 0 for m in existing), default=0) + 1
    now = datetime.now(timezone.utc).isoformat()
    dup = {
        **src,
        "id": str(uuid.uuid4()),
        "title": f"{src.get('title', '(제목 없음)')} (복사본)",
        "number": next_number,
        "createdAt": now,
        "lastSavedAt": now,
    }
    storage.save_mail(dup["id"], dup)
    return jsonify(dup), 201


@api_bp.route("/mails/<mail_id>/title", methods=["PATCH"])
def update_title(mail_id):
    body = request.get_json() or {}
    title = body.get("title", "")
    mail = storage.load_mail(mail_id)
    if mail is None:
        abort(404)
    mail["title"] = title
    mail["lastSavedAt"] = datetime.now(timezone.utc).isoformat()
    storage.save_mail(mail_id, mail)
    return jsonify(mail)
```

- [ ] **Step 4: 테스트 통과**

```bash
pytest tests/test_api_mails.py -v
```
Expected: 9 PASSED

- [ ] **Step 5: 커밋**

```bash
git add _builder/server/routes.py _builder/tests/test_api_mails.py
git commit -m "feat(builder): mail CRUD + duplicate API"
```

---

## Phase 5 — 프리셋 14종 정의

### Task 5.1: 모든 프리셋 정의

**Files:**
- Modify: `_builder/server/library.py`
- Test: `_builder/tests/test_presets.py`

- [ ] **Step 1: 실패 테스트**

```python
# tests/test_presets.py
from server.library import PRESETS, expand_preset


EXPECTED_PRESETS = {
    "hero", "hero_with_subtitle", "section_divider",
    "highlighted_intro", "body_block",
    "cta_solo", "cta_microcopy", "cta_body", "cta_emphasized",
    "card_full", "card_2up", "side_topic_box",
    "footer_company", "footer_unsubscribe",
}


def test_all_14_presets_exist():
    assert set(PRESETS.keys()) == EXPECTED_PRESETS


def test_each_preset_has_label_and_expand():
    for key, p in PRESETS.items():
        assert "label" in p, f"{key} missing label"
        assert callable(p.get("expand")), f"{key} missing expand callable"


def test_expand_returns_list_of_layouts():
    for key in PRESETS:
        result = expand_preset(key)
        assert isinstance(result, list)
        assert all("kind" in item or "type" in item for item in result)


def test_footer_unsubscribe_has_braze_token():
    result = expand_preset("footer_unsubscribe")
    flat = str(result)
    assert "{{${set_user_to_unsubscribed_url}}}" in flat
```

- [ ] **Step 2: 실행 (실패)**

```bash
pytest tests/test_presets.py -v
```

- [ ] **Step 3: `_builder/server/library.py`에 프리셋 추가**

기존 `PRESETS = {}` 부분을 다음으로 교체:

```python
def _layout_1col(items, padding=None, bg=None):
    return {
        "kind": "layout", "type": "1col",
        "padding": padding, "bgColor": bg,
        "cells": [{"items": items}]
    }


def _layout_2col_50(left_items, right_items, padding=None, bg=None):
    return {
        "kind": "layout", "type": "2col-50-50",
        "padding": padding, "bgColor": bg,
        "cells": [{"items": left_items}, {"items": right_items}]
    }


def _el(t, **kwargs):
    return {"kind": "element", "type": t, **kwargs}


def _box(items, padding=None, bg=None, border_color=None, border_width=None, border_radius=None):
    box = {"kind": "box", "items": items}
    if padding is not None: box["padding"] = padding
    if bg is not None: box["bgColor"] = bg
    if border_color is not None: box["borderColor"] = border_color
    if border_width is not None: box["borderWidth"] = border_width
    if border_radius is not None: box["borderRadius"] = border_radius
    return box


PRESETS = {
    "hero": {
        "label": "Hero", "icon": "🎯",
        "expand": lambda: [_layout_1col([
            _el("image", src="https://placehold.co/120x40?text=LOGO", alt="logo", width=120, align="center"),
            _el("text", html="<h1>메인 타이틀</h1>"),
        ])],
    },
    "hero_with_subtitle": {
        "label": "Hero + Subtitle", "icon": "🎯",
        "expand": lambda: [_layout_1col([
            _el("image", src="https://placehold.co/120x40?text=LOGO", alt="logo", width=120, align="center"),
            _el("text", html="<h1>메인 타이틀</h1>"),
            _el("text", html="<p>서브 카피</p>"),
        ])],
    },
    "section_divider": {
        "label": "Section Divider", "icon": "━",
        "expand": lambda: [_layout_1col([
            _el("text", html="<h2>섹션 제목</h2>"),
        ], padding={"top": 18, "right": 20, "bottom": 18, "left": 20}, bg="#e9f9fb")],
    },
    "highlighted_intro": {
        "label": "Highlighted Intro", "icon": "✨",
        "expand": lambda: [_layout_1col([
            _box([
                _el("text", html="<p>강조하고 싶은 본문 인트로</p>"),
            ], bg="#ffffff", border_color="#26c7d9", border_width=1, border_radius=4),
        ], bg="#e9f9fb")],
    },
    "body_block": {
        "label": "Body Block", "icon": "📄",
        "expand": lambda: [_layout_1col([
            _el("text", html="<h2>본문 제목</h2>"),
            _el("text", html="<p>본문 내용을 여기에 작성합니다.</p>"),
            _el("image", src="https://placehold.co/600x300?text=본문+이미지", alt="본문 이미지", width=600, align="center"),
        ])],
    },
    "cta_solo": {
        "label": "CTA Solo", "icon": "🔘",
        "expand": lambda: [_layout_1col([
            _el("button", label="지금 사용해보기", href="https://example.com",
                bgColor="#26c7d9", size="medium", align="center"),
        ], padding={"top": 0, "right": 20, "bottom": 30, "left": 20})],
    },
    "cta_microcopy": {
        "label": "CTA + Microcopy", "icon": "🔘",
        "expand": lambda: [_layout_1col([
            _el("text", html="<p style='text-align:center;'>등록은 30초!</p>"),
            _el("button", label="무료 시작", href="https://example.com",
                bgColor="#26c7d9", size="medium", align="center"),
        ])],
    },
    "cta_body": {
        "label": "CTA + Body", "icon": "🔘",
        "expand": lambda: [_layout_1col([
            _el("text", html="<p>왜 지금 가입해야 하는지에 대한 짧은 설명.</p>"),
            _el("button", label="가입하기", href="https://example.com",
                bgColor="#26c7d9", size="medium", align="center"),
        ])],
    },
    "cta_emphasized": {
        "label": "CTA Emphasized", "icon": "⭐",
        "expand": lambda: [_layout_1col([
            _el("text", html="<h2>강조 헤드라인</h2>"),
            _el("text", html="<p>본문 보충 설명</p>"),
            _el("button", label="시작하기", href="https://example.com",
                bgColor="#26c7d9", size="large", align="center"),
        ])],
    },
    "card_full": {
        "label": "Card Full", "icon": "🪪",
        "expand": lambda: [_layout_1col([
            _el("text", html="<h3>카드 제목</h3>"),
            _el("image", src="https://placehold.co/600x300?text=카드", alt="카드 이미지", width=600, align="center"),
            _el("text", html="<p>카드 설명</p>"),
            _el("button", label="자세히 보기", href="https://example.com",
                bgColor="#26c7d9", size="medium", align="center"),
        ])],
    },
    "card_2up": {
        "label": "Card 2-up", "icon": "🪪🪪",
        "expand": lambda: [_layout_2col_50(
            [
                _el("image", src="https://placehold.co/280x180?text=A", alt="A", width=280, align="center"),
                _el("text", html="<p><strong>카드 A</strong></p>"),
                _el("button", label="A 보기", href="https://example.com",
                    bgColor="#26c7d9", size="small", align="center"),
            ],
            [
                _el("image", src="https://placehold.co/280x180?text=B", alt="B", width=280, align="center"),
                _el("text", html="<p><strong>카드 B</strong></p>"),
                _el("button", label="B 보기", href="https://example.com",
                    bgColor="#26c7d9", size="small", align="center"),
            ],
        )],
    },
    "side_topic_box": {
        "label": "Side Topic Box", "icon": "💡",
        "expand": lambda: [_layout_1col([
            _box([
                _el("text", html="<h3>사이드 토픽</h3>"),
                _el("text", html="<p>이 박스 안의 내용은 본 주제와 약간 다른 정보입니다.</p>"),
                _el("image", src="https://placehold.co/520x260?text=토픽", alt="토픽", width=520, align="center"),
                _el("button", label="자세히", href="https://example.com",
                    bgColor="#26c7d9", size="small", align="center"),
            ], bg="#ffffff", border_color="#26c7d9", border_width=1, border_radius=8,
               padding={"top": 25, "right": 20, "bottom": 25, "left": 20}),
        ], bg="#e9f9fb")],
    },
    "footer_company": {
        "label": "Footer Company", "icon": "🏢",
        "expand": lambda: [_layout_1col([
            _el("text", html="<p style='color:#fff; font-size:12px; line-height:1.6;'>"
                              "회사명: [회사명]<br>HP: [홈페이지]<br>이메일: [이메일]<br>주소: [주소]</p>"),
        ], bg="#2a2a2a", padding={"top": 30, "right": 20, "bottom": 30, "left": 20})],
    },
    "footer_unsubscribe": {
        "label": "Footer Unsubscribe", "icon": "✉",
        "expand": lambda: [_layout_1col([
            _el("text", html="<p style='color:#aaa; font-size:11px; text-align:center;'>"
                              "수신을 원하지 않으시면 "
                              "<a href='{{${set_user_to_unsubscribed_url}}}' style='color:#aaa;'>여기</a>를 클릭해 주세요."
                              "</p>"),
        ], bg="#2a2a2a", padding={"top": 10, "right": 20, "bottom": 30, "left": 20})],
    },
}


def expand_preset(key: str) -> list:
    """프리셋 → 레이아웃·박스·요소 트리. id 없이 반환 (호출자가 부여)."""
    if key not in PRESETS:
        raise KeyError(f"unknown preset: {key}")
    return PRESETS[key]["expand"]()
```

- [ ] **Step 4: 테스트 통과**

```bash
pytest tests/test_presets.py -v
pytest tests/test_library.py -v  # 프리셋 14개 검증
```

- [ ] **Step 5: 기존 테스트의 임시 조정 되돌리기**

```python
# tests/test_library.py 의 test_get_library_returns_full_dict
def test_get_library_returns_full_dict():
    lib = get_library()
    assert "layouts" in lib
    assert "boxes" in lib
    assert "elements" in lib
    assert "presets" in lib
    assert len(lib["presets"]) == 14
```

- [ ] **Step 6: 커밋**

```bash
git add _builder/server/library.py _builder/tests/test_presets.py _builder/tests/test_library.py
git commit -m "feat(builder): define 14 presets including footers"
```

---

## Phase 6 — Sanitizer (이메일 안전 HTML)

### Task 6.1: `server/sanitizer.py` — 화이트리스트 필터

**Files:**
- Create: `_builder/server/sanitizer.py`
- Test: `_builder/tests/test_sanitizer.py`

- [ ] **Step 1: 실패 테스트**

```python
# tests/test_sanitizer.py
from server.sanitizer import sanitize_html


def test_keeps_whitelisted_tags():
    s = "<p>Hello <strong>world</strong> <u>!</u></p>"
    assert sanitize_html(s) == "<p>Hello <strong>world</strong> <u>!</u></p>"


def test_strips_div_and_span():
    s = "<div>x</div><span>y</span>"
    assert "<div>" not in sanitize_html(s)
    assert "<span>" not in sanitize_html(s)
    assert "x" in sanitize_html(s) and "y" in sanitize_html(s)


def test_strips_inline_style():
    s = '<p style="color:red;font-size:20px;">x</p>'
    out = sanitize_html(s)
    assert "style=" not in out
    assert "x" in out


def test_keeps_a_href():
    s = '<a href="https://x.com">link</a>'
    assert 'href="https://x.com"' in sanitize_html(s)


def test_strips_a_other_attrs():
    s = '<a href="https://x.com" target="_blank" onclick="x">link</a>'
    out = sanitize_html(s)
    assert 'href="https://x.com"' in out
    assert "target" not in out
    assert "onclick" not in out


def test_keeps_braze_token_in_href():
    s = '<a href="{{${set_user_to_unsubscribed_url}}}">unsub</a>'
    out = sanitize_html(s)
    assert "{{${set_user_to_unsubscribed_url}}}" in out


def test_keeps_braze_token_in_text():
    s = "<p>{{${user.name}}} 님 안녕하세요</p>"
    out = sanitize_html(s)
    assert "{{${user.name}}}" in out


def test_strips_script():
    s = '<script>alert(1)</script><p>x</p>'
    out = sanitize_html(s)
    assert "<script>" not in out
    assert "alert" not in out


def test_keeps_lists():
    s = "<ul><li>a</li><li>b</li></ul>"
    assert sanitize_html(s) == "<ul><li>a</li><li>b</li></ul>"


def test_keeps_headings():
    for h in ("h1", "h2", "h3", "h4"):
        assert f"<{h}>" in sanitize_html(f"<{h}>x</{h}>")
```

- [ ] **Step 2: 실행 (실패)**

```bash
pytest tests/test_sanitizer.py -v
```

- [ ] **Step 3: `_builder/server/sanitizer.py` 구현 (BeautifulSoup 사용)**

```python
"""리치 텍스트 sanitize — 이메일 안전 화이트리스트."""
from bs4 import BeautifulSoup, NavigableString

ALLOWED_TAGS = {"p", "br", "strong", "u", "a", "ul", "ol", "li", "h1", "h2", "h3", "h4"}
ALLOWED_ATTRS = {"a": ["href"]}


def sanitize_html(html: str) -> str:
    if not html:
        return ""
    soup = BeautifulSoup(html, "html.parser")
    _walk(soup)
    # 최상위가 NavigableString만 있으면 그대로
    return str(soup)


def _walk(node):
    # 자식들을 복사해 순회 (중간에 변경되므로)
    for child in list(node.children):
        if isinstance(child, NavigableString):
            continue
        if child.name in ALLOWED_TAGS:
            # 속성 정리
            allowed = ALLOWED_ATTRS.get(child.name, [])
            attrs_to_keep = {}
            for attr_name in list(child.attrs):
                if attr_name in allowed:
                    attrs_to_keep[attr_name] = child.attrs[attr_name]
            child.attrs = attrs_to_keep
            _walk(child)
        else:
            # 허용 안 된 태그: unwrap (자식은 살리고 태그만 제거) 또는 decompose
            if child.name in ("script", "style"):
                child.decompose()  # 내용까지 제거
            else:
                _walk(child)
                child.unwrap()  # 태그 제거, 자식 보존
```

- [ ] **Step 4: 테스트 통과**

```bash
pytest tests/test_sanitizer.py -v
```
Expected: 10 PASSED. Braze 토큰은 텍스트로 그대로 보존되며 href 속성에도 그대로 (sanitizer가 URL 검증 안 함).

- [ ] **Step 5: 커밋**

```bash
git add _builder/server/sanitizer.py _builder/tests/test_sanitizer.py
git commit -m "feat(builder): sanitizer with email-safe whitelist"
```

---

## Phase 7 — 프론트엔드 — SPA 골격 + 사이드바 + 소개탭

### Task 7.1: 정적 파일 골격 — 사이드바 + 3탭 레이아웃

**Files:**
- Modify: `_builder/static/index.html`
- Modify: `_builder/static/css/style.css`
- Create: `_builder/static/js/app.js`
- Create: `_builder/static/js/api.js`
- Create: `_builder/static/js/sidebar.js`
- Create: `_builder/static/js/intro.js`

- [ ] **Step 1: `_builder/static/index.html` 작성**

PRD §3에 따라 사이드바엔 신규생성 버튼 없음. 신규생성 CTA는 제작탭 빈 상태에서.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>CRM 메일 빌더</title>
  <link rel="stylesheet" href="/static/css/style.css">
</head>
<body>
  <div id="app">
    <aside id="sidebar">
      <div class="sidebar-header">📧 메일 목록</div>
      <ul id="mail-list"></ul>
    </aside>
    <main id="main">
      <nav id="tabs">
        <button data-tab="intro" class="tab active">소개</button>
        <button data-tab="editor" class="tab">제작</button>
        <button data-tab="compare" class="tab">비교</button>
      </nav>
      <section id="tab-content"></section>
    </main>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.15.0/Sortable.min.js"></script>
  <script type="module" src="/static/js/app.js"></script>
</body>
</html>
```

- [ ] **Step 2: `_builder/static/css/style.css` 기본 스타일**

```css
* { box-sizing: border-box; margin: 0; padding: 0; }
body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; color: #333; background: #f4f4f4; }

#app { display: flex; height: 100vh; }

#sidebar {
  width: 240px; background: #fff; border-right: 1px solid #ddd;
  display: flex; flex-direction: column; padding: 12px;
}
.sidebar-header { font-weight: bold; margin-bottom: 12px; }
#mail-list { list-style: none; flex: 1; overflow-y: auto; }
#mail-list li {
  padding: 8px; border-radius: 4px; margin-bottom: 4px;
  background: #fafafa; cursor: pointer;
}
#mail-list li.editing { background: #e9f9fb; border: 1px solid #26c7d9; }
.mail-row-header { display: flex; align-items: center; gap: 6px; font-size: 12px; }
.mail-row-header .lang { font-size: 10px; }
.mail-row-buttons { display: flex; gap: 4px; margin-top: 4px; }
.mail-row-buttons button {
  font-size: 10px; padding: 2px 6px; border: 1px solid #ccc;
  background: white; border-radius: 3px; cursor: pointer;
}
.mail-row-buttons button.active { background: #26c7d9; color: white; border-color: #26c7d9; }

button.primary {
  background: #26c7d9; color: white; border: none; padding: 8px 16px;
  border-radius: 4px; cursor: pointer; font-size: 13px;
}
button.primary:hover { background: #1faab9; }

#main { flex: 1; display: flex; flex-direction: column; }
#tabs { display: flex; background: white; border-bottom: 1px solid #ddd; }
.tab { padding: 12px 20px; background: none; border: none; cursor: pointer; font-size: 14px; }
.tab.active { border-bottom: 2px solid #26c7d9; color: #26c7d9; font-weight: bold; }

#tab-content { flex: 1; overflow: auto; padding: 20px; }
```

- [ ] **Step 3: `_builder/static/js/api.js` — 백엔드 호출 래퍼**

```javascript
// Minimal fetch wrapper
async function req(method, url, body) {
  const opts = { method, headers: { "Content-Type": "application/json" } };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const rv = await fetch(url, opts);
  if (!rv.ok) throw new Error(`API ${method} ${url} failed: ${rv.status}`);
  if (rv.status === 204) return null;
  return await rv.json();
}

export const api = {
  getLibrary: () => req("GET", "/api/library"),
  listMails: () => req("GET", "/api/mails"),
  createMail: (title, language) => req("POST", "/api/mails", { title, language }),
  getMail: (id) => req("GET", `/api/mails/${id}`),
  saveMail: (id, mail) => req("PUT", `/api/mails/${id}`, mail),
  deleteMail: (id) => req("DELETE", `/api/mails/${id}`),
  duplicateMail: (id) => req("POST", `/api/mails/${id}/duplicate`),
  patchTitle: (id, title) => req("PATCH", `/api/mails/${id}/title`, { title }),
};
```

- [ ] **Step 4: `_builder/static/js/intro.js`**

```javascript
export function renderIntroTab(container) {
  container.innerHTML = `
    <div style="max-width: 720px; margin: 40px auto; line-height: 1.7;">
      <h1>📧 CRM 메일 빌더</h1>
      <p>레이아웃·박스·요소를 조립해 이메일 HTML을 만들고, 실시간 프리뷰로 확인하고, 코드를 복사해 Braze 등 CRM 툴에 붙여넣으세요.</p>
      <h2>사용법</h2>
      <ol>
        <li>좌측 사이드바에서 <b>+ 새 메일</b> 클릭</li>
        <li>제작탭에서 좌측 라이브러리 패널의 블록을 끌어다 구성</li>
        <li>우측 프리뷰에서 비주얼/코드 토글</li>
        <li>저장 → 코드 모드에서 HTML 복사 → CRM 툴에 붙여넣기</li>
      </ol>
      <h2>지원 언어</h2>
      <p>일본어 🇯🇵 / 한국어 🇰🇷 / 영어 🇺🇸 / 포르투갈어(브라질) 🇧🇷</p>
    </div>
  `;
}
```

- [ ] **Step 5: `_builder/static/js/sidebar.js`**

```javascript
import { api } from "./api.js";

const LANG_FLAG = { ja: "🇯🇵", ko: "🇰🇷", en: "🇺🇸", "pt-BR": "🇧🇷" };

export function createSidebar(state, onChange) {
  const list = document.getElementById("mail-list");

  async function refresh() {
    state.mails = await api.listMails();
    render();
  }

  function render() {
    list.innerHTML = "";
    for (const m of state.mails) {
      const li = document.createElement("li");
      if (state.editingMailId === m.id) li.classList.add("editing");
      li.innerHTML = `
        <div class="mail-row-header">
          <span>#${m.number}</span>
          <span class="lang">${LANG_FLAG[m.language] || ""}</span>
          <span class="title">${escapeHtml(m.title || "")}</span>
        </div>
        <div class="mail-row-buttons">
          <button data-action="edit" class="${state.editingMailId === m.id ? "active" : ""}">${state.editingMailId === m.id ? "편집 중" : "편집"}</button>
          <button data-action="compare" class="${state.comparingMailIds.has(m.id) ? "active" : ""}">${state.comparingMailIds.has(m.id) ? "비교 중" : "비교"}</button>
          <button data-action="duplicate">복제</button>
          <button data-action="delete">삭제</button>
        </div>
      `;
      li.querySelector(".title").addEventListener("dblclick", async (e) => {
        const newTitle = prompt("제목 수정:", m.title);
        if (newTitle && newTitle !== m.title) {
          await api.patchTitle(m.id, newTitle);
          await refresh();
        }
      });
      li.querySelectorAll(".mail-row-buttons button").forEach(btn => {
        btn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          await handleAction(action, m);
        });
      });
      list.appendChild(li);
    }
  }

  async function handleAction(action, mail) {
    if (action === "edit") {
      if (state.editingMailId && state.editingMailId !== mail.id) {
        alert("현재 편집 중인 메일을 닫은 다음, 편집할 메일을 선택해주세요");
        return;
      }
      state.editingMailId = mail.id;
      state.activeTab = "editor";
      onChange();
      await refresh();
    } else if (action === "compare") {
      if (state.comparingMailIds.has(mail.id)) {
        state.comparingMailIds.delete(mail.id);
      } else {
        state.comparingMailIds.add(mail.id);
      }
      onChange();
      render();
    } else if (action === "duplicate") {
      await api.duplicateMail(mail.id);
      await refresh();
    } else if (action === "delete") {
      if (!confirm(`정말 이 메일을 삭제하시겠습니까?\n#${mail.number} ${mail.title}`)) return;
      await api.deleteMail(mail.id);
      if (state.editingMailId === mail.id) state.editingMailId = null;
      state.comparingMailIds.delete(mail.id);
      await refresh();
      onChange();
    }
  }

  return { refresh, render };
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}
```

- [ ] **Step 6: `_builder/static/js/app.js` — 메인 컨트롤러**

```javascript
import { api } from "./api.js";
import { renderIntroTab } from "./intro.js";
import { createSidebar } from "./sidebar.js";

const state = {
  mails: [],
  library: null,
  activeTab: "intro",
  editingMailId: null,
  currentMail: null,
  comparingMailIds: new Set(),
  unsavedChanges: false,
  undoStack: [],
};

let sidebar;

async function init() {
  state.library = await api.getLibrary();
  sidebar = createSidebar(state, onStateChange);
  await sidebar.refresh();

  document.querySelectorAll("#tabs .tab").forEach(btn => {
    btn.addEventListener("click", () => {
      state.activeTab = btn.dataset.tab;
      onStateChange();
    });
  });

  onStateChange();
}

function onStateChange() {
  // 탭 활성 표시
  document.querySelectorAll("#tabs .tab").forEach(b => {
    b.classList.toggle("active", b.dataset.tab === state.activeTab);
  });
  // 탭 콘텐츠 렌더
  const c = document.getElementById("tab-content");
  if (state.activeTab === "intro") renderIntroTab(c);
  else if (state.activeTab === "editor") c.innerHTML = "<p>제작탭 (Phase 8에서 구현)</p>";
  else if (state.activeTab === "compare") c.innerHTML = "<p>비교탭 (Phase 12에서 구현)</p>";
  if (sidebar) sidebar.render();
}

init().catch(e => {
  document.getElementById("tab-content").innerHTML = `<p style="color:red;">에러: ${e.message}</p>`;
});
```

- [ ] **Step 7: 수동 테스트**

```bash
python app.py
```
브라우저에서 http://localhost:5001 → 사이드바 + 3탭 + 소개탭 내용 확인. (메일 생성은 Task 8.1에서 제작탭 빈 상태의 CTA로 검증)

- [ ] **Step 8: 커밋**

```bash
git add _builder/static/
git commit -m "feat(builder): SPA skeleton with sidebar + tabs + intro"
```

---

## Phase 8 — 제작탭: 구성 영역 + 라이브러리 패널 + 프리뷰

### Task 8.1: 제작탭 레이아웃 + 빈 상태

**Files:**
- Create: `_builder/static/js/editor/index.js`
- Modify: `_builder/static/js/app.js`
- Modify: `_builder/static/css/style.css`

- [ ] **Step 1: `_builder/static/css/style.css`에 제작탭 스타일 추가**

```css
.editor {
  display: flex;
  flex-direction: column;
  height: 100%;
}
.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  background: white;
  border-bottom: 1px solid #ddd;
}
.editor-toolbar .title { font-weight: bold; flex: 1; }
.editor-toolbar button {
  padding: 6px 14px; border: 1px solid #ccc; background: white;
  border-radius: 4px; cursor: pointer;
}
.editor-toolbar button.primary { background: #26c7d9; color: white; border-color: #26c7d9; }
.editor-toolbar button:disabled { opacity: 0.4; cursor: not-allowed; }

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.editor-left {
  display: flex;
  flex: 1;
  overflow: hidden;
}
.library-panel {
  width: 240px;
  background: #fafafa;
  border-right: 1px solid #ddd;
  overflow-y: auto;
  padding: 10px;
}
.library-panel.collapsed { width: 28px; padding: 4px 0; }
.library-panel .toggle-btn {
  width: 100%; background: none; border: none; cursor: pointer;
  font-size: 16px; padding: 4px;
}
.library-tabs { display: flex; gap: 4px; margin-bottom: 8px; }
.library-tabs button { flex: 1; padding: 6px; font-size: 11px; }
.library-tabs button.active { background: #26c7d9; color: white; }
.library-search {
  width: 100%; padding: 4px 6px; font-size: 11px; margin-bottom: 8px;
  border: 1px solid #ccc; border-radius: 4px;
}
.library-category-header {
  font-size: 10px; text-transform: uppercase; color: #888;
  font-weight: bold; padding: 6px 0 4px 0; cursor: pointer;
  display: flex; align-items: center; gap: 4px;
}
.library-item {
  background: white; border: 1px solid #ddd; border-radius: 4px;
  padding: 6px 8px; margin-bottom: 3px; cursor: grab; font-size: 11px;
}
.library-item:hover { border-color: #26c7d9; }

.canvas {
  flex: 1;
  background: white;
  overflow-y: auto;
  padding: 14px;
}
.canvas-empty {
  text-align: center; color: #888; padding: 60px 20px;
}

.preview-pane {
  width: 660px;
  background: #f4f4f4;
  border-left: 1px solid #ddd;
  display: flex;
  flex-direction: column;
}
.preview-toggle {
  display: flex;
  background: white;
  border-bottom: 1px solid #ddd;
}
.preview-toggle button {
  flex: 1; padding: 8px; background: none; border: none; cursor: pointer;
  font-size: 12px;
}
.preview-toggle button.active { background: #26c7d9; color: white; }
.preview-content { flex: 1; overflow: auto; }
.preview-content iframe { width: 100%; height: 100%; border: 0; }
.preview-content textarea {
  width: 100%; height: 100%; border: 0; padding: 10px;
  font-family: monospace; font-size: 12px; resize: none;
}
```

- [ ] **Step 2: `_builder/static/js/editor/index.js` — 빈 상태 (PRD §5.1: 신규 메일 CTA + 언어 드롭다운)**

```javascript
import { api } from "../api.js";

export function renderEditorTab(container, state, onStateChange) {
  if (!state.editingMailId) {
    container.innerHTML = `
      <div style="text-align:center; padding:80px 20px; color:#888;">
        <p style="margin-bottom:14px; font-size:14px;">사이드바에서 편집할 메일의 '편집' 버튼을 눌러주세요</p>
        <div style="margin-top:20px;">
          <input id="new-mail-title" type="text" placeholder="제목"
                 style="padding:6px 10px; border:1px solid #ccc; border-radius:4px; margin-right:6px;">
          <select id="new-mail-lang" style="padding:6px 10px; border:1px solid #ccc; border-radius:4px; margin-right:6px;">
            <option value="ja">🇯🇵 일본어</option>
            <option value="ko" selected>🇰🇷 한국어</option>
            <option value="en">🇺🇸 영어</option>
            <option value="pt-BR">🇧🇷 포르투갈어(브라질)</option>
          </select>
          <button id="new-mail-create" class="primary">신규메일제작</button>
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
  // 편집 모드는 다음 Task에서
  container.innerHTML = `<p style="padding:20px;">편집 모드 #${state.editingMailId} (Task 8.2에서 구현)</p>`;
}
```

- [ ] **Step 3: `_builder/static/js/app.js` 수정 — editor 탭 연결**

`onStateChange` 함수에서 편집탭 분기를 다음으로 교체:

```javascript
import { renderEditorTab } from "./editor/index.js";

// onStateChange 함수 안에서:
else if (state.activeTab === "editor") renderEditorTab(c, state, onStateChange);
```

- [ ] **Step 4: 수동 확인**

`python app.py` 후 제작탭 클릭 → "사이드바에서 편집할 메일의 '편집' 버튼을 눌러주세요" 메시지 확인.

- [ ] **Step 5: 커밋**

```bash
git add _builder/static/
git commit -m "feat(builder): editor tab empty state + base styles"
```

---

### Task 8.2: 편집 모드 — 상단바 + 캔버스 + 라이브러리 패널 + 프리뷰

**Files:**
- Modify: `_builder/static/js/editor/index.js`
- Create: `_builder/static/js/editor/library.js`
- Create: `_builder/static/js/editor/canvas.js`
- Create: `_builder/static/js/editor/preview.js`
- Create: `_builder/static/js/editor/renderer.js`

- [ ] **Step 1: 프론트엔드 렌더러 — `_builder/static/js/editor/renderer.js`**

서버 `renderer.py`와 1:1 대응. 포트 결과로 검증.

```javascript
const FONT_STACKS = {
  ja: "'Hiragino Kaku Gothic ProN', 'Hiragino Sans', 'Meiryo', sans-serif",
  ko: "'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif",
  en: "Arial, Helvetica, sans-serif",
  "pt-BR": "Arial, Helvetica, sans-serif",
};

const SIZE_PADS = { small: "8px 16px", medium: "12px 24px", large: "16px 32px" };

export function renderMail(mail, library) {
  const title = mail.title || "메일";
  const language = mail.language || "ko";
  const fontStack = FONT_STACKS[language] || FONT_STACKS.ko;
  const tree = mail.tree || { layouts: [] };
  const body = renderLayouts(tree.layouts || [], library);
  return `<!DOCTYPE html>
<html lang="${language}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeText(title)}</title>
  <style>
    @media screen and (max-width: 600px) {
      .mobile-stack { display: block !important; width: 100% !important; }
    }
  </style>
</head>
<body style="margin:0; padding:0; background:#f4f4f4; font-family:${fontStack}; color:#333;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr><td align="center" style="padding: 20px 0;">
      <table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#fff;">
${body}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function renderLayouts(layouts, lib) {
  return layouts.map(l => renderLayout(l, lib)).join("\n");
}

function renderLayout(layout, lib) {
  const def = lib.layouts[layout.type];
  const padding = resolvePadding(layout.padding, def.default_padding);
  const bg = layout.bgColor || def.default_bg;
  const style = paddingStyle(padding) + (bg ? `background-color:${bg};` : "");
  const cellsHtml = (layout.cells || []).map((c, i) => renderCell(c, def, i, lib)).join("");
  if (def.cells === 1) {
    return `          <tr><td style="${style}">${cellsHtml}</td></tr>`;
  }
  return `          <tr><td style="${style}"><table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cellsHtml}</tr></table></td></tr>`;
}

function renderCell(cell, layoutDef, idx, lib) {
  if (layoutDef.cells === 1) return renderItems(cell.items || [], lib);
  const width = layoutDef.cell_widths[idx];
  return `<td width="${width}" valign="top" class="mobile-stack">${renderItems(cell.items || [], lib)}</td>`;
}

function renderItems(items, lib) {
  return items.map(it => renderItem(it, lib)).join("");
}

function renderItem(item, lib) {
  if (item.kind === "element") return renderElement(item);
  if (item.kind === "box") return renderBox(item, lib);
  return "";
}

function renderElement(el) {
  switch (el.type) {
    case "text": return el.html || "";
    case "image": {
      const src = el.src || "";
      const alt = el.alt || "";
      const width = el.width || 600;
      const align = el.align || "center";
      let img = `<img src="${src}" alt="${alt}" width="${width}" style="display:block; max-width:100%; height:auto; border:0;">`;
      if (el.link) img = `<a href="${el.link}">${img}</a>`;
      return `<div style="text-align:${align};">${img}</div>`;
    }
    case "button": {
      const label = el.label || "버튼";
      const href = el.href || "#";
      const bg = el.bgColor || "#26c7d9";
      const align = el.align || "center";
      const pad = SIZE_PADS[el.size || "medium"] || SIZE_PADS.medium;
      return `<table cellpadding="0" cellspacing="0" border="0" align="${align}" style="margin:0 auto;"><tr><td style="background-color:${bg}; border-radius:4px; padding:${pad};"><a href="${href}" style="color:#fff; text-decoration:none; font-weight:bold;">${escapeText(label)}</a></td></tr></table>`;
    }
    case "divider": {
      const color = el.color || "#dddddd";
      const thickness = el.thickness || 1;
      const width = el.width || "100%";
      return `<table width="${width}" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="background-color:${color}; height:${thickness}px; line-height:${thickness}px; font-size:0;">&nbsp;</td></tr></table>`;
    }
    case "spacer": {
      const h = el.height || 24;
      return `<div style="height:${h}px; line-height:${h}px; font-size:0;">&nbsp;</div>`;
    }
    default: return `<!-- unknown ${el.type} -->`;
  }
}

function renderBox(box, lib) {
  const def = lib.boxes.box;
  const padding = resolvePadding(box.padding, def.default_padding);
  const bg = box.bgColor || def.default_bg;
  const borderColor = box.borderColor || def.default_border_color;
  const borderWidth = box.borderWidth ?? def.default_border_width;
  const radius = box.borderRadius ?? def.default_border_radius;
  const style = paddingStyle(padding)
    + `background-color:${bg};border:${borderWidth}px solid ${borderColor};border-radius:${radius}px;`;
  return `<table width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="${style}">${renderItems(box.items || [], lib)}</td></tr></table>`;
}

function resolvePadding(override, def) {
  if (!override) return def;
  return { ...def, ...Object.fromEntries(Object.entries(override).filter(([k, v]) => v != null)) };
}

function paddingStyle(p) {
  return `padding:${p.top}px ${p.right}px ${p.bottom}px ${p.left}px;`;
}

function escapeText(s) {
  return String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}
```

- [ ] **Step 2: `_builder/static/js/editor/preview.js`**

```javascript
import { renderMail } from "./renderer.js";

export function createPreview(container, state) {
  container.innerHTML = `
    <div class="preview-pane">
      <div class="preview-toggle">
        <button data-mode="visual" class="active">비주얼</button>
        <button data-mode="code">코드</button>
      </div>
      <div class="preview-content">
        <iframe id="preview-iframe" sandbox="allow-same-origin"></iframe>
        <textarea id="preview-code" readonly hidden></textarea>
      </div>
      <div style="padding: 6px; background: white; border-top: 1px solid #ddd; text-align:right;">
        <button id="copy-code" style="padding:4px 10px; font-size:11px;">📋 코드 복사</button>
      </div>
    </div>
  `;

  let mode = "visual";
  const iframe = container.querySelector("#preview-iframe");
  const textarea = container.querySelector("#preview-code");

  container.querySelectorAll(".preview-toggle button").forEach(b => {
    b.addEventListener("click", () => {
      mode = b.dataset.mode;
      container.querySelectorAll(".preview-toggle button").forEach(x => x.classList.toggle("active", x === b));
      iframe.hidden = mode !== "visual";
      textarea.hidden = mode !== "code";
      rerender();
    });
  });

  container.querySelector("#copy-code").addEventListener("click", () => {
    textarea.select();
    document.execCommand("copy");
    alert("HTML 코드가 클립보드에 복사되었습니다");
  });

  function rerender() {
    if (!state.currentMail) return;
    const html = renderMail(state.currentMail, state.library);
    if (mode === "visual") {
      iframe.srcdoc = html;
    } else {
      textarea.value = html;
    }
  }

  return { rerender };
}
```

- [ ] **Step 3: `_builder/static/js/editor/library.js` — 라이브러리 패널**

```javascript
export function createLibraryPanel(container, state) {
  let activeTab = "basic";
  let collapsed = JSON.parse(localStorage.getItem("library_collapsed") || "false");
  let categoryOpen = JSON.parse(localStorage.getItem("library_categories") || '{"layouts":true,"boxes":true,"elements":true}');

  function render() {
    const lib = state.library;
    container.innerHTML = `
      <div class="library-panel ${collapsed ? "collapsed" : ""}">
        <button class="toggle-btn" id="lib-collapse">${collapsed ? "▶" : "◀"}</button>
        ${collapsed ? "" : `
          <div class="library-tabs">
            <button data-tab="basic" class="${activeTab === "basic" ? "active" : ""}">기본</button>
            <button data-tab="presets" class="${activeTab === "presets" ? "active" : ""}">프리셋</button>
          </div>
          <input type="text" class="library-search" placeholder="🔍 검색" />
          ${activeTab === "basic" ? renderBasic(lib, categoryOpen) : renderPresets(lib)}
        `}
      </div>
    `;
    attachEvents();
  }

  function renderBasic(lib, openMap) {
    return `
      <div class="library-category-header" data-cat="layouts">
        ${openMap.layouts ? "▾" : "▸"} 레이아웃 (${Object.keys(lib.layouts).length})
      </div>
      ${openMap.layouts ? Object.entries(lib.layouts).map(([k, v]) =>
        `<div class="library-item" draggable="true" data-add="layout" data-key="${k}">${v.label}</div>`
      ).join("") : ""}

      <div class="library-category-header" data-cat="boxes">
        ${openMap.boxes ? "▾" : "▸"} 박스 (${Object.keys(lib.boxes).length})
      </div>
      ${openMap.boxes ? Object.entries(lib.boxes).map(([k, v]) =>
        `<div class="library-item" draggable="true" data-add="box" data-key="${k}">📦 ${v.label}</div>`
      ).join("") : ""}

      <div class="library-category-header" data-cat="elements">
        ${openMap.elements ? "▾" : "▸"} 요소 (${Object.keys(lib.elements).length})
      </div>
      ${openMap.elements ? Object.entries(lib.elements).map(([k, v]) =>
        `<div class="library-item" draggable="true" data-add="element" data-key="${k}">${v.icon || ""} ${v.label}</div>`
      ).join("") : ""}
    `;
  }

  function renderPresets(lib) {
    return Object.entries(lib.presets).map(([k, v]) =>
      `<div class="library-item" draggable="true" data-add="preset" data-key="${k}">${v.icon || ""} ${v.label}</div>`
    ).join("");
  }

  function attachEvents() {
    const collapseBtn = container.querySelector("#lib-collapse");
    if (collapseBtn) collapseBtn.addEventListener("click", () => {
      collapsed = !collapsed;
      localStorage.setItem("library_collapsed", JSON.stringify(collapsed));
      render();
    });
    container.querySelectorAll(".library-tabs button").forEach(b => {
      b.addEventListener("click", () => { activeTab = b.dataset.tab; render(); });
    });
    container.querySelectorAll(".library-category-header").forEach(h => {
      h.addEventListener("click", () => {
        const cat = h.dataset.cat;
        categoryOpen[cat] = !categoryOpen[cat];
        localStorage.setItem("library_categories", JSON.stringify(categoryOpen));
        render();
      });
    });
    // 검색은 필터로
    const search = container.querySelector(".library-search");
    if (search) search.addEventListener("input", e => {
      const q = e.target.value.toLowerCase();
      container.querySelectorAll(".library-item").forEach(it => {
        it.style.display = it.textContent.toLowerCase().includes(q) ? "" : "none";
      });
    });
  }

  render();
  return { render };
}
```

- [ ] **Step 4: `_builder/static/js/editor/canvas.js` — 구성 영역**

```javascript
import { expandPreset } from "./presets.js";

export function createCanvas(container, state, onStateChange) {
  function render() {
    if (!state.currentMail) {
      container.innerHTML = `<div class="canvas-empty">메일 데이터 로딩 중...</div>`;
      return;
    }
    const tree = state.currentMail.tree || { layouts: [] };
    if (tree.layouts.length === 0) {
      container.innerHTML = `<div class="canvas-empty">
        라이브러리에서 블록을 끌어다 놓으세요
      </div>`;
    } else {
      container.innerHTML = tree.layouts.map((l, idx) => renderLayoutCard(l, idx)).join("");
    }
    attachDropHandler();
  }

  function renderLayoutCard(layout, idx) {
    const def = state.library.layouts[layout.type];
    return `
      <div class="layout-card" data-idx="${idx}">
        <div class="layout-card-header">
          <span>📐 ${def.label}</span>
          <button class="delete-btn" data-action="delete-layout" data-idx="${idx}">✕</button>
        </div>
        <div class="layout-card-body">
          ${(layout.cells || []).map((c, ci) => `
            <div class="cell" data-cell-idx="${ci}">
              <div class="cell-label">셀 ${ci + 1}</div>
              ${(c.items || []).map((it, ii) => renderItem(it, idx, ci, ii)).join("")}
              <div class="add-element-hint" data-layout-idx="${idx}" data-cell-idx="${ci}">+ 요소 (드래그)</div>
            </div>
          `).join("")}
        </div>
      </div>
    `;
  }

  function renderItem(item, layoutIdx, cellIdx, itemIdx) {
    if (item.kind === "element") {
      const def = state.library.elements[item.type];
      const summary = elementSummary(item);
      return `<div class="element-card" data-li="${layoutIdx}" data-ci="${cellIdx}" data-ii="${itemIdx}">
        <span>${def.icon || ""} ${def.label}</span>
        <span class="summary">${summary}</span>
        <button class="delete-btn" data-action="delete-item">✕</button>
      </div>`;
    }
    if (item.kind === "box") {
      return `<div class="box-card" data-li="${layoutIdx}" data-ci="${cellIdx}" data-ii="${itemIdx}">
        <div class="box-card-header">📦 박스 <button class="delete-btn" data-action="delete-item">✕</button></div>
        <div class="box-card-items">
          ${(item.items || []).map((sub, si) => renderItem(sub, layoutIdx, cellIdx, `${itemIdx}.${si}`)).join("")}
        </div>
      </div>`;
    }
    return "";
  }

  function elementSummary(el) {
    if (el.type === "text") return (el.html || "").replace(/<[^>]+>/g, "").slice(0, 30);
    if (el.type === "image") return el.alt || el.src || "";
    if (el.type === "button") return el.label || "";
    if (el.type === "spacer") return `${el.height}px`;
    if (el.type === "divider") return "";
    return "";
  }

  function attachDropHandler() {
    container.addEventListener("dragover", e => e.preventDefault());
    container.addEventListener("drop", e => {
      e.preventDefault();
      const data = e.dataTransfer.getData("application/x-builder");
      if (!data) return;
      const { add, key } = JSON.parse(data);
      handleAdd(add, key);
    });
    // 라이브러리 dragstart는 라이브러리에서 처리해야 함 (라이브러리 패널의 .library-item draggable)
    // 여기선 컨테이너의 글로벌 dragover만
    container.querySelectorAll('[data-action="delete-layout"]').forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx);
        state.currentMail.tree.layouts.splice(idx, 1);
        state.unsavedChanges = true;
        render();
        onStateChange();
      });
    });
    container.querySelectorAll('[data-action="delete-item"]').forEach(btn => {
      btn.addEventListener("click", e => {
        e.stopPropagation();
        const card = btn.closest("[data-li]");
        const li = parseInt(card.dataset.li);
        const ci = parseInt(card.dataset.ci);
        const ii = card.dataset.ii;
        deleteItem(li, ci, ii);
      });
    });
  }

  function deleteItem(li, ci, iiPath) {
    const parts = String(iiPath).split(".").map(Number);
    const cell = state.currentMail.tree.layouts[li].cells[ci];
    let arr = cell.items;
    for (let p = 0; p < parts.length - 1; p++) arr = arr[parts[p]].items;
    arr.splice(parts[parts.length - 1], 1);
    state.unsavedChanges = true;
    render();
    onStateChange();
  }

  function handleAdd(kind, key) {
    if (!state.currentMail) return;
    const layouts = state.currentMail.tree.layouts;
    if (kind === "layout") {
      const def = state.library.layouts[key];
      layouts.push({
        kind: "layout", type: key, padding: null, bgColor: null,
        cells: Array.from({ length: def.cells }, () => ({ items: [] })),
      });
    } else if (kind === "element") {
      // 마지막 레이아웃의 첫 셀에 추가 (간단화)
      if (layouts.length === 0) {
        layouts.push({
          kind: "layout", type: "1col", padding: null, bgColor: null,
          cells: [{ items: [] }],
        });
      }
      const last = layouts[layouts.length - 1];
      const def = state.library.elements[key];
      last.cells[0].items.push({ kind: "element", type: key, ...def.default });
    } else if (kind === "box") {
      if (layouts.length === 0) {
        layouts.push({
          kind: "layout", type: "1col", padding: null, bgColor: null,
          cells: [{ items: [] }],
        });
      }
      layouts[layouts.length - 1].cells[0].items.push({ kind: "box", items: [] });
    } else if (kind === "preset") {
      const expanded = expandPreset(key, state.library);
      for (const lay of expanded) layouts.push(lay);
    }
    state.unsavedChanges = true;
    render();
    onStateChange();
  }

  render();
  return { render, handleAdd };
}
```

- [ ] **Step 5: `_builder/static/js/editor/presets.js` — 프론트엔드 프리셋 분해 (서버에 별도 호출 안 하기 위해)**

```javascript
// 서버 library.py 의 expand_preset과 동일 결과 산출.
// 라이브러리 정의의 default들을 참고.
export function expandPreset(key, library) {
  const factories = PRESET_FACTORIES;
  if (!factories[key]) throw new Error(`unknown preset: ${key}`);
  return factories[key]();
}

const _l1 = (items, padding=null, bg=null) => ({
  kind: "layout", type: "1col", padding, bgColor: bg,
  cells: [{ items }]
});
const _l2 = (left, right, padding=null, bg=null) => ({
  kind: "layout", type: "2col-50-50", padding, bgColor: bg,
  cells: [{ items: left }, { items: right }]
});
const _el = (type, props) => ({ kind: "element", type, ...props });
const _box = (items, props={}) => ({ kind: "box", items, ...props });

const PRESET_FACTORIES = {
  hero: () => [_l1([
    _el("image", { src: "https://placehold.co/120x40?text=LOGO", alt: "logo", width: 120, align: "center" }),
    _el("text", { html: "<h1>메인 타이틀</h1>" }),
  ])],
  hero_with_subtitle: () => [_l1([
    _el("image", { src: "https://placehold.co/120x40?text=LOGO", alt: "logo", width: 120, align: "center" }),
    _el("text", { html: "<h1>메인 타이틀</h1>" }),
    _el("text", { html: "<p>서브 카피</p>" }),
  ])],
  section_divider: () => [_l1([
    _el("text", { html: "<h2>섹션 제목</h2>" }),
  ], { top: 18, right: 20, bottom: 18, left: 20 }, "#e9f9fb")],
  highlighted_intro: () => [_l1([
    _box([_el("text", { html: "<p>강조하고 싶은 본문 인트로</p>" })],
         { bgColor: "#ffffff", borderColor: "#26c7d9", borderWidth: 1, borderRadius: 4 }),
  ], null, "#e9f9fb")],
  body_block: () => [_l1([
    _el("text", { html: "<h2>본문 제목</h2>" }),
    _el("text", { html: "<p>본문 내용을 여기에 작성합니다.</p>" }),
    _el("image", { src: "https://placehold.co/600x300?text=본문+이미지", alt: "본문 이미지", width: 600, align: "center" }),
  ])],
  cta_solo: () => [_l1([
    _el("button", { label: "지금 사용해보기", href: "https://example.com", bgColor: "#26c7d9", size: "medium", align: "center" }),
  ], { top: 0, right: 20, bottom: 30, left: 20 })],
  cta_microcopy: () => [_l1([
    _el("text", { html: "<p style='text-align:center;'>등록은 30초!</p>" }),
    _el("button", { label: "무료 시작", href: "https://example.com", bgColor: "#26c7d9", size: "medium", align: "center" }),
  ])],
  cta_body: () => [_l1([
    _el("text", { html: "<p>왜 지금 가입해야 하는지에 대한 짧은 설명.</p>" }),
    _el("button", { label: "가입하기", href: "https://example.com", bgColor: "#26c7d9", size: "medium", align: "center" }),
  ])],
  cta_emphasized: () => [_l1([
    _el("text", { html: "<h2>강조 헤드라인</h2>" }),
    _el("text", { html: "<p>본문 보충 설명</p>" }),
    _el("button", { label: "시작하기", href: "https://example.com", bgColor: "#26c7d9", size: "large", align: "center" }),
  ])],
  card_full: () => [_l1([
    _el("text", { html: "<h3>카드 제목</h3>" }),
    _el("image", { src: "https://placehold.co/600x300?text=카드", alt: "카드 이미지", width: 600, align: "center" }),
    _el("text", { html: "<p>카드 설명</p>" }),
    _el("button", { label: "자세히 보기", href: "https://example.com", bgColor: "#26c7d9", size: "medium", align: "center" }),
  ])],
  card_2up: () => [_l2(
    [
      _el("image", { src: "https://placehold.co/280x180?text=A", alt: "A", width: 280, align: "center" }),
      _el("text", { html: "<p><strong>카드 A</strong></p>" }),
      _el("button", { label: "A 보기", href: "https://example.com", bgColor: "#26c7d9", size: "small", align: "center" }),
    ],
    [
      _el("image", { src: "https://placehold.co/280x180?text=B", alt: "B", width: 280, align: "center" }),
      _el("text", { html: "<p><strong>카드 B</strong></p>" }),
      _el("button", { label: "B 보기", href: "https://example.com", bgColor: "#26c7d9", size: "small", align: "center" }),
    ],
  )],
  side_topic_box: () => [_l1([
    _box([
      _el("text", { html: "<h3>사이드 토픽</h3>" }),
      _el("text", { html: "<p>이 박스 안의 내용은 본 주제와 약간 다른 정보입니다.</p>" }),
      _el("image", { src: "https://placehold.co/520x260?text=토픽", alt: "토픽", width: 520, align: "center" }),
      _el("button", { label: "자세히", href: "https://example.com", bgColor: "#26c7d9", size: "small", align: "center" }),
    ], { bgColor: "#ffffff", borderColor: "#26c7d9", borderWidth: 1, borderRadius: 8,
         padding: { top: 25, right: 20, bottom: 25, left: 20 } }),
  ], null, "#e9f9fb")],
  footer_company: () => [_l1([
    _el("text", { html: "<p style='color:#fff; font-size:12px; line-height:1.6;'>회사명: [회사명]<br>HP: [홈페이지]<br>이메일: [이메일]<br>주소: [주소]</p>" }),
  ], { top: 30, right: 20, bottom: 30, left: 20 }, "#2a2a2a")],
  footer_unsubscribe: () => [_l1([
    _el("text", { html: "<p style='color:#aaa; font-size:11px; text-align:center;'>수신을 원하지 않으시면 <a href='{{${set_user_to_unsubscribed_url}}}' style='color:#aaa;'>여기</a>를 클릭해 주세요.</p>" }),
  ], { top: 10, right: 20, bottom: 30, left: 20 }, "#2a2a2a")],
};
```

- [ ] **Step 6: `_builder/static/js/editor/index.js` — 편집 모드 통합**

```javascript
import { api } from "../api.js";
import { createLibraryPanel } from "./library.js";
import { createCanvas } from "./canvas.js";
import { createPreview } from "./preview.js";

let preview;
let libraryPanel;
let canvas;

export async function renderEditorTab(container, state, onStateChange) {
  if (!state.editingMailId) {
    container.innerHTML = `
      <div style="text-align:center; padding:80px 20px; color:#888;">
        <p style="margin-bottom:14px; font-size:14px;">사이드바에서 편집할 메일의 '편집' 버튼을 눌러주세요</p>
      </div>
    `;
    return;
  }

  if (!state.currentMail || state.currentMail.id !== state.editingMailId) {
    state.currentMail = await api.getMail(state.editingMailId);
    state.unsavedChanges = false;
  }

  container.innerHTML = `
    <div class="editor">
      <div class="editor-toolbar">
        <span>#${state.currentMail.number}</span>
        <span class="title">${state.currentMail.title}</span>
        <span style="font-size:11px; color:#888;">${state.currentMail.createdAt?.slice(0,10) || ""}</span>
        <button id="save-btn" class="primary" ${!state.unsavedChanges ? "disabled" : ""}>저장</button>
        <button id="close-btn" ${state.unsavedChanges ? "disabled" : ""}>닫기</button>
      </div>
      <div class="editor-body">
        <div class="editor-left">
          <div id="library-host"></div>
          <div id="canvas-host" class="canvas"></div>
        </div>
        <div id="preview-host"></div>
      </div>
    </div>
  `;

  libraryPanel = createLibraryPanel(document.getElementById("library-host"), state);
  canvas = createCanvas(document.getElementById("canvas-host"), state, () => {
    onStateChange();
    preview.rerender();
    // 저장/닫기 버튼 상태 갱신
    document.getElementById("save-btn")?.removeAttribute("disabled");
    document.getElementById("close-btn")?.setAttribute("disabled", "");
  });
  preview = createPreview(document.getElementById("preview-host"), state);
  preview.rerender();

  // 라이브러리 → 캔버스 드래그
  document.querySelectorAll(".library-item").forEach(it => {
    it.addEventListener("dragstart", e => {
      const data = { add: it.dataset.add, key: it.dataset.key };
      e.dataTransfer.setData("application/x-builder", JSON.stringify(data));
    });
  });

  document.getElementById("save-btn").addEventListener("click", async () => {
    await api.saveMail(state.currentMail.id, state.currentMail);
    state.unsavedChanges = false;
    alert("저장됨");
    onStateChange();
  });
  document.getElementById("close-btn").addEventListener("click", () => {
    if (state.unsavedChanges && !confirm("저장되지 않은 변경사항이 있습니다. 닫으시겠습니까?")) return;
    state.editingMailId = null;
    state.currentMail = null;
    state.unsavedChanges = false;
    onStateChange();
  });
}
```

- [ ] **Step 7: 추가 CSS — `_builder/static/css/style.css`에 추가**

```css
.layout-card {
  background: #fff;
  border: 1px solid #ddd;
  border-radius: 6px;
  margin-bottom: 10px;
}
.layout-card-header {
  padding: 6px 10px; background: #fff7e0;
  display: flex; justify-content: space-between; align-items: center;
  font-weight: bold; font-size: 12px; border-bottom: 1px solid #f5c842;
}
.layout-card-body { display: flex; gap: 8px; padding: 8px; }
.cell {
  flex: 1; background: #fafafa; border: 1px dashed #ccc; border-radius: 4px;
  padding: 6px; min-height: 60px;
}
.cell-label { font-size: 10px; color: #888; margin-bottom: 4px; }
.element-card {
  background: white; border: 1px solid #ddd; border-radius: 4px;
  padding: 6px; margin-bottom: 4px; font-size: 11px;
  display: flex; align-items: center; gap: 6px;
}
.element-card .summary { color: #888; flex: 1; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.box-card {
  background: #f0f9fb; border: 1px solid #26c7d9; border-radius: 4px;
  margin-bottom: 4px;
}
.box-card-header {
  padding: 4px 8px; font-size: 11px; font-weight: bold;
  display: flex; justify-content: space-between;
}
.box-card-items { padding: 6px; }
.add-element-hint {
  text-align: center; padding: 4px; color: #aaa; font-size: 10px;
  border: 1px dashed #ddd; border-radius: 3px; margin-top: 4px;
}
.delete-btn {
  background: none; border: none; color: #c00; cursor: pointer; font-size: 14px;
}
```

- [ ] **Step 8: 수동 테스트**

- 새 메일 생성
- 사이드바 "편집" 클릭 → 제작탭 진입
- 라이브러리에서 1열 레이아웃 드래그 → 캔버스에 추가
- 이미지·텍스트 요소 드래그 추가
- 우측 비주얼 프리뷰 갱신 확인
- 코드 토글 → 코드 복사 동작
- 저장 → 닫기 → 다시 편집 → 데이터 유지 확인

- [ ] **Step 9: 커밋**

```bash
git add _builder/
git commit -m "feat(builder): editor with library/canvas/preview"
```

---

## Phase 9 — 요소·박스·레이아웃 속성 편집

### Task 9.1: 요소 카드 클릭 시 속성 편집 패널

**Files:**
- Modify: `_builder/static/js/editor/canvas.js`
- Modify: `_builder/static/css/style.css`

- [ ] **Step 1: 캔버스에서 요소 클릭 시 펼침 패널 추가**

`canvas.js`의 `renderItem` (element 케이스)을 다음과 같이 확장:

```javascript
function renderItem(item, layoutIdx, cellIdx, itemIdx) {
  if (item.kind === "element") {
    const def = state.library.elements[item.type];
    const summary = elementSummary(item);
    const isExpanded = state.expandedItem === `${layoutIdx}.${cellIdx}.${itemIdx}`;
    return `<div class="element-card ${isExpanded ? "expanded" : ""}" data-li="${layoutIdx}" data-ci="${cellIdx}" data-ii="${itemIdx}">
      <div class="element-card-header">
        <span>${def.icon || ""} ${def.label}</span>
        <span class="summary">${summary}</span>
        <button class="delete-btn" data-action="delete-item">✕</button>
      </div>
      ${isExpanded ? renderProps(item, layoutIdx, cellIdx, itemIdx) : ""}
    </div>`;
  }
  // box / 기존 그대로
}

function renderProps(el, li, ci, ii) {
  if (el.type === "image") {
    return `<div class="props">
      <label>src <input type="text" data-prop="src" value="${escAttr(el.src || "")}"></label>
      <label>alt <input type="text" data-prop="alt" value="${escAttr(el.alt || "")}"></label>
      <label>width <input type="number" data-prop="width" value="${el.width || 600}"></label>
      <label>정렬
        <select data-prop="align">
          <option ${el.align==="left"?"selected":""}>left</option>
          <option ${el.align==="center"?"selected":""}>center</option>
          <option ${el.align==="right"?"selected":""}>right</option>
        </select>
      </label>
      <label>링크 (옵션) <input type="text" data-prop="link" value="${escAttr(el.link || "")}"></label>
    </div>`;
  }
  if (el.type === "button") {
    return `<div class="props">
      <label>라벨 <input type="text" data-prop="label" value="${escAttr(el.label || "")}"></label>
      <label>URL <input type="text" data-prop="href" value="${escAttr(el.href || "")}"></label>
      <label>배경색 <input type="color" data-prop="bgColor" value="${el.bgColor || "#26c7d9"}"></label>
      <label>크기
        <select data-prop="size">
          <option ${el.size==="small"?"selected":""}>small</option>
          <option ${el.size==="medium"?"selected":""}>medium</option>
          <option ${el.size==="large"?"selected":""}>large</option>
        </select>
      </label>
    </div>`;
  }
  if (el.type === "divider") {
    return `<div class="props">
      <label>색 <input type="color" data-prop="color" value="${el.color || "#dddddd"}"></label>
      <label>두께 <input type="number" data-prop="thickness" value="${el.thickness || 1}"></label>
    </div>`;
  }
  if (el.type === "spacer") {
    return `<div class="props">
      <label>높이(px) <input type="number" data-prop="height" value="${el.height || 24}"></label>
    </div>`;
  }
  if (el.type === "text") {
    // Phase 10에서 contentEditable로 교체
    return `<div class="props">
      <label>HTML <textarea data-prop="html" rows="4">${escapeText(el.html || "")}</textarea></label>
    </div>`;
  }
  return "";
}

function escAttr(s) {
  return String(s).replace(/[&<>"]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
}
function escapeText(s) {
  return String(s).replace(/[&<>]/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;"}[c]));
}
```

- [ ] **Step 2: 클릭으로 펼치기·속성 입력 핸들러**

`attachDropHandler` 끝에 추가:

```javascript
container.querySelectorAll(".element-card-header").forEach(h => {
  h.addEventListener("click", e => {
    if (e.target.closest("button")) return;
    const card = h.closest(".element-card");
    const key = `${card.dataset.li}.${card.dataset.ci}.${card.dataset.ii}`;
    state.expandedItem = state.expandedItem === key ? null : key;
    render();
  });
});
container.querySelectorAll(".props [data-prop]").forEach(input => {
  input.addEventListener("change", e => {
    const card = input.closest("[data-li]");
    const li = parseInt(card.dataset.li);
    const ci = parseInt(card.dataset.ci);
    const ii = card.dataset.ii;
    updateItem(li, ci, ii, input.dataset.prop, parseValue(input));
  });
});

function parseValue(input) {
  if (input.type === "number") return parseFloat(input.value);
  return input.value;
}

function updateItem(li, ci, iiPath, prop, value) {
  const parts = String(iiPath).split(".").map(Number);
  const cell = state.currentMail.tree.layouts[li].cells[ci];
  let arr = cell.items;
  for (let p = 0; p < parts.length - 1; p++) arr = arr[parts[p]].items;
  arr[parts[parts.length - 1]][prop] = value;
  state.unsavedChanges = true;
  onStateChange();
  // 부분 재렌더 대신 전체 재렌더 (단순)
  render();
}
```

- [ ] **Step 3: CSS 추가**

```css
.element-card.expanded { background: #f0f9fb; }
.element-card-header { display: flex; align-items: center; gap: 6px; padding: 6px; cursor: pointer; }
.props {
  padding: 8px; background: #fafafa; border-top: 1px solid #ddd;
  display: flex; flex-direction: column; gap: 6px;
}
.props label { font-size: 11px; display: flex; align-items: center; gap: 6px; }
.props label input[type="text"], .props label input[type="number"], .props label textarea, .props label select {
  flex: 1; padding: 3px 6px; font-size: 11px; border: 1px solid #ccc; border-radius: 3px;
}
```

- [ ] **Step 4: 수동 테스트**

이미지·버튼·텍스트 요소 펼쳐서 속성 수정 → 우측 프리뷰 갱신 확인.

- [ ] **Step 5: 커밋**

```bash
git add _builder/static/
git commit -m "feat(builder): element property panels (image/button/divider/spacer/text)"
```

---

## Phase 10 — 리치 텍스트 (contentEditable)

### Task 10.1: 텍스트 요소 인라인 편집 + sanitize

**Files:**
- Create: `_builder/static/js/editor/richtext.js`
- Modify: `_builder/static/js/editor/canvas.js`
- Create: `_builder/server/routes_sanitize.py` (간단 sanitize API)

- [ ] **Step 1: 서버 sanitize 라우트**

`server/routes.py`에 추가:

```python
from . import sanitizer

@api_bp.route("/sanitize", methods=["POST"])
def sanitize_endpoint():
    body = request.get_json() or {}
    return jsonify({"html": sanitizer.sanitize_html(body.get("html", ""))})
```

- [ ] **Step 2: 프론트 `richtext.js`**

```javascript
import { api } from "../api.js";

export function makeEditable(el, initialHtml, onChange) {
  el.contentEditable = "true";
  el.innerHTML = initialHtml;
  let timer = null;
  el.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(async () => {
      const sanitized = await api_sanitize(el.innerHTML);
      onChange(sanitized);
    }, 200);
  });
  el.addEventListener("blur", async () => {
    clearTimeout(timer);
    const sanitized = await api_sanitize(el.innerHTML);
    el.innerHTML = sanitized;
    onChange(sanitized);
  });
}

async function api_sanitize(html) {
  const rv = await fetch("/api/sanitize", {
    method: "POST", headers: {"Content-Type":"application/json"},
    body: JSON.stringify({html}),
  });
  const data = await rv.json();
  return data.html;
}

// 툴바
export function createToolbar(targetEl) {
  const bar = document.createElement("div");
  bar.className = "richtext-toolbar";
  bar.innerHTML = `
    <button data-cmd="bold"><b>B</b></button>
    <button data-cmd="underline"><u>U</u></button>
    <button data-cmd="createLink">🔗</button>
    <button data-cmd="formatBlock-h1">H1</button>
    <button data-cmd="formatBlock-h2">H2</button>
    <button data-cmd="formatBlock-p">P</button>
    <button data-cmd="insertUnorderedList">• 목록</button>
  `;
  bar.addEventListener("click", e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const cmd = btn.dataset.cmd;
    if (cmd === "createLink") {
      const url = prompt("URL:");
      if (url) document.execCommand("createLink", false, url);
    } else if (cmd?.startsWith("formatBlock-")) {
      const tag = cmd.replace("formatBlock-", "");
      document.execCommand("formatBlock", false, tag);
    } else if (cmd) {
      document.execCommand(cmd);
    }
    targetEl.focus();
  });
  return bar;
}
```

- [ ] **Step 3: 캔버스의 텍스트 요소를 contentEditable로 교체**

`renderProps`의 text 케이스를 다음과 같이 변경:

```javascript
if (el.type === "text") {
  return `<div class="props">
    <div class="richtext-toolbar-host"></div>
    <div class="richtext-area" data-prop="html">${el.html || ""}</div>
  </div>`;
}
```

펼쳤을 때 toolbar + makeEditable 적용:

```javascript
// attachDropHandler 안에 추가
container.querySelectorAll(".element-card.expanded .richtext-area").forEach(area => {
  if (area.dataset.bound) return;
  area.dataset.bound = "1";
  const card = area.closest("[data-li]");
  const li = parseInt(card.dataset.li);
  const ci = parseInt(card.dataset.ci);
  const ii = card.dataset.ii;
  const tbHost = area.previousElementSibling;
  import("./richtext.js").then(({ makeEditable, createToolbar }) => {
    tbHost.appendChild(createToolbar(area));
    makeEditable(area, area.innerHTML, (newHtml) => {
      updateItem(li, ci, ii, "html", newHtml);
    });
  });
});
```

- [ ] **Step 4: 툴바 CSS**

```css
.richtext-toolbar { display: flex; gap: 4px; margin-bottom: 6px; }
.richtext-toolbar button {
  padding: 2px 8px; font-size: 11px; border: 1px solid #ccc;
  background: white; cursor: pointer; border-radius: 3px;
}
.richtext-area {
  border: 1px solid #ccc; border-radius: 3px; padding: 6px;
  min-height: 60px; background: white; font-size: 12px;
}
.richtext-area:focus { outline: 2px solid #26c7d9; }
```

- [ ] **Step 5: 수동 테스트**

텍스트 요소 펼침 → 인라인 편집 (B, U, 링크, H1-H2 토글) → 200ms 후 sanitize 적용. div/span 등 제거 확인.

- [ ] **Step 6: 커밋**

```bash
git add _builder/
git commit -m "feat(builder): contentEditable rich text + sanitize endpoint"
```

---

## Phase 11 — 여백 컨트롤 + 레이아웃·박스 속성

### Task 11.1: 레이아웃·박스 클릭 시 속성 패널 (배경색·border·padding)

**Files:**
- Modify: `_builder/static/js/editor/canvas.js`
- Create: `_builder/static/js/editor/spacing.js`

- [ ] **Step 1: 레이아웃 카드 헤더 클릭 → 속성 패널**

`renderLayoutCard`를 다음과 같이 확장:

```javascript
function renderLayoutCard(layout, idx) {
  const def = state.library.layouts[layout.type];
  const expanded = state.expandedLayout === idx;
  return `
    <div class="layout-card" data-idx="${idx}">
      <div class="layout-card-header" data-action="toggle-layout-props">
        <span>📐 ${def.label}</span>
        <button class="delete-btn" data-action="delete-layout" data-idx="${idx}">✕</button>
      </div>
      ${expanded ? renderLayoutProps(layout, def, idx) : ""}
      <div class="layout-card-body">
        ${(layout.cells || []).map((c, ci) => `
          <div class="cell" data-cell-idx="${ci}">
            <div class="cell-label">셀 ${ci + 1}</div>
            ${(c.items || []).map((it, ii) => renderItem(it, idx, ci, ii)).join("")}
          </div>
        `).join("")}
      </div>
    </div>
  `;
}

function renderLayoutProps(layout, def, idx) {
  const p = layout.padding || def.default_padding;
  const bg = layout.bgColor || "";
  return `<div class="layout-props">
    <label>배경색 <input type="color" data-layout-prop="bgColor" data-idx="${idx}" value="${bg || "#ffffff"}">
      <button data-layout-prop="bgColor-clear" data-idx="${idx}">↻ 기본</button>
    </label>
    <div class="padding-control">
      <span>여백:</span>
      <label>위 <input type="number" data-pad="top" data-idx="${idx}" value="${p.top}"></label>
      <label>오른쪽 <input type="number" data-pad="right" data-idx="${idx}" value="${p.right}"></label>
      <label>아래 <input type="number" data-pad="bottom" data-idx="${idx}" value="${p.bottom}"></label>
      <label>왼쪽 <input type="number" data-pad="left" data-idx="${idx}" value="${p.left}"></label>
      <button data-layout-prop="padding-clear" data-idx="${idx}">↻ 기본</button>
    </div>
  </div>`;
}
```

- [ ] **Step 2: 핸들러 추가**

`attachDropHandler` 안에 추가:

```javascript
container.querySelectorAll('[data-action="toggle-layout-props"]').forEach(h => {
  h.addEventListener("click", e => {
    if (e.target.closest("button")) return;
    const idx = parseInt(h.parentElement.dataset.idx);
    state.expandedLayout = state.expandedLayout === idx ? null : idx;
    render();
  });
});
container.querySelectorAll('[data-layout-prop="bgColor"]').forEach(input => {
  input.addEventListener("change", e => {
    const idx = parseInt(input.dataset.idx);
    state.currentMail.tree.layouts[idx].bgColor = input.value;
    state.unsavedChanges = true;
    onStateChange();
    render();
  });
});
container.querySelectorAll('[data-layout-prop="bgColor-clear"]').forEach(btn => {
  btn.addEventListener("click", () => {
    const idx = parseInt(btn.dataset.idx);
    state.currentMail.tree.layouts[idx].bgColor = null;
    state.unsavedChanges = true;
    onStateChange();
    render();
  });
});
container.querySelectorAll('[data-pad]').forEach(input => {
  input.addEventListener("change", e => {
    const idx = parseInt(input.dataset.idx);
    const dir = input.dataset.pad;
    const layout = state.currentMail.tree.layouts[idx];
    layout.padding = layout.padding || {};
    layout.padding[dir] = parseInt(input.value);
    state.unsavedChanges = true;
    onStateChange();
    render();
  });
});
container.querySelectorAll('[data-layout-prop="padding-clear"]').forEach(btn => {
  btn.addEventListener("click", () => {
    const idx = parseInt(btn.dataset.idx);
    state.currentMail.tree.layouts[idx].padding = null;
    state.unsavedChanges = true;
    onStateChange();
    render();
  });
});
```

- [ ] **Step 3: 박스에도 동일 패턴 적용**

`renderItem`의 box 케이스를 다음과 같이 수정:

```javascript
if (item.kind === "box") {
  const expandedKey = `box-${layoutIdx}-${cellIdx}-${itemIdx}`;
  const isExpanded = state.expandedBox === expandedKey;
  return `<div class="box-card" data-li="${layoutIdx}" data-ci="${cellIdx}" data-ii="${itemIdx}">
    <div class="box-card-header" data-action="toggle-box-props" data-key="${expandedKey}">
      📦 박스 <button class="delete-btn" data-action="delete-item">✕</button>
    </div>
    ${isExpanded ? renderBoxProps(item, layoutIdx, cellIdx, itemIdx) : ""}
    <div class="box-card-items">
      ${(item.items || []).map((sub, si) => renderItem(sub, layoutIdx, cellIdx, `${itemIdx}.${si}`)).join("")}
    </div>
  </div>`;
}

function renderBoxProps(box, li, ci, ii) {
  const def = state.library.boxes.box;
  const p = box.padding || def.default_padding;
  return `<div class="box-props" data-li="${li}" data-ci="${ci}" data-ii="${ii}">
    <label>배경색 <input type="color" data-box-prop="bgColor" value="${box.bgColor || def.default_bg}"></label>
    <label>테두리 색 <input type="color" data-box-prop="borderColor" value="${box.borderColor || def.default_border_color}"></label>
    <label>테두리 두께 <input type="number" data-box-prop="borderWidth" value="${box.borderWidth ?? def.default_border_width}"></label>
    <label>radius <input type="number" data-box-prop="borderRadius" value="${box.borderRadius ?? def.default_border_radius}"></label>
    <div class="padding-control">
      <span>여백:</span>
      <label>위 <input type="number" data-box-pad="top" value="${p.top}"></label>
      <label>오른쪽 <input type="number" data-box-pad="right" value="${p.right}"></label>
      <label>아래 <input type="number" data-box-pad="bottom" value="${p.bottom}"></label>
      <label>왼쪽 <input type="number" data-box-pad="left" value="${p.left}"></label>
      <button data-box-prop="padding-clear">↻ 기본</button>
    </div>
  </div>`;
}
```

핸들러 추가 (`attachDropHandler` 안):

```javascript
container.querySelectorAll('[data-action="toggle-box-props"]').forEach(h => {
  h.addEventListener("click", e => {
    if (e.target.closest("button")) return;
    state.expandedBox = state.expandedBox === h.dataset.key ? null : h.dataset.key;
    render();
  });
});
container.querySelectorAll('[data-box-prop]').forEach(input => {
  input.addEventListener("change", e => {
    const propsDiv = input.closest(".box-props");
    const li = parseInt(propsDiv.dataset.li);
    const ci = parseInt(propsDiv.dataset.ci);
    const ii = propsDiv.dataset.ii;
    const prop = input.dataset.boxProp;
    const value = prop === "padding-clear" ? null : (input.type === "number" ? parseInt(input.value) : input.value);
    const target = locateBox(li, ci, ii);
    if (prop === "padding-clear") target.padding = null;
    else target[prop] = value;
    state.unsavedChanges = true;
    onStateChange();
    render();
  });
});
container.querySelectorAll('[data-box-pad]').forEach(input => {
  input.addEventListener("change", e => {
    const propsDiv = input.closest(".box-props");
    const li = parseInt(propsDiv.dataset.li);
    const ci = parseInt(propsDiv.dataset.ci);
    const ii = propsDiv.dataset.ii;
    const target = locateBox(li, ci, ii);
    target.padding = target.padding || {};
    target.padding[input.dataset.boxPad] = parseInt(input.value);
    state.unsavedChanges = true;
    onStateChange();
    render();
  });
});

function locateBox(li, ci, iiPath) {
  const parts = String(iiPath).split(".").map(Number);
  const cell = state.currentMail.tree.layouts[li].cells[ci];
  let arr = cell.items;
  for (let p = 0; p < parts.length - 1; p++) arr = arr[parts[p]].items;
  return arr[parts[parts.length - 1]];
}
```

- [ ] **Step 4: CSS**

```css
.layout-props {
  padding: 8px; background: #fafafa; border-bottom: 1px solid #ddd;
  display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px;
}
.padding-control {
  display: flex; gap: 6px; align-items: center; flex-wrap: wrap;
}
.padding-control input[type="number"] { width: 56px; padding: 2px 4px; font-size: 11px; }
```

- [ ] **Step 5: 수동 테스트**

레이아웃 헤더 클릭 → 배경색 변경 / 패딩 위·아래 조정 / ↻ 기본값 동작 확인. 박스도 동일.

- [ ] **Step 6: 커밋**

```bash
git add _builder/
git commit -m "feat(builder): layout/box props panel with bg + 4-direction padding"
```

---

## Phase 12 — Undo + 미저장 처리 + beforeunload

### Task 12.1: Undo 스택 + Ctrl+Z 바인딩

**Files:**
- Create: `_builder/static/js/editor/undo.js`
- Modify: `_builder/static/js/editor/canvas.js`
- Modify: `_builder/static/js/editor/index.js`

- [ ] **Step 1: `undo.js`**

```javascript
const MAX = 30;

export function createUndoStack() {
  const stack = [];
  return {
    push(snapshot) {
      stack.push(JSON.stringify(snapshot));
      while (stack.length > MAX) stack.shift();
    },
    pop() {
      if (stack.length === 0) return null;
      return JSON.parse(stack.pop());
    },
    clear() { stack.length = 0; },
    size() { return stack.length; },
  };
}
```

- [ ] **Step 2: 모든 트리 변경 직전에 push**

`canvas.js`에 helper 추가하고 `handleAdd`, `deleteItem`, `updateItem`에서 호출:

```javascript
function snapshot() {
  state.undoStack.push(state.currentMail.tree);
}
```

각 변경 함수 시작 부분에 `snapshot()` 호출 추가.

- [ ] **Step 3: Ctrl+Z 글로벌 핸들러 (`editor/index.js`에서 등록)**

```javascript
// renderEditorTab 안 마지막에:
function onKey(e) {
  if (e.ctrlKey && e.key === "z" && state.editingMailId) {
    const prev = state.undoStack.pop();
    if (prev) {
      state.currentMail.tree = prev;
      state.unsavedChanges = true;
      onStateChange();
    }
  }
}
document.addEventListener("keydown", onKey);
// 닫기 시 제거 — close-btn 핸들러에 추가:
// document.removeEventListener("keydown", onKey);
```

- [ ] **Step 4: 메일 닫을 때 스택 초기화**

close-btn 핸들러:

```javascript
state.undoStack.clear();
```

- [ ] **Step 5: beforeunload 경고**

`app.js` 초기화 시:

```javascript
window.addEventListener("beforeunload", e => {
  if (state.unsavedChanges) {
    e.preventDefault();
    e.returnValue = "저장되지 않은 변경사항이 있습니다.";
  }
});
```

- [ ] **Step 6: state에 undoStack 초기화 — `app.js`**

```javascript
import { createUndoStack } from "./editor/undo.js";
state.undoStack = createUndoStack();
```

- [ ] **Step 7: 수동 테스트**

요소 추가·삭제·텍스트 수정 후 Ctrl+Z 누름 → 이전 상태 복원. 메일 닫고 다시 열면 스택 초기화. 미저장 변경 있을 때 새로고침 → 브라우저 컨펌.

- [ ] **Step 8: 커밋**

```bash
git add _builder/static/
git commit -m "feat(builder): undo stack + beforeunload warning"
```

---

## Phase 13 — 신규 메일 생성 시 14 프리셋 자동 삽입

### Task 13.1: POST /api/mails 시 데모 트리 자동 채우기

**Files:**
- Modify: `_builder/server/routes.py`
- Test: `_builder/tests/test_demo_seed.py`

- [ ] **Step 1: 실패 테스트**

```python
# tests/test_demo_seed.py
import pytest
from app import app
from server import storage


@pytest.fixture(autouse=True)
def clean_mails(tmp_path, monkeypatch):
    mails_dir = tmp_path / "mails"
    mails_dir.mkdir()
    monkeypatch.setattr(storage, "MAILS_DIR", mails_dir)
    monkeypatch.setattr(storage, "BACKUP_DIR", mails_dir / ".backup")
    yield


def test_new_mail_has_14_layouts():
    client = app.test_client()
    rv = client.post("/api/mails", json={"title": "demo", "language": "ko"})
    mail = rv.get_json()
    assert len(mail["tree"]["layouts"]) == 14
```

- [ ] **Step 2: `routes.py`의 `create_mail` 수정**

```python
from . import library

# create_mail 함수 안의 mail = ...에서 tree 부분을 다음으로 교체:
demo_layouts = []
for preset_key in library.PRESETS.keys():
    expanded = library.expand_preset(preset_key)
    demo_layouts.extend(expanded)

# 각 layout/cell/item에 id 부여
def _assign_ids(items, prefix="el"):
    for i, item in enumerate(items):
        item["id"] = f"{prefix}-{uuid.uuid4().hex[:8]}"
        if item.get("kind") == "box":
            _assign_ids(item.get("items", []), prefix="el")

for li, layout in enumerate(demo_layouts):
    layout["id"] = f"lay-{uuid.uuid4().hex[:8]}"
    for cell in layout.get("cells", []):
        cell["id"] = f"cell-{uuid.uuid4().hex[:8]}"
        _assign_ids(cell.get("items", []))

mail = {
    "id": str(uuid.uuid4()),
    "title": title,
    "number": next_number,
    "language": language,
    "createdAt": now,
    "lastSavedAt": now,
    "tree": {"layouts": demo_layouts},
}
```

- [ ] **Step 3: 테스트 통과**

```bash
pytest tests/test_demo_seed.py -v
```

- [ ] **Step 4: 수동 확인**

새 메일 생성 → 사이드바 "편집" → 캔버스에 14개 레이아웃 모두 노출 확인.

- [ ] **Step 5: 커밋**

```bash
git add _builder/server/routes.py _builder/tests/test_demo_seed.py
git commit -m "feat(builder): new mail seeded with all 14 presets"
```

---

## Phase 14 — 비교탭

### Task 14.1: 비교탭 — 가로 스크롤 + 폭 토글

**Files:**
- Create: `_builder/static/js/compare.js`
- Modify: `_builder/static/js/app.js`
- Modify: `_builder/static/css/style.css`

- [ ] **Step 1: `compare.js`**

```javascript
import { api } from "./api.js";
import { renderMail } from "./editor/renderer.js";

let currentWidth = 600;

export async function renderCompareTab(container, state) {
  if (state.comparingMailIds.size === 0) {
    container.innerHTML = `<div style="text-align:center; padding:60px; color:#888;">
      사이드바에서 비교할 메일의 '비교' 버튼을 눌러주세요
    </div>`;
    return;
  }

  const mails = await Promise.all(
    [...state.comparingMailIds].map(id => api.getMail(id))
  );

  container.innerHTML = `
    <div class="compare-toolbar">
      <button data-w="600" class="${currentWidth===600?"active":""}">🖥️ 데스크톱 600</button>
      <button data-w="375" class="${currentWidth===375?"active":""}">📱 모바일 375</button>
      <input type="range" min="320" max="800" value="${currentWidth}" id="width-slider">
      <span id="width-label">${currentWidth}px</span>
    </div>
    <div class="compare-scroll">
      ${mails.map(m => `
        <div class="compare-item">
          <div class="compare-item-header">#${m.number} ${m.title}</div>
          <iframe srcdoc="${escAttr(renderMail(m, state.library))}" style="width:${currentWidth}px;"></iframe>
        </div>
      `).join("")}
    </div>
  `;

  container.querySelectorAll(".compare-toolbar button[data-w]").forEach(b => {
    b.addEventListener("click", () => {
      currentWidth = parseInt(b.dataset.w);
      renderCompareTab(container, state);
    });
  });
  const slider = container.querySelector("#width-slider");
  slider.addEventListener("input", () => {
    currentWidth = parseInt(slider.value);
    container.querySelectorAll(".compare-item iframe").forEach(f => f.style.width = `${currentWidth}px`);
    container.querySelector("#width-label").textContent = `${currentWidth}px`;
  });
}

function escAttr(s) {
  return String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
```

- [ ] **Step 2: `app.js`에 연결**

```javascript
import { renderCompareTab } from "./compare.js";

// onStateChange 에서:
else if (state.activeTab === "compare") renderCompareTab(c, state);
```

- [ ] **Step 3: CSS**

```css
.compare-toolbar {
  display: flex; gap: 12px; padding: 10px;
  background: white; border-bottom: 1px solid #ddd;
  align-items: center;
}
.compare-toolbar button { padding: 6px 12px; }
.compare-toolbar button.active { background: #26c7d9; color: white; }
.compare-scroll {
  display: flex; gap: 16px; padding: 16px;
  overflow-x: auto; height: calc(100vh - 100px);
}
.compare-item {
  flex-shrink: 0;
  display: flex; flex-direction: column;
  border: 1px solid #ddd; border-radius: 6px; background: white;
}
.compare-item-header {
  padding: 6px 10px; font-size: 12px; font-weight: bold;
  background: #fafafa; border-bottom: 1px solid #ddd;
}
.compare-item iframe { border: 0; height: 600px; }
```

- [ ] **Step 4: 수동 테스트**

여러 메일 "비교" 토글 → 비교탭 클릭 → 가로 나열 확인. 데스크톱/모바일 토글 + 슬라이더 동작 확인.

- [ ] **Step 5: 커밋**

```bash
git add _builder/
git commit -m "feat(builder): compare tab with width toggle"
```

---

## Phase 15 — 정합성 테스트 (sample_complete)

### Task 15.1: `tests/sample_complete.json` + `sample_complete.html` + 정합성 테스트

**Files:**
- Create: `_builder/tests/sample_complete.json`
- Create: `_builder/tests/sample_complete.html`
- Create: `_builder/tests/test_renderer_fidelity.py`

- [ ] **Step 1: `tests/sample_complete.json` 작성**

모든 레이아웃·박스·요소·14 프리셋의 핵심 변형을 포함하는 메일 트리. (실제 작성 시 약 200-300줄. 모든 5 레이아웃, 박스 단일+중첩, 5 요소, 패딩/배경 변형 1개 이상씩)

```json
{
  "id": "fixture-sample-complete",
  "title": "Sample Complete (모든 레이아웃·요소 포함)",
  "number": 1,
  "language": "ko",
  "createdAt": "2026-04-25T00:00:00Z",
  "lastSavedAt": "2026-04-25T00:00:00Z",
  "tree": {
    "layouts": [
      {
        "id": "lay-hero",
        "type": "1col",
        "padding": null,
        "bgColor": null,
        "cells": [{"id":"c1","items":[
          {"kind":"element","id":"e1","type":"image","src":"https://placehold.co/120x40","alt":"logo","width":120,"align":"center"},
          {"kind":"element","id":"e2","type":"text","html":"<h1>샘플 헤로</h1>"}
        ]}]
      },
      {
        "id": "lay-2col-a",
        "type": "2col-50-50",
        "padding": null,
        "bgColor": null,
        "cells": [
          {"id":"c2a","items":[{"kind":"element","id":"e3","type":"text","html":"<p>왼쪽 50%</p>"}]},
          {"id":"c2b","items":[{"kind":"element","id":"e4","type":"text","html":"<p>오른쪽 50%</p>"}]}
        ]
      },
      {
        "id": "lay-2col-b",
        "type": "2col-33-67",
        "padding": null,
        "bgColor": null,
        "cells": [
          {"id":"c3a","items":[{"kind":"element","id":"e5","type":"text","html":"<p>33%</p>"}]},
          {"id":"c3b","items":[{"kind":"element","id":"e6","type":"text","html":"<p>67%</p>"}]}
        ]
      },
      {
        "id": "lay-2col-c",
        "type": "2col-67-33",
        "padding": null,
        "bgColor": null,
        "cells": [
          {"id":"c4a","items":[{"kind":"element","id":"e7","type":"text","html":"<p>67%</p>"}]},
          {"id":"c4b","items":[{"kind":"element","id":"e8","type":"text","html":"<p>33%</p>"}]}
        ]
      },
      {
        "id": "lay-3col",
        "type": "3col",
        "padding": null,
        "bgColor": null,
        "cells": [
          {"id":"c5a","items":[{"kind":"element","id":"e9","type":"text","html":"<p>A</p>"}]},
          {"id":"c5b","items":[{"kind":"element","id":"e10","type":"text","html":"<p>B</p>"}]},
          {"id":"c5c","items":[{"kind":"element","id":"e11","type":"text","html":"<p>C</p>"}]}
        ]
      },
      {
        "id": "lay-box-nested",
        "type": "1col",
        "padding": {"top":30,"right":20,"bottom":30,"left":20},
        "bgColor": "#e9f9fb",
        "cells": [{"id":"c6","items":[
          {"kind":"box","id":"b1","padding":{"top":25,"right":20,"bottom":25,"left":20},
           "bgColor":"#ffffff","borderColor":"#26c7d9","borderWidth":1,"borderRadius":8,
           "items":[
             {"kind":"box","id":"b2","padding":null,
              "bgColor":"#fff7e0","borderColor":"#f5c842","borderWidth":1,"borderRadius":4,
              "items":[
                {"kind":"element","id":"e12","type":"text","html":"<p>박스 안 박스</p>"}
              ]}
           ]}
        ]}]
      },
      {
        "id": "lay-buttons",
        "type": "1col",
        "padding": null,
        "bgColor": null,
        "cells": [{"id":"c7","items":[
          {"kind":"element","id":"e13","type":"button","label":"기본","href":"#","bgColor":"#26c7d9","size":"medium","align":"center"},
          {"kind":"element","id":"e14","type":"divider","color":"#cccccc","thickness":1,"width":"100%"},
          {"kind":"element","id":"e15","type":"spacer","height":24}
        ]}]
      }
    ]
  }
}
```

- [ ] **Step 2: 빈 `sample_complete.html` (정답)**

JSON을 한 번 렌더해서 출력 결과를 sample_complete.html로 저장 (수동 검수 후 커밋).

```python
# 임시 스크립트로 한 번 생성 후 결과를 검수해 sample_complete.html 로 저장
# python -c "import json; from server.renderer import render_mail; print(render_mail(json.load(open('tests/sample_complete.json'))))" > tests/sample_complete.html
```

이후 사용자가 직접 검수하여 `tests/sample_complete.html`을 정답으로 확정.

- [ ] **Step 3: 정합성 테스트 — `tests/test_renderer_fidelity.py`**

```python
import json
import re
from pathlib import Path
from server.renderer import render_mail


def _normalize(html: str) -> str:
    # 공백·줄바꿈 정규화
    html = re.sub(r'>\s+<', '><', html)
    html = re.sub(r'\s+', ' ', html)
    return html.strip()


def test_sample_complete_renders_to_expected_html():
    base = Path(__file__).parent
    tree = json.loads((base / "sample_complete.json").read_text(encoding="utf-8"))
    expected = (base / "sample_complete.html").read_text(encoding="utf-8")
    actual = render_mail(tree)
    assert _normalize(actual) == _normalize(expected), "렌더링 결과가 sample_complete.html과 다릅니다"
```

- [ ] **Step 4: 실행**

```bash
pytest tests/test_renderer_fidelity.py -v
```
Expected: PASS (sample_complete.html을 렌더 결과로 만들었으므로)

- [ ] **Step 5: 프론트 렌더러 정합성 (수동)**

브라우저에서 새 메일 생성 → 14개 프리셋이 들어간 데모 → 비주얼/코드 토글 → 코드 출력이 서버 렌더와 동일한지 시각 비교 (큰 구조 일치하면 OK).

- [ ] **Step 6: 커밋**

```bash
git add _builder/tests/
git commit -m "test(builder): renderer fidelity test against sample_complete"
```

---

## Phase 16 — 매뉴얼 체크리스트 + 마무리

### Task 16.1: `tests/manual.md` 작성 + v1 완료 검증

**Files:**
- Create: `_builder/tests/manual.md`

- [ ] **Step 1: 매뉴얼 체크리스트 작성**

```markdown
# 매뉴얼 테스트 체크리스트

릴리스 전 사람이 클릭하며 확인. PRD §12 완료 기준과 1:1 대응.

## 핵심 흐름
- [ ] http://localhost:5001 접속 → 소개탭 표시
- [ ] "+ 새 메일" → 14개 프리셋이 모두 캔버스에 자동 추가됨
- [ ] 사이드바에 #1, 언어 라벨, 제목 표시
- [ ] 사이드바 "편집" 클릭 → 제작탭으로 이동, 버튼이 "편집 중"으로 변경
- [ ] 라이브러리 패널의 [기본]/[프리셋] 탭 토글
- [ ] 라이브러리에서 1열 레이아웃 드래그 → 캔버스 추가
- [ ] 텍스트 요소 드래그 → 인라인 편집 (B, U, 링크, H1-H4 토글) → 200ms 후 sanitize 적용
- [ ] 이미지 요소 → src/alt/width/정렬/링크 입력
- [ ] 버튼 요소 → 라벨/URL/배경색/크기 입력
- [ ] 구분선·여백 요소
- [ ] 박스 추가 + 박스 안에 박스 중첩 OK
- [ ] 레이아웃 헤더 클릭 → 배경색·4방향 패딩 조정. ↻ 기본값 동작
- [ ] 우측 비주얼 프리뷰 실시간 갱신 (200ms debounce)
- [ ] 우측 코드 토글 → HTML 표시 → 코드 복사 동작
- [ ] 저장 클릭 → 닫기 버튼 활성화. 닫기 → 사이드바 "편집" 원복
- [ ] 같은 메일 다시 편집 → 데이터 그대로

## 사이드바
- [ ] 메일 row의 제목 더블클릭 → 인라인 수정 → Enter
- [ ] "비교" 토글 → "비교 중" 표시
- [ ] "복제" → 사이드바에 복사본 추가, 제목에 "(복사본)"
- [ ] "삭제" → 컨펌 → 메일 + 백업 모두 제거
- [ ] 다른 메일 편집 중 다른 메일 "편집" 시도 → 차단 팝업

## 비교탭
- [ ] 비교 토글된 메일들이 가로 나열
- [ ] 데스크톱(600)/모바일(375) 버튼 토글 → 모든 카드 폭 변경
- [ ] 슬라이더 → 실시간 폭 조절

## 백업
- [ ] 같은 메일 4번 저장 → `_builder/mails/.backup/` 안에 3개만 남음
- [ ] Claude Code 명령으로 백업 복구 (수동 작업)

## Undo
- [ ] 요소 추가·삭제·수정 후 Ctrl+Z → 직전 상태 복원
- [ ] 메일 닫고 다시 열면 Undo 스택 초기화 (Ctrl+Z 동작 안 함)

## 미저장 처리
- [ ] 미저장 변경 있을 때 새로고침 → 브라우저 컨펌 표시
- [ ] 다른 탭(소개/비교) 클릭 → 메모리 상태 유지

## 4개 언어
- [ ] ja/ko/en/pt-BR 각 언어로 메일 생성 → 사이드바 라벨 정상
- [ ] 출력 HTML의 `lang` 속성 + 폰트 스택 확인

## 이메일 클라이언트 검증 (1회)
- [ ] 코드 모드에서 HTML 복사 → 본인 Gmail로 발송 → 의도대로 렌더
```

- [ ] **Step 2: 자동 테스트 전체 실행**

```bash
cd _builder
pytest -v
```
Expected: 모든 테스트 PASS

- [ ] **Step 3: 매뉴얼 체크리스트 직접 수행**

위 체크리스트 모두 ✅로 만들기 (사용자 또는 실행 에이전트가 수행).

- [ ] **Step 4: 최종 커밋**

```bash
git add _builder/tests/manual.md
git commit -m "docs(builder): manual test checklist for v1 acceptance"
```

---

## 후속 (v1 완료 후)

- v1 완료 보고: PRD §12의 모든 체크박스 ✅
- 사용자가 일주일 사용 후 v2 후보 (소셜 모듈, 검색, 자동저장 등) 우선순위 결정
- 필요 시 별도 플랜 문서로 v2 계획 작성

---

_플랜 작성: 2026-04-25 / 기준: docs/PRD.md, docs/DESIGN.md / 총 16 Phase, 약 30 Task / TDD 기반_
