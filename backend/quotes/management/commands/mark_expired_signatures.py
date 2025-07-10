# quotes/management/commands/mark_expired_signatures.py
from django.core.management.base import BaseCommand
from quotes.jobs import auto_refuse_stale_quotes  # adjust path if in scheduler app

class Command(BaseCommand):
    help = 'Manually run the auto_refuse_stale_quotes function'

    def handle(self, *args, **kwargs):
        auto_refuse_stale_quotes()
        self.stdout.write(self.style.SUCCESS("Refusal task ran successfully"))
