"""ContentItem — the primary editorial entity."""

from __future__ import annotations

from django.conf import settings
from django.db import models
from django.urls import reverse


class ContentItem(models.Model):
    """
    Represents a single publishable unit: a post, a static page, or a reusable template.

    Two artefacts are maintained per item: the ``source_qd`` (Quarkdown source) and
    the ``compiled_html`` produced by the compiler. The frontend always serves
    ``compiled_html`` from items in ``published`` status, keeping the render path
    independent of the compilation process.
    """

    class Kind(models.TextChoices):
        POST = "post", "Post"
        PAGE = "page", "Page"
        TEMPLATE = "template", "Template"

    class Status(models.TextChoices):
        DRAFT = "draft", "Draft"
        COMPILING = "compiling", "Compiling"
        COMPILED = "compiled", "Compiled"
        PUBLISHED = "published", "Published"
        ERROR = "error", "Error"
        ARCHIVED = "archived", "Archived"

    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    kind = models.CharField(max_length=20, choices=Kind.choices, default=Kind.POST)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.DRAFT)

    source_qd = models.TextField(help_text="Quarkdown source. Saved automatically on compile.")
    compiled_html = models.TextField(blank=True)
    compiled_excerpt = models.TextField(blank=True)

    compile_error = models.TextField(blank=True)
    compile_warnings = models.JSONField(default=list, blank=True)
    compile_metadata = models.JSONField(default=dict, blank=True)

    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name="content_items",
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    last_compiled_at = models.DateTimeField(null=True, blank=True)
    published_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ["-published_at", "-created_at"]
        verbose_name = "Content Item"
        verbose_name_plural = "Content Items"

    def __str__(self) -> str:
        return f"{self.title} ({self.get_kind_display()} · {self.get_status_display()})"

    def get_absolute_url(self) -> str:
        if self.kind == self.Kind.PAGE:
            return reverse("editorial:page_detail", kwargs={"slug": self.slug})
        return reverse("editorial:post_detail", kwargs={"slug": self.slug})

    @property
    def is_published(self) -> bool:
        return self.status == self.Status.PUBLISHED

    @property
    def has_compile_error(self) -> bool:
        return self.status == self.Status.ERROR

    @property
    def is_compiled(self) -> bool:
        return self.status in {self.Status.COMPILED, self.Status.PUBLISHED}
