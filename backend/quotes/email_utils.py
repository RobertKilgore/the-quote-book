from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone


def send_signature_email(signature, event_type, extra_context=None):
    quote = signature.quote
    recipient = None

    if signature.user_id:
        recipient = signature.user.email if signature.user and signature.user.email else None
    elif getattr(signature, "guest_name", ""):
        recipient = None

    if not recipient:
        recipient = quote.created_by.email if quote.created_by and quote.created_by.email else None

    if not recipient:
        return False

    if event_type == "quote_created":
        subject = f"New quote needs your signature #{quote.id}"
        body = (
            f"A new quote has been created and is waiting for your signature.\n"
            f"Quote ID: {quote.id}\n"
            f"Please sign or refuse it at your earliest convenience."
        )
    elif event_type == "quote_reopened":
        subject = f"Signature window reopened for quote #{quote.id}"
        body = (
            f"The signing window for quote #{quote.id} has been reopened.\n"
            f"You can review the quote and respond again."
        )
    elif event_type == "reminder":
        subject = f"Reminder: quote #{quote.id} needs your signature"
        body = (
            f"This is a reminder that quote #{quote.id} is still awaiting your signature.\n"
            f"Please sign or refuse it before the deadline expires."
        )
    elif event_type == "expired":
        subject = f"Quote #{quote.id} signature window expired"
        body = (
            f"The signature window for quote #{quote.id} has expired.\n"
            f"Your signature has been marked as refused automatically."
        )
    else:
        return False

    send_mail(
        subject,
        body,
        getattr(settings, "DEFAULT_FROM_EMAIL", "webmaster@localhost"),
        [recipient],
        fail_silently=True,
    )
    return True


def send_quote_event_emails(quote, event_type):
    recipients = []
    for participant in quote.participants.all():
        if participant.email:
            recipients.append(participant.email)
    if quote.created_by and quote.created_by.email:
        recipients.append(quote.created_by.email)

    if not recipients:
        return False

    if event_type == "quote_created":
        subject = f"New quote needs signatures #{quote.id}"
        body = (
            f"A new quote has been created and requires signatures.\n"
            f"Quote ID: {quote.id}\n"
            f"Please review it soon."
        )
    elif event_type == "quote_reopened":
        subject = f"Signature window reopened for quote #{quote.id}"
        body = (
            f"The signing window for quote #{quote.id} has been reopened.\n"
            f"Participants should review it again."
        )
    else:
        return False

    send_mail(
        subject,
        body,
        getattr(settings, "DEFAULT_FROM_EMAIL", "webmaster@localhost"),
        list(dict.fromkeys(recipients)),
        fail_silently=True,
    )
    return True
