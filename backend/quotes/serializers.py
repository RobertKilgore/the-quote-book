from rest_framework import serializers
from .models import Quote, QuoteLine, Signature, AccountRequest
from django.contrib.auth.models import User
from allauth.account import app_settings as allauth_settings
import logging
from rest_framework import serializers
from .models import QuoteRankVote, RARITY_CHOICES
from collections import defaultdict
import json



logger = logging.getLogger(__name__)

logger.debug(f"LOGIN_METHOD: {allauth_settings.LOGIN_METHODS}")
logger.debug(f"USERNAME_REQUIRED: {allauth_settings.USERNAME_REQUIRED}")
logger.debug(f"EMAIL_REQUIRED: {allauth_settings.EMAIL_REQUIRED}")



class QuoteRankVoteSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteRankVote
        fields = ['quote', 'user', 'rarity']
        read_only_fields = ['user']

    def validate_rarity(self, value):
        if value not in dict(RARITY_CHOICES):
            raise serializers.ValidationError("Invalid rarity.")
        return value
    


class QuoteLineSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(required=False, allow_null=True)
    text = serializers.SerializerMethodField()

    class Meta:
        model = QuoteLine
        fields = ['id', 'speaker_name', 'text', 'user_id']

    def get_user_id(self, obj):
        # Assuming there's a matching Signature entry:
        sig = obj.quote.signatures.filter(user__username=obj.speaker_name).first()
        return sig.user.id if sig else None
    
    def get_text(self, obj):
        raw = self.context.get("raw", False)
        if obj.quote.redacted and not raw:
            return "REDACTED"
        return obj.text
    


class SignatureSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    refused = serializers.BooleanField(default=False)

    class Meta:
        model = Signature
        fields = ['id', 'user', 'signature_image', 'refused', 'signed_at', 'name']

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_superuser', 'name', 'is_active']

    def get_name(self, obj):
        full_name = f"{obj.first_name} {obj.last_name}".strip()
        return full_name if full_name else obj.username

class AccountRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountRequest
        fields = [
            'id',
            'first_name',
            'last_name',
            'username',
            'email',
            'submitted_at',
            'approved'
        ]
        read_only_fields = ['id', 'submitted_at', 'approved', 'processed']


