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
let leaderNickname = '';
let partnerNickname = '';
let teamName = '';
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
        text: "What's your favorite programming language?",
        answers: [
            { label: "Python -- clean and powerful.",    scores: { calm: 2, bold: 1 } },
            { label: "Rust -- safety is non-negotiable.", scores: { hardy: 2, brave: 1 } },
            { label: "JavaScript -- it runs everywhere.", scores: { jolly: 2, quirky: 1 } },
            { label: "C -- I like to suffer.",           scores: { brave: 2, lonely: 1 } },
        ]
    },
    {
        text: "What's your favorite LLM?",
        answers: [
            { label: "Claude -- thoughtful and thorough.", scores: { calm: 2, bold: 1 } },
            { label: "GPT -- the OG. Respect the lineage.", scores: { hardy: 2, brave: 1 } },
            { label: "Gemini -- Google scale, baby.",     scores: { bold: 2, sassy: 1 } },
            { label: "Local models -- I don't trust the cloud.", scores: { lonely: 2, timid: 1 } },
        ]
    },
    {
        text: "Your CI pipeline just failed at 2 AM. What do you do?",
        answers: [
            { label: "Fix it right now. Sleep is for the weak.", scores: { brave: 2, hardy: 1 } },
            { label: "Check the logs, make a plan for morning.", scores: { calm: 2, bold: 1 } },
            { label: "Rerun it. Probably flaky.",        scores: { quirky: 2, sassy: 1 } },
            { label: "Pretend I didn't see the alert.",  scores: { timid: 2, jolly: 1 } },
        ]
    },
    {
        text: "How do you feel about code reviews?",
        answers: [
            { label: "Love them. Rip my code apart.",    scores: { brave: 2, bold: 1 } },
            { label: "They're essential for quality.",   scores: { calm: 2, hardy: 1 } },
            { label: "I just approve everything tbh.",   scores: { jolly: 2, quirky: 1 } },
            { label: "Stressful. What if they judge me?", scores: { timid: 2, lonely: 1 } },
        ]
    },
    {
        text: "Your AI agent just hallucinated a fake API. How do you react?",
        answers: [
            { label: "Laugh it off and fix it.",         scores: { jolly: 2, quirky: 1 } },
            { label: "Add validation. This won't happen again.", scores: { bold: 2, calm: 1 } },
            { label: "Rant about it on social media.",   scores: { sassy: 2, brave: 1 } },
            { label: "Quietly question the future of AI.", scores: { lonely: 2, timid: 1 } },
        ]
    },
    {
        text: "What's your stance on tabs vs spaces?",
        answers: [
            { label: "Spaces. Always. Fight me.",        scores: { hardy: 2, brave: 1 } },
            { label: "Tabs. More accessible, objectively better.", scores: { bold: 2, sassy: 1 } },
            { label: "Whatever the formatter says.",     scores: { calm: 2, jolly: 1 } },
            { label: "I have opinions but I keep them to myself.", scores: { timid: 2, lonely: 1 } },
        ]
    },
    {
        text: "A junior dev pushes directly to main. You...",
        answers: [
            { label: "Revert it immediately. No mercy.", scores: { hardy: 2, bold: 1 } },
            { label: "Teach them about branch protection.", scores: { calm: 2, brave: 1 } },
            { label: "We've all been there. Help them fix it.", scores: { jolly: 2, calm: 1 } },
            { label: "Quietly set up branch rules so it never happens again.", scores: { lonely: 2, timid: 1 } },
        ]
    },
    {
        text: "Pick a side project vibe:",
        answers: [
            { label: "Building my own game engine from scratch.", scores: { brave: 2, hardy: 1 } },
            { label: "A perfectly architected REST API that nobody will use.", scores: { bold: 2, calm: 1 } },
            { label: "A Discord bot that posts memes.", scores: { quirky: 2, sassy: 1 } },
            { label: "Contributing to open source, quietly.", scores: { lonely: 2, timid: 1 } },
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
                localStorage.setItem('rtai_leader_dex_id', String(assignedPokemon.dex_id));
                clearSpriteGrid();
                spriteDisplay.innerHTML = '';
                resetWidgets();
                stepNameLeader();
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
        localStorage.setItem('rtai_leader_dex_id', String(p.dex_id));
        clearSpriteGrid();
        stepNameLeader();
    });
}

function stepNameLeader() {
    showDialogueWithInput(
        `Great choice! What will you name your ${leaderChoice.name}?`,
        leaderChoice.name,
        (name) => {
            leaderNickname = name || leaderChoice.name;
            stepConfirmLeader();
        }
    );
}

function stepConfirmLeader() {
    showDialogue(
        `${leaderNickname} the ${leaderChoice.name}! Now, every leader needs a partner...`,
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
        stepNamePartner();
    });
}

function stepNamePartner() {
    showDialogueWithInput(
        `Excellent! What will you name your ${partnerChoice.name}?`,
        partnerChoice.name,
        (name) => {
            partnerNickname = name || partnerChoice.name;
            stepConfirmPartner();
        }
    );
}

function stepConfirmPartner() {
    showDialogue(
        `${leaderNickname} the ${leaderChoice.name} and ${partnerNickname} the ${partnerChoice.name} -- now THAT'S a duo!`,
        [{ label: "Almost there!", action: stepNameTeam }]
    );
}

function stepNameTeam() {
    showDialogueWithInput(
        "One last thing -- every rescue team needs a name. What will yours be?",
        "Team Awesome",
        (name) => {
            teamName = name || "Team Awesome";
            stepSpawnSprites();
        }
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
        `${teamName} is ready for action! ${leaderNickname} and ${partnerNickname} reporting for duty! ` +
        "Click on a sprite to see them attack!",
        [{ label: "Start over", action: resetQuiz }]
    );
}

function resetQuiz() {
    leaderChoice = null;
    partnerChoice = null;
    leaderNickname = '';
    partnerNickname = '';
    teamName = '';
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

function showDialogueWithInput(text, placeholder, onSubmit) {
    chatText.textContent = text;
    chatOptions.innerHTML = '';

    const wrapper = document.createElement('div');
    wrapper.className = 'chat-input-wrapper';

    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'chat-input';
    input.placeholder = placeholder;
    input.maxLength = 24;

    const btn = document.createElement('button');
    btn.className = 'chat-option';
    btn.textContent = 'Confirm';

    const submit = () => onSubmit(input.value.trim());
    btn.addEventListener('click', submit);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') submit();
    });

    wrapper.appendChild(input);
    wrapper.appendChild(btn);
    chatOptions.appendChild(wrapper);

    requestAnimationFrame(() => input.focus());
}

// -------------------------------------------------------
// Utilities
// -------------------------------------------------------

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// -- Boot --
document.addEventListener('DOMContentLoaded', init);
