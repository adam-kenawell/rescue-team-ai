/**
 * quiz.js -- NPC dialogue-driven onboarding quiz.
 *
 * Reads pokemon_choices from the embedded JSON data contract,
 * walks the player through leader/partner selection via a chat bubble,
 * then spawns animated sprites via pmd-visualizer.
 */
import {
    createSpriteWidget,
    resetWidgets,
    nameToDexId,
} from './pmd-visualizer/index.js';


// -- DOM refs --
const chatText = document.getElementById('chat-text');
const chatOptions = document.getElementById('chat-options');
const spriteDisplay = document.getElementById('sprite-display');

// -- State --
let pokemonChoices = [];
let leaderChoice = null;
let partnerChoice = null;

// -- Init --
function init() {
    const dataEl = document.getElementById('pokemon-data');
    if (dataEl) {
        pokemonChoices = JSON.parse(dataEl.textContent);
    }
    stepWelcome();
}

// -------------------------------------------------------
// Dialogue steps
// -------------------------------------------------------

function stepWelcome() {
    showDialogue(
        "Welcome, recruit! I'm Chatot, head of intelligence at the guild. " +
        "Before we get started, I need to know a bit about you...",
        [{ label: "I'm ready!", action: stepPickLeader }]
    );
}

async function stepPickLeader() {
    showDialogue("First things first -- which Pokemon will lead your rescue team?", []);
    await showSpriteGrid(pokemonChoices, (p) => {
        leaderChoice = p;
        stepConfirmLeader();
    });
}

function stepConfirmLeader() {
    clearSpriteGrid();
    showDialogue(
        `${leaderChoice.name}, huh? A fine choice! Now, every leader needs a partner...`,
        [{ label: "Pick my partner!", action: stepPickPartner }]
    );
}

async function stepPickPartner() {
    const leaderTypes = new Set(leaderChoice.types);
    const available = pokemonChoices.filter(p =>
        p.dex_id !== leaderChoice.dex_id &&
        !p.types.some(t => leaderTypes.has(t))
    );
    showDialogue("Who will be your trusted partner on these rescue missions?", []);
    await showSpriteGrid(available, (p) => {
        partnerChoice = p;
        stepConfirmPartner();
    });
}

function stepConfirmPartner() {
    clearSpriteGrid();
    showDialogue(
        `${leaderChoice.name} and ${partnerChoice.name} -- now THAT'S a rescue team! ` +
        "Let me introduce you to the guild...",
        [{ label: "Let's go!", action: stepSpawnSprites }]
    );
}

async function stepSpawnSprites() {
    showDialogue("Your team is assembling...", []);

    spriteDisplay.innerHTML = '';

    // Spawn leader
    const leaderSlot = document.createElement('div');
    leaderSlot.className = 'sprite-slot';
    const leaderCanvas = await createSpriteWidget(leaderChoice.dex_id);
    if (leaderCanvas) {
        leaderSlot.appendChild(leaderCanvas);
        spriteDisplay.appendChild(leaderSlot);
    }

    // Spawn partner
    const partnerSlot = document.createElement('div');
    partnerSlot.className = 'sprite-slot';
    const partnerCanvas = await createSpriteWidget(partnerChoice.dex_id);
    if (partnerCanvas) {
        partnerSlot.appendChild(partnerCanvas);
        spriteDisplay.appendChild(partnerSlot);
    }

    showDialogue(
        `${leaderChoice.name} and ${partnerChoice.name} are ready for action! ` +
        "Click on a sprite to see them attack!",
        [{ label: "Start over", action: resetQuiz }]
    );
}

function resetQuiz() {
    leaderChoice = null;
    partnerChoice = null;
    spriteDisplay.innerHTML = '';
    resetWidgets();
    stepWelcome();
}

// -------------------------------------------------------
// Sprite selection grid
// -------------------------------------------------------

async function showSpriteGrid(choices, onSelect) {
    clearSpriteGrid();
    const grid = document.createElement('div');
    grid.className = 'sprite-grid';
    spriteDisplay.appendChild(grid);

    // Load all sprites in parallel
    const entries = await Promise.all(choices.map(async (p) => {
        const canvas = await createSpriteWidget(p.dex_id);
        return { pokemon: p, canvas };
    }));

    for (const { pokemon, canvas } of entries) {
        if (!canvas) continue;
        const cell = document.createElement('div');
        cell.className = 'sprite-grid-cell';
        cell.title = pokemon.name;

        const label = document.createElement('span');
        label.className = 'sprite-grid-label';
        label.textContent = pokemon.name;

        cell.appendChild(canvas);
        cell.appendChild(label);
        cell.addEventListener('click', () => onSelect(pokemon));
        grid.appendChild(cell);
    }
}

function clearSpriteGrid() {
    const existing = spriteDisplay.querySelector('.sprite-grid');
    if (existing) existing.remove();
    resetWidgets();
}

// -------------------------------------------------------
// Chat bubble renderer
// -------------------------------------------------------

function showDialogue(text, options) {
    chatText.textContent = text;
    chatOptions.innerHTML = '';
    for (const opt of options) {
        const btn = document.createElement('button');
        btn.className = 'chat-option';
        btn.textContent = opt.label;
        btn.addEventListener('click', opt.action);
        chatOptions.appendChild(btn);
    }
}

// -- Boot --
document.addEventListener('DOMContentLoaded', init);
