"""
Personality quiz data faithful to Pokémon Mystery Dungeon: Explorers of Sky.
Nature→Starter mapping from Sonictrainer's FAQ (GameFAQs).
Questions adapted from the original game with nature-point scoring.
"""

# Nature → Starter Pokemon per gender
# Some starters are gender-exclusive:
#   Male only: Phanpy (Relaxed), Shinx (Hasty), Riolu (Sassy)
#   Female only: Vulpix (Relaxed), Eevee (Jolly), Skitty (Naive)
NATURE_STARTERS: dict[str, dict[str, str]] = {
    "Bold":    {"male": "Turtwig",   "female": "Squirtle"},
    "Brave":   {"male": "Pikachu",   "female": "Charmander"},
    "Calm":    {"male": "Chikorita", "female": "Cyndaquil"},
    "Docile":  {"male": "Charmander","female": "Bulbasaur"},
    "Hardy":   {"male": "Torchic",   "female": "Treecko"},
    "Hasty":   {"male": "Shinx",     "female": "Pikachu"},
    "Impish":  {"male": "Piplup",    "female": "Chimchar"},
    "Jolly":   {"male": "Totodile",  "female": "Eevee"},
    "Lonely":  {"male": "Bulbasaur", "female": "Mudkip"},
    "Naive":   {"male": "Chimchar",  "female": "Skitty"},
    "Quiet":   {"male": "Treecko",   "female": "Chikorita"},
    "Quirky":  {"male": "Squirtle",  "female": "Piplup"},
    "Rash":    {"male": "Mudkip",    "female": "Torchic"},
    "Relaxed": {"male": "Phanpy",    "female": "Vulpix"},
    "Sassy":   {"male": "Riolu",     "female": "Totodile"},
    "Timid":   {"male": "Cyndaquil", "female": "Turtwig"},
}

# Primary types for all possible starter/partner Pokemon
POKEMON_TYPES: dict[str, list[str]] = {
    "Bulbasaur":  ["Grass", "Poison"],
    "Charmander": ["Fire"],
    "Squirtle":   ["Water"],
    "Pikachu":    ["Electric"],
    "Chikorita":  ["Grass"],
    "Cyndaquil":  ["Fire"],
    "Totodile":   ["Water"],
    "Treecko":    ["Grass"],
    "Torchic":    ["Fire"],
    "Mudkip":     ["Water"],
    "Turtwig":    ["Grass"],
    "Piplup":     ["Water"],
    "Chimchar":   ["Fire"],
    "Eevee":      ["Normal"],
    "Vulpix":     ["Fire"],
    "Phanpy":     ["Ground"],
    "Shinx":      ["Electric"],
    "Riolu":      ["Fighting"],
    "Skitty":     ["Normal"],
}

# All valid partner choices (same pool as starters)
ALL_PARTNERS = list(POKEMON_TYPES.keys())


def types_overlap(pokemon_a: str, pokemon_b: str) -> bool:
    """Check if two Pokemon share any type."""
    types_a = set(POKEMON_TYPES[pokemon_a])
    types_b = set(POKEMON_TYPES[pokemon_b])
    return bool(types_a & types_b)


