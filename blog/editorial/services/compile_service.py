"""Orchestrates compilation jobs and persists results to the database."""

from __future__ import annotations

import threading

from django.db.models import Max
from django.utils import timezone

from editorial.compiler.adapter import CompileResult, QuarkdownCompilerAdapter
from editorial.models import CompileJob, ContentItem, ContentRevision

_adapter = QuarkdownCompilerAdapter()


def compile_content_sync(content: ContentItem, *, triggered_by=None) -> CompileResult:
    """
    Compile ``content`` synchronously and persist the result.

    Use this in admin views where the result must be shown immediately after
    the call returns. Blocks the request thread during compilation.
    """
    job = _open_job(content, triggered_by)
    result = _adapter.compile_to_html(content.source_qd)
    _close_job(content, job, result)
    return result


def compile_content_async(content: ContentItem, *, triggered_by=None) -> CompileJob:
    """
    Queue compilation in a background daemon thread and return the job immediately.

    Suitable for post-save signals and bulk admin actions where the caller
    does not need to block. For production workloads, replace the threading
    backend with Celery or Django-Q to gain retry logic, observability, and
    worker scaling.
    """
    job = _open_job(content, triggered_by)

    def _run() -> None:
        result = _adapter.compile_to_html(content.source_qd)
        _close_job(content, job, result)

    threading.Thread(target=_run, daemon=True, name=f"qd-{content.pk}").start()
    return job


# ── Internal helpers ──────────────────────────────────────────────────────────

def _open_job(content: ContentItem, triggered_by) -> CompileJob:
    """Mark content as compiling and create the job record."""
    content.status = ContentItem.Status.COMPILING
    content.save(update_fields=["status", "updated_at"])
    return CompileJob.objects.create(content=content, triggered_by=triggered_by)


def _close_job(content: ContentItem, job: CompileJob, result: CompileResult) -> None:
    """Persist the compilation result on both the job and the content item."""
    job.finished_at = timezone.now()

    if result["success"]:
        content.compiled_html = result["html"]
        content.compile_error = ""
        content.compile_warnings = result.get("warnings", [])
        content.last_compiled_at = timezone.now()
        content.status = ContentItem.Status.COMPILED
        job.status = CompileJob.Status.SUCCESS
        _snapshot(content)
    else:
        content.compile_error = result.get("error") or "Unknown compilation error."
        content.status = ContentItem.Status.ERROR
        job.status = CompileJob.Status.FAILED
        job.log = content.compile_error

    content.save(
        update_fields=[
            "compiled_html", "compile_error", "compile_warnings",
            "last_compiled_at", "status", "updated_at",
        ]
    )
    job.save(update_fields=["log", "status", "finished_at"])


def _snapshot(content: ContentItem) -> None:
    """Create a ContentRevision for the current compiled state."""
    next_rev = (
        ContentRevision.objects.filter(content=content)
        .aggregate(m=Max("revision_number"))["m"]
        or 0
    ) + 1
    ContentRevision.objects.create(
        content=content,
        revision_number=next_rev,
        source_qd=content.source_qd,
        compiled_html=content.compiled_html,
        compile_status=ContentRevision.CompileStatus.SUCCESS,
    )
