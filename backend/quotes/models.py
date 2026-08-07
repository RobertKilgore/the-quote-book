from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import pre_delete
from django.dispatch import receiver
from django.utils import timezone
from collections import Counter


RARITY_CHOICES = [
    ('common', 'Common'),
    ('uncommon', 'Uncommon'),
    ('rare', 'Rare'),
    ('epic', 'Epic'),
    ('legendary', 'Legendary'),
]

class QuoteRankVote(models.Model):
    quote = models.ForeignKey("Quote", on_delete=models.CASCADE, related_name="rank_votes")
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    rarity = models.CharField(max_length=10, choices=RARITY_CHOICES)
    voted_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('quote', 'user')  # One vote per user per quote

def update_quote_rank(quote):
    votes = quote.rank_votes.all()
    tally = Counter(v.rarity for v in votes)

    order = ['common', 'uncommon', 'rare', 'epic', 'legendary']
    for rank in order:
        if tally[rank] == max(tally.values(), default=0):
            quote.rank = rank
            quote.save(update_fields=['rank'])
            break

class AccountRequest(models.Model):
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.username})"

class SignatureTimelineConfig(models.Model):
    name = models.CharField(max_length=100, default="default")
    initial_window_seconds = models.PositiveIntegerField(default=1209600)
    reopen_window_seconds = models.PositiveIntegerField(default=604800)
    reminder_offsets_seconds = models.JSONField(default=list, blank=True)
    quote_created_email_subject = models.CharField(max_length=255, default="A quote needs your signature")
    quote_reopened_email_subject = models.CharField(max_length=255, default="A quote signature window has been reopened")
    reminder_email_subject = models.CharField(max_length=255, default="Reminder: a quote still needs your signature")
    expiry_email_subject = models.CharField(max_length=255, default="A quote signature window has expired")
    enabled = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class Quote(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quotes_created')
    participants = models.ManyToManyField(User, related_name='quotes_participating', blank=True)
    date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)
    visible = models.BooleanField(default=False)  # renamed from is_public
    redacted = models.BooleanField(default=False)
    approved = models.BooleanField(default=False)
    approved_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    flagged_by = models.ManyToManyField(User, blank=True, related_name="flagged_quotes")
    is_flagged = models.BooleanField(default=False)
    rank = models.CharField(max_length=10, choices=RARITY_CHOICES, default='common')
    quote_notes = models.TextField(blank=True, null=True)
    quote_source = models.URLField(blank=True, null=True)
    quote_source_image = models.ImageField(upload_to="quote_sources/", blank=True, null=True)

    def __str__(self):
        return f"Quote #{self.id} on {self.date} at {self.time}"

    def get_timeline_config(self):
        return SignatureTimelineConfig.objects.order_by('-created_at').first() or SignatureTimelineConfig.objects.create()

    def reset_participant_deadlines(self, reset_at=None, window_seconds=None, reopened=False):
        if reset_at is None:
            reset_at = timezone.now()
        config = self.get_timeline_config()
        if window_seconds is None:
            window_seconds = config.reopen_window_seconds if reopened else config.initial_window_seconds
        deadline = reset_at + timezone.timedelta(seconds=window_seconds)

        for participant in self.participants.all():
            sig, created = Signature.objects.get_or_create(quote=self, user=participant)
            if created:
                print(f"[signature] created signature {sig.id} for quote {self.id} participant {participant.id}")
            sig.reset_deadline(deadline=deadline)
            sig.schedule_timeline_events(config=config, event_type='quote_reopened' if reopened else 'quote_created', base_time=reset_at)

        return self

class QuoteLine(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='lines')
    speaker_name = models.CharField(max_length=255)
    text = models.TextField()
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"{self.speaker_name}: {self.text[:30]}..."


