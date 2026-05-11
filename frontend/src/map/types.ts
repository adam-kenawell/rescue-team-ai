// Map system type definitions

/** 2D position on the canvas (pixels) */
export interface Position {
  x: number;
  y: number;
}

/** Axis-aligned bounding box for clickable regions */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** What happens when a hotspot is clicked */
export type HotspotKind = 'shop' | 'exit';

/** A clickable region on a map screen */
export interface Hotspot {
  id: string;
  label: string;
  kind: HotspotKind;
  bounds: Rect;
  /** Walk-to position (sprite destination when clicked) */
  walkTo: Position;
  /** For exits: which screen to transition to */
  targetScreen?: string;
  /** For exits: where the player spawns on the target screen */
  spawnPosition?: Position;
  /** For shops: the agent's Pokemon name (maps to backend agent) */
  agentPokemon?: string;
}

/** A single map screen */
export interface Screen {
  id: string;
  label: string;
  /** Placeholder background color (replaced with PNG in Phase 2) */
  backgroundColor: string;
  /** Canvas dimensions for this screen */
  width: number;
  height: number;
  /** Clickable regions */
  hotspots: Hotspot[];
  /** Default player spawn position */
  defaultSpawn: Position;
}

/** Current walk animation state */
export interface WalkState {
  from: Position;
  to: Position;
  startTime: number;
  duration: number;
}

/** Overall map state at any point in time */
export interface MapState {
  currentScreenId: string;
  playerPosition: Position;
  playerDexId: number;
  walk: WalkState | null;
}
