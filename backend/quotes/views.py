from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from .models import Quote, QuoteLine, Signature
from .serializers import QuoteSerializer, QuoteLineSerializer, SignatureSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import logout
from django.contrib.auth.models import User
from .serializers import UserSerializer
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import get_object_or_404
from django.core.files.base import ContentFile
from django.db.models import Q
import base64


class IsApprovedUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_active


@api_view(["GET"])
def test_auth(request):
    return Response({
        "user": str(request.user),
        "is_authenticated": request.user.is_authenticated,
        "is_superuser": request.user.is_superuser,
        "id": request.user.id,
    })

def get_csrf(request):
    return JsonResponse({'csrfToken': request.META.get('CSRF_COOKIE', '')})


@api_view(['GET'])
@permission_classes([IsApprovedUser])
def pending_signatures(request):
    user = request.user
    all_quotes = Quote.objects.filter(participants=user, approved=True)

    signed = Signature.objects.filter(user=user).values_list('quote_id', flat=True)
    pending = all_quotes.exclude(id__in=signed)

    serializer = QuoteSerializer(pending, many=True)
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsApprovedUser])
def pending_signatures_count(request):
    user = request.user
    # Get quotes user is a participant in
    quotes = Quote.objects.filter(participants=user, approved=True)

    # Remove quotes they've already signed
    signed_quote_ids = Signature.objects.filter(user=user).values_list('quote_id', flat=True)
    pending_quotes = quotes.exclude(id__in=signed_quote_ids)

    return Response({'count': pending_quotes.count()})


@api_view(['POST'])
@permission_classes([IsApprovedUser])
def refuse_signature(request):
    user = request.user
    quote_id = request.data.get('quote_id')

    if not quote_id:
        return Response({'error': 'Quote ID is required'}, status=400)

    quote = get_object_or_404(Quote, id=quote_id)

    # Check user is a participant
    if user not in quote.participants.all():
        return Response({'error': 'User is not a participant for this quote'}, status=403)

    # Check if already signed/refused
    if Signature.objects.filter(quote=quote, user=user).exists():
        return Response({'error': 'Signature already exists'}, status=400)

    # Save refusal
    Signature.objects.create(quote=quote, user=user, refused=True)
    return Response({'success': 'Refusal recorded'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def submit_signature(request):
    try:
        quote_id = request.data.get('quote_id')
        user_id = request.data.get('sign_as_user_id')
        image_data = request.data.get('signature_image')

        if not quote_id or not user_id or not image_data:
            return Response({"error": "Missing required fields"}, status=400)



        quote = Quote.objects.get(id=quote_id)
        signer = User.objects.get(id=user_id)

        # decode and save image
        format, imgstr = image_data.split(';base64,')
        ext = format.split('/')[-1]
        data = ContentFile(base64.b64decode(imgstr), name=f'sign_{signer.id}_{quote_id}.{ext}')

        sig, _ = Signature.objects.get_or_create(quote=quote, user=signer)
        sig.signature_image = data
        sig.refused = False
        sig.save()

        return Response({"success": True}, status=200)

    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        return Response({"error": str(e), "trace": traceback_str}, status=400)






class LogoutView(APIView):
    permission_classes = [IsApprovedUser]

    def post(self, request):
        logout(request)
        return Response({"detail": "Logged out successfully"}, status=status.HTTP_200_OK)

class QuoteViewSet(viewsets.ModelViewSet):
    queryset = Quote.objects.all()
    serializer_class = QuoteSerializer
    permission_classes = [IsApprovedUser]


    def get_queryset(self):
        user = self.request.user
        if user.is_superuser:
            return Quote.objects.filter(approved=True)
        return Quote.objects.filter(
            approved=True
        ).filter(
            Q(visible=True) | Q(participants=user)
        )

    def perform_create(self, serializer):
        serializer.save()
    
    def list(self, request, *args, **kwargs):
        print("📌 Logged in user:", request.user)
        return super().list(request, *args, **kwargs)


class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsApprovedUser]


class SignatureViewSet(viewsets.ModelViewSet):
    queryset = Signature.objects.all()
    serializer_class = SignatureSerializer
    permission_classes = [IsApprovedUser]

class QuoteLineViewSet(viewsets.ModelViewSet):
    queryset = QuoteLine.objects.all()
    serializer_class = QuoteLineSerializer
    permission_classes = [IsApprovedUser]
