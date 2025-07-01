from rest_framework import serializers
from .models import Quote, QuoteLine, Signature
from django.contrib.auth.models import User

class QuoteLineSerializer(serializers.ModelSerializer):
    class Meta:
        model = QuoteLine
        fields = ['id', 'speaker_name', 'text']

class SignatureSerializer(serializers.ModelSerializer):
    class Meta:
        model = Signature
        fields = ['id', 'user', 'signature_image', 'signed_at']


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'is_superuser']
class QuoteSerializer(serializers.ModelSerializer):
    lines = QuoteLineSerializer(many=True)
    signatures = SignatureSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)

    class Meta:
        model = Quote
        fields = [
            'id', 'created_by', 'participants', 'created_at',
            'date', 'time', 'visible', 'redacted', 'approved',
            'lines', 'signatures'
        ]
        read_only_fields = ['created_by', 'signatures', 'created_at']

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

