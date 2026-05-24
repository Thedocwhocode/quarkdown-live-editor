"""Tests for the public blog frontend views."""

import pytest
from django.contrib.auth import get_user_model
from django.test import Client
from django.urls import reverse

from editorial.models import ContentItem

User = get_user_model()


@pytest.fixture
def client():
    return Client()


@pytest.fixture
def author(db):
    return User.objects.create_user(username="writer", password="pw")


@pytest.fixture
def published_post(db, author):
    return ContentItem.objects.create(
        title="My Great Post",
        slug="my-great-post",
        kind=ContentItem.Kind.POST,
        status=ContentItem.Status.PUBLISHED,
        source_qd="# My Great Post",
        compiled_html="<h1>My Great Post</h1>",
        author=author,
    )


@pytest.fixture
def draft_post(db, author):
    return ContentItem.objects.create(
        title="Unpublished",
        slug="unpublished",
        kind=ContentItem.Kind.POST,
        status=ContentItem.Status.DRAFT,
        source_qd="# Draft",
        author=author,
    )


class TestPostList:
    def test_list_returns_200(self, client, db):
        resp = client.get(reverse("editorial:post_list"))
        assert resp.status_code == 200

    def test_published_post_appears(self, client, published_post):
        resp = client.get(reverse("editorial:post_list"))
        assert "My Great Post" in resp.content.decode()

    def test_draft_post_not_shown(self, client, draft_post):
        resp = client.get(reverse("editorial:post_list"))
        assert "Unpublished" not in resp.content.decode()


class TestPostDetail:
    def test_published_post_returns_200(self, client, published_post):
        resp = client.get(reverse("editorial:post_detail", kwargs={"slug": "my-great-post"}))
        assert resp.status_code == 200

    def test_compiled_html_rendered(self, client, published_post):
        resp = client.get(reverse("editorial:post_detail", kwargs={"slug": "my-great-post"}))
        assert "<h1>My Great Post</h1>" in resp.content.decode()

    def test_draft_post_returns_404(self, client, draft_post):
        resp = client.get(reverse("editorial:post_detail", kwargs={"slug": "unpublished"}))
        assert resp.status_code == 404

    def test_nonexistent_slug_returns_404(self, client, db):
        resp = client.get(reverse("editorial:post_detail", kwargs={"slug": "nope"}))
        assert resp.status_code == 404
