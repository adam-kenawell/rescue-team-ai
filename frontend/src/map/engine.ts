// Map engine — state management, hotspot detection, walk interpolation, screen transitions

import type { MapState, Position, Hotspot, WalkState, FadeState } from './types.js';
import { getScreen, WALK_SPEED } from './screens.js';

const FADE_DURATION = 250; // ms per phase (out + in)

/** Create initial map state */
export function createMapState(playerDexId: number, startScreen = 'sharpedo_bluff'): MapState {
  const screen = getScreen(startScreen);
  return {
    currentScreenId: startScreen,
    playerPosition: { ...screen.defaultSpawn },
    playerDexId,
    walk: null,
    fade: null,
  };
}

/** Distance between two points */
export function distance(a: Position, b: Position): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Check if a point is inside a rect */
export function pointInRect(px: number, py: number, rect: { x: number; y: number; w: number; h: number }): boolean {
  return px >= rect.x && px <= rect.x + rect.w && py >= rect.y && py <= rect.y + rect.h;
}

/** Find which hotspot (if any) was clicked */
export function findHotspot(screenId: string, clickX: number, clickY: number): Hotspot | null {
  const screen = getScreen(screenId);
  for (const hotspot of screen.hotspots) {
    if (pointInRect(clickX, clickY, hotspot.bounds)) {
      return hotspot;
    }
  }
  return null;
}

/** Start a walk animation toward a target position */
export function startWalk(state: MapState, target: Position, now: number): void {
  const dist = distance(state.playerPosition, target);
  if (dist < 1) return;
  const duration = (dist / WALK_SPEED) * 1000; // ms
  state.walk = {
    from: { ...state.playerPosition },
    to: { ...target },
    startTime: now,
    duration,
  };
}

/** Linearly interpolate the player position during a walk. Returns true if walk completed. */
export function updateWalk(state: MapState, now: number): boolean {
  if (!state.walk) return false;
  const elapsed = now - state.walk.startTime;
  const t = Math.min(1, elapsed / state.walk.duration);
  state.playerPosition.x = state.walk.from.x + (state.walk.to.x - state.walk.from.x) * t;
  state.playerPosition.y = state.walk.from.y + (state.walk.to.y - state.walk.from.y) * t;
  if (t >= 1) {
    state.walk = null;
    return true;
  }
  return false;
}

/** Is the player currently walking? */
export function isWalking(state: MapState): boolean {
  return state.walk !== null;
}

/** Transition to a new screen (used after walk-to-exit completes) */
export function transitionScreen(state: MapState, targetScreenId: string, spawnPosition: Position): void {
  getScreen(targetScreenId); // validate exists
  state.currentScreenId = targetScreenId;
  state.playerPosition = { ...spawnPosition };
  state.walk = null;
}

/** Start a fade-to-black screen transition */
export function startFade(state: MapState, targetScreenId: string, spawnPosition: Position, now: number): void {
  getScreen(targetScreenId); // validate exists
  state.fade = {
    phase: 'out',
    startTime: now,
    duration: FADE_DURATION,
    targetScreenId,
    spawnPosition: { ...spawnPosition },
  };
}

/**
 * Update fade progress. Returns the current opacity (0 = clear, 1 = fully black).
 * Handles phase transition (out→swap screen→in) and cleanup.
 */
export function updateFade(state: MapState, now: number): number {
  if (!state.fade) return 0;

  const elapsed = now - state.fade.startTime;
  const t = Math.min(1, elapsed / state.fade.duration);

  if (state.fade.phase === 'out') {
    if (t >= 1) {
      // Swap screen at midpoint
      state.currentScreenId = state.fade.targetScreenId;
      state.playerPosition = { ...state.fade.spawnPosition };
      state.walk = null;
      state.fade.phase = 'in';
      state.fade.startTime = now;
      return 1;
    }
    return t;
  }

  // phase === 'in'
  if (t >= 1) {
    state.fade = null;
    return 0;
  }
  return 1 - t;
}

/** Is a fade transition currently active? */
export function isFading(state: MapState): boolean {
  return state.fade !== null;
}

/**
 * Handle a click on the map canvas.
 * Returns the hotspot clicked (if any) so the caller can react (e.g., open chat for shops).
 * Walk animation is started automatically. Exit transitions happen after walk completes
 * (caller must call updateWalk each frame and check for exit completion).
 */
export function handleClick(state: MapState, clickX: number, clickY: number, now: number): Hotspot | null {
  if (isWalking(state) || isFading(state)) return null; // ignore clicks during walk or fade
  const hotspot = findHotspot(state.currentScreenId, clickX, clickY);
  if (hotspot) {
    startWalk(state, hotspot.walkTo, now);
    return hotspot;
  }
  // No hotspot — walk to clicked position
  startWalk(state, { x: clickX, y: clickY }, now);
  return null;
}

/**
 * Tick the engine forward. Call each frame.
 * Returns the pending hotspot if a walk just completed (so caller can trigger transition/shop).
 */
export function tick(state: MapState, now: number, pendingHotspot: Hotspot | null): Hotspot | null {
  const completed = updateWalk(state, now);
  if (completed && pendingHotspot) {
    if (pendingHotspot.kind === 'exit' && pendingHotspot.targetScreen && pendingHotspot.spawnPosition) {
      startFade(state, pendingHotspot.targetScreen, pendingHotspot.spawnPosition, now);
    }
    return pendingHotspot;
  }
  // Advance fade if active
  updateFade(state, now);
  return null;
}
