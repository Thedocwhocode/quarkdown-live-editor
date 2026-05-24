"""Django Admin for the editorial app."""

from __future__ import annotations

from django.contrib import admin, messages
from django.http import HttpRequest, HttpResponse
from django.shortcuts import redirect
from django.urls import path, reverse
from django.utils import timezone
from django.utils.html import format_html

from editorial.models import CompileJob, ContentAsset, ContentItem, ContentRevision
from editorial.services import compile_content_async, compile_content_sync

# ── Inlines ───────────────────────────────────────────────────────────────────


class ContentAssetInline(admin.TabularInline):
    model = ContentAsset
    extra = 1
    fields = ("file", "alt_text", "caption")


class ContentRevisionInline(admin.TabularInline):
    model = ContentRevision
    extra = 0
    max_num = 20
    readonly_fields = ("revision_number", "compile_status", "created_at", "notes")
    fields = ("revision_number", "compile_status", "created_at", "notes")
    ordering = ("-revision_number",)
    can_delete = False

    def has_add_permission(self, request: HttpRequest, obj=None) -> bool:
        return False


class CompileJobInline(admin.TabularInline):
    model = CompileJob
    extra = 0
    max_num = 10
    readonly_fields = ("status", "triggered_by", "created_at", "finished_at")
    fields = ("status", "triggered_by", "created_at", "finished_at")
    ordering = ("-created_at",)
    can_delete = False

    def has_add_permission(self, request: HttpRequest, obj=None) -> bool:
        return False


# ── ContentItem admin ─────────────────────────────────────────────────────────


