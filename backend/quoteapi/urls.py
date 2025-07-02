"""
URL configuration for quoteapi project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from dj_rest_auth.views import LogoutView
from quotes import views
from django.views.decorators.csrf import ensure_csrf_cookie
from django.conf import settings
from django.conf.urls.static import static

def set_csrf_cookie(request):
    return JsonResponse({"detail": "CSRF cookie set"})

urlpatterns = [
    path('api/signatures/submit/', views.submit_signature, name='submit-signature'),
    path('api/signatures/refuse/', views.refuse_signature),
    path('api/signatures/pending/', views.pending_signatures),
    path('api/signatures/pending/count/', views.pending_signatures_count),
    path('auth/logout/', LogoutView.as_view(), name='rest_logout'),
    path("api/test-auth/", views.test_auth),
    path('admin/', admin.site.urls),
    path('api/', include('quotes.urls')),            # ← Add this
    path('auth/', include('dj_rest_auth.urls')),     # ← Auth routes
    path('auth/registration/', include('dj_rest_auth.registration.urls')),
    path("csrf/", set_csrf_cookie),
     # Optional root route
    path('', lambda request: JsonResponse({"message": "Welcome to The Quote Book API"})),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
