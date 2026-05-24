<div align="center">

<br>

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="https://img.shields.io/badge/%E2%AC%A1%20Quark-Notes-d4774a?style=for-the-badge&labelColor=272220&color=d4774a">
  <img src="https://img.shields.io/badge/%E2%AC%A1%20Quark-Notes-d4774a?style=for-the-badge&labelColor=f3efe9&color=d4774a" alt="Quark Notes" height="44">
</picture>

<br><br>

**Um app de notas local-first inspirado no Bear, alimentado pelo [Quarkdown](https://github.com/iamgio/quarkdown).**<br>
Escreva com facilidade. Estruture sem dor. Visualize com beleza.

<br>

[![CI](https://img.shields.io/github/actions/workflow/status/Thedocwhocode/quarkdown-live-editor/quark-ci.yml?branch=main&label=CI&logo=github&style=flat-square)](../../actions/workflows/quark-ci.yml)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?style=flat-square&logo=typescript&logoColor=white)](tsconfig.json)
[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Tauri](https://img.shields.io/badge/Tauri-2-24c8db?style=flat-square&logo=tauri&logoColor=white)](https://tauri.app)
[![Rust](https://img.shields.io/badge/Rust-1.80+-ce422b?style=flat-square&logo=rust&logoColor=white)](https://rust-lang.org)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue?style=flat-square&logo=gnu&logoColor=white)](../LICENSE)

<br>

[🇺🇸 English](README.md) · **🇧🇷 Português**

</div>

---

## O que é o Quark?

O Quark é um **app de notas desktop local-first** que usa o [Quarkdown](https://github.com/iamgio/quarkdown) como linguagem de escrita nativa. Ele fica entre uma ferramenta de captura rápida e um sistema editorial completo — fluido o suficiente para notas diárias, poderoso o suficiente para produzir artigos acadêmicos, apresentações, exercícios matemáticos ou diagramas Mermaid sem sair do app.

Pense no **Bear**, mas com o conjunto completo de recursos do Quarkdown: matemática KaTeX, diagramas Mermaid, notas de rodapé, referências cruzadas, sumários, slides, temas e layouts estruturados — tudo compilado em HTML bonito e renderizado ao vivo dentro do app.

Todos os dados são armazenados localmente. Nada sai da sua máquina.

---

## Interface

```
┌──────────────┬─────────────────┬────────────────────────────────────────────┐
│  Barra Lat.  │  Lista de Notas │  Barra de Ferramentas                       │
│  ──────────  │  ─────────────  ├────────────────────────────────────────────┤
│  ⬡ Quark    │  🔍 Busca       │  [Editar] [Dividir] [Preview]  Template ⚡ │
│              │                 ├──────────────────────┬─────────────────────┤
│  Todas       │  ■ Nota 1       │  Editor de Notas     │  Pré-visualização   │
│              │  ■ Nota 2  #tag │  ─────────────────   │  ─────────────────  │
│  Cadernos    │  📌 Fixada      │  CodeMirror 6        │  <HTML compilado>   │
│  ──────────  │                 │  (Quarkdown)         │                     │
│  Trabalho    │                 │  ──────────────────  │                     │
│  Estudo      │                 │  Painel de Anexos    │                     │
│              │                 │  (fotos · OCR)       │                     │
│  Tags        │                 │                      │                     │
│  ──────────  │                 │                      │                     │
│  #pesquisa   │                 │                      │                     │
│  #rascunho   │                 │                      │                     │
│  ⚙ Config    │                 │                      │                     │
└──────────────┴─────────────────┴──────────────────────┴─────────────────────┘
```

**Três modos de visualização:** Somente edição · Dividido (editor + preview) · Somente preview

---

## Recursos

<table>
<tr>
<td width="50%" valign="top">

**Escrita**
- Editor CodeMirror 6 com sintaxe Quarkdown
- Menu de barra (/) no estilo Notion — insere blocos e funções
- Menu de formatação flutuante (bold, itálico, link, etc.)
- Auto-save com debounce de 600ms
- Atalhos de teclado: Ctrl+B (bold), Ctrl+I (itálico), Ctrl+K (código)

**Preview**
- Compilação Quarkdown → HTML com um clique
- Preview ao vivo em iframe (sem reload)
- Modo dividido: escreva e visualize simultaneamente
- Erros de compilação e avisos exibidos inline

</td>
<td width="50%" valign="top">

**Organização**
- Notas, Cadernos, Tags (muitos-para-muitos)
- Fixar notas importantes · Busca full-text
- Notas arquivadas (exclusão suave)
- Ícone + cor do caderno personalizáveis

**Templates (6 embutidos)**
- Artigo Científico · Slides
- Trabalho Escolar · Exercícios de Matemática
- Fluxograma Mermaid · Tabela de Dados
- Modal de seleção com grade por categoria

</td>
</tr>
<tr>
<td valign="top">

**Anexos & OCR**
- Anexe imagens, PDFs e arquivos a qualquer nota
- Miniaturas de imagens com sobreposição de exclusão
- OCR Tesseract.js nas imagens anexadas
- Texto OCR indexado para busca futura

</td>
<td valign="top">

**Exportação & Temas**
- Exportar para TXT, PDF (impressão) ou JPG (screenshot)
- 5 temas inspirados no Bear:
  Papel Quente · Grafite Vermelho · Pasta de Dente
  Solarizado · Bear Escuro
- Tema persistido entre sessões

</td>
</tr>
</table>

---

## Por que Quarkdown?

O Quark não é apenas mais um app de notas Markdown. Ele usa o **Quarkdown** — uma linguagem Turing-completa que estende CommonMark com:

| Recurso | Exemplo | Resultado |
|---|---|---|
| Matemática nativa | `.math { x = \frac{a}{b} }` | KaTeX renderizado |
| Diagramas | `.mermaid { graph LR ... }` | Diagrama Mermaid |
| Slides | `.doctype {slides}` | Apresentação Reveal.js |
| Loops | `.foreach {1..5} { \n # Slide \1 }` | Geração programática |
| Variáveis | `.let {nome} {Quark}` | Interpolação de texto |
| Funções customizadas | `.function {minhaFuncao} ...` | Reutilização total |

---

## Arquitetura

```
┌──────────────────────────────────────────────────────────────────┐
│  React 19 + Vite 6  (frontend)                                   │
│  Zustand stores ──► invoke() ──► Tauri IPC                       │
└──────────────────────────────┬───────────────────────────────────┘
                               │  Tauri IPC
┌──────────────────────────────▼───────────────────────────────────┐
│  Rust / Tauri 2 backend                                          │
│  rusqlite (SQLite WAL + FK)  ·  std::process::Command            │
└──────────────────────────────┬───────────────────────────────────┘
                               │  subprocesso --pipe
┌──────────────────────────────▼───────────────────────────────────┐
│  Quarkdown CLI  (build/install/quarkdown/bin/quarkdown)           │
│  .qd fonte ──► HTML via stdout                                   │
└──────────────────────────────────────────────────────────────────┘
```

No **Android e iOS**, a compilação roda remotamente via endpoint HTTP configurável (Configurações → Servidor).

Dados armazenados localmente em:

| Plataforma | Caminho |
|---|---|
| Linux | `~/.local/share/quark/quark.db` |
| macOS | `~/Library/Application Support/quark/quark.db` |
| Windows | `%APPDATA%\quark\quark.db` |

---

## Requisitos

| Dependência | Versão | Finalidade |
|---|:---:|---|
| [Node.js](https://nodejs.org) | **≥ 20** | Build e testes do frontend |
| [Rust](https://rustup.rs) | **≥ 1.80** | Backend Tauri |
| [Java](https://adoptium.net) | **21** | Build do Quarkdown CLI (apenas uma vez) |
| Gradle Wrapper | embutido | `./gradlew installDist` |

---

## Início Rápido

### 1 — Compilar o Quarkdown CLI

Da **raiz do repositório** (configuração única):

```bash
./gradlew installDist
```

Isso produz o binário em `build/install/quarkdown/bin/quarkdown`, detectado automaticamente pelo backend Rust.

### 2 — Instalar dependências

```bash
cd quark
npm install
cargo install tauri-cli --version "^2"
```

### 3 — Rodar em desenvolvimento

```bash
npm run tauri dev
```

Inicia o Vite na porta 5173 e abre a janela desktop Tauri com hot-reload.

### 4 — Build de produção (desktop)

```bash
npm run tauri build
```

O instalador é escrito em `src-tauri/target/release/bundle/`.

### 5 — Build Android

> Requer [Android Studio](https://developer.android.com/studio), NDK e SDK (API 24+).

```bash
# Inicialização única do projeto (execute em quark/)
npm run tauri android init

# Desenvolvimento (hot-reload via USB/emulador)
npm run tauri android dev

# APK / AAB de produção
npm run tauri android build
```

### 6 — Build iOS

> Requer macOS, Xcode 15+ e conta de desenvolvedor Apple.

```bash
# Inicialização única (execute em quark/ no macOS)
npm run tauri ios init

# Desenvolvimento (Simulador ou dispositivo)
npm run tauri ios dev

# IPA de produção
npm run tauri ios build
```

---

## Testes

```bash
cd quark
npm install
npm test          # executa todos os testes Vitest
npm run type-check  # verificação TypeScript strict
```

---

## Roadmap

| Fase | Status | Descrição |
|---|:---:|---|
| 0 — Fundação | ✅ | Shell, schema SQLite, navegação, layout 3 painéis |
| 1 — Escrita & Preview | ✅ | CRUD de notas, editor CodeMirror, compilação Quarkdown |
| 2 — Organização | ✅ | Tags, filtro de tags, 5 temas Bear, cor/ícone de caderno |
| 3 — Templates | ✅ | Modal de seleção, novo a partir de template (6 embutidos) |
| 4 — Anexos & OCR | ✅ | Anexo de arquivos, miniaturas, OCR Tesseract.js |
| 5 — Exportação | ✅ | TXT (Rust), PDF (impressão), JPG (html2canvas) |
| 6 — Editor Estruturado | ✅ | Editor de blocos React, menu de barra, menu flutuante |
| 7 — Mobile (Android + iOS) | ✅ | Tauri 2 mobile; compilação remota; layout responsivo |
| 8 — Cloud Sync | 🔜 | Sincronização entre dispositivos com resolução de conflitos |

---

## Contribuindo

Veja [CONTRIBUTING.md](CONTRIBUTING.md) para as diretrizes específicas do Quark Notes.

Para o compilador Quarkdown upstream, veja o [CONTRIBUTING.md raiz](../CONTRIBUTING.md).

---

## Licença

<div align="center">

Licenciado sob a **GNU General Public License v3.0**.

| | |
|---|---|
| App Quark Notes | Copyright © 2025 Luiz Rodolfo (Thedocwhocode) |
| Compilador Quarkdown upstream | Copyright © 2025 Giorgio Garofalo |

[Texto completo da licença](../LICENSE) · [Proveniência do código](../NOTICE)

</div>
