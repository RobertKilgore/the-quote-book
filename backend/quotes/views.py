from django.shortcuts import render
from rest_framework import viewsets, permissions, status
from .models import Quote, QuoteLine, Signature, QuoteRankVote
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
from django.utils import timezone 
import base64
from .models import AccountRequest
from .serializers import AccountRequestSerializer
from scheduler.jobs import auto_refuse_stale_quotes
from .serializers import QuoteRankVoteSerializer
from .models import update_quote_rank, RARITY_CHOICES



class IsApprovedUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_active

class IsSuperUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_superuser)
    
@api_view(['GET'])
@permission_classes([IsSuperUser])
def get_quote_for_editing(request, pk):
    try:
        quote = Quote.objects.get(pk=pk)
    except Quote.DoesNotExist:
        raise Http404("Quote not found")

    # Force raw context (prevents redaction)
    serializer = QuoteSerializer(quote, context={'request': request, 'raw': True})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsApprovedUser])
def unrated_quotes_count(request):
    user = request.user
    count = (
        Quote.objects
        .filter(approved=True, visible=True)
        .exclude(rank_votes__user=user)
        .distinct()
        .count()
    )
    return Response({"count": count})


@api_view(['GET'])
@permission_classes([IsSuperUser])
def flagged_quotes_count(request):
    count = Quote.objects.filter(is_flagged=True).count()
    return Response({"count": count})

@api_view(['POST'])
@permission_classes([IsApprovedUser])
def vote_quote_rank(request, quote_id):
    quote = get_object_or_404(Quote, id=quote_id)
    rarity = request.data.get("rarity")


    if rarity is None:
        # Remove the user's vote if it exists
        QuoteRankVote.objects.filter(quote=quote, user=request.user).delete()
        update_quote_rank(quote)
        serializer = QuoteSerializer(quote, context={"request": request})
        return Response(serializer.data)
    
    if rarity not in ['common', 'uncommon', 'rare', 'epic', 'legendary']:
        return Response({"error": "Invalid rarity"}, status=400)

    # Remove existing vote
    QuoteRankVote.objects.filter(user=request.user, quote=quote).delete()

    # Create new vote
    QuoteRankVote.objects.create(user=request.user, quote=quote, rarity=rarity)

    # Update rank
    update_quote_rank(quote)

    # ✅ Return full updated quote
    serializer = QuoteSerializer(quote, context={"request": request})
    return Response(serializer.data, status=200)



@api_view(["GET"])
@permission_classes([IsApprovedUser])
def list_unrated_quotes(request):
    user = request.user
    quotes = (
        Quote.objects
        .filter(approved=True, visible=True)
        .exclude(rank_votes__user=user)
        .distinct()
        .order_by("-created_at")
    )
    data = QuoteSerializer(quotes, many=True, context={"request": request}).data
    return Response(data)

@api_view(["GET"])
@permission_classes([IsSuperUser])
def list_flagged_quotes(request):
    quotes = (
        Quote.objects
        .filter(is_flagged=True)
        .order_by("-created_at")
    )
    data = QuoteSerializer(quotes, many=True, context={"request": request}).data
    return Response(data)

@api_view(['GET'])
@permission_classes([IsSuperUser])
def list_users(request):
    users = User.objects.filter()
    data = [
        {"id": u.id, "username": u.username, "email": u.email, "name": u.get_full_name(), "is_active": u.is_active, "is_superuser": u.is_superuser,}
        for u in users
    ]
    return Response(data)

@api_view(['DELETE'])
@permission_classes([IsSuperUser])
def delete_user(request, user_id):
    try:
        user = User.objects.get(id=user_id)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except User.DoesNotExist:
        return Response({"error": "User not found"}, status=status.HTTP_404_NOT_FOUND)

@api_view(["POST"])
@permission_classes([IsApprovedUser])
def flag_quote(request, quote_id):
    try:
        quote = Quote.objects.get(id=quote_id)
        quote.flagged_by.add(request.user)
        quote.is_flagged = True
        quote.save()
        return Response({"success": "Quote flagged for review."}, status=status.HTTP_200_OK)
    except Quote.DoesNotExist:
        return Response({"error": "Quote not found."}, status=status.HTTP_404_NOT_FOUND)

@api_view(["POST"])
@permission_classes([IsSuperUser])
def debug_run_refuse(request):
    auto_refuse_stale_quotes(15)
    return Response({"status": "Manually triggered"}, status=200)

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
    serializer = QuoteSerializer(quotes, many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([IsApprovedUser])
def pending_signatures(request):
    quotes = Quote.objects.filter(
        approved=True,
        participants=request.user
    ).exclude(
        signatures__user=request.user
    ).distinct()

    serializer = QuoteSerializer(quotes, many=True, context={'request': request})
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

        # Decode and prepare new image
        format, imgstr = image_data.split(';base64,')
        ext = format.split('/')[-1]
        data = ContentFile(base64.b64decode(imgstr), name=f'sign_{signer.id}_{quote_id}.{ext}')

        # Fetch or create signature object
        sig, created = Signature.objects.get_or_create(quote=quote, user=signer)

        # Overwrite previous signature
        if sig.signature_image:
            sig.signature_image.delete(save=False)  # clean up old file

        sig.signature_image = data
        sig.refused = False  # mark as signed
        sig.save()

        return Response({"success": True}, status=200)

    except Exception as e:
        import traceback
        traceback_str = traceback.format_exc()
        return Response({"error": str(e), "trace": traceback_str}, status=400)

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
            # Check if admin marked it as approved on creation
            approved = serializer.validated_data.get("approved", False)
            if approved:
                serializer.save(created_by=user, approved_at=timezone.now())
            else:
                serializer.save(created_by=user)
        else:
            # Force safe defaults for normal users
            serializer.save(
                created_by=user,
                visible=False,
                approved=False,
                approved_at=None
            )

    def update(self, request, *args, **kwargs):
        instance = self.get_object()

        if not request.user.is_superuser:
            raise PermissionDenied("Only admins can update quotes.")

        # 🔄 clear flags *first* so serializer sees the change
        instance.flagged_by.clear()
        instance.is_flagged = False
        instance.save(update_fields=["is_flagged"])

        # ▸ reset votes & rank (optional but usually desired)
        QuoteRankVote.objects.filter(quote=instance).delete()
        update_quote_rank(instance)

        resp = super().update(request, *args, **kwargs)

        # if the quote is now approved, stamp approved_at
        if instance.approved:
            instance.approved_at = timezone.now()
            instance.save(update_fields=["approved_at"])
        else:
            instance.approved_at = None
            instance.save(update_fields=["approved_at"])

        return resp

    # ---------- PARTIAL update ----------
    def partial_update(self, request, *args, **kwargs):
        if not request.user.is_superuser:
            raise PermissionDenied("Only admins can update quotes.")

        instance = self.get_object()

        # clear flags BEFORE serialisation
        instance.flagged_by.clear()
        instance.is_flagged = False
        instance.save(update_fields=["is_flagged"])

        QuoteRankVote.objects.filter(quote=instance).delete()
        update_quote_rank(instance)

        resp = super().partial_update(request, *args, **kwargs)

        if instance.approved:
            instance.approved_at = timezone.now()
            instance.save(update_fields=["approved_at"])
        else:
            instance.approved_at = None
            instance.save(update_fields=["approved_at"])

        return resp
    

    def list(self, request, *args, **kwargs):
        # print("📌 Logged in user:", request.user)
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


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsSuperUser]  # Only admins can use this viewset
    http_method_names = ['get', 'post', 'patch', 'delete']

    def partial_update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = self.get_serializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)


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
