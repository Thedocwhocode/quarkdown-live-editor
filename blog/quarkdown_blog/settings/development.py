"""Development settings — SQLite, DEBUG on, relaxed security."""

import os

os.environ.setdefault("SECRET_KEY", "dev-insecure-secret-key-do-not-use-in-production")
os.environ.setdefault("DEBUG", "True")

from .base import *  # noqa: F401, F403

ALLOWED_HOSTS = ["*"]
