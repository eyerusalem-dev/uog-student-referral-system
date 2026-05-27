"""
Custom JWT login view that adds audit logging on success and failure.
"""
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.exceptions import TokenError, InvalidToken
from rest_framework.response import Response
from rest_framework import status


class AuditedTokenObtainPairView(TokenObtainPairView):
    """JWT login that logs LOGIN / LOGIN_FAILED events."""

    def post(self, request, *args, **kwargs):
        from apps.audit.logger import AuditLogger
        from apps.audit.models import ACTION_TYPES, RESOURCE_TYPES

        username = request.data.get('username', '')

        try:
            response = super().post(request, *args, **kwargs)
            # Success – look up the user for full attribution
            from django.contrib.auth import get_user_model
            User = get_user_model()
            try:
                actor = User.objects.get(username=username)
            except User.DoesNotExist:
                actor = None

            AuditLogger.log(
                action=ACTION_TYPES.LOGIN,
                resource_type=RESOURCE_TYPES.AUTH,
                resource_id=username,
                resource_repr=f'Login: {username}',
                actor=actor,
                request=request,
            )
            return response

        except (TokenError, InvalidToken) as exc:
            AuditLogger.log(
                action=ACTION_TYPES.LOGIN_FAILED,
                resource_type=RESOURCE_TYPES.AUTH,
                resource_id=username,
                resource_repr=f'Failed login attempt: {username}',
                request=request,
                extra={'error': str(exc)},
            )
            raise
