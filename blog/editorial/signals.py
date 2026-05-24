"""Django signals for the editorial app.

Currently intentionally empty: compilation is triggered explicitly via the
admin save_model hook and direct service calls rather than post_save signals.
This avoids double-compilation and race conditions during admin bulk edits.
"""
