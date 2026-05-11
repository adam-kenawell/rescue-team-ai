// Treasure Town screen definitions — placeholder backgrounds
// Real PNG backgrounds will replace backgroundColor in a later checkpoint

import type { Screen } from './types.js';

/** Canvas dimensions (all screens share the same size) */
export const CANVAS_W = 512;
export const CANVAS_H = 384;

/** Walk speed in pixels per second */
export const WALK_SPEED = 120;

export const SCREENS: Record<string, Screen> = {
  sharpedo_bluff: {
    id: 'sharpedo_bluff',
    label: 'Sharpedo Bluff',
    backgroundColor: '#1a1a2e',
    width: CANVAS_W,
    height: CANVAS_H,
    defaultSpawn: { x: 256, y: 300 },
    hotspots: [
      {
        id: 'exit_to_crossroads',
        label: 'To Crossroads',
        kind: 'exit',
        bounds: { x: 220, y: 0, w: 72, h: 32 },
        walkTo: { x: 256, y: 40 },
        targetScreen: 'crossroads',
        spawnPosition: { x: 256, y: 340 },
      },
    ],
  },

  crossroads: {
    id: 'crossroads',
    label: 'Crossroads',
    backgroundColor: '#2d2d44',
    width: CANVAS_W,
    height: CANVAS_H,
    defaultSpawn: { x: 256, y: 192 },
    hotspots: [
      {
        id: 'exit_to_bluff',
        label: 'To Sharpedo Bluff',
        kind: 'exit',
        bounds: { x: 220, y: 352, w: 72, h: 32 },
        walkTo: { x: 256, y: 350 },
        targetScreen: 'sharpedo_bluff',
        spawnPosition: { x: 256, y: 40 },
      },
      {
        id: 'exit_to_town_center',
        label: 'To Town Center',
        kind: 'exit',
        bounds: { x: 0, y: 160, w: 32, h: 64 },
        walkTo: { x: 40, y: 192 },
        targetScreen: 'town_center',
        spawnPosition: { x: 470, y: 192 },
      },
      {
        id: 'exit_to_town_east',
        label: 'To Town East',
        kind: 'exit',
        bounds: { x: 480, y: 160, w: 32, h: 64 },
        walkTo: { x: 470, y: 192 },
        targetScreen: 'town_east',
        spawnPosition: { x: 40, y: 192 },
      },
      {
        id: 'shop_wigglytuff',
        label: "Wigglytuff's Guild",
        kind: 'shop',
        bounds: { x: 200, y: 40, w: 112, h: 80 },
        walkTo: { x: 256, y: 120 },
        agentPokemon: 'wigglytuff',
      },
    ],
  },

  town_center: {
    id: 'town_center',
    label: 'Town Center',
    backgroundColor: '#3a3a5c',
    width: CANVAS_W,
    height: CANVAS_H,
    defaultSpawn: { x: 256, y: 192 },
    hotspots: [
      {
        id: 'exit_to_crossroads',
        label: 'To Crossroads',
        kind: 'exit',
        bounds: { x: 480, y: 160, w: 32, h: 64 },
        walkTo: { x: 470, y: 192 },
        targetScreen: 'crossroads',
        spawnPosition: { x: 40, y: 192 },
      },
      {
        id: 'shop_kecleon',
        label: 'Kecleon Shop',
        kind: 'shop',
        bounds: { x: 60, y: 60, w: 100, h: 80 },
        walkTo: { x: 110, y: 140 },
        agentPokemon: 'kecleon',
      },
      {
        id: 'shop_kangaskhan',
        label: 'Kangaskhan Storage',
        kind: 'shop',
        bounds: { x: 220, y: 60, w: 100, h: 80 },
        walkTo: { x: 270, y: 140 },
        agentPokemon: 'kangaskhan',
      },
      {
        id: 'shop_duskull',
        label: 'Duskull Bank',
        kind: 'shop',
        bounds: { x: 380, y: 60, w: 100, h: 80 },
        walkTo: { x: 430, y: 140 },
        agentPokemon: 'duskull',
      },
      {
        id: 'shop_chansey',
        label: "Chansey's Day Care",
        kind: 'shop',
        bounds: { x: 100, y: 240, w: 100, h: 80 },
        walkTo: { x: 150, y: 240 },
        agentPokemon: 'chansey',
      },
    ],
  },

  town_east: {
    id: 'town_east',
    label: 'Town East',
    backgroundColor: '#44446e',
    width: CANVAS_W,
    height: CANVAS_H,
    defaultSpawn: { x: 256, y: 192 },
    hotspots: [
      {
        id: 'exit_to_crossroads',
        label: 'To Crossroads',
        kind: 'exit',
        bounds: { x: 0, y: 160, w: 32, h: 64 },
        walkTo: { x: 40, y: 192 },
        targetScreen: 'crossroads',
        spawnPosition: { x: 470, y: 192 },
      },
      {
        id: 'shop_electivire',
        label: 'Electivire Link Shop',
        kind: 'shop',
        bounds: { x: 120, y: 60, w: 100, h: 80 },
        walkTo: { x: 170, y: 140 },
        agentPokemon: 'electivire',
      },
      {
        id: 'shop_marowak',
        label: 'Marowak Dojo',
        kind: 'shop',
        bounds: { x: 300, y: 60, w: 100, h: 80 },
        walkTo: { x: 350, y: 140 },
        agentPokemon: 'marowak',
      },
      {
        id: 'shop_xatu',
        label: 'Xatu Appraisal',
        kind: 'shop',
        bounds: { x: 200, y: 240, w: 100, h: 80 },
        walkTo: { x: 250, y: 280 },
        agentPokemon: 'xatu',
      },
    ],
  },
};

/** Get a screen by ID, throws if not found */
export function getScreen(id: string): Screen {
  const screen = SCREENS[id];
  if (!screen) throw new Error(`Unknown screen: ${id}`);
  return screen;
}

/** All screen IDs */
export function screenIds(): string[] {
  return Object.keys(SCREENS);
}
