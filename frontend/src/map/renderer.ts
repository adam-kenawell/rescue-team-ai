// Map renderer — draws backgrounds, hotspots, player sprite on a 2D canvas
// Real sprite integration with pmd-visualizer happens in CP7

import type { MapState, Hotspot } from './types.js';
import { getScreen } from './screens.js';

export interface RenderOptions {
  /** Show hotspot debug outlines */
  debugHotspots?: boolean;
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

/** Draw player as a placeholder circle (real sprite rendering in CP7) */
export function drawPlayer(ctx: CanvasRenderingContext2D, state: MapState): void {
  ctx.beginPath();
  ctx.arc(state.playerPosition.x, state.playerPosition.y, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#ffcc00';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();
}

/** Draw shop agent placeholders at their walkTo positions */
export function drawAgentPlaceholders(ctx: CanvasRenderingContext2D, screenId: string): void {
  const screen = getScreen(screenId);
  for (const hotspot of screen.hotspots) {
    if (hotspot.kind !== 'shop' || !hotspot.agentPokemon) continue;
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

/** Full render pass */
export function render(ctx: CanvasRenderingContext2D, state: MapState, opts: RenderOptions = {}): void {
  drawBackground(ctx, state.currentScreenId);
  drawAgentPlaceholders(ctx, state.currentScreenId);
  if (opts.debugHotspots) {
    drawHotspots(ctx, state.currentScreenId);
  }
  drawPlayer(ctx, state);
}
