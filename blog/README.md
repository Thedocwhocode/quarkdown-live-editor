<div align="center">

<br>

<img src="https://img.shields.io/badge/Quarkdown-Blog%20Engine-6c47ff?style=for-the-badge&labelColor=1a1a2e" alt="Quarkdown Blog Engine" height="42">

<br><br>

**A CMS/blog engine powered by [Quarkdown](https://github.com/iamgio/quarkdown).**  
Write content in Quarkdown syntax. Compile once. Serve everywhere.

<br>

[![CI](https://img.shields.io/github/actions/workflow/status/Thedocwhocode/quarkdown-live-editor/blog-ci.yml?branch=main&label=CI&logo=github&style=flat-square)](../../actions/workflows/blog-ci.yml)
[![Python](https://img.shields.io/badge/Python-3.12-3776ab?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![Django](https://img.shields.io/badge/Django-5.1-092e20?style=flat-square&logo=django&logoColor=white)](https://djangoproject.com)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue?style=flat-square&logo=gnu&logoColor=white)](../LICENSE)

<br><br>

</div>

---

## What Is This?

Quarkdown Blog Engine is a Django-based CMS where authors write content in
[Quarkdown](https://github.com/iamgio/quarkdown) — a Turing-complete Markdown flavor
that supports math, diagrams, footnotes, cross-references, advanced layouts, and slides —
and the system compiles it to HTML, stores the rendered output, and serves it instantly
to readers without a compile step at read time.

The architecture maintains **two artefacts per content item**: the Quarkdown source
(`source_qd`) and the compiled HTML (`compiled_html`). The frontend always serves the
pre-compiled HTML from published items, keeping read latency independent of compilation.

---

## Features

<table>
<tr>
<td width="50%">

**Editorial workflow**
- Posts, static pages, and reusable templates
- Draft → Compiled → Published state machine
- Automatic compilation on save (async background thread)
- Manual "Compile Now" button in the admin
- One-click publish (only after successful compile)

</td>
<td width="50%">

**Compiler integration**
- Invokes the official Quarkdown CLI binary as a subprocess
- Full Quarkdown feature set: math, Mermaid, footnotes, layouts, slides
- Compilation errors surfaced inline in the admin
- Compiler warnings captured and persisted

</td>
</tr>
<tr>
<td>

**Versioning**
- Automatic revision snapshot on every successful compile
- Full source + compiled HTML stored per revision
- Foundation for rollback and audit history

</td>
<td>

**Django Admin**
- Color-coded status badges
- Inline compile error and warning panels
- Preview opens the compiled page in a new tab
- Bulk compile and publish actions
- Revisions and compile jobs as inline tables

</td>
</tr>
</table>

---

## Content State Machine

```
draft ──► compiling ──► compiled ──► published
                │
                └──► error
```

The frontend only exposes `published` items. The last valid compiled HTML is
preserved even when a subsequent compile fails, preventing the site from going dark.

---

## Requirements

| Dependency | Version | Purpose |
|---|:---:|---|
| [Python](https://python.org) | **3.12** | Runtime |
| [Django](https://djangoproject.com) | **5.1** | Web framework and admin |
| [PostgreSQL](https://postgresql.org) | **16** | Primary database |
| [Java](https://adoptium.net) | **21** | Quarkdown CLI (JVM compiler) |
| Gradle Wrapper | bundled | Build the Quarkdown CLI — one time |

---

## Quickstart

### 1 — Build the Quarkdown CLI

From the **repository root** (one-time):

```bash
./gradlew installDist
```

The binary is installed to `build/install/quarkdown/bin/quarkdown`.
The blog engine finds it automatically.

### 2 — Set up the Python environment

```bash
cd blog
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements-dev.txt
```

### 3 — Configure environment

```bash
cp .env.example .env
# Edit .env — set SECRET_KEY at minimum.
# Leave DATABASE_URL blank to use SQLite in development.
```

### 4 — Initialise the database

```bash
python manage.py migrate
python manage.py createsuperuser
```

### 5 — Run the development server

```bash
python manage.py runserver
```

Open **http://localhost:8000/admin/** to access the editorial dashboard.
The public blog is at **http://localhost:8000/**.

---

## Docker (full stack with PostgreSQL)

```bash
cd blog
docker compose up --build
```

This starts PostgreSQL and the Django dev server. The Quarkdown binary is
mounted read-only from `../build/install/quarkdown`. Run `./gradlew installDist`
from the repo root first.

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│  Django Admin  /admin/                                   │
│  Author writes Quarkdown → saves ContentItem             │
└────────────────────────┬─────────────────────────────────┘
                         │  save_model hook
┌────────────────────────▼─────────────────────────────────┐
│  Compile Service  (background thread)                    │
│  compile_content_async(content)                          │
└────────────────────────┬─────────────────────────────────┘
                         │  subprocess.run --pipe
┌────────────────────────▼─────────────────────────────────┐
│  Quarkdown CLI  build/install/quarkdown/bin/quarkdown     │
│  Compiles .qd → HTML, returns via stdout                 │
└────────────────────────┬─────────────────────────────────┘
                         │  persists compiled_html
┌────────────────────────▼─────────────────────────────────┐
│  PostgreSQL  ContentItem, ContentRevision, CompileJob    │
└────────────────────────┬─────────────────────────────────┘
                         │  serves published compiled_html
┌────────────────────────▼─────────────────────────────────┐
│  Public frontend  /posts/<slug>/                         │
│  Django template renders pre-compiled HTML — zero lag    │
└──────────────────────────────────────────────────────────┘
```

---

## Project Structure

<details>
<summary><strong>blog/ — click to expand</strong></summary>

```
blog/
├── manage.py
├── requirements.txt
├── requirements-dev.txt
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── pyproject.toml                  pytest + coverage config
├── quarkdown_blog/
│   ├── settings/
│   │   ├── base.py                 shared settings (env-driven)
│   │   ├── development.py          SQLite, DEBUG=True
│   │   └── production.py           strict security headers
│   ├── urls.py                     root URL conf + admin title
│   ├── wsgi.py
│   └── asgi.py
└── editorial/
    ├── models/
    │   ├── content.py              ContentItem (post|page|template, status machine)
    │   ├── revision.py             ContentRevision (immutable snapshots)
    │   ├── asset.py                ContentAsset (media files)
    │   └── compile_job.py          CompileJob (async job tracker)
    ├── compiler/
    │   └── adapter.py              QuarkdownCompilerAdapter (subprocess wrapper)
    ├── services/
    │   └── compile_service.py      compile_content_sync / compile_content_async
    ├── admin/
    │   └── content_admin.py        ContentItemAdmin with custom URLs + actions
    ├── views.py                    post_list, post_detail, page_detail
    ├── urls.py                     public URL patterns
    ├── signals.py                  (reserved for future hooks)
    ├── templates/editorial/
    │   ├── post_list.html
    │   ├── post_detail.html
    │   └── page_detail.html
    └── tests/
        ├── test_models.py          model status transitions and str representations
        ├── test_adapter.py         adapter success/failure/timeout (mocked subprocess)
        └── test_views.py           public view status codes and rendered HTML
```

</details>

---

## Data Model

```
ContentItem ──── ContentRevision  (one per successful compile)
     │
     ├────────── ContentAsset     (images and attachments)
     │
     └────────── CompileJob       (one per compilation attempt)
```

| Model | Purpose |
|---|---|
| `ContentItem` | Primary content unit: post, page, or template |
| `ContentRevision` | Immutable snapshot of source + compiled HTML |
| `ContentAsset` | Media files referenced in Quarkdown source |
| `CompileJob` | Lifecycle record for a single compilation run |

---

## Running Tests

```bash
cd blog
pip install -r requirements-dev.txt
pytest
```

| File | Coverage |
|---|---|
| `test_models.py` | Status machine, `is_published`, `__str__`, revision ordering |
| `test_adapter.py` | Adapter success, warnings, failure, timeout, binary not found |
| `test_views.py` | Post list, post detail 200/404, draft gating |

---

## Roadmap

| Phase | Status | Description |
|---|:---:|---|
| 0 — Bootstrap | ✅ | Models, settings, migrations, admin, public views |
| 1 — Compiler | ✅ | Adapter, compile service, async jobs, revision snapshots |
| 2 — Admin UX | ✅ | Status badges, error panels, compile/preview/publish buttons |
| 3 — Versioning | 🔜 | Diff view, rollback action, revision comparison |
| 4 — Templates | 🔜 | Template type, clone-to-post, snippet library |
| 5 — Rich preview | 🔜 | Live preview, Celery/Django-Q backend, editor integration |

---

## Contributing

See the root [CONTRIBUTING.md](../CONTRIBUTING.md) for general guidelines.

For editor-specific contributions (the React structured editor), see
[editor/CONTRIBUTING.md](../editor/CONTRIBUTING.md).

---

## License

<div align="center">

Licensed under the **GNU General Public License v3.0**.

| | |
|---|---|
| Blog engine code | Copyright © 2025 Luiz Rodolfo (Thedocwhocode) |
| Upstream Quarkdown compiler | Copyright © 2025 Giorgio Garofalo |

[Full license text](../LICENSE) · [Code provenance](../NOTICE)

</div>
