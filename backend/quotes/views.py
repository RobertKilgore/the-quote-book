from django.shortcuts import render
from rest_framework import viewsets, permissions
from .models import Quote, QuoteLine, Signature
from .serializers import QuoteSerializer, QuoteLineSerializer, SignatureSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie

@api_view(["GET"])
def test_auth(request):
    return Response({
        "user": str(request.user),
        "is_authenticated": request.user.is_authenticated,
    })

def get_csrf(request):
    return JsonResponse({'csrfToken': request.META.get('CSRF_COOKIE', '')})

class IsApprovedUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_active

class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Quote.objects.all()
        return Quote.objects.filter(is_public=True)

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    def list(self, request, *args, **kwargs):
        print("📌 Logged in user:", request.user)
        return super().list(request, *args, **kwargs)

class SignatureViewSet(viewsets.ModelViewSet):
    queryset = Signature.objects.all()
    serializer_class = SignatureSerializer
    permission_classes = [IsApprovedUser]

class QuoteLineViewSet(viewsets.ModelViewSet):
    queryset = QuoteLine.objects.all()
    serializer_class = QuoteLineSerializer
    permission_classes = [IsApprovedUser]
