# Rescue Team AI

A gamified multi-agent AI coding assistant, themed after Pokemon Mystery Dungeon: Explorers of Sky.

You take the personality quiz, get assigned a starter Pokemon, pick a partner, and your partner orchestrates a team of AI agents to help you code, debug, plan, and ship.  Each agent runs a shop in Treasure Town.  Walk around the map, talk to your partner to start a session, and watch the agents come alive as they work through your requests.

It's basically Cursor, but way cooler.

---

## Getting Started

**Prerequisites:**

- [Python 3.13+](https://www.python.org/downloads/)
- [Poetry](https://python-poetry.org/) 2.x
- [Node.js](https://nodejs.org/) 20+
- [pmd-visualizer](https://github.com/adam-kenawell/pmd-visualizer) cloned as a sibling directory
- An API key for at least one LLM provider (Anthropic, OpenAI, or Google GenAI)

**Setup:**

```bash
git clone https://github.com/adam-kenawell/rescue-team-ai.git
cd rescue-team-ai

cd backend
poetry install
poetry run python manage.py migrate
poetry run python manage.py loaddata agents
cd ..

cd frontend
npm install
cd ..
```

**Play:**

Double-click `play.bat`.  That's it.

The app handles the rest: personality quiz, LLM provider selection, API key, workspace path.  No `.env` file needed.

---

## Agent Roster

| Shop | Pokemon | Role | Tier |
|------|---------|------|------|
| Wigglytuff's Guild | Wigglytuff | Planner | HIGH |
| Kecleon Shop | Kecleon | File Navigator | FAST |
| Kangaskhan Storage | Kangaskhan | Memory / Context | MID |
| Duskull Bank | Duskull | Git Agent | MID |
| Electivire Link Shop | Electivire | Code Writer | HIGH |
| Marowak Dojo | Marowak | Terminal Runner | FAST |
| Chansey's Day Care | Chansey | Code Reviewer | HIGH |
| Xatu Appraisal | Xatu | Analyzer / Debugger | MID |
| *(Your choice)* | Partner | Orchestrator | HIGH |

---

## Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.13 - Django 6.0.5 - Pydantic AI 1.93.0 - Poetry |
| Frontend | TypeScript 6.0 - 2D Canvas - htmx 2.0.10 - pmd-visualizer |
| LLMs | Anthropic / OpenAI / Google GenAI (tiered model system) |
| Testing | pytest 9.0.3 - vitest 4.1.6 |
| Database | SQLite |

---

## How It Works

1. Take the Explorers of Sky personality quiz (faithful to the original game)
2. Pick a partner Pokemon (can't share a type with your starter)
3. Choose your LLM provider and paste your API key
4. Point the team at a project directory
5. Your partner routes requests to the right agents
6. Agents wake up, do their thing, and report back through chat
7. Type `/rest` when you're done

Runs entirely on your machine.  No cloud, no deployment, just you and your rescue team.

---

## Testing

```bash
cd backend && poetry run pytest -v
cd frontend && npx vitest run
```

---

## Project Structure

```text
rescue-team-ai/
  play.bat              # Double-click to launch
  backend/
    api/
      agents/           # 8 shop agents + orchestrator
      quiz/             # Personality quiz
      session/          # Session CRUD, dispatch, polling
    config/             # LLM tiers, constants
    game/               # Serves the game page
  frontend/
    src/
      map/              # Canvas engine, screens, sprites
      chat/             # Chat panel, API client, state
  shared/
    pokedex.json        # Full national dex
```

---

## License

Personal project.  Sprites from the [PMD Collab Sprite Repository](https://sprites.pmdcollab.org/) (CC-licensed).
