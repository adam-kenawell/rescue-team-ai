// Map page entry point -- wires the engine to the DOM.
import { createEngine, init, loadScene, loadPlayerSprite, startLoop } from './map-engine.js';

const DEFAULT_DEX_ID = 25; // Pikachu fallback

function getDexIdFromStorage() {
    try {
        const raw = localStorage.getItem('rtai_leader_dex_id');
        const id = parseInt(raw, 10);
        return id > 0 ? id : DEFAULT_DEX_ID;
    } catch {
        return DEFAULT_DEX_ID;
    }
}

async function boot() {
    const canvas = document.getElementById('map-canvas');
    const overlay = document.getElementById('fade-overlay');
    if (!canvas) return;

    const engine = createEngine();
    init(engine, canvas, overlay);

    const dexId = getDexIdFromStorage();
    await loadPlayerSprite(engine, dexId);
    loadScene(engine, 'market', null);
    startLoop(engine);
}

document.addEventListener('DOMContentLoaded', boot);
