from rest_framework import serializers
from accounts.models import Users
from accounts.services import create_user_account, authenticated
from accounts.validators import validate_phone_number


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "gender",
            "date_of_birth",
            "profile_picture",
        ]
    
    def validate_phone_number(self, value):
        return validate_phone_number(value)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = Users
        fields = ['username', 'email', 'first_name',
                  'last_name', 'password', 'phone_number',
                  'gender', 'date_of_birth', 'profile_picture']
        extra_kwargs = {
            "email": {"required": True},
        }
    
    def validate_phone_number(self, value):
        return validate_phone_number(value)
    
    def create(self, validated_data):
        password = validated_data.pop("password")
        user = create_user_account(password=password, **validated_data)
        return user


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)  # dont return password

    def validate(self, data):
        # TODO: add email login option
        user = authenticated(username=data['username'], password=data['password'])

        if not user:
            raise serializers.ValidationError("Invalid credentials")
        
        return {"user": user}


class TokenSerializer(serializers.Serializer):
    """Serializer for JWT tokens"""
    access = serializers.CharField()
    refresh = serializers.CharField()
    user = UserSerializer()


class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Users
        fields = [
            "email",
            "first_name",
            "last_name",
            "phone_number",
            "gender",
            "date_of_birth",
            "profile_picture",
        ]
    
    def validate_phone_number(self, value):
        return validate_phone_number(value)