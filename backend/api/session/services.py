"""Session business logic — start, message, state, end."""

import json

from django.utils import timezone

from api.models import Player, Agent, Session, SessionAgent, Message
from api.agents.orchestrator import create_orchestrator
from api.agents.planner import planner_agent
from api.agents.schemas import TaskPlan
from api.agents.registry import get_agent
from config.constants import MAX_MESSAGES_PER_SESSION, MAX_AGENT_CALLS_PER_MESSAGE

from pydantic_ai.models.test import TestModel


class SessionError(Exception):
    """Base exception for session operations."""

    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def start_session(player_id: int, workspace_path: str = "") -> Session:
    """Create a new session for a player. Raises SessionError if invalid."""
    try:
        player = Player.objects.get(pk=player_id)
    except Player.DoesNotExist:
        raise SessionError("Player not found", 404)

    # Check for existing active session
    if Session.objects.filter(player=player, status=Session.Status.ACTIVE).exists():
        raise SessionError("Player already has an active session", 409)

    return Session.objects.create(player=player, workspace_path=workspace_path)


def send_message(session_id: int, content: str) -> dict:
    """Process a user message: persist, run orchestrator + planner, wake agents."""
    try:
        session = Session.objects.get(pk=session_id)
    except Session.DoesNotExist:
        raise SessionError("Session not found", 404)

    if session.status != Session.Status.ACTIVE:
        raise SessionError("Session is not active", 400)

    if not content.strip():
        raise SessionError("Message content cannot be empty", 400)

    # Guardrail: max messages
    if session.messages.count() >= MAX_MESSAGES_PER_SESSION:
        raise SessionError("Message limit reached for this session", 429)

    # Persist user message
    Message.objects.create(session=session, role=Message.Role.USER, content=content)

    # Run orchestrator
    partner_pokemon = session.player.partner_pokemon
    orchestrator = create_orchestrator(partner_pokemon)

    # Use TestModel for now — will be swapped for real model via config later
    with orchestrator.override(model=TestModel()):
        orch_result = orchestrator.run_sync(content)

    orchestrator_response = orch_result.output
    Message.objects.create(
        session=session,
        role=Message.Role.ORCHESTRATOR,
        content=orchestrator_response,
    )

    # Run planner (Wigglytuff) to generate a task plan
    with planner_agent.override(model=TestModel()):
        plan_result = planner_agent.run_sync(content)

    plan: TaskPlan = plan_result.output

    # Persist plan as orchestrator message
    plan_dict = plan.model_dump()
    Message.objects.create(
        session=session,
        role=Message.Role.ORCHESTRATOR,
        content=json.dumps(plan_dict),
    )

    # Wake agents referenced in the plan
    for step in plan.steps:
        try:
            agent = Agent.objects.get(pokemon=step.agent)
        except Agent.DoesNotExist:
            continue  # skip unknown agents gracefully
        sa, created = SessionAgent.objects.get_or_create(
            session=session,
            agent=agent,
            defaults={"status": SessionAgent.AgentStatus.AWAKE},
        )
        if not created:
            sa.status = SessionAgent.AgentStatus.AWAKE
            sa.save()

    # Dispatch plan steps to shop agents sequentially
    agent_results = []
    workspace_path = session.workspace_path
    for step in plan.steps:
        try:
            db_agent = Agent.objects.get(pokemon=step.agent)
        except Agent.DoesNotExist:
            continue

        # Update status to thinking
        SessionAgent.objects.filter(session=session, agent=db_agent).update(
            status=SessionAgent.AgentStatus.THINKING
        )

        # Run the shop agent
        try:
            shop_agent = get_agent(step.agent, workspace_path, session.pk)
            with shop_agent.override(model=TestModel()):
                result = shop_agent.run_sync(step.description)
            agent_response = result.output
        except (KeyError, Exception) as e:
            agent_response = f"Error executing {step.agent}: {e}"

        # Persist agent response
        Message.objects.create(
            session=session,
            role=Message.Role.AGENT,
            content=agent_response,
            agent=db_agent,
        )
        agent_results.append({"agent": step.agent, "response": agent_response})

        # Update status to done
        SessionAgent.objects.filter(session=session, agent=db_agent).update(
            status=SessionAgent.AgentStatus.DONE
        )

    return {
        "orchestrator_response": orchestrator_response,
        "plan": plan_dict,
        "agent_results": agent_results,
    }


def get_session_state(session_id: int, since: str | None = None) -> dict:
    """Return current agent statuses and messages for polling."""
    try:
        session = Session.objects.get(pk=session_id)
    except Session.DoesNotExist:
        raise SessionError("Session not found", 404)

    # Agent statuses
    agents = []
    for sa in session.session_agents.select_related("agent").all():
        agents.append({
            "pokemon": sa.agent.pokemon,
            "role": sa.agent.role,
            "shop": sa.agent.shop,
            "status": sa.status,
        })

    # Messages, optionally filtered by since
    messages_qs = session.messages.all()
    if since:
        try:
            from datetime import datetime
            # URL query params decode '+' as space, restore it for ISO parsing
            since_clean = since.replace(" ", "+")
            since_dt = datetime.fromisoformat(since_clean)
            messages_qs = messages_qs.filter(created_at__gt=since_dt)
        except (ValueError, TypeError):
            pass  # ignore bad since param, return all

    messages = []
    for msg in messages_qs:
        messages.append({
            "id": msg.pk,
            "role": msg.role,
            "content": msg.content,
            "agent": msg.agent.pokemon if msg.agent else None,
            "created_at": msg.created_at.isoformat(),
        })

    return {
        "session_status": session.status,
        "agents": agents,
        "messages": messages,
    }


def end_session(session_id: int) -> Session:
    """End a session, set all agents to done."""
    try:
        session = Session.objects.get(pk=session_id)
    except Session.DoesNotExist:
        raise SessionError("Session not found", 404)

    if session.status != Session.Status.ACTIVE:
        raise SessionError("Session is not active", 400)

    session.status = Session.Status.COMPLETED
    session.ended_at = timezone.now()
    session.save()

    # Set all session agents to done
    session.session_agents.update(status=SessionAgent.AgentStatus.DONE)

    return session
