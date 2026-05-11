// Sprite layer — agent sprite state management, direction calc, rendering helpers
// Consumes pmd-visualizer primitives for sprite sheet loading/frame calculation

import type { Action } from 'pmd-visualizer';
import type { Position } from './types.js';

// ── Direction ────────────────────────────────────────────────────

/** PMD sprite sheet row indices (8-directional) */
export const DIRECTION_ROWS = {
  Down: 0,
  DownLeft: 1,
  Left: 2,
  UpLeft: 3,
  Up: 4,
  UpRight: 5,
  Right: 6,
  DownRight: 7,
} as const;

export type DirectionRow = (typeof DIRECTION_ROWS)[keyof typeof DIRECTION_ROWS];

/**
 * Calculate the 8-directional sprite sheet row from a movement delta.
 * Returns Down (0) for zero-length deltas (idle).
 */
export function directionFromDelta(dx: number, dy: number): DirectionRow {
  if (dx === 0 && dy === 0) return DIRECTION_ROWS.Down;

  // atan2 gives angle in radians, convert to 0-360 degrees
  const angle = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;

  // Map angle to 8 directions (each direction covers 45 degrees)
  // 0° = Right, 90° = Down, 180° = Left, 270° = Up
  if (angle >= 337.5 || angle < 22.5) return DIRECTION_ROWS.Right;
  if (angle >= 22.5 && angle < 67.5) return DIRECTION_ROWS.DownRight;
  if (angle >= 67.5 && angle < 112.5) return DIRECTION_ROWS.Down;
  if (angle >= 112.5 && angle < 157.5) return DIRECTION_ROWS.DownLeft;
  if (angle >= 157.5 && angle < 202.5) return DIRECTION_ROWS.Left;
  if (angle >= 202.5 && angle < 247.5) return DIRECTION_ROWS.UpLeft;
  if (angle >= 247.5 && angle < 292.5) return DIRECTION_ROWS.Up;
  return DIRECTION_ROWS.UpRight; // 292.5 - 337.5
}

// ── Agent State ──────────────────────────────────────────────────

export type AgentStatus = 'sleeping' | 'awake' | 'thinking' | 'done';

/** Maps backend agent status to sprite action */
function statusToAction(status: AgentStatus): Action {
  switch (status) {
    case 'sleeping':
      return 'Sleep';
    case 'thinking':
      return 'Walk';
    case 'awake':
    case 'done':
    default:
      return 'Idle';
  }
}

/** Loaded sprite sheets + frame info for a single dex ID */
export interface LoadedSheets {
  sheets: Record<string, HTMLImageElement | null>;
  frameInfo: Record<string, { w: number; h: number; count: number } | null>;
}

/** Sprite state for a single agent on the map */
export interface AgentSpriteState {
  pokemon: string;
  dexId: number;
  action: Action;
  status: AgentStatus;
  frame: number;
  direction: DirectionRow;
  position: Position;
  isPartner: boolean;
}

/** Create a new agent sprite state with defaults */
export function createAgentSpriteState(
  pokemon: string,
  dexId: number,
  isPartner = false,
): AgentSpriteState {
  return {
    pokemon,
    dexId,
    action: 'Idle',
    status: 'sleeping',
    frame: 0,
    direction: DIRECTION_ROWS.Down,
    position: { x: 0, y: 0 },
    isPartner,
  };
}

/**
 * Update agent sprite states from poll response data.
 * Transitions actions based on status changes, resets frame counter on action change.
 */
export function updateAgentStates(
  states: Map<string, AgentSpriteState>,
  pollAgents: { pokemon: string; status: AgentStatus }[],
): void {
  for (const agent of pollAgents) {
    const key = agent.pokemon.toLowerCase();
    const state = states.get(key);
    if (!state) continue;

    const newAction = statusToAction(agent.status);
    if (state.action !== newAction) {
      state.frame = 0;
    }
    state.action = newAction;
    state.status = agent.status;
  }
}

// ── Sprite Cache ─────────────────────────────────────────────────

/** Global cache of loaded sprite sheets, keyed by dex ID */
const sheetCache = new Map<number, LoadedSheets>();

export function getCachedSheets(dexId: number): LoadedSheets | undefined {
  return sheetCache.get(dexId);
}

