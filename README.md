# Rescue Team AI

Gamified multi-agent AI orchestration — Pokémon Mystery Dungeon themed.

Your partner Pokémon orchestrates a team of AI agents (each a shop in Treasure Town) to help you code, debug, plan, and ship.

## Stack

- **Backend**: Python 3.14.5 · Django 6.0.5 · Pydantic AI 1.93.0 · Poetry 2.4.1
- **Frontend**: TypeScript 6.0.3 · 2D Canvas · htmx 2.0.10 · pmd-visualizer
- **Testing**: pytest 9.0.3 · vitest 4.1.6

## Setup

### Backend

```bash
cd backend
poetry install
cp ../.env.example ../.env  # fill in your keys
poetry run python manage.py migrate
poetry run python manage.py check
```

### Frontend

```bash
cd frontend
npm install
npm run build
```

## Development

```bash
# Backend
cd backend && poetry run python manage.py runserver

# Frontend (watch mode)
cd frontend && npm run dev
```
