from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import pre_delete
from django.dispatch import receiver

class AccountRequest(models.Model):
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    username = models.CharField(max_length=150, unique=True)
    email = models.EmailField(unique=True)
    submitted_at = models.DateTimeField(auto_now_add=True)
    approved = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.username})"

class Quote(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quotes_created')
    participants = models.ManyToManyField(User, related_name='quotes_participating', blank=True)
    date = models.DateField(null=True, blank=True)
    time = models.TimeField(null=True, blank=True)
    visible = models.BooleanField(default=False)  # renamed from is_public
    redacted = models.BooleanField(default=False)
    approved = models.BooleanField(default=False)  # ✅ new
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Quote #{self.id} on {self.date} at {self.time}"

class QuoteLine(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='lines')
    speaker_name = models.CharField(max_length=255)
    text = models.TextField()
    user = models.ForeignKey(User, null=True, blank=True, on_delete=models.SET_NULL)

    def __str__(self):
        return f"{self.speaker_name}: {self.text[:30]}..."


class Signature(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='signatures')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    signature_image = models.ImageField(upload_to='signatures/', null=True, blank=True)
    refused = models.BooleanField(default=False)  # ✅ NEW
    signed_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)

    def __str__(self):
        return f"{self.user.username} {'refused' if self.refused else 'signed'} on {self.signed_at}"

@receiver(pre_delete, sender=Signature)
def delete_signature_file(sender, instance, **kwargs):
    if instance.signature_image:
        instance.signature_image.delete(save=False)