export function setCachedSheets(dexId: number, sheets: LoadedSheets): void {
  sheetCache.set(dexId, sheets);
}

export function clearSheetCache(): void {
  sheetCache.clear();
}

// ── Sprite Loading ───────────────────────────────────────────────

import { spriteUrl, loadImage, fetchAnimData, calcFrameInfo } from 'pmd-visualizer';

const SPRITE_ACTIONS = ['Walk', 'Idle', 'Sleep'] as const;

/**
 * Load sprite sheets for a dex ID. Returns cached if available.
 * Loads Walk, Idle, and Sleep sheets in parallel.
 */
export async function loadSpriteSheets(dexId: number): Promise<LoadedSheets> {
  const cached = sheetCache.get(dexId);
  if (cached) return cached;

  const [animDims, walkImg, idleImg, sleepImg] = await Promise.all([
    fetchAnimData(dexId),
    loadImage(spriteUrl(dexId, 'Walk')),
    loadImage(spriteUrl(dexId, 'Idle')),
    loadImage(spriteUrl(dexId, 'Sleep')),
  ]);

  const sheets: Record<string, HTMLImageElement | null> = {
    Walk: walkImg,
    Idle: idleImg,
    Sleep: sleepImg,
  };

  const frameInfo: Record<string, { w: number; h: number; count: number } | null> = {
    Walk: walkImg ? calcFrameInfo(walkImg, animDims['Walk']) : null,
    Idle: idleImg ? calcFrameInfo(idleImg, animDims['Idle']) : null,
    Sleep: sleepImg ? calcFrameInfo(sleepImg, animDims['Sleep']) : null,
  };

  const loaded: LoadedSheets = { sheets, frameInfo };
  sheetCache.set(dexId, loaded);
  return loaded;
}

// ── Sprite Drawing ───────────────────────────────────────────────

const SPRITE_SCALE = 2;

/**
 * Draw a sprite frame on the canvas at the given position.
 * Falls back to a colored circle if sheets aren't loaded.
 */
export function drawSprite(
  ctx: CanvasRenderingContext2D,
  state: AgentSpriteState,
  loaded: LoadedSheets | undefined,
): void {
  const { position, action, frame, direction } = state;

  if (!loaded) {
    // Fallback circle
    drawFallbackCircle(ctx, position, state.isPartner ? '#ffcc00' : 'rgba(100,200,255,0.7)');
    return;
  }

  // Determine which sheet to use
  let sheet = loaded.sheets[action];
  let info = loaded.frameInfo[action];

  // Sleep fallback: Idle at half alpha + Zzz
  const isSleepFallback = action === 'Sleep' && !sheet;
  if (isSleepFallback) {
    sheet = loaded.sheets['Idle'];
    info = loaded.frameInfo['Idle'];
  }

  if (!sheet || !info) {
    drawFallbackCircle(ctx, position, state.isPartner ? '#ffcc00' : 'rgba(100,200,255,0.7)');
    return;
  }

  const frameIdx = frame % info.count;
  const sw = info.w;
  const sh = info.h;
  const dw = sw * SPRITE_SCALE;
  const dh = sh * SPRITE_SCALE;
  // Center sprite on position
  const dx = position.x - dw / 2;
  const dy = position.y - dh / 2;

  ctx.save();
  if (isSleepFallback) {
    ctx.globalAlpha = 0.5;
  }
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(sheet, frameIdx * sw, direction * sh, sw, sh, dx, dy, dw, dh);
  ctx.restore();

  // Sleep indicator
  if (action === 'Sleep' || isSleepFallback) {
    drawIndicator(ctx, position, dh, 'Zzz', 'rgba(150,150,255,0.9)');
  }

  // Thinking indicator
  if (state.status === 'thinking') {
    drawIndicator(ctx, position, dh, '...', 'rgba(255,255,255,0.9)');
  }
}

function drawFallbackCircle(ctx: CanvasRenderingContext2D, pos: Position, color: string): void {
  ctx.beginPath();
  ctx.arc(pos.x, pos.y, 12, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawIndicator(
  ctx: CanvasRenderingContext2D,
  pos: Position,
  spriteHeight: number,
  text: string,
  color: string,
): void {
  ctx.fillStyle = color;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.fillText(text, pos.x, pos.y - spriteHeight / 2 - 4);
  ctx.textAlign = 'start';
}
