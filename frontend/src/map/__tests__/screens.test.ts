// Tests for screen data integrity

import { describe, it, expect } from 'vitest';
import { SCREENS, getScreen, screenIds, CANVAS_W, CANVAS_H } from '../screens.js';

describe('screen data', () => {
  const ids = screenIds();

  it('has exactly 4 screens', () => {
    expect(ids).toHaveLength(4);
    expect(ids).toContain('sharpedo_bluff');
    expect(ids).toContain('crossroads');
    expect(ids).toContain('town_center');
    expect(ids).toContain('town_east');
  });

  it('all screens use standard canvas dimensions', () => {
    for (const id of ids) {
      const s = getScreen(id);
      expect(s.width).toBe(CANVAS_W);
      expect(s.height).toBe(CANVAS_H);
    }
  });

  it('all screens have a valid defaultSpawn within bounds', () => {
    for (const id of ids) {
      const s = getScreen(id);
      expect(s.defaultSpawn.x).toBeGreaterThanOrEqual(0);
      expect(s.defaultSpawn.x).toBeLessThanOrEqual(s.width);
      expect(s.defaultSpawn.y).toBeGreaterThanOrEqual(0);
      expect(s.defaultSpawn.y).toBeLessThanOrEqual(s.height);
    }
  });

  it('all hotspot bounds are within canvas', () => {
    for (const id of ids) {
      const s = getScreen(id);
      for (const h of s.hotspots) {
        expect(h.bounds.x).toBeGreaterThanOrEqual(0);
        expect(h.bounds.y).toBeGreaterThanOrEqual(0);
        expect(h.bounds.x + h.bounds.w).toBeLessThanOrEqual(s.width);
        expect(h.bounds.y + h.bounds.h).toBeLessThanOrEqual(s.height);
      }
    }
  });

  it('all hotspot walkTo positions are within canvas', () => {
    for (const id of ids) {
      const s = getScreen(id);
      for (const h of s.hotspots) {
        expect(h.walkTo.x).toBeGreaterThanOrEqual(0);
        expect(h.walkTo.x).toBeLessThanOrEqual(s.width);
        expect(h.walkTo.y).toBeGreaterThanOrEqual(0);
        expect(h.walkTo.y).toBeLessThanOrEqual(s.height);
      }
    }
  });

  it('all exit hotspots reference existing screens', () => {
    for (const id of ids) {
      const s = getScreen(id);
      for (const h of s.hotspots) {
        if (h.kind === 'exit') {
          expect(h.targetScreen).toBeDefined();
          expect(ids).toContain(h.targetScreen);
          expect(h.spawnPosition).toBeDefined();
        }
      }
    }
  });

  it('exit connections are bidirectional', () => {
    for (const id of ids) {
      const s = getScreen(id);
      for (const h of s.hotspots) {
        if (h.kind !== 'exit' || !h.targetScreen) continue;
        const target = getScreen(h.targetScreen);
        const backExit = target.hotspots.find(
          (th) => th.kind === 'exit' && th.targetScreen === id,
        );
        expect(backExit, `${id} -> ${h.targetScreen} has no return exit`).toBeDefined();
      }
    }
  });

  it('all shop hotspots have agentPokemon', () => {
    for (const id of ids) {
      const s = getScreen(id);
      for (const h of s.hotspots) {
        if (h.kind === 'shop') {
          expect(h.agentPokemon).toBeDefined();
          expect(h.agentPokemon!.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('all 8 shop agents are placed exactly once', () => {
    const agents = new Set<string>();
    for (const id of ids) {
      for (const h of getScreen(id).hotspots) {
        if (h.kind === 'shop' && h.agentPokemon) {
          expect(agents.has(h.agentPokemon), `duplicate agent: ${h.agentPokemon}`).toBe(false);
          agents.add(h.agentPokemon);
        }
      }
    }
    expect(agents.size).toBe(8);
    for (const name of ['wigglytuff', 'kecleon', 'kangaskhan', 'duskull', 'electivire', 'marowak', 'chansey', 'xatu']) {
      expect(agents.has(name), `missing agent: ${name}`).toBe(true);
    }
  });

  it('getScreen throws on unknown id', () => {
    expect(() => getScreen('fake')).toThrow('Unknown screen: fake');
  });

  it('hotspot IDs are unique within each screen', () => {
    for (const id of ids) {
      const s = getScreen(id);
      const hotspotIds = s.hotspots.map((h) => h.id);
      expect(new Set(hotspotIds).size).toBe(hotspotIds.length);
    }
  });
});
