// Map module — public API

export type { Position, Rect, Hotspot, HotspotKind, Screen, WalkState, MapState } from './types.js';
export { SCREENS, CANVAS_W, CANVAS_H, WALK_SPEED, getScreen, screenIds } from './screens.js';
export {
  createMapState,
  distance,
  pointInRect,
  findHotspot,
  startWalk,
  updateWalk,
  isWalking,
  transitionScreen,
  handleClick,
  tick,
} from './engine.js';
export { drawBackground, drawHotspots, drawPlayer, drawAgentPlaceholders, render } from './renderer.js';
export type { RenderOptions } from './renderer.js';
export {
  DIRECTION_ROWS,
  directionFromDelta,
  createAgentSpriteState,
  updateAgentStates,
  loadSpriteSheets,
  drawSprite,
  getCachedSheets,
  setCachedSheets,
  clearSheetCache,
} from './sprites.js';
export type {
  DirectionRow,
  AgentStatus,
  LoadedSheets,
  AgentSpriteState,
} from './sprites.js';
