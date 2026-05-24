# Security Policy — Quark Notes

This document covers the security policy for the **Quark Notes** desktop application (`quark/`).
For the upstream Quarkdown compiler, see the [root SECURITY.md](../SECURITY.md).

---

## Supported Versions

Security fixes are applied to the latest commit on the active development branch.
There are no versioned releases yet; all fixes land on the main development line.

| Branch | Receives fixes |
|---|:---:|
| `main` | Yes |
| `claude/quark-notes` | Yes (active development) |
| Older feature branches | No |

---

## Threat Model

Quark Notes is a **local-first desktop application**. It has no server, no user accounts, and no network connections except for spawning the Quarkdown CLI as a subprocess. The primary security surface is:

- **The compiled HTML preview** rendered inside a Tauri webview iframe. Arbitrary Quarkdown source is compiled to HTML and displayed.
- **File-system access** via the Tauri `fs` and `dialog` plugins (attachment import, TXT export).
- **Subprocess execution** — the Quarkdown CLI binary is invoked via `std::process::Command`.
- **SQLite database** stored locally in the user's app-data directory.

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security bugs.**

Report vulnerabilities privately via [GitHub Security Advisories](../../security/advisories/new).
If you are unable to use that channel, send an encrypted email to `luizrodolfocc@gmail.com`.

Include:
- A clear description of the vulnerability.
- Steps to reproduce (source file, Tauri version, OS).
- Potential impact and severity assessment.
- Whether you have a proposed fix or patch.

---

## Response Timeline

| Milestone | Target |
|---|---|
| Acknowledge receipt | Within 7 days |
| Confirm or dispute the report | Within 14 days |
| Patch and release | Within 90 days |

Reporters who follow responsible disclosure will be credited in the release notes.

---

## Scope

**In scope:**
- HTML injection or XSS through the preview iframe that escapes the webview sandbox.
- Path traversal or arbitrary file-system access beyond what the user explicitly granted through the Tauri dialog.
- Privilege escalation through the Quarkdown CLI subprocess invocation.
- SQLite injection in any Tauri command.
- Dependency vulnerabilities with a realistic exploitation path in the desktop context.

**Out of scope:**
- Vulnerabilities that require physical access to the user's machine.
- Social engineering attacks against the user.
- CVEs in upstream dependencies with no known exploitation path against this app.
- The Quarkdown compiler itself — report those to the [upstream project](https://github.com/iamgio/quarkdown).

---

## Security Considerations for Contributors

- **Never concatenate user input into SQL strings.** All queries use rusqlite `params![]`.
- **Sanitize paths** before passing them to `std::fs` or the Tauri `fs` plugin.
- **Keep the CSP** in `tauri.conf.json` restrictive. The preview iframe uses `srcdoc`, which isolates compiled HTML from the app origin.
- **Do not add new Tauri plugins** without evaluating the permissions they expose in `capabilities/`.
- When updating dependencies, run `npm audit` and `cargo audit` to check for known vulnerabilities before opening a PR.
