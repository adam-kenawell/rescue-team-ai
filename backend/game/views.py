from django.shortcuts import render


def index(request):
    """Serve the main game page."""
    return render(request, "game/index.html")
