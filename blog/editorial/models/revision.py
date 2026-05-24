"""ContentRevision — immutable snapshot of a compiled editorial state."""

from __future__ import annotations

from django.conf import settings
from django.db import models


class ContentRevision(models.Model):
    """
    Immutable snapshot of a ContentItem's source and compiled output at a
    specific point in time. Created automatically after each successful compilation.

    Enables rollback, audit, and comparison between published and draft versions.
    """

    class CompileStatus(models.TextChoices):
        SUCCESS = "success", "Success"
        FAILED = "failed", "Failed"

    content = models.ForeignKey(
        "editorial.ContentItem",
        on_delete=models.CASCADE,
        related_name="revisions",
    )
    revision_number = models.PositiveIntegerField()
    source_qd = models.TextField()
    compiled_html = models.TextField(blank=True)
    compile_status = models.CharField(
        max_length=20,
        choices=CompileStatus.choices,
        default=CompileStatus.SUCCESS,
    )
    compile_error = models.TextField(blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="+",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    notes = models.CharField(max_length=255, blank=True)

    class Meta:
        ordering = ["-revision_number"]
        unique_together = [("content", "revision_number")]
        verbose_name = "Content Revision"
        verbose_name_plural = "Content Revisions"

    def __str__(self) -> str:
        return f"Rev {self.revision_number} of '{self.content.title}'"
