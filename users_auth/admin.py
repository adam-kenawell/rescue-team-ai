from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin

from users_auth.models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ("username", "github_username", "github_id", "is_staff")
    search_fields = ("username", "github_username")
