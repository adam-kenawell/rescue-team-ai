// boot.ts — Application entry point
// Orchestrates onboarding (quiz, config) and game mode (map + chat)

import { createMapState, render, tick, handleClick, isFading, updateFade } from './map/index.js';
import type { MapState, Hotspot } from './map/index.js';
import { CANVAS_W, CANVAS_H } from './map/index.js';
import { loadSpriteSheets, createAgentSpriteState, updateAgentStates } from './map/index.js';
import type { AgentSpriteState } from './map/index.js';
import type { AgentStatus } from './map/sprites.js';
import { ChatPanel } from './chat/index.js';
import type { StateUpdate } from './chat/index.js';

// ── DOM References ───────────────────────────────────────────────

const onboardingEl = document.getElementById('onboarding') as HTMLDivElement;
const gameEl = document.getElementById('game') as HTMLDivElement;
const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d')!;
const msgContainer = document.getElementById('onboarding-messages') as HTMLDivElement;
const input = document.getElementById('onboarding-input') as HTMLInputElement;
const sendBtn = document.getElementById('onboarding-send') as HTMLButtonElement;

// ── Pokedex ──────────────────────────────────────────────────────

let pokedex: Record<string, number> = {};

async function loadPokedex(): Promise<void> {
  try {
    const res = await fetch('/static/shared/pokedex.json');
    pokedex = await res.json();
  } catch {
    console.warn('Failed to load pokedex.json — using fallback dex IDs');
  }
}

function getDexId(pokemon: string): number {
  return pokedex[pokemon.toLowerCase()] ?? 25; // fallback to Pikachu
}

// ── State ────────────────────────────────────────────────────────

const API_BASE = '/api';

interface AppState {
  phase: 'quiz' | 'config' | 'game';
  playerId: number | null;
  sessionId: number | null;
  starterPokemon: string;
  partnerPokemon: string;
  nature: string;
  gender: string;
  llmProvider: string;
  llmKey: string;
  workspacePath: string;
  quizQuestions: any[];
  quizAnswers: { question_id: number; answer_index: number }[];
  currentQuestionIndex: number;
  awaitingInput: 'quiz-answer' | 'gender' | 'partner' | 'provider' | 'api-key' | 'workspace' | null;
}

const state: AppState = {
  phase: 'quiz',
  playerId: null,
  sessionId: null,
  starterPokemon: '',
  partnerPokemon: '',
  nature: '',
  gender: '',
  llmProvider: '',
  llmKey: '',
  workspacePath: '',
  quizQuestions: [],
  quizAnswers: [],
  currentQuestionIndex: 0,
  awaitingInput: null,
};

// ── Onboarding Chat Helpers ──────────────────────────────────────

