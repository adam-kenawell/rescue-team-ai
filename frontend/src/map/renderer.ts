// Map renderer — draws backgrounds, hotspots, player + agent sprites on a 2D canvas

import type { MapState } from './types.js';
import { getScreen } from './screens.js';
import { updateFade } from './engine.js';
import {
  type AgentSpriteState,
  getCachedSheets,
  drawSprite,
} from './sprites.js';

export interface RenderOptions {
  /** Show hotspot debug outlines */
  debugHotspots?: boolean;
  /** Agent sprite states (keyed by pokemon name) */
  agentStates?: Map<string, AgentSpriteState>;
  /** Player sprite state (for real sprite rendering) */
  playerSpriteState?: AgentSpriteState;
  /** Current timestamp for fade calculation */
  now?: number;
}

/** Draw the current screen background (placeholder solid color) */
export function drawBackground(ctx: CanvasRenderingContext2D, screenId: string): void {
  const screen = getScreen(screenId);
  ctx.fillStyle = screen.backgroundColor;
  ctx.fillRect(0, 0, screen.width, screen.height);
}

/** Draw hotspot debug outlines */
export function drawHotspots(ctx: CanvasRenderingContext2D, screenId: string): void {
  const screen = getScreen(screenId);
  for (const hotspot of screen.hotspots) {
    const { x, y, w, h } = hotspot.bounds;
    ctx.strokeStyle = hotspot.kind === 'exit' ? 'rgba(0,255,0,0.6)' : 'rgba(255,255,0,0.6)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.font = '10px monospace';
    ctx.fillText(hotspot.label, x + 2, y + h + 12);
  }
}

/**
 * Draw the player sprite. Uses real sprite if playerSpriteState is provided
 * and sheets are cached, otherwise falls back to a yellow circle.
 */
export function drawPlayer(
  ctx: CanvasRenderingContext2D,
  state: MapState,
  playerSpriteState?: AgentSpriteState,
): void {
  if (playerSpriteState) {
    playerSpriteState.position = { ...state.playerPosition };
    const loaded = getCachedSheets(playerSpriteState.dexId);
    drawSprite(ctx, playerSpriteState, loaded);
    return;
  }
  // Fallback circle
  ctx.beginPath();
  ctx.arc(state.playerPosition.x, state.playerPosition.y, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#ffcc00';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/**
 * Draw shop agent sprites. Uses real sprites from agentStates if available,
 * otherwise falls back to labeled circles.
 */
export function drawAgentPlaceholders(
  ctx: CanvasRenderingContext2D,
  screenId: string,
  agentStates?: Map<string, AgentSpriteState>,
): void {
  const screen = getScreen(screenId);
  for (const hotspot of screen.hotspots) {
    if (hotspot.kind !== 'shop' || !hotspot.agentPokemon) continue;
    const key = hotspot.agentPokemon.toLowerCase();
    const agentState = agentStates?.get(key);

    if (agentState) {
      agentState.position = { ...hotspot.walkTo };
      const loaded = getCachedSheets(agentState.dexId);
      drawSprite(ctx, agentState, loaded);
    } else {
      const { x, y } = hotspot.walkTo;
      ctx.beginPath();
      ctx.arc(x, y - 20, 10, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(100,200,255,0.7)';
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = '9px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(hotspot.agentPokemon, x, y - 35);
      ctx.textAlign = 'start';
    }
  }
}

/** Draw a black overlay at the given opacity (for fade transitions) */
export function drawFadeOverlay(ctx: CanvasRenderingContext2D, state: MapState, now: number): void {
  const opacity = updateFade(state, now);
  if (opacity <= 0) return;
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

/** Full render pass */
export function render(ctx: CanvasRenderingContext2D, state: MapState, opts: RenderOptions = {}): void {
  drawBackground(ctx, state.currentScreenId);
  drawAgentPlaceholders(ctx, state.currentScreenId, opts.agentStates);
  if (opts.debugHotspots) {
    drawHotspots(ctx, state.currentScreenId);
  }
  drawPlayer(ctx, state, opts.playerSpriteState);
  if (state.fade && opts.now != null) {
    drawFadeOverlay(ctx, state, opts.now);
  }
}
