"""Tests for the Quarkdown compiler adapter."""

from __future__ import annotations

from unittest.mock import MagicMock, patch

import pytest

from editorial.compiler.adapter import CompileResult, QuarkdownCompilerAdapter


@pytest.fixture
def adapter():
    return QuarkdownCompilerAdapter(binary_path="/fake/quarkdown")


class TestCompileSuccess:
    def test_returns_html_on_zero_exit(self, adapter):
        mock = MagicMock()
        mock.returncode = 0
        mock.stdout = "<h1>Hello</h1>"
        mock.stderr = ""

        with patch("subprocess.run", return_value=mock):
            result: CompileResult = adapter.compile_to_html("# Hello")

        assert result["success"] is True
        assert "<h1>Hello</h1>" in result["html"]
        assert result["error"] is None
        assert result["warnings"] == []

    def test_extracts_warnings_from_stderr(self, adapter):
        mock = MagicMock()
        mock.returncode = 0
        mock.stdout = "<p>ok</p>"
        mock.stderr = "WARNING: unknown function .foo\nINFO: compiled in 42ms"

        with patch("subprocess.run", return_value=mock):
            result = adapter.compile_to_html(".foo")

        assert len(result["warnings"]) == 1
        assert "unknown function" in result["warnings"][0]


class TestCompileFailure:
    def test_returns_error_on_nonzero_exit(self, adapter):
        mock = MagicMock()
        mock.returncode = 1
        mock.stdout = ""
        mock.stderr = "Error: undefined function '.bar'"

        with patch("subprocess.run", return_value=mock):
            result = adapter.compile_to_html(".bar")

        assert result["success"] is False
        assert result["html"] == ""
        assert "undefined function" in result["error"]

    def test_returns_error_on_timeout(self, adapter):
        import subprocess

        with patch("subprocess.run", side_effect=subprocess.TimeoutExpired(cmd="", timeout=30)):
            result = adapter.compile_to_html("# long doc")

        assert result["success"] is False
        assert "timed out" in result["error"].lower()

    def test_returns_error_when_binary_not_found(self, adapter):
        with patch("subprocess.run", side_effect=FileNotFoundError):
            result = adapter.compile_to_html("# test")

        assert result["success"] is False
        assert "not found" in result["error"].lower()


class TestIsAvailable:
    def test_true_when_binary_responds(self, adapter):
        mock = MagicMock()
        mock.returncode = 0
        with patch("subprocess.run", return_value=mock):
            assert adapter.is_available() is True

    def test_false_when_binary_missing(self, adapter):
        with patch("subprocess.run", side_effect=FileNotFoundError):
            assert adapter.is_available() is False