class SignatureTimelineEvent(models.Model):
    EVENT_TYPES = [
        ('quote_created', 'quote_created'),
        ('quote_reopened', 'quote_reopened'),
        ('reminder', 'reminder'),
        ('expired', 'expired'),
    ]

    quote = models.ForeignKey('Quote', on_delete=models.CASCADE, related_name='timeline_events')
    signature = models.ForeignKey('Signature', on_delete=models.SET_NULL, null=True, blank=True, related_name='timeline_events')
    recipient = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='signature_timeline_events')
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES)
    offset_seconds = models.PositiveIntegerField(default=0)
    scheduled_for = models.DateTimeField()
    sent_at = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=20, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'scheduled_for']),
        ]


class Signature(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='signatures')
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)
    guest_name = models.CharField(max_length=255, blank=True)  # New field for guest
    signature_image = models.ImageField(upload_to='signatures/', null=True, blank=True)
    refused = models.BooleanField(default=False)  # ✅ NEW
    signed_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    deadline_at = models.DateTimeField(null=True, blank=True)
    reminder_sent_at = models.DateTimeField(null=True, blank=True)
    last_notified_at = models.DateTimeField(null=True, blank=True)
    expired_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)

    def save(self, *args, **kwargs):
        is_new = self._state.adding
        super().save(*args, **kwargs)
        action = "created" if is_new else "updated"
        print(
            f"[signature] {action} signature {self.id} for quote {self.quote_id} "
            f"user={self.user_id} guest={self.guest_name!r} refused={self.refused} deadline={self.deadline_at}"
        )

    def is_guest(self):
        return self.user is None and bool(self.guest_name)

    def is_expired(self):
        return self.deadline_at and timezone.now() >= self.deadline_at and not self.refused and not self.signature_image

    def reset_deadline(self, deadline=None):
        if deadline is None:
            deadline = timezone.now() + timezone.timedelta(days=14)
        self.deadline_at = deadline
        self.expired_at = None
        self.save(update_fields=["deadline_at", "expired_at"])

    def schedule_timeline_events(self, config=None, event_type='quote_created', base_time=None):
        if config is None:
            config = self.quote.get_timeline_config()
        if base_time is None:
            base_time = timezone.now()
        if not config.enabled:
            return []

        SignatureTimelineEvent.objects.filter(signature=self, status='pending').update(status='canceled')
        SignatureTimelineEvent.objects.create(
            quote=self.quote,
            signature=self,
            recipient=self.user,
            event_type=event_type,
            offset_seconds=0,
            scheduled_for=base_time,
            status='pending',
        )

        for offset in config.reminder_offsets_seconds or []:
            SignatureTimelineEvent.objects.create(
                quote=self.quote,
                signature=self,
                recipient=self.user,
                event_type='reminder',
                offset_seconds=offset,
                scheduled_for=base_time + timezone.timedelta(seconds=offset),
                status='pending',
            )

        if self.deadline_at:
            SignatureTimelineEvent.objects.create(
                quote=self.quote,
                signature=self,
                recipient=self.user,
                event_type='expired',
                offset_seconds=0,
                scheduled_for=self.deadline_at,
                status='pending',
            )

        return list(self.timeline_events.filter(status='pending').order_by('scheduled_for'))

    def mark_expired(self):
        if self.refused or self.signature_image:
            return False
        self.refused = True
        self.expired_at = timezone.now()
        self.save(update_fields=["refused", "expired_at"])
        return True

    def admin_clear(self):
        if self.signature_image:
            self.signature_image.delete(save=False)

        config = self.quote.get_timeline_config()
        self.signature_image = None
        self.refused = False
        self.expired_at = None
        self.reminder_sent_at = None
        self.last_notified_at = None
        self.deadline_at = timezone.now() + timezone.timedelta(seconds=config.reopen_window_seconds)
        self.save(update_fields=["signature_image", "refused", "expired_at", "reminder_sent_at", "last_notified_at", "deadline_at"])
        self.schedule_timeline_events(event_type='quote_reopened', base_time=timezone.now())
        return self

    def __str__(self):
        return f"{self.user.username} {'refused' if self.refused else 'signed'} on {self.signed_at}"

@receiver(pre_delete, sender=Signature)
def delete_signature_file(sender, instance, **kwargs):
    if instance.signature_image:
        instance.signature_image.delete(save=False)
