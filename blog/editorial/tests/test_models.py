"""Tests for editorial models."""

import pytest
from django.contrib.auth import get_user_model

from editorial.models import ContentItem, ContentRevision

User = get_user_model()


@pytest.fixture
def author(db):
    return User.objects.create_user(username="author", password="pass")


@pytest.fixture
def draft_post(db, author):
    return ContentItem.objects.create(
        title="Hello World",
        slug="hello-world",
        kind=ContentItem.Kind.POST,
        source_qd="# Hello World\n\nFirst post.",
        author=author,
    )


class TestContentItemStatus:
    def test_default_status_is_draft(self, draft_post):
        assert draft_post.status == ContentItem.Status.DRAFT

    def test_is_published_false_for_draft(self, draft_post):
        assert not draft_post.is_published

    def test_is_published_true_after_publish(self, draft_post):
        draft_post.status = ContentItem.Status.PUBLISHED
        assert draft_post.is_published

    def test_has_compile_error_when_error_status(self, draft_post):
        draft_post.status = ContentItem.Status.ERROR
        assert draft_post.has_compile_error

    def test_is_compiled_for_compiled_status(self, draft_post):
        draft_post.status = ContentItem.Status.COMPILED
        assert draft_post.is_compiled

    def test_is_compiled_for_published_status(self, draft_post):
        draft_post.status = ContentItem.Status.PUBLISHED
        assert draft_post.is_compiled


class TestContentItemStr:
    def test_str_includes_title_kind_status(self, draft_post):
        result = str(draft_post)
        assert "Hello World" in result
        assert "Post" in result
        assert "Draft" in result


class TestContentRevisionOrdering:
    def test_revisions_ordered_descending(self, db, draft_post, author):
        ContentRevision.objects.create(
            content=draft_post,
            revision_number=1,
            source_qd="v1",
            compile_status=ContentRevision.CompileStatus.SUCCESS,
        )
        ContentRevision.objects.create(
            content=draft_post,
            revision_number=2,
            source_qd="v2",
            compile_status=ContentRevision.CompileStatus.SUCCESS,
        )
        revs = list(draft_post.revisions.all())
        assert revs[0].revision_number == 2
        assert revs[1].revision_number == 1
