"""URL patterns for the public blog frontend."""

from django.urls import path

from editorial import views

app_name = "editorial"

urlpatterns = [
    path("", views.post_list, name="post_list"),
    path("posts/<slug:slug>/", views.post_detail, name="post_detail"),
    path("pages/<slug:slug>/", views.page_detail, name="page_detail"),
]
