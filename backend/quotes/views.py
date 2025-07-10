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
from rest_framework.decorators import api_view, permission_classes, action
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.core.files.base import ContentFile
from django.db.models import Q
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAdminUser
import base64
from .models import AccountRequest
from .serializers import AccountRequestSerializer



class IsApprovedUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_active

class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)


@api_view(['GET'])  # ✅ Required for DRF to set renderer & context
@permission_classes([IsApprovedUser])
def test_auth(request):
    user_data = UserSerializer(request.user).data  # serialize user properly
    return Response(user_data)

def get_csrf(request):
    return JsonResponse({'csrfToken': request.META.get('CSRF_COOKIE', '')})

@api_view(['GET'])
@permission_classes([IsApprovedUser])
def unapproved_quotes(request):
    if not request.user.is_superuser:
        return Response({'error': 'Forbidden'}, status=403)

    quotes = Quote.objects.filter(approved=False)
    serializer = QuoteSerializer(quotes, many=True)
    return Response(serializer.data)

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
def unapproved_quotes_count(request):
    if not request.user.is_superuser:
        return Response({'error': 'Forbidden'}, status=403)

    count = Quote.objects.filter(approved=False).count()
    return Response({'count': count})

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

@api_view(["GET"])
@permission_classes([IsSuperUser])
def unapproved_user_count(request):
    count = AccountRequest.objects.filter(approved=False).count()
    return Response({"count": count})


@api_view(['POST'])
@permission_classes([IsApprovedUser])
def refuse_signature(request):
    quote_id = request.data.get('quote_id')
    sign_as_user_id = request.data.get('sign_as_user_id')

    if not quote_id:
        return Response({'error': 'Quote ID is required'}, status=400)

    quote = get_object_or_404(Quote, id=quote_id)

    # Determine actual signer
    if request.user.is_superuser and sign_as_user_id:
        try:
            signer = User.objects.get(id=sign_as_user_id)
        except User.DoesNotExist:
            return Response({'error': 'Selected user not found'}, status=404)
    else:
        signer = request.user

    # Check signer is a participant
    if signer not in quote.participants.all():
        return Response({'error': 'User is not a participant for this quote'}, status=403)

    # Check if already signed/refused
    if Signature.objects.filter(quote=quote, user=signer).exists():
        return Response({'error': 'Signature already exists'}, status=400)

    # Save refusal
    Signature.objects.create(quote=quote, user=signer, refused=True)
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

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def submitted_unapproved_quotes(request):
    quotes = Quote.objects.filter(created_by=request.user, approved=False)
    serializer = QuoteSerializer(quotes, many=True)
    return Response(serializer.data)




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
        ).distinct()

    def perform_create(self, serializer):
        user = self.request.user

        if user.is_superuser:
        # Allow admin to submit their own values
            serializer.save(created_by=user)
        else:
            # Force standard users to safe defaults
            serializer.save(
                created_by=user,
                visible=False,
                approved=False
            )

    def update(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            raise PermissionDenied("Only admins can update quotes.")
        return super().update(request, *args, **kwargs)

    def partial_update(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            raise PermissionDenied("Only admins can update quotes.")
        return super().partial_update(request, *args, **kwargs)
    
    def list(self, request, *args, **kwargs):
        print("📌 Logged in user:", request.user)
        return super().list(request, *args, **kwargs)
    
    def get_object(self):
        pk = self.kwargs["pk"]
        try:
            quote = Quote.objects.get(pk=pk)
        except Quote.DoesNotExist:
            raise Http404("Quote not found")

        user = self.request.user

        # Allow if admin
        if user.is_superuser:
            return quote

        # Only allow access to approved quotes if user is participant or visible
        if quote.approved:
            if quote.visible or user in quote.participants.all() or user == quote.created_by:
                return quote
            raise PermissionDenied("You do not have access to this quote.")

        # Only allow access to unapproved quotes if user is a participant
        if user in quote.participants.all() or user == quote.created_by:
            return quote

        raise PermissionDenied("You do not have access to this unapproved quote.")

    
    def retrieve(self, request, *args, **kwargs):
        user = request.user
        pk = self.kwargs["pk"]

        try:
            quote = Quote.objects.get(pk=pk)
        except Quote.DoesNotExist:
            raise Http404("Quote not found")

        # 🔒 Access control:
        if not quote.approved:
            # Only admins and participants can see unapproved quotes
            if not user.is_superuser and user not in quote.participants.all() and user != quote.created_by:
                raise PermissionDenied("You do not have access to this unapproved quote.")
        else:
            # For approved quotes, user must be admin, participant, or visibility = True
            if not quote.visible and user not in quote.participants.all() and not user.is_superuser and  user == quote.created_by:
                raise PermissionDenied("You do not have access to this quote.")

        serializer = self.get_serializer(quote)
        return Response(serializer.data)
    
    def destroy(self, request, *args, **kwargs):
        user = request.user
        pk = self.kwargs["pk"]

        try:
            quote = Quote.objects.get(pk=pk)
        except Quote.DoesNotExist:
            raise Http404("Quote not found")

        # Only admins can delete
        if not user.is_superuser:
            raise PermissionDenied("Only admins can delete quotes.")

        quote.delete()
        return Response(status=204)


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


class AccountRequestViewSet(viewsets.ModelViewSet):
    queryset = AccountRequest.objects.all().order_by('-submitted_at')
    serializer_class = AccountRequestSerializer

    def get_permissions(self):
        if self.action in ['list', 'update', 'partial_update', 'destroy', 'approve']:
            return [permissions.IsAdminUser()]
        return [permissions.AllowAny()]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        account_request = self.get_object()

        # Prevent duplicate user creation
        if User.objects.filter(username=account_request.username).exists():
            return Response({"error": "Username already exists"}, status=400)
        if User.objects.filter(email=account_request.email).exists():
            return Response({"error": "Email already exists"}, status=400)

        # Create user with no password yet — will set it later
        user = User.objects.create_user(
            username=account_request.username,
            email=account_request.email,
            first_name=account_request.first_name,
            last_name=account_request.last_name,
            password=None
        )
        user.is_active = False  # Let them activate later via password reset link
        user.save()

        # Mark request as approved
        account_request.delete()

        return Response({"success": "User approved and created. Awaiting password setup."}, status=201)
