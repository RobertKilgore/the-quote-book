from django.db import models
from django.contrib.auth.models import User

class Quote(models.Model):
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quotes_created')
    participants = models.ManyToManyField(User, related_name='quotes_participating')
    created_at = models.DateTimeField(auto_now_add=True)
    date = models.DateField()
    is_public = models.BooleanField(default=False)           # new
    is_redacted = models.BooleanField(default=False)         # new

    def __str__(self):
        return f"Quote #{self.id} on {self.date}"


class QuoteLine(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='lines')
    speaker_name = models.CharField(max_length=255)
    text = models.TextField()

    def __str__(self):
        return f"{self.speaker_name}: {self.text[:30]}..."


class Signature(models.Model):
    quote = models.ForeignKey(Quote, on_delete=models.CASCADE, related_name='signatures')
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    signature_image = models.ImageField(upload_to='signatures/')
    signed_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} signed on {self.signed_at}"
