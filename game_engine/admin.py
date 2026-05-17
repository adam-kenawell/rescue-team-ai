from django.contrib import admin

from game_engine.models import PlayerProfile


@admin.register(PlayerProfile)
class PlayerProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "team_name", "starter_pokemon", "partner_pokemon", "created_at")
    search_fields = ("team_name", "user__username")
