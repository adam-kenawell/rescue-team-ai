// Treasure Town screen definitions — placeholder backgrounds
// Real PNG backgrounds will replace backgroundColor in a later checkpoint

import type { Screen } from './types.js';

/** Canvas dimensions (all screens share the same size) */
export const CANVAS_W = 960;
export const CANVAS_H = 720;

/** Walk speed in pixels per second */
export const WALK_SPEED = 220;

export const SCREENS: Record<string, Screen> = {
  sharpedo_bluff: {
    id: 'sharpedo_bluff',
    label: 'Sharpedo Bluff',
    backgroundColor: '#1a1a2e',
    width: CANVAS_W,
    height: CANVAS_H,
    defaultSpawn: { x: 480, y: 560 },
    hotspots: [
      {
        id: 'exit_to_crossroads',
        label: 'To Crossroads',
        kind: 'exit',
        bounds: { x: 410, y: 0, w: 140, h: 60 },
        walkTo: { x: 480, y: 75 },
        targetScreen: 'crossroads',
        spawnPosition: { x: 480, y: 640 },
      },
    ],
  },

  crossroads: {
    id: 'crossroads',
    label: 'Crossroads',
    backgroundColor: '#2d2d44',
    width: CANVAS_W,
    height: CANVAS_H,
    defaultSpawn: { x: 480, y: 360 },
    hotspots: [
      {
        id: 'exit_to_bluff',
        label: 'To Sharpedo Bluff',
        kind: 'exit',
        bounds: { x: 410, y: 660, w: 140, h: 60 },
        walkTo: { x: 480, y: 655 },
        targetScreen: 'sharpedo_bluff',
        spawnPosition: { x: 480, y: 75 },
      },
      {
        id: 'exit_to_town_center',
        label: 'To Town Center',
        kind: 'exit',
        bounds: { x: 0, y: 300, w: 60, h: 120 },
        walkTo: { x: 75, y: 360 },
        targetScreen: 'town_center',
        spawnPosition: { x: 885, y: 360 },
      },
      {
        id: 'exit_to_town_east',
        label: 'To Town East',
        kind: 'exit',
        bounds: { x: 900, y: 300, w: 60, h: 120 },
        walkTo: { x: 885, y: 360 },
        targetScreen: 'town_east',
        spawnPosition: { x: 75, y: 360 },
      },
      {
        id: 'shop_wigglytuff',
        label: "Wigglytuff's Guild",
        kind: 'shop',
        bounds: { x: 375, y: 75, w: 210, h: 150 },
        walkTo: { x: 480, y: 225 },
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
    defaultSpawn: { x: 480, y: 360 },
    hotspots: [
      {
        id: 'exit_to_crossroads',
        label: 'To Crossroads',
        kind: 'exit',
        bounds: { x: 900, y: 300, w: 60, h: 120 },
        walkTo: { x: 885, y: 360 },
        targetScreen: 'crossroads',
        spawnPosition: { x: 75, y: 360 },
      },
      {
        id: 'shop_kecleon',
        label: 'Kecleon Shop',
        kind: 'shop',
        bounds: { x: 110, y: 110, w: 190, h: 150 },
        walkTo: { x: 205, y: 260 },
        agentPokemon: 'kecleon',
      },
      {
        id: 'shop_kangaskhan',
        label: 'Kangaskhan Storage',
        kind: 'shop',
        bounds: { x: 410, y: 110, w: 190, h: 150 },
        walkTo: { x: 505, y: 260 },
        agentPokemon: 'kangaskhan',
      },
      {
        id: 'shop_duskull',
        label: 'Duskull Bank',
        kind: 'shop',
        bounds: { x: 710, y: 110, w: 190, h: 150 },
        walkTo: { x: 805, y: 260 },
        agentPokemon: 'duskull',
      },
      {
        id: 'shop_chansey',
        label: "Chansey's Day Care",
        kind: 'shop',
        bounds: { x: 190, y: 450, w: 190, h: 150 },
        walkTo: { x: 285, y: 450 },
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
    defaultSpawn: { x: 480, y: 360 },
    hotspots: [
      {
        id: 'exit_to_crossroads',
        label: 'To Crossroads',
        kind: 'exit',
        bounds: { x: 0, y: 300, w: 60, h: 120 },
        walkTo: { x: 75, y: 360 },
        targetScreen: 'crossroads',
        spawnPosition: { x: 885, y: 360 },
      },
      {
        id: 'shop_electivire',
        label: 'Electivire Link Shop',
        kind: 'shop',
        bounds: { x: 225, y: 110, w: 190, h: 150 },
        walkTo: { x: 320, y: 260 },
        agentPokemon: 'electivire',
      },
      {
        id: 'shop_marowak',
        label: 'Marowak Dojo',
        kind: 'shop',
        bounds: { x: 560, y: 110, w: 190, h: 150 },
        walkTo: { x: 655, y: 260 },
        agentPokemon: 'marowak',
      },
      {
        id: 'shop_xatu',
        label: 'Xatu Appraisal',
        kind: 'shop',
        bounds: { x: 375, y: 450, w: 190, h: 150 },
        walkTo: { x: 470, y: 525 },
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
