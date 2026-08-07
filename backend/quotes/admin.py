from django.contrib import admin
from .models import Quote, QuoteLine, Signature, SignatureTimelineConfig, SignatureTimelineEvent

admin.site.register(Quote)
admin.site.register(QuoteLine)
admin.site.register(Signature)
admin.site.register(SignatureTimelineConfig)
admin.site.register(SignatureTimelineEvent)