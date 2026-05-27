from django.contrib.auth import get_user_model
from rest_framework import viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status

from config.permissions import IsAdminRole
from .serializers import UserSerializer

User = get_user_model()


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(UserSerializer(request.user).data)


class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('id')
    serializer_class = UserSerializer
    permission_classes = [IsAdminRole]

    def perform_create(self, serializer):
        from apps.audit.logger import AuditLogger
        from apps.audit.models import ACTION_TYPES, RESOURCE_TYPES
        instance = serializer.save()
        AuditLogger.log(
            action=ACTION_TYPES.USER_CREATED,
            resource_type=RESOURCE_TYPES.USER,
            resource_id=instance.id,
            resource_repr=str(instance),
            request=self.request,
            after_state=UserSerializer(instance).data,
        )

    def perform_update(self, serializer):
        from apps.audit.logger import AuditLogger
        from apps.audit.models import ACTION_TYPES, RESOURCE_TYPES
        before = UserSerializer(serializer.instance).data
        instance = serializer.save()
        AuditLogger.log(
            action=ACTION_TYPES.USER_UPDATED,
            resource_type=RESOURCE_TYPES.USER,
            resource_id=instance.id,
            resource_repr=str(instance),
            request=self.request,
            before_state=dict(before),
            after_state=UserSerializer(instance).data,
        )

    def perform_destroy(self, instance):
        from apps.audit.logger import AuditLogger
        from apps.audit.models import ACTION_TYPES, RESOURCE_TYPES
        before = UserSerializer(instance).data
        AuditLogger.log(
            action=ACTION_TYPES.USER_DELETED,
            resource_type=RESOURCE_TYPES.USER,
            resource_id=instance.id,
            resource_repr=str(instance),
            request=self.request,
            before_state=dict(before),
        )
        instance.delete()


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        from apps.audit.logger import AuditLogger
        from apps.audit.models import ACTION_TYPES, RESOURCE_TYPES
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')

        if not old_password or not new_password:
            return Response(
                {'detail': 'Both old and new passwords are required.'},
                status=400
            )

        if not user.check_password(old_password):
            return Response(
                {'detail': 'Current password is incorrect.'},
                status=400
            )

        if len(new_password) < 6:
            return Response(
                {'detail': 'New password must be at least 6 characters.'},
                status=400
            )

        user.set_password(new_password)
        user.save()
        AuditLogger.log(
            action=ACTION_TYPES.PASSWORD_CHANGE,
            resource_type=RESOURCE_TYPES.USER,
            resource_id=user.id,
            resource_repr=str(user),
            request=request,
        )
        return Response({'detail': 'Password changed successfully.'})


class AdminForcePasswordChangeView(APIView):
    permission_classes = [IsAdminRole]

    def post(self, request, user_id):
        from apps.audit.logger import AuditLogger
        from apps.audit.models import ACTION_TYPES, RESOURCE_TYPES
        new_password = request.data.get('new_password')

        if not new_password:
            return Response(
                {'detail': 'New password is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if len(new_password) < 6:
            return Response(
                {'detail': 'New password must be at least 6 characters.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            user = User.objects.get(id=user_id)
            user.set_password(new_password)
            user.save()
            AuditLogger.log(
                action=ACTION_TYPES.PASSWORD_CHANGE,
                resource_type=RESOURCE_TYPES.USER,
                resource_id=user.id,
                resource_repr=str(user),
                request=request,
                extra={'forced_by_admin': True},
            )
            return Response({'detail': f'Password changed for {user.username}.'})
        except User.DoesNotExist:
            return Response(
                {'detail': 'User not found.'},
                status=status.HTTP_404_NOT_FOUND
            )