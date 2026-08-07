from django_apscheduler.jobstores import DjangoJobStore, register_events, register_job
from apscheduler.schedulers.background import BackgroundScheduler
from quotes.models import Quote, Signature, SignatureTimelineEvent
from django.utils import timezone
from datetime import timedelta
from django.contrib.auth.models import User
from django.db import close_old_connections
from django.http import HttpRequest
from quotes.email_utils import send_signature_email
from quotes.serializers import QuoteSerializer
from django.conf import settings
import requests


def _scheduler_request_context():
    request = HttpRequest()
    request.user = None
    request.META['SERVER_NAME'] = 'localhost'
    request.META['SERVER_PORT'] = '8000'
    request.META['HTTP_HOST'] = 'localhost:8000'
    request.META['wsgi.url_scheme'] = 'http'
    return {'request': request}

def normalize_quote_expiry_state(quote, now=None):
    close_old_connections()
    if now is None:
        now = timezone.now()

    serializer = QuoteSerializer(quote, context=_scheduler_request_context())
    participant_status = serializer.data.get('participant_status', [])
    changed = False
    print("c")
    for entry in participant_status:
        signature_id = entry.get('signature_id')
        deadline_at = entry.get('deadline_at')
        print(deadline_at)
        if not signature_id or not deadline_at:
            continue

        if deadline_at <= now:
            signature = Signature.objects.filter(id=signature_id).first()
            if not signature or signature.signature_image or signature.refused:
                continue

            print(f"[scheduler] updating signature {signature.id} on quote {quote.id}: refused=True, expired_at={now}, deadline_at=None")
            signature.refused = True
            signature.expired_at = now
            signature.deadline_at = None
            signature.save(update_fields=['refused', 'expired_at', 'deadline_at'])
            changed = True

    return changed


def process_quote_deadlines(now=None):
    close_old_connections()
    print("[scheduler] process_quote_deadlines running")
    if now is None:
        now = timezone.now()

    quotes = Quote.objects.filter(approved=True).prefetch_related('participants')
    print(quotes)
    changed = False
    for quote in quotes:
        if normalize_quote_expiry_state(quote, now=now):
            changed = True

    return changed


def process_signature_timeline(now=None):
    close_old_connections()
    print("[scheduler] process_signature_timeline running")
    if now is None:
        now = timezone.now()

    quotes = Quote.objects.filter(approved=True).prefetch_related('participants', 'signatures')
    for quote in quotes:
        serializer = QuoteSerializer(quote, context=_scheduler_request_context())
        participant_status = serializer.data.get('participant_status', [])

        for entry in participant_status:
            signature_id = entry.get('signature_id')
            deadline_at = entry.get('deadline_at')
            if deadline_at != None:
                print(deadline_at)
            if not signature_id or not deadline_at:
                continue

            if deadline_at <= now:
                signature = Signature.objects.filter(id=signature_id).first()
                if not signature or signature.signature_image or signature.refused:
                    continue

                print(f"[scheduler] updating signature {signature.id} on quote {quote.id}: refused=True, expired_at={now}, deadline_at=None")
                signature.refused = True
                signature.expired_at = now
                signature.deadline_at = None
                signature.save(update_fields=['refused', 'expired_at', 'deadline_at'])
                print(f"[scheduler] marked signature {signature.id} as refused for quote {quote.id}")

    pending_events = list(
        SignatureTimelineEvent.objects.filter(status='pending', scheduled_for__lte=now).select_related('quote', 'signature', 'recipient')[:20]
    )
    for event in pending_events:
        signature = event.signature
        if not signature or not getattr(signature, 'quote_id', None):
            event.status = 'sent'
            event.sent_at = now
            event.save(update_fields=['status', 'sent_at'])
            continue

        if signature:
            signature.last_notified_at = now
            if event.event_type == 'reminder':
                signature.reminder_sent_at = now
            signature.save(update_fields=['last_notified_at', 'reminder_sent_at'])

        try:
            if event.event_type == 'expired':
                if not signature.refused and not signature.signature_image:
                    signature.mark_expired()
                    send_signature_email(signature, 'expired')
            elif event.event_type in {'quote_created', 'quote_reopened', 'reminder'}:
                if signature.refused:
                    continue
                if signature.signature_image:
                    continue
                send_signature_email(signature, event.event_type)
        except Exception as exc:
            print(f"[scheduler] skipped timeline event {event.id}: {exc}")

        event.status = 'sent'
        event.sent_at = now
        event.save(update_fields=['status', 'sent_at'])


def create_timeline_events_for_quote(quote, event_type='quote_created', base_time=None):
    if base_time is None:
        base_time = timezone.now()

    participants = list(quote.participants.all())
    if not participants:
        return []

    for participant in participants:
        sig, created = Signature.objects.get_or_create(quote=quote, user=participant)
        if created:
            print(f"[signature] created signature {sig.id} for quote {quote.id} participant {participant.id} in scheduler timeline")
        if event_type == 'quote_created':
            sig.deadline_at = base_time + timedelta(seconds=1209600)
            sig.save(update_fields=['deadline_at'])
        elif event_type == 'quote_reopened':
            sig.deadline_at = base_time + timedelta(seconds=604800)
            sig.save(update_fields=['deadline_at'])

        SignatureTimelineEvent.objects.create(
            quote=quote,
            signature=sig,
            recipient=participant,
            event_type=event_type,
            offset_seconds=0,
            scheduled_for=base_time,
        )

    return list(quote.timeline_events.all())
