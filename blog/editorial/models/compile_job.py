"""CompileJob — tracks a single asynchronous compilation run."""

from __future__ import annotations

from django.conf import settings
from django.db import models


class CompileJob(models.Model):
    """
    Records the lifecycle of a single compilation task.

    A job is created when compilation is requested (status=queued), updated to
    ``running`` when the worker starts, and finalized as ``success`` or ``failed``
    with the full log attached.
    """

    class Status(models.TextChoices):
        QUEUED = "queued", "Queued"
        RUNNING = "running", "Running"
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    content = models.ForeignKey(
        "editorial.ContentItem",
        on_delete=models.CASCADE,
        related_name="compile_jobs",
    )
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED)
    triggered_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    log = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Compile Job"
        verbose_name_plural = "Compile Jobs"

    def __str__(self) -> str:
        return f"Job {self.pk} — {self.content.title} ({self.get_status_display()})"

    @property
    def duration_seconds(self) -> float | None:
        if self.finished_at and self.created_at:
            return (self.finished_at - self.created_at).total_seconds()
        return None
