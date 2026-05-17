from django.conf import settings
from django.db import models


class PlayerProfile(models.Model):
    """Game profile created during onboarding quiz completion.

    Stores the player's rescue team identity: team name, starter/partner
    pokemon, and optional nicknames. One profile per user.
    """

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="player_profile",
    )
    team_name = models.CharField(max_length=100)
    starter_pokemon = models.CharField(max_length=50)
    partner_pokemon = models.CharField(max_length=50)
    starter_nickname = models.CharField(max_length=50, blank=True, default="")
    partner_nickname = models.CharField(max_length=50, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "game_engine_player_profile"

    def __str__(self):
        return f"Team {self.team_name} ({self.user})"
