"""ContentAsset — media files attached to a ContentItem."""

from __future__ import annotations

from django.db import models


class ContentAsset(models.Model):
    """
    An image or binary file associated with a ContentItem.

    Files are stored under ``content-assets/<content_id>/`` and referenced
    in Quarkdown source via the ``.figure`` or ``.image`` functions.
    """

    content = models.ForeignKey(
        "editorial.ContentItem",
        on_delete=models.CASCADE,
        related_name="assets",
    )
    file = models.FileField(upload_to="content-assets/%Y/%m/")
    alt_text = models.CharField(max_length=255, blank=True)
    caption = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Asset"
        verbose_name_plural = "Assets"

    def __str__(self) -> str:
        return self.file.name
