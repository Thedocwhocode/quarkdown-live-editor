"""Adapter that compiles Quarkdown source to HTML by invoking the CLI binary."""

from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path
from typing import TypedDict

_COMPILE_TIMEOUT = 30

_BINARY_CANDIDATES = [
    # Repo root → build/install/quarkdown (the standard installDist output)
    Path(__file__).parents[4] / "build" / "install" / "quarkdown" / "bin" / "quarkdown",
]


class CompileResult(TypedDict):
    success: bool
    html: str
    warnings: list[str]
    error: str | None
    artifacts: dict


class QuarkdownCompilerAdapter:
    """
    Wraps the Quarkdown CLI to compile ``.qd`` source strings to HTML.

    The binary is auto-detected from ``build/install/quarkdown/bin/quarkdown``
    relative to the repository root (produced by ``./gradlew installDist``).
    Pass ``binary_path`` explicitly or set ``QUARKDOWN_BINARY`` in ``.env``
    to override the detected path.
    """

    def __init__(self, binary_path: str = "") -> None:
        self._binary = binary_path or self._detect_binary()

    def compile_to_html(self, source: str) -> CompileResult:
        """
        Compile a Quarkdown source string to HTML.

        Writes source to a temp file, runs the CLI with ``--pipe``, and
        captures HTML from stdout. Errors are returned in the result dict
        so the service layer can persist and surface them without raising.
        """
        with tempfile.TemporaryDirectory(prefix="qd-blog-") as tmpdir:
            src = Path(tmpdir) / "content.qd"
            src.write_text(source, encoding="utf-8")
            return self._invoke(src, Path(tmpdir))

    def is_available(self) -> bool:
        """Return True if the binary responds to ``--version``."""
        try:
            r = subprocess.run(
                [self._binary, "--version"], capture_output=True, timeout=5
            )
            return r.returncode == 0
        except (FileNotFoundError, subprocess.TimeoutExpired, PermissionError):
            return False

    # ── Internal ──────────────────────────────────────────────────────────────

    def _invoke(self, src: Path, workdir: Path) -> CompileResult:
        try:
            proc = subprocess.run(
                [self._binary, "c", str(src), "--pipe"],
                capture_output=True,
                text=True,
                timeout=_COMPILE_TIMEOUT,
                cwd=workdir,
            )
        except subprocess.TimeoutExpired:
            return _err(f"Compilation timed out after {_COMPILE_TIMEOUT} s.")
        except FileNotFoundError:
            return _err(
                f"Quarkdown binary not found at '{self._binary}'.\n"
                "Run ./gradlew installDist from the repository root."
            )

        if proc.returncode == 0:
            return {
                "success": True,
                "html": proc.stdout,
                "warnings": _warnings(proc.stderr),
                "error": None,
                "artifacts": {},
            }
        return _err(
            proc.stderr.strip() or f"Quarkdown exited with code {proc.returncode}.",
            warnings=_warnings(proc.stderr),
        )

    @staticmethod
    def _detect_binary() -> str:
        for candidate in _BINARY_CANDIDATES:
            if candidate.is_file():
                return str(candidate)
        return "quarkdown"


def _err(message: str, *, warnings: list[str] | None = None) -> CompileResult:
    return {"success": False, "html": "", "warnings": warnings or [], "error": message, "artifacts": {}}


def _warnings(stderr: str) -> list[str]:
    return [l for l in stderr.splitlines() if l.strip() and "WARNING" in l.upper()]
