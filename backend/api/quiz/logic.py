"""Quiz scoring logic — pure functions, no Django dependency."""
import random
from .data import QUESTIONS, NATURE_STARTERS, NUM_QUIZ_QUESTIONS


def pick_questions() -> list[dict]:
    """Select NUM_QUIZ_QUESTIONS random questions."""
    return random.sample(QUESTIONS, NUM_QUIZ_QUESTIONS)


def tally_nature(answers: list[dict[str, int]]) -> str:
    """
    Given a list of answer point dicts (e.g. [{"Brave": 2, "Relaxed": 1}, ...]),
    return the winning nature. Ties broken randomly.
    """
    scores: dict[str, int] = {}
    for points in answers:
        for nature, value in points.items():
            scores[nature] = scores.get(nature, 0) + value

    if not scores:
        return random.choice(list(NATURE_STARTERS.keys()))

    max_score = max(scores.values())
    tied = [n for n, s in scores.items() if s == max_score]
    return random.choice(tied)


def get_starter(nature: str, gender: str) -> str:
    """Get the starter Pokemon for a nature + gender combo."""
    return NATURE_STARTERS[nature][gender]