@admin.register(ContentItem)
class ContentItemAdmin(admin.ModelAdmin):
    list_display = ("title", "kind", "status_badge", "author", "last_compiled_at", "published_at")
    list_filter = ("kind", "status", "author")
    search_fields = ("title", "slug", "source_qd")
    prepopulated_fields = {"slug": ("title",)}
    date_hierarchy = "created_at"
    actions = ["action_compile", "action_publish", "action_archive"]
    inlines = [ContentAssetInline, ContentRevisionInline, CompileJobInline]

    readonly_fields = (
        "status",
        "compile_error_panel",
        "compile_warnings_panel",
        "last_compiled_at",
        "created_at",
        "updated_at",
        "action_buttons",
    )

    fieldsets = (
        (
            "Content",
            {"fields": ("title", "slug", "kind", "author")},
        ),
        (
            "Quarkdown Source",
            {
                "fields": ("source_qd",),
                "classes": ("wide",),
                "description": (
                    "Write your content in Quarkdown syntax. "
                    "The source is compiled automatically on save."
                ),
            },
        ),
        (
            "Compile Status",
            {
                "fields": (
                    "status",
                    "compile_error_panel",
                    "compile_warnings_panel",
                    "last_compiled_at",
                    "action_buttons",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "Publication",
            {"fields": ("published_at",)},
        ),
        (
            "Timestamps",
            {
                "fields": ("created_at", "updated_at"),
                "classes": ("collapse",),
            },
        ),
    )

    # ── Custom URLs ──────────────────────────────────────────────────────────

    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "<int:pk>/compile/",
                self.admin_site.admin_view(self._compile_view),
                name="editorial_contentitem_compile",
            ),
            path(
                "<int:pk>/preview/",
                self.admin_site.admin_view(self._preview_view),
                name="editorial_contentitem_preview",
            ),
            path(
                "<int:pk>/publish/",
                self.admin_site.admin_view(self._publish_view),
                name="editorial_contentitem_publish",
            ),
        ]
        return custom + urls

    def _compile_view(self, request: HttpRequest, pk: int) -> HttpResponse:
        content = ContentItem.objects.get(pk=pk)
        result = compile_content_sync(content, triggered_by=request.user)
        if result["success"]:
            self.message_user(request, "Compilation successful.", messages.SUCCESS)
        else:
            self.message_user(request, f"Compilation failed: {result['error']}", messages.ERROR)
        return redirect(f"../../{pk}/change/")

    def _preview_view(self, request: HttpRequest, pk: int) -> HttpResponse:
        content = ContentItem.objects.get(pk=pk)
        html = content.compiled_html or (
            "<body style='font-family:sans-serif;padding:2rem;color:#666'>"
            "<p>No compiled output yet. Click <strong>Compile Now</strong> first.</p></body>"
        )
        return HttpResponse(html)

    def _publish_view(self, request: HttpRequest, pk: int) -> HttpResponse:
        content = ContentItem.objects.get(pk=pk)
        if content.status == ContentItem.Status.COMPILED:
            content.status = ContentItem.Status.PUBLISHED
            content.published_at = timezone.now()
            content.save(update_fields=["status", "published_at", "updated_at"])
            self.message_user(request, f"'{content.title}' published.", messages.SUCCESS)
        else:
            self.message_user(
                request, "Only compiled items can be published.", messages.WARNING
            )
        return redirect(f"../../{pk}/change/")

    # ── Readonly display fields ───────────────────────────────────────────────

    @admin.display(description="Status")
    def status_badge(self, obj: ContentItem) -> str:
        palette = {
            "draft": ("#6c757d", "white"),
            "compiling": ("#fd7e14", "white"),
            "compiled": ("#0d6efd", "white"),
            "published": ("#198754", "white"),
            "error": ("#dc3545", "white"),
            "archived": ("#adb5bd", "black"),
        }
        bg, fg = palette.get(obj.status, ("#6c757d", "white"))
        return format_html(
            '<span style="background:{};color:{};padding:2px 10px;'
            'border-radius:12px;font-size:11px;font-weight:600">{}</span>',
            bg, fg, obj.get_status_display(),
        )

    @admin.display(description="Compile error")
    def compile_error_panel(self, obj: ContentItem) -> str:
        if obj.compile_error:
            return format_html(
                '<pre style="color:#842029;background:#f8d7da;border:1px solid #f5c2c7;'
                'padding:10px;border-radius:4px;font-size:12px;white-space:pre-wrap">{}</pre>',
                obj.compile_error,
            )
        return format_html('<span style="color:#198754">No errors.</span>')

    @admin.display(description="Warnings")
    def compile_warnings_panel(self, obj: ContentItem) -> str:
        if obj.compile_warnings:
            return format_html(
                '<pre style="color:#664d03;background:#fff3cd;border:1px solid #ffecb5;'
                'padding:10px;border-radius:4px;font-size:12px;white-space:pre-wrap">{}</pre>',
                "\n".join(obj.compile_warnings),
            )
        return "—"

    @admin.display(description="Actions")
    def action_buttons(self, obj: ContentItem) -> str:
        if not obj.pk:
            return "Save the item first to enable compilation."

        btn = (
            '<a href="{url}" class="button" style="margin-right:4px">{label}</a>'
        )
        compile_url = reverse("admin:editorial_contentitem_compile", args=[obj.pk])
        preview_url = reverse("admin:editorial_contentitem_preview", args=[obj.pk])
        publish_url = reverse("admin:editorial_contentitem_publish", args=[obj.pk])

        html = format_html(btn, url=compile_url, label="⚙ Compile Now")
        if obj.compiled_html:
            html += format_html(btn + " ", url=preview_url + '" target="_blank"', label="👁 Preview")
        if obj.status == ContentItem.Status.COMPILED:
            html += format_html(btn, url=publish_url, label="🚀 Publish")
        return html

    # ── Bulk actions ─────────────────────────────────────────────────────────

    @admin.action(description="Compile selected items (async)")
    def action_compile(self, request: HttpRequest, queryset) -> None:
        for content in queryset:
            compile_content_async(content, triggered_by=request.user)
        self.message_user(request, f"Queued compilation for {queryset.count()} item(s).")

    @admin.action(description="Publish selected (compiled only)")
    def action_publish(self, request: HttpRequest, queryset) -> None:
        n = queryset.filter(status=ContentItem.Status.COMPILED).update(
            status=ContentItem.Status.PUBLISHED,
            published_at=timezone.now(),
        )
        self.message_user(request, f"{n} item(s) published.")

    @admin.action(description="Archive selected items")
    def action_archive(self, request: HttpRequest, queryset) -> None:
        queryset.update(status=ContentItem.Status.ARCHIVED)
        self.message_user(request, f"{queryset.count()} item(s) archived.")

    # ── Save hook ────────────────────────────────────────────────────────────

    def save_model(self, request: HttpRequest, obj: ContentItem, form, change: bool) -> None:
        if not obj.pk:
            obj.author = request.user
        super().save_model(request, obj, form, change)
        if "source_qd" in form.changed_data:
            compile_content_async(obj, triggered_by=request.user)
