from datetime import datetime, timezone as dt_timezone

from django.utils import timezone
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from config.permissions import (
    IsClinicianRole,
    IsAdminOrIntakeTeam,
    IsAdminRole,
)

from .models import Referral
from .serializers import ReferralSerializer
from apps.users.models import User


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

        if getattr(user, 'role', None) == 'intake_team' and user.department:
            return qs.filter(receiving_department=user.department)

        return qs.none()

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsClinicianRole()]

        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsAdminOrIntakeTeam()]

        if self.action == 'destroy':
            return [IsAuthenticated(), IsAdminRole()]

        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(referred_by=self.request.user)

    def update(self, request, *args, **kwargs):
        referral = self.get_object()
        user_role = getattr(request.user, 'role', None)

        if user_role == 'intake_team':
            if not request.user.department or referral.receiving_department != request.user.department:
                return Response(
                    {'detail': 'You can only respond to referrals for your department.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            allowed_fields = {'status', 'response_note'}
            sent_fields = set(request.data.keys())

            if not sent_fields.issubset(allowed_fields):
                return Response(
                    {'detail': 'Intake Team can only update status and response note.'},
                    status=status.HTTP_403_FORBIDDEN
                )

            if request.data.get('status') not in ['accepted', 'declined']:
                return Response(
                    {'detail': 'Status must be accepted or declined.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

        return super().update(request, *args, **kwargs)

    def perform_update(self, serializer):
        instance = serializer.save()

        if instance.status in ['accepted', 'declined'] and instance.responded_at is None:
            instance.responded_at = timezone.now()
            instance.save(update_fields=['responded_at'])


@api_view(['GET'])
@permission_classes([IsAdminRole])
def dashboard_stats(request):
    """
    Admin-only dashboard/report statistics.
    All monthly calculations use UTC month boundary.
    """

    now = timezone.now()

    start_of_month = datetime(
        now.year,
        now.month,
        1,
        tzinfo=dt_timezone.utc
    )

    referrals_this_month_qs = Referral.objects.filter(
        created_at__gte=start_of_month
    )

    # Count unique students referred this month, not just referral records.
    students_referred_this_month = referrals_this_month_qs.values(
        'student'
    ).distinct().count()

    total_referrals = Referral.objects.count()

    pending_referrals = Referral.objects.filter(
        status='pending'
    ).count()

    accepted_referrals = Referral.objects.filter(
        status='accepted'
    ).count()

    declined_referrals = Referral.objects.filter(
        status='declined'
    ).count()

    new_staff_this_month = User.objects.filter(
        date_joined__gte=start_of_month,
        role__in=[
            'clinician',
            'intake_team',
            'lab_technician',
            'pharmacist',
        ]
    ).count()

    total_staff = User.objects.filter(
        role__in=[
            'clinician',
            'intake_team',
            'lab_technician',
            'pharmacist',
        ]
    ).count()

    active_staff = User.objects.filter(
        role__in=[
            'clinician',
            'intake_team',
            'lab_technician',
            'pharmacist',
        ],
        is_active=True
    ).count()

    return Response({
        'students_referred_this_month': students_referred_this_month,
        'referrals_this_month': referrals_this_month_qs.count(),
        'new_staff_this_month': new_staff_this_month,

        'total_referrals': total_referrals,
        'pending_referrals': pending_referrals,
        'accepted_referrals': accepted_referrals,
        'declined_referrals': declined_referrals,

        'total_staff': total_staff,
        'active_staff': active_staff,

        'utc_month_start': start_of_month.isoformat(),
    })