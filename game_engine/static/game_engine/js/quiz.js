/**
 * quiz.js -- PMD-style personality quiz with NPC dialogue.
 *
 * Asks personality questions, maps scores to a nature -> Pokemon,
 * reveals the result, then lets the player keep or manually pick.
 * Partner selection uses the sprite grid with type filtering.
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
let personalityScores = {};

// -------------------------------------------------------
// Personality quiz data
// -------------------------------------------------------

const NATURES = ['brave', 'bold', 'calm', 'jolly', 'timid', 'quirky', 'hardy', 'sassy', 'lonely'];

// Maps nature -> dex_id from the roster. Spread across the roster evenly.
const NATURE_TO_DEX = {
    brave:  374,  // Beldum
    bold:   524,  // Roggenrola
    calm:   175,  // Togepi
    jolly:  174,  // Igglybuff
    timid:  704,  // Goomy
    quirky: 137,  // Porygon
    hardy:  246,  // Larvitar
    sassy:   92,  // Gastly
    lonely:  63,  // Abra
};

const QUESTIONS = [
    {
        text: "You find a treasure chest in a dungeon. What do you do?",
        answers: [
            { label: "Open it immediately!",            scores: { brave: 2, jolly: 1 } },
            { label: "Check it carefully for traps.",   scores: { calm: 2, timid: 1 } },
            { label: "Ignore it. Treasure slows you down.", scores: { hardy: 2, bold: 1 } },
            { label: "Open it, but stand behind someone else.", scores: { sassy: 2, quirky: 1 } },
        ]
    },
    {
        text: "A teammate is struggling on a mission. What's your move?",
        answers: [
            { label: "Rush in and carry them!",         scores: { brave: 2, hardy: 1 } },
            { label: "Encourage them from behind.",     scores: { calm: 2, lonely: 1 } },
            { label: "Tell them to figure it out.",     scores: { sassy: 2, bold: 1 } },
            { label: "Make a joke to lighten the mood.", scores: { jolly: 2, quirky: 1 } },
        ]
    },
    {
        text: "You're lost in a mystery dungeon. What's your strategy?",
        answers: [
            { label: "Pick a direction and commit.",    scores: { brave: 1, hardy: 2 } },
            { label: "Study the map carefully.",        scores: { calm: 1, bold: 2 } },
            { label: "Wander and see what happens.",    scores: { quirky: 2, jolly: 1 } },
            { label: "Sit down and think it over.",     scores: { timid: 2, lonely: 1 } },
        ]
    },
    {
        text: "How do you handle a rival rescue team trash-talking you?",
        answers: [
            { label: "Challenge them to a battle!",     scores: { brave: 2, sassy: 1 } },
            { label: "Ignore them completely.",         scores: { calm: 2, hardy: 1 } },
            { label: "Trash-talk them right back.",     scores: { sassy: 2, jolly: 1 } },
            { label: "Walk away... but remember it.",   scores: { lonely: 2, timid: 1 } },
        ]
    },
    {
        text: "It's your day off. What are you doing?",
        answers: [
            { label: "Training!",                       scores: { hardy: 2, brave: 1 } },
            { label: "Reading up on dungeon tactics.",  scores: { bold: 2, calm: 1 } },
            { label: "Hanging with friends at the cafe.", scores: { jolly: 2, quirky: 1 } },
            { label: "Staying in. Alone time is important.", scores: { lonely: 2, timid: 1 } },
        ]
    },
    {
        text: "A younger recruit asks you for life advice. You say...",
        answers: [
            { label: "\"Never back down. Ever.\"",      scores: { brave: 2, hardy: 1 } },
            { label: "\"Think before you act.\"",       scores: { calm: 2, bold: 1 } },
            { label: "\"Don't take anything too seriously.\"", scores: { quirky: 2, sassy: 1 } },
            { label: "\"Trust yourself, even when no one else does.\"", scores: { lonely: 2, timid: 1 } },
        ]
    },
    {
        text: "You discover a secret passage in the guild. What now?",
        answers: [
            { label: "Explore it alone. Right now.",    scores: { brave: 2, lonely: 1 } },
            { label: "Report it to the Guildmaster.",   scores: { bold: 2, calm: 1 } },
            { label: "Explore it... but bring snacks.", scores: { jolly: 1, quirky: 2 } },
            { label: "Pretend you didn't see it.",      scores: { timid: 2, sassy: 1 } },
        ]
    },
    {
        text: "What's most important in a rescue team?",
        answers: [
            { label: "Raw strength.",                   scores: { hardy: 2, brave: 1 } },
            { label: "Strategy and planning.",          scores: { bold: 2, calm: 1 } },
            { label: "Team chemistry.",                 scores: { jolly: 2, calm: 1 } },
            { label: "Unpredictability.",               scores: { quirky: 2, sassy: 1 } },
        ]
    },
];

// -------------------------------------------------------
// Init
// -------------------------------------------------------

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
    personalityScores = {};
    NATURES.forEach(n => personalityScores[n] = 0);
    showDialogue(
        "Welcome, recruit! I'm Chatot, head of intelligence at the guild. " +
        "Before we assign you a Pokemon, I need to understand your personality...",
        [{ label: "Let's do it!", action: () => stepQuestion(0) }]
    );
}

function stepQuestion(index) {
    if (index >= QUESTIONS.length) {
        stepRevealLeader();
        return;
    }
    const q = QUESTIONS[index];
    showDialogue(
        `Question ${index + 1} of ${QUESTIONS.length}: ${q.text}`,
        q.answers.map(a => ({
            label: a.label,
            action: () => {
                // Tally scores
                for (const [nature, pts] of Object.entries(a.scores)) {
                    personalityScores[nature] += pts;
                }
                stepQuestion(index + 1);
            }
        }))
    );
}

async function stepRevealLeader() {
    // Find dominant nature
    let topNature = 'brave';
    let topScore = 0;
    for (const [nature, score] of Object.entries(personalityScores)) {
        if (score > topScore) {
            topScore = score;
            topNature = nature;
        }
    }

    const assignedDexId = NATURE_TO_DEX[topNature];
    const assignedPokemon = pokemonChoices.find(p => p.dex_id === assignedDexId) || pokemonChoices[0];

    showDialogue(`Hmm... I see. You have a ${topNature} spirit. That means...`, []);

    // Dramatic pause, then reveal sprite
    await delay(1500);

    clearSpriteGrid();
    spriteDisplay.innerHTML = '';
    const revealSlot = document.createElement('div');
    revealSlot.className = 'sprite-slot';
    const canvas = await createSpriteWidget(assignedPokemon.dex_id);
    if (canvas) {
        revealSlot.appendChild(canvas);
        spriteDisplay.appendChild(revealSlot);
    }

    showDialogue(
        `Your Pokemon is ${assignedPokemon.name}! The ${topNature} nature suits them perfectly.`,
        [
            { label: `I'll go with ${assignedPokemon.name}!`, action: () => {
                leaderChoice = assignedPokemon;
                clearSpriteGrid();
                spriteDisplay.innerHTML = '';
                resetWidgets();
                stepConfirmLeader();
            }},
            { label: "Actually, let me choose myself.", action: () => {
                spriteDisplay.innerHTML = '';
                resetWidgets();
                stepManualPickLeader();
            }},
        ]
    );
}

async function stepManualPickLeader() {
    showDialogue("No problem! Pick whoever speaks to you.", []);
    await showSpriteGrid(pokemonChoices, (p) => {
        leaderChoice = p;
        clearSpriteGrid();
        stepConfirmLeader();
    });
}

function stepConfirmLeader() {
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
        clearSpriteGrid();
        stepConfirmPartner();
    });
}

function stepConfirmPartner() {
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

// -------------------------------------------------------
// Utilities
// -------------------------------------------------------

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// -- Boot --
document.addEventListener('DOMContentLoaded', init);
