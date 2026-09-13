from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError

from .models import User


class RegisterSerializer(serializers.ModelSerializer):

    password = serializers.CharField(
        write_only=True
    )

    confirm_password = serializers.CharField(
        write_only=True
    )

    class Meta:
        model = User

        fields = [
            "full_name",
            "email",
            "phone_number",
            "password",
            "confirm_password",
        ]

    def validate_password(self, value):
        validate_password(value)
        return value

    def validate(self, attrs):

        if attrs["password"] != attrs["confirm_password"]:
            raise serializers.ValidationError({
                "confirm_password": "Passwords do not match."
            })

        return attrs

    def create(self, validated_data):

        validated_data.pop("confirm_password")

        password = validated_data.pop("password")

        return User.objects.create_user(
            password=password,
            **validated_data
        )


class LoginSerializer(TokenObtainPairSerializer):

    username_field = "email"

    def validate(self, attrs):

        data = super().validate(attrs)

        data["user"] = {
            "id": self.user.id,
            "full_name": self.user.full_name,
            "email": self.user.email,
            "phone_number": self.user.phone_number,
            "role": self.user.role,
        }

        return data


class LogoutSerializer(serializers.Serializer):

    refresh = serializers.CharField(
        write_only=True
    )

    def save(self, **kwargs):

        refresh_token = self.validated_data["refresh"]

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()

        except TokenError:
            raise serializers.ValidationError({
                "refresh": "Invalid or already blacklisted refresh token."
            })   
