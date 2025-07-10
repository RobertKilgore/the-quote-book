from django_apscheduler.jobstores import DjangoJobStore, register_events, register_job
from apscheduler.schedulers.background import BackgroundScheduler
from quotes.models import Quote, Signature
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User

def auto_refuse_stale_quotes(time=(60*60*24*14)):
    now = timezone.now()
    threshold = now - timedelta(seconds=time)

    stale_quotes = Quote.objects.filter(
        approved=True,
        approved_at__lt=threshold
    ).exclude(
        signatures__isnull=False
    ).distinct()

    count = 0
    for quote in stale_quotes:
        for participant in quote.participants.all():
            if not Signature.objects.filter(quote=quote, user=participant).exists():
                Signature.objects.create(quote=quote, user=participant, refused=True)
                count += 1

    print(f"[⏰ auto_refuse_stale_quotes] Refused {count} stale signature(s)")
