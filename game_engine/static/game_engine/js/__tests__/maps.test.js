import { describe, it, expect } from 'vitest';
import {
    SCENES, COLS, ROWS, TILE_SIZE, SCALE,
    getExitAtTile, getEdgeSpawn, TILE_COLORS,
} from '../maps.js';

describe('maps.js', () => {
    describe('scene definitions', () => {
        it('defines exactly 4 scenes', () => {
            expect(Object.keys(SCENES)).toHaveLength(4);
            expect(Object.keys(SCENES).sort()).toEqual(['guild', 'home', 'market', 'outings']);
        });

        it('each scene has correct grid dimensions', () => {
            for (const scene of Object.values(SCENES)) {
                expect(scene.grid).toHaveLength(ROWS);
                for (const row of scene.grid) {
                    expect(row).toHaveLength(COLS);
                }
            }
        });

        it('each scene has a name, spawn, and exits', () => {
            for (const scene of Object.values(SCENES)) {
                expect(scene.name).toBeTruthy();
                expect(scene.spawn).toHaveProperty('x');
                expect(scene.spawn).toHaveProperty('y');
                expect(Array.isArray(scene.exits)).toBe(true);
                expect(scene.exits.length).toBeGreaterThan(0);
            }
        });

        it('market has 3 exits (west, north, east)', () => {
            const edges = SCENES.market.exits.map(e => e.edge).sort();
            expect(edges).toEqual(['east', 'north', 'west']);
        });

        it('outer scenes each have 1 exit back to market', () => {
            for (const name of ['home', 'guild', 'outings']) {
                expect(SCENES[name].exits).toHaveLength(1);
                expect(SCENES[name].exits[0].target).toBe('market');
            }
        });
    });

    describe('getExitAtTile', () => {
        it('returns exit when standing on an exit tile', () => {
            // Market west exit at col 0, rows 6-8
            const exit = getExitAtTile(SCENES.market, 0, 7);
            expect(exit).not.toBeNull();
            expect(exit.target).toBe('home');
        });

        it('returns null for non-exit tiles', () => {
            const exit = getExitAtTile(SCENES.market, 10, 10);
            expect(exit).toBeNull();
        });

        it('detects north exit on row 0', () => {
            const exit = getExitAtTile(SCENES.market, 10, 0);
            expect(exit).not.toBeNull();
            expect(exit.target).toBe('guild');
        });

        it('detects east exit on last column', () => {
            const exit = getExitAtTile(SCENES.market, COLS - 1, 7);
            expect(exit).not.toBeNull();
            expect(exit.target).toBe('outings');
        });
    });

    describe('getEdgeSpawn', () => {
        it('spawns one tile inward from the edge', () => {
            const spawn = getEdgeSpawn(SCENES.market, 'west');
            expect(spawn.x).toBe(1); // one in from west edge
        });

        it('spawns at center of exit range', () => {
            // Market west exit: rows 6-8, mid = 7
            const spawn = getEdgeSpawn(SCENES.market, 'west');
            expect(spawn.y).toBe(7);
        });

        it('falls back to scene default spawn for unknown edge', () => {
            const spawn = getEdgeSpawn(SCENES.home, 'north'); // home has no north exit
            expect(spawn).toEqual(SCENES.home.spawn);
        });
    });

    describe('constants', () => {
        it('tile size and scale produce correct pixel size', () => {
            expect(TILE_SIZE * SCALE).toBe(36);
        });

        it('grid dimensions are 20x15', () => {
            expect(COLS).toBe(20);
            expect(ROWS).toBe(15);
        });

        it('all tile types have colors defined', () => {
            for (let t = 0; t <= 4; t++) {
                expect(TILE_COLORS[t]).toBeTruthy();
            }
        });
    });
});
