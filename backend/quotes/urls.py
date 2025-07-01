from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import QuoteViewSet, QuoteLineViewSet, SignatureViewSet
from .views import LogoutView


router = DefaultRouter()
router.register(r'quotes', QuoteViewSet)
router.register(r'lines', QuoteLineViewSet)
router.register(r'signatures', SignatureViewSet)

urlpatterns = [
    path('logout/', LogoutView.as_view(), name='logout'),
    path('', include(router.urls)),
    #path('api/', include('quotes.urls')),  # optional for later
]