class QuoteSerializer(serializers.ModelSerializer):
    lines = QuoteLineSerializer(many=True, required=False)
    signatures = SignatureSerializer(many=True, read_only=True)
    # participants = serializers.PrimaryKeyRelatedField(
    #     queryset=User.objects.all(), many=True, write_only=True, required=False
    # )
    participants_detail = UserSerializer(source='participants', many=True, read_only=True)
    participant_status = serializers.SerializerMethodField()
    created_by = UserSerializer(read_only=True)
    is_flagged = serializers.BooleanField(read_only=True)
    has_flagged = serializers.SerializerMethodField()
    flag_count = serializers.SerializerMethodField()
    flagged_by_users = serializers.SerializerMethodField()
    rank_votes = serializers.SerializerMethodField()
    user_rarity_vote = serializers.SerializerMethodField()
    quote_notes = serializers.CharField(required=False, allow_blank=True)
    quote_source = serializers.URLField(required=False, allow_blank=True)
    quote_source_image = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = Quote
        fields = [
            'id', 'created_by', 'participants', 'participants_detail', 'created_at',
            'date', 'time', 'visible', 'redacted', 'approved', 'approved_at',
            'lines', 'signatures', 'participant_status', 'is_flagged', 'has_flagged', "flag_count",
            "flagged_by_users", 'rank', 'rank_votes', 'user_rarity_vote', 'quote_notes', 'quote_source', 'quote_source_image'
        ]
        read_only_fields = ['created_by', 'signatures', 'created_at']

    def to_internal_value(self, data):
        import json
        from django.http import QueryDict
        files = data.get("quote_source_image")
    

        # Make a mutable copy of the data
        if isinstance(data, QueryDict):
            non_file_data = {k: v for k, v in data.items() if k != "quote_source_image"}
            data = non_file_data.copy()

        if files:
            data["quote_source_image"] = files

        if data.get("date") == "":
            data["date"] = None
        if data.get("time") == "":
            data["time"] = None

        # Parse JSON strings into Python lists/dicts
        if isinstance(data.get('lines'), str):
            try:
                data['lines'] = json.loads(data['lines'])
            except json.JSONDecodeError:
                raise serializers.ValidationError({'lines': 'Invalid JSON format.'})

        if isinstance(data.get('participants'), str):
            try:
                parsed = json.loads(data['participants'])
                if hasattr(data, 'setlist'):
                    data.setlist('participants', parsed)
                else:
                    data['participants'] = parsed
            except json.JSONDecodeError:
                raise serializers.ValidationError({'participants': 'Invalid JSON format.'})

        return super().to_internal_value(data)



    def get_rank_votes(self, obj):
        votes_by_rarity = defaultdict(list)
        for vote in obj.rank_votes.select_related("user").all():
            votes_by_rarity[vote.rarity].append({
                "id": vote.user.id,
                "name": vote.user.get_full_name() or vote.user.username
            })
        return votes_by_rarity

    def get_user_rarity_vote(self, obj):
        user = self.context['request'].user
        vote = obj.rank_votes.filter(user=user).first()
        return vote.rarity if vote else None

    def get_flag_count(self, obj):
        return obj.flagged_by.count()

    def get_flagged_by_users(self, obj):
        request = self.context.get("request")
        if request and request.user.is_superuser:
            return [{"id": user.id, "name": user.get_full_name() or user.username} for user in obj.flagged_by.all()]
        return None
        
    def get_has_flagged(self, obj):
        user = self.context.get('request').user
        return user.is_authenticated and obj.flagged_by.filter(id=user.id).exists()
    

    def get_participant_status(self, obj):
        result = []
        for user in obj.participants.all():
            sig = obj.signatures.filter(user=user).first()
            result.append({
                "user": user.id,
                "name": user.get_full_name() or user.username,
                "signature_image": sig.signature_image.url if sig and sig.signature_image else None,
                "refused": sig.refused if sig else False,
                "signed_at": sig.signed_at if sig else None,
            })
        return result


    def create(self, validated_data):
        request = self.context['request']
        
        # Remove fields that will be manually handled
        validated_data.pop('participants', None)
        validated_data.pop('lines', None)
        validated_data.pop('created_by', None)

        try:
            lines_data = json.loads(request.data.get('lines', '[]'))
            participant_ids = json.loads(request.data.get('participants', '[]'))
        except json.JSONDecodeError:
            raise serializers.ValidationError("Invalid JSON for lines or participants.")

        quote = Quote.objects.create(created_by=request.user, **validated_data)
        quote.participants.set(participant_ids)

        for line_data in lines_data:
            user_id = line_data.pop('user_id', None)
            user = User.objects.get(id=user_id) if user_id else None
            QuoteLine.objects.create(quote=quote, user=user, **line_data)

        return quote

    def update(self, instance, validated_data):
        request = self.context['request']
        

        instance.quote_notes = request.data.get("quote_notes", "")
        instance.quote_source = request.data.get("quote_source", "")
        # Replace or clear quote_source_image
        new_image = request.FILES.get('quote_source_image')
        clear_image = request.data.get('quote_source_image') == ""
        if new_image:
            # Delete old image if it exists
            if instance.quote_source_image:
                instance.quote_source_image.delete(save=False)
            instance.quote_source_image = new_image

        if clear_image:
            # Clear the image field
            if instance.quote_source_image:
                instance.quote_source_image.delete(save=False)
            instance.quote_source_image = None
            

                # Remove fields that will be manually handled
        validated_data.pop('participants', None)
        validated_data.pop('lines', None)

        try:
            lines_data = json.loads(request.data.get('lines', '[]'))
            participant_ids = json.loads(request.data.get('participants', '[]'))
        except json.JSONDecodeError:
            raise serializers.ValidationError("Invalid JSON for lines or participants.")

        # Clear old data
        Signature.objects.filter(quote=instance).delete()
        instance.lines.all().delete()
        instance.participants.set(participant_ids)

        # Update quote fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        for line_data in lines_data:
            user_id = line_data.pop('user_id', None)
            user = User.objects.get(id=user_id) if user_id else None
            QuoteLine.objects.create(quote=instance, user=user, **line_data)

        return instance

    def to_representation(self, instance):
        data = super().to_representation(instance)

        # Manually ensure participants are serialized if missing
        data["participants"] = UserSerializer(instance.participants.all(), many=True).data


        return data


