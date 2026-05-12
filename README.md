# Rescue Team AI# Rescue Team AI



Gamified multi-agent AI orchestration — Pokemon Mystery Dungeon themed.Gamified multi-agent AI orchestration — Pokémon Mystery Dungeon themed.



Your partner Pokemon orchestrates a team of AI agents, each running a shop in Treasure Town, to help you code, debug, plan, and ship. Walk around the map, talk to your partner to start a session, and watch the agents come alive as they work through your requests.Your partner Pokémon orchestrates a team of AI agents (each a shop in Treasure Town) to help you code, debug, plan, and ship.



## Stack## Stack



| Layer | Tech |- **Backend**: Python 3.14.5 · Django 6.0.5 · Pydantic AI 1.93.0 · Poetry 2.4.1

|-------|------|- **Frontend**: TypeScript 6.0.3 · 2D Canvas · htmx 2.0.10 · pmd-visualizer

| Backend | Python 3.13 · Django 6.0.5 · Pydantic AI 1.93.0 · Poetry |- **Testing**: pytest 9.0.3 · vitest 4.1.6

| Frontend | TypeScript 6.0 · 2D Canvas · htmx 2.0.10 · pmd-visualizer |

| LLMs | Anthropic (default) · OpenAI · Google GenAI — tiered model system |## Setup

| Testing | pytest 9.0.3 + pytest-django (backend) · vitest 4.1.6 (frontend) |

| Database | SQLite (dev) |### Backend



## Agent Roster```bash

cd backend

| Shop | Pokemon | Role | Tier |poetry install

|------|---------|------|------|cp ../.env.example ../.env  # fill in your keys

| Wigglytuff's Guild | Wigglytuff | Planner — decomposes requests into task plans | HIGH |poetry run python manage.py migrate

| Kecleon Shop | Kecleon | File Navigator — reads, searches, lists files | FAST |poetry run python manage.py check

| Kangaskhan Storage | Kangaskhan | Memory/Context — manages history, summarizes | MID |```

| Duskull Bank | Duskull | Git Agent — commits, branches, diffs, status | MID |

| Electivire Link Shop | Electivire | Code Writer — writes and edits code | HIGH |### Frontend

| Marowak Dojo | Marowak | Terminal Runner — executes shell commands, tests | FAST |

| Chansey's Day Care | Chansey | Code Reviewer — reviews diffs, suggests improvements | HIGH |```bash

| Xatu Appraisal | Xatu | Analyzer/Debugger — inspects errors, diagnoses | MID |cd frontend

| (Your choice) | Partner | Orchestrator — routes tasks, manages conversation | HIGH |npm install

npm run build

## Prerequisites```



- Python 3.13+## Development

- [Poetry](https://python-poetry.org/) 2.x

- Node.js 20+```bash

- An API key for at least one LLM provider (Anthropic, OpenAI, or Google GenAI)# Backend

- `pmd-visualizer` cloned as a sibling directory (see [pmd-visualizer](https://github.com/adam-kenawell/pmd-visualizer))cd backend && poetry run python manage.py runserver



## Setup# Frontend (watch mode)

cd frontend && npm run dev

### 1. Clone```


```bash
git clone https://github.com/adam-kenawell/rescue-team-ai.git
cd rescue-team-ai
```

### 2. Environment Variables

```bash
cp .env.example .env
# Edit .env and fill in your API key + desired provider
```

### 3. Backend

```bash
cd backend
poetry install
poetry run python manage.py migrate
poetry run python manage.py loaddata agents    # seed the 8 shop agents
poetry run python manage.py check
```

### 4. Frontend

```bash
cd frontend
npm install
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
