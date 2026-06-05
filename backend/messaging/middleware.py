from urllib.parse import parse_qs


from channels.middleware import BaseMiddleware

from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.tokens import AccessToken
from rest_framework_simplejwt.exceptions import InvalidToken , TokenError

from accounts.models import Users

@database_sync_to_async
def get_user_from_token(token_key):

    """
    Validates the JWT access token and returns the matching User.
    Returns AnonymousUser if the token is missing, invalid, or expired.
    """
    try:
        token = AccessToken(token_key)
        return Users.objects.get(id=token["user_id"])
    except (InvalidToken, TokenError, Users.DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):

    """
    Reads the JWT token from the WebSocket query string.

    The browser connects like:
        ws://localhost:8000/ws/chat/5/?token=eyJ...

    Normal DRF authentication (Authorization header) does not work for
    WebSocket connections — headers are not accessible the same way.
    Passing the token as a query param is the standard workaround.
    """
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        params       = parse_qs(query_string)
        token_list   = params.get("token",[])
        token        = token_list[0] if token_list else None

        scope["user"] = (
            await get_user_from_token(token)
            if token
            else AnonymousUser()
        )

        return await super().__call__(scope, receive, send)