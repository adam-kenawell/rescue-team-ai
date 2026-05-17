from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    """Custom user model with GitHub OAuth fields.

    Extends Django's AbstractUser so we own the auth table from day one.
    GitHub-specific fields are populated during the OAuth callback.
    """

    github_id = models.PositiveBigIntegerField(unique=True, null=True, blank=True)
    github_username = models.CharField(max_length=39, blank=True, default="")
    github_avatar_url = models.URLField(blank=True, default="")
    # TODO: encrypt at rest (CP5-security / phase-1 CP5 scope)
    github_token = models.TextField(blank=True, default="")

    class Meta:
        db_table = "users_auth_user"

    def __str__(self):
        return self.github_username or self.username
