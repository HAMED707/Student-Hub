from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import (
    UserSerializer,
    UserUpdateSerializer,
    RegisterSerializer,
    LoginSerializer,
)


def get_tokens_for_user(user):
    """Generate JWT tokens for a user"""
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }


@api_view(['POST'])
def register_api(request):
    """Register a new user (no tokens - must login after)"""
    serialized = RegisterSerializer(data=request.data)

    if serialized.is_valid():
        user = serialized.save()
        # print(f"New user registered: {user.username}")  # for tracking
        
        return Response({
            'message': 'User registered successfully. Please login.',
            'user': UserSerializer(user).data
        }, status=201)
    
    return Response(serialized.errors, status=400)


@api_view(['POST'])
def login_api(request):
    """Login user and return JWT tokens"""
    # TODO: add rate limiting to prevent brute force
    serialized = LoginSerializer(data=request.data)

    if serialized.is_valid():
        user = serialized.validated_data['user']
        tokens = get_tokens_for_user(user)  # generate fresh tokens
        
        return Response({
            'user': UserSerializer(user).data,
            'tokens': tokens
        }, status=200)
    
    return Response(serialized.errors, status=400)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_api(request):
    """Logout user (token blacklisting handled by frontend)"""
    # could implement token blacklist here if needed
    return Response({"message": "logged out successfully"})


@api_view(['GET', 'PUT', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_api(request):
    """Get or update user profile"""
    user = request.user
    
    if request.method == 'GET':
        serializer = UserSerializer(user)
        return Response(serializer.data)
    
    elif request.method in ['PUT', 'PATCH']:
        serializer = UserUpdateSerializer(
            user,
            data=request.data,
            partial=(request.method == 'PATCH'),
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated successfully',
                'user': UserSerializer(user).data
            })
        
        return Response(serializer.errors, status=400)