function addSystemMessage(text: string, cssClass = 'system'): void {
  const el = document.createElement('div');
  el.className = `ob-msg ${cssClass}`;
  el.textContent = text;
  msgContainer.appendChild(el);
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

function addUserMessage(text: string): void {
  const el = document.createElement('div');
  el.className = 'ob-msg user';
  el.textContent = text;
  msgContainer.appendChild(el);
  msgContainer.scrollTop = msgContainer.scrollHeight;
}

function setInputEnabled(enabled: boolean): void {
  input.disabled = !enabled;
  sendBtn.disabled = !enabled;
  if (enabled) input.focus();
}

// ── Funny invalid input messages ─────────────────────────────────

const RETRY_MESSAGES = [
  "Huh? Even Bidoof could follow these instructions... try again!",
  "That doesn't look right. Wigglytuff is giving you a concerned look...",
  "Your partner is confused! Try picking a valid option.",
  "Chatot is squawking at you to pay attention. Try again!",
  "Loudred says: WHAT?! That's not a valid answer! TRY AGAIN!",
  "Sunflora is like, oh my gosh, that's not right!",
  "Diglett popped up to tell you that's not a valid choice.",
  "Corphish says hey hey hey! That ain't right!",
];

let retryIndex = 0;
function getRetryMessage(): string {
  const msg = RETRY_MESSAGES[retryIndex % RETRY_MESSAGES.length];
  retryIndex++;
  return msg;
}

// ── Boot ─────────────────────────────────────────────────────────

async function boot(): Promise<void> {
  // Load pokedex for dex ID lookups
  await loadPokedex();

  // Check localStorage for existing player
  const savedPlayerId = localStorage.getItem('rta_player_id');
  const savedProvider = localStorage.getItem('rta_llm_provider');
  const savedKey = localStorage.getItem('rta_llm_key');
  const savedWorkspace = localStorage.getItem('rta_workspace_path');
  const savedPartner = localStorage.getItem('rta_partner_pokemon');
  const savedStarter = localStorage.getItem('rta_starter_pokemon');

  if (savedPlayerId && savedProvider && savedKey) {
    // Return visit — skip quiz + config
    state.playerId = parseInt(savedPlayerId);
    state.llmProvider = savedProvider;
    state.llmKey = savedKey;
    state.partnerPokemon = savedPartner ?? '';
    state.starterPokemon = savedStarter ?? '';
    state.phase = 'config';

    addSystemMessage(`Welcome back! Your partner ${state.partnerPokemon} is glad to see you.`);

    if (savedWorkspace) {
      state.workspacePath = savedWorkspace;
      addSystemMessage(`Last workspace: ${savedWorkspace}\nType a new path, or press Enter to use the same one.`);
    } else {
      addSystemMessage('What project directory should your team work on?\nPaste the full path:');
    }
    state.awaitingInput = 'workspace';
    setInputEnabled(true);
    return;
  }

  // First visit — start quiz
  addSystemMessage('Welcome to Rescue Team AI!\n\nBefore we begin, let\'s find out what kind of Pokemon you\'d be...');
  await startQuiz();
}

// ── Input Handler ────────────────────────────────────────────────

function handleInput(): void {
  const text = input.value.trim();
  if (!text && state.awaitingInput !== 'workspace') return;
  input.value = '';

  switch (state.awaitingInput) {
    case 'quiz-answer':
      handleQuizAnswer(text);
      break;
    case 'gender':
      handleGenderAnswer(text);
      break;
    case 'partner':
      handlePartnerAnswer(text);
      break;
    case 'provider':
      handleProviderAnswer(text);
      break;
    case 'api-key':
      handleApiKeyAnswer(text);
      break;
    case 'workspace':
      handleWorkspaceAnswer(text);
      break;
  }
}

sendBtn.addEventListener('click', handleInput);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !input.disabled) handleInput();
});

// ── Quiz Flow ────────────────────────────────────────────────────

async function startQuiz(): Promise<void> {
  setInputEnabled(false);

  try {
    const res = await fetch(`${API_BASE}/quiz/start/`);
    const data = await res.json();
    state.quizQuestions = data.questions;
    state.currentQuestionIndex = 0;
    state.quizAnswers = [];

    // First, ask gender
    addSystemMessage('\nFirst things first... are you a boy or a girl?\n\n1. Boy\n2. Girl');
    state.awaitingInput = 'gender';
    setInputEnabled(true);
  } catch {
    addSystemMessage('Failed to load quiz. Is the server running?');
  }
}

function handleGenderAnswer(text: string): void {
  const num = parseInt(text);
  if (num === 1) {
    state.gender = 'male';
    addUserMessage('Boy');
  } else if (num === 2) {
    state.gender = 'female';
    addUserMessage('Girl');
  } else {
    addSystemMessage(getRetryMessage());
    return;
  }

  showNextQuestion();
}

function showNextQuestion(): void {
  if (state.currentQuestionIndex >= state.quizQuestions.length) {
    submitQuiz();
    return;
  }

  const q = state.quizQuestions[state.currentQuestionIndex];
  let text = `\n${q.text}\n\n`;
  q.answers.forEach((a: any, i: number) => {
    text += `${i + 1}. ${a.text}\n`;
  });

  addSystemMessage(text);
  state.awaitingInput = 'quiz-answer';
  setInputEnabled(true);
}

function handleQuizAnswer(text: string): void {
  const num = parseInt(text);
  const q = state.quizQuestions[state.currentQuestionIndex];

  if (isNaN(num) || num < 1 || num > q.answers.length) {
    addSystemMessage(getRetryMessage());
    return;
  }

  addUserMessage(text);
  state.quizAnswers.push({
    question_id: q.id,
    answer_index: num - 1,
  });
  state.currentQuestionIndex++;
  showNextQuestion();
}

