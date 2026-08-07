# quotes/management/commands/mark_expired_signatures.py
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Placeholder command kept for compatibility'

    def handle(self, *args, **kwargs):
        self.stdout.write(self.style.WARNING("The old stale-quote refusal job was removed."))
