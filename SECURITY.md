# Security Policy

This document covers the security policy for the **Quarkdown Live Editor** fork,
which includes both the upstream Quarkdown compiler and the new `editor/` subproject.

---

## Supported Versions

Security fixes are applied to the following:

| Component | Branch | Supported |
|---|---|---|
| Quarkdown compiler (upstream) | `main` | See [upstream policy](https://github.com/iamgio/quarkdown) |
| Quarkdown Live Editor (`editor/`) | `claude/quarkdown-editor-mvp-peM7E` and `main` | Yes |

Older branches are not actively maintained. If you are using a pinned older
version, please update to a supported branch before reporting.

---

## Reporting a Vulnerability

**Do not open a public GitHub issue for security vulnerabilities.**
Public disclosure before a fix is available puts all users at risk.

### Preferred channel

Use GitHub's private **Security Advisory** feature:

1. Go to the repository on GitHub.
2. Click the **Security** tab → **Advisories** → **Report a vulnerability**.
3. Fill in the advisory form with as much detail as possible.

### Alternative channel

If you cannot use GitHub Advisories, email the maintainer directly:

> **luizrodolfocc@gmail.com**
>
> Subject line: `[SECURITY] <one-line summary>`

Please encrypt your report using PGP if the information is highly sensitive.

### What to include

A useful report contains:
- A clear description of the vulnerability and its potential impact.
- The affected component (compiler, server, editor API, a dependency).
- Steps to reproduce or a proof-of-concept (private repository or attached file).
- The version or commit SHA where the issue was observed.
- Any suggested mitigations, if known.

---

## Scope

### In scope

The following are considered valid security targets for this repository:

- **Quarkdown compiler** — arbitrary code execution via malformed `.qd` input,
  path traversal via `.include`, unsafe deserialization.
- **`quarkdown-server`** — unauthenticated endpoints, WebSocket injection,
  server-side request forgery (SSRF), directory traversal.
- **Editor compile API** (`editor/server.ts`) — command injection via the
  compile endpoint, path traversal in temporary file handling, denial-of-service
  via unbounded input size or subprocess exhaustion.
- **Dependency vulnerabilities** — critical or high CVEs in direct dependencies
  declared in `editor/package.json` or the Gradle build.

### Out of scope

The following are explicitly out of scope:

- Vulnerabilities in third-party fonts, icon sets, or CSS bundled for offline use
  (Bootstrap Icons, KaTeX fonts, etc.) that have no exploitable attack vector in
  a Quarkdown-rendered document.
- Social engineering attacks targeting maintainers.
- Vulnerabilities requiring physical access to the host machine.
- Self-XSS in the editor preview pane when the user deliberately writes malicious
  `.qd` source (the preview iframe uses `sandbox` attributes by design; users are
  expected to control their own source).
- Issues in Quarkdown upstream that are already tracked in
  [iamgio/quarkdown issues](https://github.com/iamgio/quarkdown/issues).

---

## Response Timeline

| Milestone | Target |
|---|---|
| Acknowledgement of report | Within 7 days |
| Initial triage and severity assessment | Within 14 days |
| Fix developed and reviewed | Within 90 days (critical: within 30 days) |
| Public disclosure | After fix is released, coordinated with reporter |

These are best-effort targets. Complex vulnerabilities may require more time.

---

## Disclosure Policy

This project follows **coordinated disclosure**:

1. Reporter privately submits the vulnerability.
2. Maintainer acknowledges, assesses severity, and develops a fix.
3. A patched release is prepared and reviewed.
4. The fix is released and a Security Advisory is published on GitHub.
5. The reporter is credited in the Security Advisory and in the CHANGELOG entry,
   unless they request to remain anonymous.

We ask that reporters refrain from public disclosure until step 4 is complete,
or until 90 days have elapsed from the initial report (whichever comes first).

---

## Credits

Security researchers who responsibly disclose vulnerabilities will be thanked
in the relevant GitHub Security Advisory and in the project CHANGELOG.

---

*This security policy applies to the fork maintained at
[Thedocwhocode/quarkdown-live-editor](https://github.com/Thedocwhocode/quarkdown-live-editor).
For vulnerabilities in the original Quarkdown project, please refer to the
upstream repository's security policy.*
