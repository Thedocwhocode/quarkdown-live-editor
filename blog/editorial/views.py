"""Public-facing views for the blog frontend."""

from __future__ import annotations

from django.http import Http404, HttpRequest, HttpResponse
from django.shortcuts import get_object_or_404, render

from editorial.models import ContentItem


def post_list(request: HttpRequest) -> HttpResponse:
    """Homepage — chronological list of published posts."""
    posts = ContentItem.objects.filter(
        kind=ContentItem.Kind.POST,
        status=ContentItem.Status.PUBLISHED,
    )
    return render(request, "editorial/post_list.html", {"posts": posts})


def post_detail(request: HttpRequest, slug: str) -> HttpResponse:
    """Individual post page — serves the pre-compiled HTML."""
    post = get_object_or_404(
        ContentItem,
        slug=slug,
        kind=ContentItem.Kind.POST,
        status=ContentItem.Status.PUBLISHED,
    )
    return render(request, "editorial/post_detail.html", {"post": post})


def page_detail(request: HttpRequest, slug: str) -> HttpResponse:
    """Static page — serves the pre-compiled HTML."""
    page = get_object_or_404(
        ContentItem,
        slug=slug,
        kind=ContentItem.Kind.PAGE,
        status=ContentItem.Status.PUBLISHED,
    )
    return render(request, "editorial/page_detail.html", {"page": page})
