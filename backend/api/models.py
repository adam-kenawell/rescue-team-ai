from django.db import models


class Player(models.Model):
    """A player who has completed the personality quiz."""

    starter_pokemon = models.CharField(max_length=50)
    partner_pokemon = models.CharField(max_length=50)
    quiz_nature = models.CharField(max_length=20)
    sprite = models.CharField(max_length=100, blank=True, default="")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Player ({self.starter_pokemon} + {self.partner_pokemon})"


class Agent(models.Model):
    """A shop agent in Treasure Town."""

    class Tier(models.TextChoices):
        HIGH_REASONING = "HIGH_REASONING"
        MID_REASONING = "MID_REASONING"
        FAST_EXECUTION = "FAST_EXECUTION"

    pokemon = models.CharField(max_length=50, unique=True)
    role = models.CharField(max_length=100)
    shop = models.CharField(max_length=100)
    tier = models.CharField(max_length=20, choices=Tier.choices)
    dex_id = models.PositiveIntegerField(default=0)
    model_override = models.CharField(max_length=100, blank=True, default="")

    def __str__(self):
        return f"{self.pokemon} ({self.shop})"


class Session(models.Model):
    """An active work session between a player and their agents."""

    class Status(models.TextChoices):
        ACTIVE = "active"
        COMPLETED = "completed"
        CANCELLED = "cancelled"

    player = models.ForeignKey(Player, on_delete=models.CASCADE, related_name="sessions")
    workspace_path = models.CharField(max_length=500, default="")
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.ACTIVE)
    pending_plan = models.JSONField(null=True, blank=True, default=None)
    pending_step_index = models.PositiveIntegerField(default=0)
    partner_target = models.CharField(max_length=50, blank=True, default="")
    started_at = models.DateTimeField(auto_now_add=True)
    ended_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Session {self.pk} ({self.status})"


class SessionAgent(models.Model):
    """Tracks which agents are active in a session and their current state."""

    class AgentStatus(models.TextChoices):
        SLEEPING = "sleeping"
        AWAKE = "awake"
        THINKING = "thinking"
        DONE = "done"

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="session_agents")
    agent = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name="session_agents")
    status = models.CharField(
        max_length=20, choices=AgentStatus.choices, default=AgentStatus.SLEEPING
    )

    class Meta:
        unique_together = ("session", "agent")

    def __str__(self):
        return f"{self.agent.pokemon} in Session {self.session.pk} ({self.status})"


class Message(models.Model):
    """A message in a session's conversation history."""

    class Role(models.TextChoices):
        USER = "user"
        ORCHESTRATOR = "orchestrator"
        AGENT = "agent"

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    agent = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"[{self.role}] {self.content[:50]}"


class SessionSummary(models.Model):
    """A compacted summary of a range of session messages."""

    session = models.ForeignKey(Session, on_delete=models.CASCADE, related_name="summaries")
    content = models.TextField()
    message_range_start = models.IntegerField()  # PK of first message covered
    message_range_end = models.IntegerField()  # PK of last message covered
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["created_at"]

    def __str__(self):
        return f"Summary for Session {self.session.pk} (msgs {self.message_range_start}-{self.message_range_end})"
