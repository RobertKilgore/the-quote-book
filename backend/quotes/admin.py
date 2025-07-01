from django.contrib import admin
from .models import Quote, QuoteLine, Signature

admin.site.register(Quote)
admin.site.register(QuoteLine)
admin.site.register(Signature)