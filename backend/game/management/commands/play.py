"""Custom management command to build frontend, start server, and open browser."""

import os
import subprocess
import sys
import threading
import webbrowser

from django.core.management import call_command
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Build frontend, start dev server, and open browser."

    def add_arguments(self, parser):
        parser.add_argument("--port", type=int, default=8000, help="Port to run the server on (default: 8000)")
        parser.add_argument("--skip-build", action="store_true", help="Skip frontend build step")

    def handle(self, *args, **options):
        port = options["port"]

        if not options["skip_build"]:
            self.stdout.write("Building frontend...")
            frontend_dir = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "frontend")
            frontend_dir = os.path.normpath(frontend_dir)
            try:
                subprocess.run(
                    ["npm", "run", "build"],
                    cwd=frontend_dir,
                    check=True,
                    shell=True,
                )
                self.stdout.write(self.style.SUCCESS("Frontend built."))
            except subprocess.CalledProcessError:
                self.stderr.write(self.style.ERROR("Frontend build failed."))
                sys.exit(1)
            except FileNotFoundError:
                self.stderr.write(self.style.ERROR("npm not found. Is Node.js installed?"))
                sys.exit(1)

        # Open browser after a short delay
        url = f"http://localhost:{port}"
        threading.Timer(1.5, lambda: webbrowser.open(url)).start()
        self.stdout.write(f"Opening {url} in your browser...")

        # Run migrations silently, then start dev server
        call_command("migrate", "--run-syncdb", verbosity=0)
        call_command("loaddata", "agents", verbosity=0)
        call_command("runserver", str(port))