async function submitQuiz(): Promise<void> {
  setInputEnabled(false);
  addSystemMessage('\n...\n\nThe results are in...');

  try {
    const res = await fetch(`${API_BASE}/quiz/submit/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        answers: state.quizAnswers,
        gender: state.gender,
      }),
    });
    const data = await res.json();
    state.nature = data.nature;
    state.starterPokemon = data.starter;

    addSystemMessage(`Your nature is... ${data.nature}!`, 'reveal');

    setTimeout(() => {
      addSystemMessage(`You are a ${data.starter}!`, 'reveal');
      setTimeout(() => showPartnerSelection(), 1000);
    }, 1500);
  } catch {
    addSystemMessage('Failed to submit quiz. Try refreshing.');
  }
}

async function showPartnerSelection(): Promise<void> {
  // Fetch available partners from the quiz endpoint
  addSystemMessage('\nNow, choose your partner Pokemon!\nYour partner can\'t share a type with you.\n\nType the name of the Pokemon you want as your partner:');

  // We'll validate on submit — the backend rejects invalid partners
  state.awaitingInput = 'partner';
  setInputEnabled(true);
}

async function handlePartnerAnswer(text: string): Promise<void> {
  setInputEnabled(false);
  addUserMessage(text);

  // Capitalize first letter
  const partner = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();

  try {
    const res = await fetch(`${API_BASE}/quiz/partner/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        starter: state.starterPokemon,
        partner,
        nature: state.nature,
        gender: state.gender,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      addSystemMessage(getRetryMessage() + `\n(${err.error})`);
      state.awaitingInput = 'partner';
      setInputEnabled(true);
      return;
    }

    const data = await res.json();
    state.playerId = data.player_id;
    state.partnerPokemon = data.partner;

    localStorage.setItem('rta_player_id', String(data.player_id));
    localStorage.setItem('rta_partner_pokemon', data.partner);
    localStorage.setItem('rta_starter_pokemon', data.starter);

    addSystemMessage(`\nYou and ${data.partner} are now a rescue team!`, 'reveal');

    setTimeout(() => startConfigFlow(), 1500);
  } catch {
    addSystemMessage('Failed to select partner. Try again.');
    state.awaitingInput = 'partner';
    setInputEnabled(true);
  }
}

// ── Config Flow ──────────────────────────────────────────────────

function startConfigFlow(): void {
  state.phase = 'config';
  addSystemMessage('\nBefore your first mission, let\'s set up your tools.\n\nWhich LLM provider do you want to use?\n\n1. Anthropic (Claude)\n2. OpenAI (GPT)\n3. Google (Gemini)');
  state.awaitingInput = 'provider';
  setInputEnabled(true);
}

function handleProviderAnswer(text: string): void {
  const num = parseInt(text);
  const providers: Record<number, string> = { 1: 'anthropic', 2: 'openai', 3: 'gemini' };
  const provider = providers[num];

  if (!provider) {
    addSystemMessage(getRetryMessage());
    return;
  }

  addUserMessage(text);
  state.llmProvider = provider;
  localStorage.setItem('rta_llm_provider', provider);

  const names: Record<string, string> = { anthropic: 'Anthropic (Claude)', openai: 'OpenAI (GPT)', gemini: 'Google (Gemini)' };
  addSystemMessage(`\nGreat, ${names[provider]} it is!\n\nNow paste your API key:`);
  state.awaitingInput = 'api-key';
}

function handleApiKeyAnswer(text: string): void {
  if (text.length < 10) {
    addSystemMessage(getRetryMessage() + '\n(That key looks too short.)');
    return;
  }

  addUserMessage('*'.repeat(text.length));
  state.llmKey = text;
  localStorage.setItem('rta_llm_key', text);

  addSystemMessage('\nAPI key saved!\n\nWhat project directory should your team work on?\nPaste the full path:');
  state.awaitingInput = 'workspace';
}

