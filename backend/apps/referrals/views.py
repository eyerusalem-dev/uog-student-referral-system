from django.utils import timezone
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from config.permissions import IsAdminOrClinician, IsAdminOrDepartmentReceiver, IsAdminRole
from .models import Referral
from .serializers import ReferralSerializer


class ReferralViewSet(viewsets.ModelViewSet):
    queryset = Referral.objects.select_related(
        'student',
        'clinical_visit',
        'referred_by',
        'receiving_department'
    ).all()
    serializer_class = ReferralSerializer
    lookup_field = 'referral_id'

    def get_queryset(self):
        user = self.request.user
        qs = super().get_queryset().order_by('-created_at')

        if getattr(user, 'role', None) == 'admin':
            return qs

        if getattr(user, 'role', None) == 'clinician':
            return qs.filter(referred_by=user)

        if getattr(user, 'role', None) == 'department_receiver' and user.department:
            return qs.filter(receiving_department=user.department)

        return qs.none()

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsAdminOrClinician()]
        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsAdminOrDepartmentReceiver()]
        if self.action == 'destroy':
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(referred_by=self.request.user)

    def update(self, request, *args, **kwargs):
        referral = self.get_object()
        user_role = getattr(request.user, 'role', None)

        if user_role == 'department_receiver':
            if not request.user.department or referral.receiving_department != request.user.department:
                return Response(
                    {'detail': 'You can only respond to referrals for your department.'},
                    status=status.HTTP_403_FORBIDDEN
                )

        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        instance = serializer.save()

        if instance.status in ['accepted', 'declined'] and instance.responded_at is None:
            instance.responded_at = timezone.now()
            instance.save(update_fields=['responded_at'])