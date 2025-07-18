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
    path("api/quotes/<int:pk>/edit/", views.get_quote_for_editing),
    path("quotes/unrated/count/", views.unrated_quotes_count),
    path("quotes/flagged/count/", views.flagged_quotes_count),
    path("quotes/unrated/", views.list_unrated_quotes, name="list-unrated-quotes"),
    path("quotes/flagged/", views.list_flagged_quotes, name="list-flagged-quotes"),
    path('quotes/<int:quote_id>/vote/', views.vote_quote_rank, name='vote-quote-rank'),
    path("admin/users/", views.list_users),
    path("admin/users/<int:user_id>/", views.delete_user),
    path("quotes/<int:quote_id>/flag/", views.flag_quote, name="flag-quote"),
    path('debug/refuse/', views.debug_run_refuse),
    path("users/unapproved/count/", views.unapproved_user_count),
    path("api/quotes/submitted/", views.submitted_unapproved_quotes),
    path('api/quotes/unapproved/count/', views.unapproved_quotes_count, name='unapproved-quotes-count'),
    path('api/quotes/unapproved/', views.unapproved_quotes, name='unapproved-quotes'),
    path('api/signatures/submit/', views.submit_signature, name='submit-signature'),
    path('api/signatures/refuse/', views.refuse_signature),
    path('api/signatures/pending/', views.pending_signatures),
    path('api/signatures/pending/count/', views.pending_signatures_count),
    path('auth/logout/', LogoutView.as_view(), name='rest_logout'),
    path("api/test-auth/", views.test_auth),
    path('admin/', admin.site.urls),
    path('api/', include('quotes.urls')),            # ← Add this
    path('auth/', include('dj_rest_auth.urls')),     # ← Auth routes
    ##path('auth/registration/', include('dj_rest_auth.registration.urls')),
    path("csrf/", set_csrf_cookie),
     # Optional root route
    path('', lambda request: JsonResponse({"message": "Welcome to The Quote Book API"})),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