function handleWorkspaceAnswer(text: string): void {
  // Empty = use last workspace (return visit)
  const workspace = text || state.workspacePath;
  if (!workspace) {
    addSystemMessage('You need to provide a workspace path!');
    return;
  }

  addUserMessage(workspace);
  state.workspacePath = workspace;
  localStorage.setItem('rta_workspace_path', workspace);

  addSystemMessage(`\nWorkspace set to: ${workspace}\n\nStarting your session...`);
  setInputEnabled(false);

  setTimeout(() => launchGame(), 1000);
}

// ── Game Launch ──────────────────────────────────────────────────

async function launchGame(): Promise<void> {
  // Start a session
  try {
    const res = await fetch(`${API_BASE}/session/start/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LLM-Provider': state.llmProvider,
        'X-LLM-Key': state.llmKey,
      },
      body: JSON.stringify({
        player_id: state.playerId,
        workspace_path: state.workspacePath,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      addSystemMessage(`Failed to start session: ${err.error}`);
      return;
    }

    const data = await res.json();
    state.sessionId = data.session_id;
    state.phase = 'game';

    // Transition to game layout
    onboardingEl.style.display = 'none';
    gameEl.style.display = 'flex';

    initGameLoop();
  } catch {
    addSystemMessage('Failed to start session. Is the server running?');
  }
}

// ── Game Loop ────────────────────────────────────────────────────

let mapState: MapState;
let pendingHotspot: Hotspot | null = null;
let chatPanel: ChatPanel;
let agentStates: Map<string, AgentSpriteState>;
let playerSpriteState: AgentSpriteState;

function initGameLoop(): void {
  const playerDexId = getDexId(state.starterPokemon);
  const partnerDexId = getDexId(state.partnerPokemon);

  mapState = createMapState(playerDexId);
  agentStates = new Map();
  playerSpriteState = createAgentSpriteState(state.starterPokemon, playerDexId, false);

  // Create partner sprite state (spawns at Sharpedo Bluff near player)
  const partnerState = createAgentSpriteState(state.partnerPokemon, partnerDexId, true);
  partnerState.status = 'awake';
  partnerState.action = 'Idle';
  agentStates.set(state.partnerPokemon.toLowerCase(), partnerState);

  // Load player + partner sprites
  loadSpriteSheets(playerDexId);
  loadSpriteSheets(partnerDexId);

  // Init chat panel
  chatPanel = new ChatPanel({
    baseUrl: API_BASE,
    sessionId: state.sessionId!,
    pollInterval: 2000,
    onStateChange: (update: StateUpdate) => {
      updateAgentStates(agentStates, update.agents as { pokemon: string; status: AgentStatus }[]);
    },
    onSessionEnd: () => {
      // Session ended via /rest — return to onboarding for new session
      setTimeout(() => returnToOnboarding(), 500);
    },
    llmProvider: state.llmProvider,
    llmKey: state.llmKey,
  });

  // Canvas click handler
  canvas.addEventListener('click', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;
    const hotspot = handleClick(mapState, x, y, performance.now());
    if (hotspot) pendingHotspot = hotspot;
  });

  // beforeunload — end session on close
  window.addEventListener('beforeunload', () => {
    if (state.sessionId) {
      navigator.sendBeacon(`${API_BASE}/session/${state.sessionId}/end/`);
    }
  });

  // Start render loop
  requestAnimationFrame(gameLoop);
}

function gameLoop(now: number): void {
  if (state.phase !== 'game') return;

  // Tick engine
  const completed = tick(mapState, now, pendingHotspot);
  if (completed) pendingHotspot = null;

  // Update player sprite position
  playerSpriteState.position = { ...mapState.playerPosition };

  // Render
  render(ctx, mapState, {
    debugHotspots: false,
    agentStates,
    playerSpriteState,
    now,
  });

  requestAnimationFrame(gameLoop);
}

function returnToOnboarding(): void {
  state.phase = 'config';
  state.sessionId = null;

  // Clean up game
  if (chatPanel) chatPanel.destroy();
  gameEl.style.display = 'none';
  onboardingEl.style.display = 'flex';

  // Clear messages and show new session prompt
  msgContainer.innerHTML = '';
  addSystemMessage(`Welcome back to Sharpedo Bluff!\n\nLast workspace: ${state.workspacePath}\nType a new path, or press Enter to use the same one.`);
  state.awaitingInput = 'workspace';
  setInputEnabled(true);
}

// ── Start ────────────────────────────────────────────────────────

boot();