# Quiz questions with nature-point scoring.
# Each answer maps to {nature: points}.
# 8 random questions are drawn per quiz.
QUESTIONS: list[dict] = [
    {
        "id": 1,
        "text": "Have you ever said 'nice to meet you' to someone you've met previously?",
        "answers": [
            {"text": "Yes.", "points": {"Brave": 2, "Relaxed": 1}},
            {"text": "No.", "points": {"Calm": 1}},
        ],
    },
    {
        "id": 2,
        "text": "Do you want to be taller someday?",
        "answers": [
            {"text": "Totally!", "points": {"Sassy": 2}},
            {"text": "Of course not.", "points": {"Calm": 1}},
        ],
    },
    {
        "id": 3,
        "text": "A friend tells you a secret. What do you do?",
        "answers": [
            {"text": "Keep it to yourself.", "points": {"Calm": 2, "Lonely": 1}},
            {"text": "Tell someone else.", "points": {"Rash": 2, "Naive": 1}},
            {"text": "It depends on the secret.", "points": {"Quirky": 2}},
        ],
    },
    {
        "id": 4,
        "text": "You discover a new path in the forest. What do you do?",
        "answers": [
            {"text": "Take it immediately!", "points": {"Brave": 2, "Hasty": 1}},
            {"text": "Stay on the safe path.", "points": {"Timid": 2, "Calm": 1}},
            {"text": "Look for someone to go with.", "points": {"Jolly": 2}},
        ],
    },
    {
        "id": 5,
        "text": "Do you like to fight?",
        "answers": [
            {"text": "Yes!", "points": {"Brave": 2, "Impish": 1}},
            {"text": "No.", "points": {"Timid": 2, "Calm": 1}},
        ],
    },
    {
        "id": 6,
        "text": "You see a big and scary-looking Pokemon. What do you do?",
        "answers": [
            {"text": "Challenge it!", "points": {"Brave": 2, "Sassy": 1}},
            {"text": "Run away!", "points": {"Timid": 2}},
            {"text": "Stare it down.", "points": {"Bold": 2, "Hardy": 1}},
        ],
    },
    {
        "id": 7,
        "text": "You broke something that belongs to a friend. What do you do?",
        "answers": [
            {"text": "Tell the truth immediately.", "points": {"Bold": 2, "Hardy": 1}},
            {"text": "Try to fix it before they notice.", "points": {"Hasty": 2, "Naive": 1}},
            {"text": "Pretend it wasn't you.", "points": {"Rash": 1, "Sassy": 1}},
        ],
    },
    {
        "id": 8,
        "text": "You find a wallet on the ground. What do you do?",
        "answers": [
            {"text": "Turn it in right away.", "points": {"Hardy": 2, "Bold": 1}},
            {"text": "Keep it.", "points": {"Sassy": 2, "Rash": 1}},
            {"text": "Look for the owner yourself.", "points": {"Brave": 1, "Lonely": 1}},
        ],
    },
    {
        "id": 9,
        "text": "Do you often forget things?",
        "answers": [
            {"text": "All the time!", "points": {"Relaxed": 2, "Jolly": 1}},
            {"text": "Never!", "points": {"Hardy": 2}},
            {"text": "Sometimes...", "points": {"Docile": 2}},
        ],
    },
    {
        "id": 10,
        "text": "Your friend trips and falls in public. What do you do?",
        "answers": [
            {"text": "Help them up right away.", "points": {"Bold": 2, "Brave": 1}},
            {"text": "Laugh a little, then help.", "points": {"Jolly": 2, "Impish": 1}},
            {"text": "Pretend you didn't see.", "points": {"Timid": 1, "Lonely": 1}},
        ],
    },
    {
        "id": 11,
        "text": "Can you sincerely say you like yourself?",
        "answers": [
            {"text": "Of course!", "points": {"Sassy": 2, "Bold": 1}},
            {"text": "Hmm... not really.", "points": {"Lonely": 2, "Timid": 1}},
            {"text": "I think so.", "points": {"Docile": 2, "Calm": 1}},
        ],
    },
    {
        "id": 12,
        "text": "You're at a party with people you don't know. What do you do?",
        "answers": [
            {"text": "Talk to everyone!", "points": {"Jolly": 2, "Naive": 1}},
            {"text": "Stick close to someone I know.", "points": {"Timid": 2, "Relaxed": 1}},
            {"text": "Find a quiet corner.", "points": {"Lonely": 2, "Quiet": 1}},
        ],
    },
    {
        "id": 13,
        "text": "Do you tend to do things at your own pace?",
        "answers": [
            {"text": "Yes, always.", "points": {"Relaxed": 2, "Quiet": 1}},
            {"text": "No, I like to rush.", "points": {"Hasty": 2, "Rash": 1}},
            {"text": "It depends.", "points": {"Docile": 1, "Quirky": 1}},
        ],
    },
    {
        "id": 14,
        "text": "You've been waiting for someone for a long time. What do you do?",
        "answers": [
            {"text": "Keep waiting patiently.", "points": {"Calm": 2, "Docile": 1}},
            {"text": "Get angry!", "points": {"Rash": 2, "Hasty": 1}},
            {"text": "Leave.", "points": {"Sassy": 1, "Lonely": 1}},
        ],
    },
    {
        "id": 15,
        "text": "Someone makes fun of you. What do you do?",
        "answers": [
            {"text": "Get really angry!", "points": {"Rash": 2, "Brave": 1}},
            {"text": "Ignore them.", "points": {"Calm": 2, "Bold": 1}},
            {"text": "Make fun of them back.", "points": {"Sassy": 2, "Impish": 1}},
        ],
    },
    {
        "id": 16,
        "text": "Do you think it's important to be cool?",
        "answers": [
            {"text": "Absolutely!", "points": {"Sassy": 2, "Hasty": 1}},
            {"text": "Not really.", "points": {"Relaxed": 2, "Docile": 1}},
            {"text": "I'm already cool.", "points": {"Bold": 2, "Impish": 1}},
        ],
    },
    {
        "id": 17,
        "text": "There's a long line at the store. What do you do?",
        "answers": [
            {"text": "Wait patiently.", "points": {"Calm": 2, "Relaxed": 1}},
            {"text": "Come back later.", "points": {"Hasty": 2, "Quirky": 1}},
            {"text": "Complain out loud.", "points": {"Rash": 1, "Sassy": 1}},
        ],
    },
    {
        "id": 18,
        "text": "You're exploring and find a treasure chest. What do you do?",
        "answers": [
            {"text": "Open it immediately!", "points": {"Brave": 2, "Hasty": 1}},
            {"text": "Check for traps first.", "points": {"Quiet": 2, "Calm": 1}},
            {"text": "Wonder if someone lost it.", "points": {"Naive": 2, "Docile": 1}},
        ],
    },
    {
        "id": 19,
        "text": "Do you ever Pokemon at your own reflection?",
        "answers": [
            {"text": "Always!", "points": {"Jolly": 2, "Naive": 1}},
            {"text": "Never.", "points": {"Quiet": 2, "Lonely": 1}},
            {"text": "Only when I look good.", "points": {"Sassy": 1, "Quirky": 1}},
        ],
    },
    {
        "id": 20,
        "text": "Would you give your last piece of food to someone who's hungry?",
        "answers": [
            {"text": "Of course!", "points": {"Bold": 2, "Brave": 1}},
            {"text": "Hmm, probably not.", "points": {"Sassy": 1, "Lonely": 1}},
            {"text": "I'd split it.", "points": {"Quirky": 2, "Docile": 1}},
        ],
    },
    {
        "id": 21,
        "text": "Do you like to organize things?",
        "answers": [
            {"text": "Yes, I love it!", "points": {"Hardy": 2, "Bold": 1}},
            {"text": "Not at all.", "points": {"Relaxed": 2, "Rash": 1}},
            {"text": "Only when I have to.", "points": {"Docile": 1, "Quiet": 1}},
        ],
    },
    {
        "id": 22,
        "text": "Do you often daydream?",
        "answers": [
            {"text": "All the time!", "points": {"Naive": 2, "Quiet": 1}},
            {"text": "Never.", "points": {"Hardy": 2, "Hasty": 1}},
            {"text": "Only a little.", "points": {"Relaxed": 1, "Calm": 1}},
        ],
    },
    {
        "id": 23,
        "text": "You have a whole day off. What do you do?",
        "answers": [
            {"text": "Go on an adventure!", "points": {"Brave": 2, "Jolly": 1}},
            {"text": "Relax at home.", "points": {"Relaxed": 2, "Quiet": 1}},
            {"text": "Hang out with friends.", "points": {"Jolly": 2, "Naive": 1}},
        ],
    },
    {
        "id": 24,
        "text": "Are you quick to make decisions?",
        "answers": [
            {"text": "Yes, I decide fast!", "points": {"Hasty": 2, "Brave": 1}},
            {"text": "No, I think things over.", "points": {"Calm": 2, "Quiet": 1}},
            {"text": "It depends.", "points": {"Quirky": 2}},
        ],
    },
    {
        "id": 25,
        "text": "Do you cry easily when watching a sad movie?",
        "answers": [
            {"text": "Yes, every time.", "points": {"Lonely": 2, "Naive": 1}},
            {"text": "No, never.", "points": {"Bold": 2, "Hardy": 1}},
            {"text": "Sometimes.", "points": {"Docile": 2, "Relaxed": 1}},
        ],
    },
]

NUM_QUIZ_QUESTIONS = 8
