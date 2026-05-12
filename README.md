# Rescue Team AI# Rescue Team AI# Rescue Team AI



A gamified multi-agent AI coding assistant, themed after Pokemon Mystery Dungeon: Explorers of Sky.



You take the Explorers personality quiz, get assigned a starter Pokemon, pick a partner, and your partner orchestrates a team of AI agents to help you code, debug, plan, and ship.  Each agent runs a shop in Treasure Town.  Walk around the map, talk to your partner to start a session, and watch the agents come alive as they work through your requests.Gamified multi-agent AI orchestration — Pokemon Mystery Dungeon themed.Gamified multi-agent AI orchestration — Pokémon Mystery Dungeon themed.



## Quick Start



### PrerequisitesYour partner Pokemon orchestrates a team of AI agents, each running a shop in Treasure Town, to help you code, debug, plan, and ship. Walk around the map, talk to your partner to start a session, and watch the agents come alive as they work through your requests.Your partner Pokémon orchestrates a team of AI agents (each a shop in Treasure Town) to help you code, debug, plan, and ship.



- [Python 3.13+](https://www.python.org/downloads/)

- [Poetry](https://python-poetry.org/) 2.x

- [Node.js](https://nodejs.org/) 20+## Stack## Stack

- [pmd-visualizer](https://github.com/adam-kenawell/pmd-visualizer) cloned as a sibling directory

- An API key for at least one LLM provider (Anthropic, OpenAI, or Google GenAI)



### Setup| Layer | Tech |- **Backend**: Python 3.14.5 · Django 6.0.5 · Pydantic AI 1.93.0 · Poetry 2.4.1



```bash|-------|------|- **Frontend**: TypeScript 6.0.3 · 2D Canvas · htmx 2.0.10 · pmd-visualizer

git clone https://github.com/adam-kenawell/rescue-team-ai.git

cd rescue-team-ai| Backend | Python 3.13 · Django 6.0.5 · Pydantic AI 1.93.0 · Poetry |- **Testing**: pytest 9.0.3 · vitest 4.1.6



# Backend| Frontend | TypeScript 6.0 · 2D Canvas · htmx 2.0.10 · pmd-visualizer |

cd backend

poetry install| LLMs | Anthropic (default) · OpenAI · Google GenAI — tiered model system |## Setup

poetry run python manage.py migrate

poetry run python manage.py loaddata agents| Testing | pytest 9.0.3 + pytest-django (backend) · vitest 4.1.6 (frontend) |

cd ..

| Database | SQLite (dev) |### Backend

# Frontend

cd frontend

npm install

cd ..## Agent Roster```bash

```

cd backend

### Play

| Shop | Pokemon | Role | Tier |poetry install

Double-click `play.bat` (or run it from a terminal).  It builds the frontend, starts the server, and opens your browser.

|------|---------|------|------|cp ../.env.example ../.env  # fill in your keys

The app walks you through everything from there: personality quiz, LLM provider + API key, workspace path.  No `.env` file required for basic usage.

| Wigglytuff's Guild | Wigglytuff | Planner — decomposes requests into task plans | HIGH |poetry run python manage.py migrate

## Agent Roster

| Kecleon Shop | Kecleon | File Navigator — reads, searches, lists files | FAST |poetry run python manage.py check

| Shop | Pokemon | Role | Tier |

|------|---------|------|------|| Kangaskhan Storage | Kangaskhan | Memory/Context — manages history, summarizes | MID |```

| Wigglytuff's Guild | Wigglytuff | Planner — decomposes requests into task plans | HIGH |

| Kecleon Shop | Kecleon | File Navigator — reads, searches, lists files | FAST || Duskull Bank | Duskull | Git Agent — commits, branches, diffs, status | MID |

| Kangaskhan Storage | Kangaskhan | Memory/Context — manages history, summarizes | MID |

| Duskull Bank | Duskull | Git Agent — commits, branches, diffs, status | MID || Electivire Link Shop | Electivire | Code Writer — writes and edits code | HIGH |### Frontend

| Electivire Link Shop | Electivire | Code Writer — writes and edits code | HIGH |

| Marowak Dojo | Marowak | Terminal Runner — executes shell commands, tests | FAST || Marowak Dojo | Marowak | Terminal Runner — executes shell commands, tests | FAST |

| Chansey's Day Care | Chansey | Code Reviewer — reviews diffs, suggests improvements | HIGH |

| Xatu Appraisal | Xatu | Analyzer/Debugger — inspects errors, diagnoses | MID || Chansey's Day Care | Chansey | Code Reviewer — reviews diffs, suggests improvements | HIGH |```bash

| *(Your choice)* | Partner | Orchestrator — routes tasks, manages conversation | HIGH |

| Xatu Appraisal | Xatu | Analyzer/Debugger — inspects errors, diagnoses | MID |cd frontend

## Stack

| (Your choice) | Partner | Orchestrator — routes tasks, manages conversation | HIGH |npm install

| Layer | Tech |

|-------|------|npm run build

| Backend | Python 3.13 · Django 6.0.5 · Pydantic AI 1.93.0 · Poetry |

| Frontend | TypeScript 6.0 · 2D Canvas · htmx 2.0.10 · pmd-visualizer |## Prerequisites```

| LLMs | Anthropic (default) · OpenAI · Google GenAI — tiered model system |

| Testing | pytest 9.0.3 + pytest-django · vitest 4.1.6 |

| Database | SQLite |

- Python 3.13+## Development

## Testing

- [Poetry](https://python-poetry.org/) 2.x

```bash

# Backend (167 tests)- Node.js 20+```bash

cd backend && poetry run pytest -v

- An API key for at least one LLM provider (Anthropic, OpenAI, or Google GenAI)# Backend

# Frontend (86 tests)

cd frontend && npx vitest run- `pmd-visualizer` cloned as a sibling directory (see [pmd-visualizer](https://github.com/adam-kenawell/pmd-visualizer))cd backend && poetry run python manage.py runserver

```



## How It Works

## Setup# Frontend (watch mode)

1. First boot: you take the Explorers of Sky personality quiz (faithful to the original game's nature/starter mappings)

2. Pick a partner Pokemon (can't share a type with your starter)cd frontend && npm run dev

3. Choose your LLM provider and paste your API key

4. Point the team at a project directory on your machine### 1. Clone```

5. Your partner starts a session and routes your requests to the right agents

6. Agents wake up, do their thing, and report back through chat

7. Type `/rest` when you're done to end the session```bash

git clone https://github.com/adam-kenawell/rescue-team-ai.git

The whole thing runs locally on Django's dev server.  No cloud hosting, no deployment, just you and your rescue team.cd rescue-team-ai

```

## Project Structure

### 2. Environment Variables

```

rescue-team-ai/```bash

  play.bat              # Double-click to launchcp .env.example .env

  backend/# Edit .env and fill in your API key + desired provider

    api/```

      agents/           # 8 shop agents + orchestrator + safety + registry

      quiz/             # Personality quiz (Explorers of Sky faithful)### 3. Backend

      session/          # Session CRUD, message dispatch, polling

    config/             # LLM tier config, guardrail constants```bash

    game/               # Django app — serves the game pagecd backend

  frontend/poetry install

    src/poetry run python manage.py migrate

      map/              # Canvas engine, screens, sprites, rendererpoetry run python manage.py loaddata agents    # seed the 8 shop agents

      chat/             # Chat panel, API client, state managementpoetry run python manage.py check

  shared/```

    pokedex.json        # Full national dex (name -> dex ID)

```### 4. Frontend



## License```bash

cd frontend

This is a personal project.  Sprites are from the [PMD Collab Sprite Repository](https://sprites.pmdcollab.org/) (CC-licensed).npm install

npm run build
```

## Development

```bash
# Start Django dev server (serves both API and frontend static)
cd backend && poetry run python manage.py runserver

# Frontend TypeScript watch (separate terminal)
cd frontend && npm run dev
```

Open `http://localhost:8000` in your browser.

## Testing

```bash
# Backend (167 tests)
cd backend && poetry run pytest -v

# Frontend (81 tests)
cd frontend && npx vitest run
```

## Project Structure

```
rescue-team-ai/
  backend/
    api/              # Django app — agents, quiz, session endpoints
      agents/         # 8 shop agents + orchestrator + safety + registry
      quiz/           # Personality quiz (Explorers of Sky faithful)
      session/        # Session CRUD, message dispatch, polling
    config/           # LLM tier config, guardrail constants
    rescue_team/      # Django project settings + root URL conf
  frontend/
    src/
      map/            # Canvas engine, screens, sprites, renderer
      chat/           # Chat panel, API client, state management
  shared/
    pokedex.json      # Full national dex (name -> dex_id)
  scripts/
    gen_pokedex.py    # One-time pokedex generator from PokeAPI
```

## How It Works

1. **Personality Quiz** — PMD-style quiz (8 random questions) determines your starter Pokemon and nature
2. **Partner Selection** — Pick a partner Pokemon (can't share a type with your starter)
3. **Session** — Talk to your partner at Sharpedo Bluff to start a session
4. **Orchestration** — Partner consults Wigglytuff (Planner), generates a task plan, then walks around town dispatching work to shop agents
5. **Live Map** — Watch agents wake up, think, and complete tasks on the 2D canvas map
6. **Chat** — Collapsible side panel shows the full conversation with agent attribution
7. **Rest** — Type `/rest` to end the session and return to Sharpedo Bluff

## Configuration

See `.env.example` for all available environment variables and their defaults.

Key tuning constants in `backend/config/constants.py`:
- `MAX_MESSAGES_PER_SESSION` — message cap per session (default: 100)
- `MAX_AGENT_CALLS_PER_MESSAGE` — max agent dispatches per user message (default: 5)
- `SESSION_TIMEOUT_MINUTES` — inactive session auto-end (default: 30)
- `COMPACTION_THRESHOLD` — messages before Kangaskhan compacts memory (default: 50)

## License

Private project — not open source.
