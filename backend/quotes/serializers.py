from rest_framework import serializers
from .models import Quote, QuoteLine, Signature
from django.contrib.auth.models import User

class QuoteLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteLine
        fields = ['id', 'speaker_name', 'text']

class SignatureSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()
    refused = serializers.BooleanField(default=False)

    class Meta:
        model = Signature
        fields = ['id', 'user', 'signature_image', 'refused', 'signed_at', 'name']

    def get_name(self, obj):
        return obj.user.get_full_name() or obj.user.username


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_superuser']


class QuoteSerializer(serializers.ModelSerializer):
    lines = QuoteLineSerializer(many=True)
    signatures = SignatureSerializer(many=True, read_only=True)
    participants_signatures = serializers.SerializerMethodField()
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Quote
        fields = [
            'id', 'created_by', 'participants', 'created_at',
            'date', 'time', 'visible', 'redacted', 'approved',
            'lines', 'signatures', 'participants_signatures'
        ]
        read_only_fields = ['created_by', 'signatures', 'created_at']

    def get_participants_signatures(self, obj):
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
        lines_data = validated_data.pop('lines', [])
        participants = validated_data.pop('participants', [])
        quote = Quote.objects.create(created_by=self.context['request'].user, **validated_data)
        quote.participants.set(participants)

        for line_data in lines_data:
            QuoteLine.objects.create(quote=quote, **line_data)

        return quote

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.redacted:
            for line in data.get('lines', []):
                line['text'] = "REDACTED"
        return data

