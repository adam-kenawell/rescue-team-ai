// Scene / tilemap definitions for the PMD town map.
// Tile types: 0=grass, 1=dirt, 2=stone, 3=water, 4=exit
// Grid: 20 columns x 15 rows, rendered at 1.5x scale (36px per tile).

export const TILE_SIZE = 24;
export const SCALE = 1.5;
export const COLS = 20;
export const ROWS = 15;

export const TILE_COLORS = {
    0: '#5a9e3e', // grass
    1: '#c4a55a', // dirt
    2: '#8a8a8a', // stone
    3: '#3a7abf', // water
    4: '#d4a017', // exit (gold highlight)
};

// Helper: fill a grid with a single tile type.
function fillGrid(tile = 0) {
    return Array.from({ length: ROWS }, () => Array(COLS).fill(tile));
}

// Helper: place exit tiles along an edge.
function setEdgeTiles(grid, edge, tile, start, end) {
    for (let i = start; i <= end; i++) {
        if (edge === 'west') grid[i][0] = tile;
        else if (edge === 'east') grid[i][COLS - 1] = tile;
        else if (edge === 'north') grid[0][i] = tile;
        else if (edge === 'south') grid[ROWS - 1][i] = tile;
    }
}

// --- Market (center hub) ---
function buildMarket() {
    const grid = fillGrid(1); // dirt base
    // Stone plaza center
    for (let r = 5; r <= 9; r++)
        for (let c = 7; c <= 12; c++) grid[r][c] = 2;
    // Grass border along top and bottom rows
    for (let c = 0; c < COLS; c++) { grid[0][c] = 0; grid[ROWS - 1][c] = 0; }
    for (let r = 0; r < ROWS; r++) { grid[r][0] = 0; grid[r][COLS - 1] = 0; }

    // Exits
    setEdgeTiles(grid, 'west', 4, 6, 8);   // -> Home
    setEdgeTiles(grid, 'north', 4, 9, 11); // -> Guild
    setEdgeTiles(grid, 'east', 4, 6, 8);   // -> Outings

    return grid;
}

// --- Home (west of market) ---
function buildHome() {
    const grid = fillGrid(0); // grass base
    // Dirt path from east entrance toward a cozy center
    for (let c = 10; c < COLS; c++) { grid[6][c] = 1; grid[7][c] = 1; grid[8][c] = 1; }
    // Stone hearth
    for (let r = 5; r <= 9; r++)
        for (let c = 4; c <= 8; c++) grid[r][c] = 2;

    setEdgeTiles(grid, 'east', 4, 6, 8); // -> Market
    return grid;
}

// --- Guild (north of market) ---
function buildGuild() {
    const grid = fillGrid(2); // stone base
    // Dirt walkway across the middle
    for (let c = 0; c < COLS; c++) { grid[10][c] = 1; grid[11][c] = 1; }
    // Grass patches
    for (let r = 0; r <= 3; r++)
        for (let c = 0; c <= 4; c++) grid[r][c] = 0;

    setEdgeTiles(grid, 'south', 4, 9, 11); // -> Market
    return grid;
}

// --- Outings (east of market) ---
function buildOutings() {
    const grid = fillGrid(0); // grass base (wilderness)
    // Dirt trail from west entrance
    for (let c = 0; c <= 10; c++) { grid[6][c] = 1; grid[7][c] = 1; grid[8][c] = 1; }
    // Water pond
    for (let r = 2; r <= 4; r++)
        for (let c = 13; c <= 17; c++) grid[r][c] = 3;

    setEdgeTiles(grid, 'west', 4, 6, 8); // -> Market
    return grid;
}

export const SCENES = {
    market: {
        name: 'market',
        grid: buildMarket(),
        spawn: { x: 10, y: 10 },
        exits: [
            { edge: 'west', target: 'home', spawnEdge: 'east', start: 6, end: 8 },
            { edge: 'north', target: 'guild', spawnEdge: 'south', start: 9, end: 11 },
            { edge: 'east', target: 'outings', spawnEdge: 'west', start: 6, end: 8 },
        ],
    },
    home: {
        name: 'home',
        grid: buildHome(),
        spawn: { x: 6, y: 7 },
        exits: [
            { edge: 'east', target: 'market', spawnEdge: 'west', start: 6, end: 8 },
        ],
    },
    guild: {
        name: 'guild',
        grid: buildGuild(),
        spawn: { x: 10, y: 8 },
        exits: [
            { edge: 'south', target: 'market', spawnEdge: 'north', start: 9, end: 11 },
        ],
    },
    outings: {
        name: 'outings',
        grid: buildOutings(),
        spawn: { x: 5, y: 7 },
        exits: [
            { edge: 'west', target: 'market', spawnEdge: 'east', start: 6, end: 8 },
        ],
    },
};

/**
 * Get the spawn position (in tile coords) when entering a scene from a given edge.
 * Returns center of the exit tile range, one tile inward from the edge.
 */
export function getEdgeSpawn(scene, edge) {
    const exit = scene.exits.find(e => e.edge === edge);
    if (!exit) return scene.spawn;
    const mid = Math.floor((exit.start + exit.end) / 2);
    switch (edge) {
        case 'west': return { x: 1, y: mid };
        case 'east': return { x: COLS - 2, y: mid };
        case 'north': return { x: mid, y: 1 };
        case 'south': return { x: mid, y: ROWS - 2 };
        default: return scene.spawn;
    }
}

/**
 * Check if a tile coordinate is an exit zone. Returns the exit definition or null.
 */
export function getExitAtTile(scene, tx, ty) {
    for (const exit of scene.exits) {
        const tiles = [];
        for (let i = exit.start; i <= exit.end; i++) {
            if (exit.edge === 'west') tiles.push([0, i]);
            else if (exit.edge === 'east') tiles.push([COLS - 1, i]);
            else if (exit.edge === 'north') tiles.push([i, 0]);
            else if (exit.edge === 'south') tiles.push([i, ROWS - 1]);
        }
        if (tiles.some(([ex, ey]) => ex === tx && ey === ty)) return exit;
    }
    return null;
}
