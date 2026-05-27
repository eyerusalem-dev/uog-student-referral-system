from datetime import datetime, timezone as dt_timezone, timedelta

from django.utils import timezone
from django.db.models import Count, Q
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from config.permissions import (
    IsClinicianRole,
    IsAdminOrIntakeTeam,
    IsAdminRole,
    IsAdminOrClinician,
)

from .models import Referral
from .serializers import ReferralSerializer
from apps.users.models import User
from apps.visits.models import LabRequest, Prescription, ClinicalVisit
from apps.departments.models import HospitalDepartment


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
            return [IsAuthenticated(), IsAdminOrClinician()]

        if self.action in ['update', 'partial_update']:
            return [IsAuthenticated(), IsAdminOrIntakeTeam()]

        if self.action == 'destroy':
            return [IsAuthenticated(), IsAdminRole()]

        return [IsAuthenticated()]

    def perform_create(self, serializer):
        from apps.audit.logger import AuditLogger
        from apps.audit.models import ACTION_TYPES, RESOURCE_TYPES
        instance = serializer.save(referred_by=self.request.user)
        AuditLogger.log(
            action=ACTION_TYPES.REFERRAL_CREATED,
            resource_type=RESOURCE_TYPES.REFERRAL,
            resource_id=instance.referral_id,
            resource_repr=str(instance),
            request=self.request,
            after_state={
                'referral_id': instance.referral_id,
                'student': str(instance.student),
                'department': str(instance.receiving_department),
                'status': instance.status,
            },
        )

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
        from apps.audit.logger import AuditLogger
        from apps.audit.models import ACTION_TYPES, RESOURCE_TYPES
        old_status = serializer.instance.status
        instance = serializer.save()

        if instance.status in ['accepted', 'declined'] and instance.responded_at is None:
            instance.responded_at = timezone.now()
            instance.save(update_fields=['responded_at'])

        action = ACTION_TYPES.REFERRAL_UPDATED
        if instance.status == 'accepted' and old_status != 'accepted':
            action = ACTION_TYPES.REFERRAL_ACCEPTED
        elif instance.status == 'declined' and old_status != 'declined':
            action = ACTION_TYPES.REFERRAL_DECLINED

        AuditLogger.log(
            action=action,
            resource_type=RESOURCE_TYPES.REFERRAL,
            resource_id=instance.referral_id,
            resource_repr=str(instance),
            request=self.request,
            before_state={'status': old_status},
            after_state={'status': instance.status, 'response_note': instance.response_note},
        )


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


@api_view(['GET'])
@permission_classes([IsAdminRole])
def students_referred_this_month(request):
    """
    Admin-only: Returns list of students referred this month with their referral details.
    """
    now = timezone.now()
    start_of_month = datetime(now.year, now.month, 1, tzinfo=dt_timezone.utc)

    referrals = Referral.objects.select_related(
        'student', 'referred_by', 'receiving_department'
    ).filter(created_at__gte=start_of_month).order_by('-created_at')

    data = []
    for ref in referrals:
        data.append({
            'referral_id': ref.referral_id,
            'student_university_id': ref.student.university_id,
            'student_name': f"{ref.student.first_name} {ref.student.last_name}",
            'student_department': ref.student.department,
            'student_year': ref.student.year_of_study,
            'referred_by': f"{ref.referred_by.first_name or ref.referred_by.username} {ref.referred_by.last_name or ''}".strip(),
            'referred_by_id': ref.referred_by.id,
            'receiving_department': ref.receiving_department.name if ref.receiving_department else 'N/A',
            'status': ref.status,
            'created_at': ref.created_at.isoformat(),
            'has_clinical_visit': ref.clinical_visit is not None,
        })

    return Response(data)


def get_date_range(range_type, custom_start=None, custom_end=None):
    """
    Helper function to calculate date ranges based on selection.
    Returns (start_date, end_date) tuple.
    """
    now = timezone.now()
    
    if range_type == 'today':
        start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
        return start, end
    
    elif range_type == 'week':
        # Start of current week (Monday)
        start = now - timedelta(days=now.weekday())
        start = start.replace(hour=0, minute=0, second=0, microsecond=0)
        end = now
        return start, end
    
    elif range_type == 'month':
        start = datetime(now.year, now.month, 1, tzinfo=dt_timezone.utc)
        end = now
        return start, end
    
    elif range_type == 'quarter':
        # Current quarter
        quarter_month = ((now.month - 1) // 3) * 3 + 1
        start = datetime(now.year, quarter_month, 1, tzinfo=dt_timezone.utc)
        end = now
        return start, end
    
    elif range_type == 'year':
        start = datetime(now.year, 1, 1, tzinfo=dt_timezone.utc)
        end = now
        return start, end
    
    elif range_type == 'custom' and custom_start and custom_end:
        start = datetime.fromisoformat(custom_start) if isinstance(custom_start, str) else custom_start
        end = datetime.fromisoformat(custom_end) if isinstance(custom_end, str) else custom_end
        return start, end
    
    # Default to month
    start = datetime(now.year, now.month, 1, tzinfo=dt_timezone.utc)
    end = now
    return start, end


def get_previous_date_range(range_type, current_start, current_end):
    """
    Get the previous period for comparison.
    """
    duration = current_end - current_start
    
    if range_type == 'today':
        prev_end = current_start
        prev_start = prev_end - timedelta(days=1)
    elif range_type == 'week':
        prev_end = current_start
        prev_start = prev_end - timedelta(weeks=1)
    elif range_type == 'month':
        # Previous month
        if current_start.month == 1:
            prev_start = datetime(current_start.year - 1, 12, 1, tzinfo=dt_timezone.utc)
        else:
            prev_start = datetime(current_start.year, current_start.month - 1, 1, tzinfo=dt_timezone.utc)
        prev_end = current_start
    elif range_type == 'quarter':
        # Previous quarter
        prev_months = current_start.month - 3
        if prev_months <= 0:
            prev_start = datetime(current_start.year - 1, prev_months + 12, 1, tzinfo=dt_timezone.utc)
        else:
            prev_start = datetime(current_start.year, prev_months, 1, tzinfo=dt_timezone.utc)
        prev_end = current_start
    elif range_type == 'year':
        prev_start = datetime(current_start.year - 1, 1, 1, tzinfo=dt_timezone.utc)
        prev_end = current_start
    elif range_type == 'custom':
        prev_end = current_start
        prev_start = prev_end - duration
    else:
        prev_start = current_start - duration
        prev_end = current_start
    
    return prev_start, prev_end


def calculate_trend(current_value, previous_value):
    """
    Calculate trend percentage and direction.
    Returns (percentage, direction) where direction is 'up', 'down', or 'neutral'.
    """
    if previous_value == 0:
        if current_value == 0:
            return 0, 'neutral'
        return 100, 'up'
    
    change = ((current_value - previous_value) / previous_value) * 100
    if change > 0:
        return round(change, 1), 'up'
    elif change < 0:
        return round(abs(change), 1), 'down'
    return 0, 'neutral'


@api_view(['GET'])
@permission_classes([IsAdminRole])
def enhanced_dashboard_stats(request):
    """
    Enhanced admin dashboard statistics with date range filtering,
    department breakdown, trend comparisons, and lab/prescription metrics.
    
    Query parameters:
    - range: today | week | month | quarter | year | custom (default: month)
    - start_date: ISO format date (required if range=custom)
    - end_date: ISO format date (required if range=custom)
    - department: Department ID to filter by (optional)
    """
    range_type = request.query_params.get('range', 'month')
    custom_start = request.query_params.get('start_date')
    custom_end = request.query_params.get('end_date')
    department_id = request.query_params.get('department')
    
    # Get date range
    start_date, end_date = get_date_range(range_type, custom_start, custom_end)
    
    # Get previous period for trend comparison
    prev_start, prev_end = get_previous_date_range(range_type, start_date, end_date)
    
    # Base referral queryset for current period
    referrals_qs = Referral.objects.filter(
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    
    # Apply department filter if specified
    if department_id:
        referrals_qs = referrals_qs.filter(receiving_department_id=department_id)
    
    # Current period referral stats
    total_referrals = referrals_qs.count()
    pending_referrals = referrals_qs.filter(status='pending').count()
    accepted_referrals = referrals_qs.filter(status='accepted').count()
    declined_referrals = referrals_qs.filter(status='declined').count()
    
    # Unique students referred
    students_referred = referrals_qs.values('student').distinct().count()
    
    # Acceptance rate
    acceptance_rate = round((accepted_referrals / total_referrals * 100), 1) if total_referrals > 0 else 0
    
    # Previous period referral stats for trends
    prev_referrals_qs = Referral.objects.filter(
        created_at__gte=prev_start,
        created_at__lte=prev_end
    )
    if department_id:
        prev_referrals_qs = prev_referrals_qs.filter(receiving_department_id=department_id)
    
    prev_total = prev_referrals_qs.count()
    prev_accepted = prev_referrals_qs.filter(status='accepted').count()
    prev_pending = prev_referrals_qs.filter(status='pending').count()
    prev_declined = prev_referrals_qs.filter(status='declined').count()
    
    # Calculate trends
    total_trend_pct, total_trend_dir = calculate_trend(total_referrals, prev_total)
    accepted_trend_pct, accepted_trend_dir = calculate_trend(accepted_referrals, prev_accepted)
    pending_trend_pct, pending_trend_dir = calculate_trend(pending_referrals, prev_pending)
    declined_trend_pct, declined_trend_dir = calculate_trend(declined_referrals, prev_declined)
    
    # Referrals by department breakdown
    department_breakdown = []
    if department_id:
        # If filtered by department, show department name
        try:
            dept = HospitalDepartment.objects.get(id=department_id)
            department_breakdown = [{
                'department_id': dept.id,
                'department_name': dept.name,
                'count': total_referrals,
                'pending': pending_referrals,
                'accepted': accepted_referrals,
                'declined': declined_referrals
            }]
        except HospitalDepartment.DoesNotExist:
            pass
    else:
        # Group by receiving department
        dept_stats = referrals_qs.values(
            'receiving_department',
            'receiving_department__name'
        ).annotate(
            count=Count('id'),
            pending=Count('id', filter=Q(status='pending')),
            accepted=Count('id', filter=Q(status='accepted')),
            declined=Count('id', filter=Q(status='declined'))
        ).order_by('-count')
        
        for stat in dept_stats:
            department_breakdown.append({
                'department_id': stat['receiving_department'],
                'department_name': stat['receiving_department__name'],
                'count': stat['count'],
                'pending': stat['pending'],
                'accepted': stat['accepted'],
                'declined': stat['declined']
            })
    
    # Status distribution for pie chart
    status_distribution = [
        {'status': 'Pending', 'count': pending_referrals, 'color': '#F59E0B'},
        {'status': 'Accepted', 'count': accepted_referrals, 'color': '#10B981'},
        {'status': 'Declined', 'count': declined_referrals, 'color': '#EF4444'}
    ]
    
    # Lab metrics
    lab_qs = LabRequest.objects.filter(
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    total_lab_requests = lab_qs.count()
    completed_lab = lab_qs.filter(status='completed').count()
    pending_lab = lab_qs.filter(status='pending').count()
    lab_completion_rate = round((completed_lab / total_lab_requests * 100), 1) if total_lab_requests > 0 else 0
    
    # Prescription metrics
    rx_qs = Prescription.objects.filter(
        created_at__gte=start_date,
        created_at__lte=end_date
    )
    total_prescriptions = rx_qs.count()
    dispensed_rx = rx_qs.filter(status='dispensed').count()
    out_of_stock_rx = rx_qs.filter(status='out_of_stock').count()
    pending_rx = rx_qs.filter(status='pending').count()
    fulfillment_rate = round((dispensed_rx / total_prescriptions * 100), 1) if total_prescriptions > 0 else 0
    
    # Clinical visits count
    visits_count = ClinicalVisit.objects.filter(
        visit_date__gte=start_date,
        visit_date__lte=end_date
    ).count()
    
    # Most active clinician (by referrals)
    most_active_clinician = None
    clinician_stats = referrals_qs.values(
        'referred_by',
        'referred_by__first_name',
        'referred_by__last_name',
        'referred_by__username'
    ).annotate(count=Count('id')).order_by('-count')
    
    if clinician_stats.exists():
        top = clinician_stats[0]
        first_name = top.get('referred_by__first_name', '')
        last_name = top.get('referred_by__last_name', '')
        username = top.get('referred_by__username', '')
        name = f"{first_name} {last_name}".strip() or username
        most_active_clinician = {
            'name': name,
            'referrals': top['count']
        }
    
    # Active users (users who have created referrals or visits in the period)
    active_user_ids = set()
    active_user_ids.update(
        Referral.objects.filter(
            created_at__gte=start_date,
            created_at__lte=end_date
        ).values_list('referred_by_id', flat=True)
    )
    active_user_ids.update(
        ClinicalVisit.objects.filter(
            visit_date__gte=start_date,
            visit_date__lte=end_date
        ).values_list('clinician_id', flat=True)
    )
    active_user_ids.discard(None)
    active_users_count = len(active_user_ids)
    
    # Get list of departments for filter dropdown
    departments = list(HospitalDepartment.objects.values('id', 'name').order_by('name'))
    
    return Response({
        'date_range': {
            'start': start_date.isoformat(),
            'end': end_date.isoformat(),
            'range_type': range_type
        },
        'referrals': {
            'total': total_referrals,
            'pending': pending_referrals,
            'accepted': accepted_referrals,
            'declined': declined_referrals,
            'acceptance_rate': acceptance_rate,
            'students_referred': students_referred,
            'trends': {
                'total': {'percentage': total_trend_pct, 'direction': total_trend_dir},
                'accepted': {'percentage': accepted_trend_pct, 'direction': accepted_trend_dir},
                'pending': {'percentage': pending_trend_pct, 'direction': pending_trend_dir},
                'declined': {'percentage': declined_trend_pct, 'direction': declined_trend_dir}
            }
        },
        'lab': {
            'total': total_lab_requests,
            'completed': completed_lab,
            'pending': pending_lab,
            'completion_rate': lab_completion_rate
        },
        'prescriptions': {
            'total': total_prescriptions,
            'dispensed': dispensed_rx,
            'out_of_stock': out_of_stock_rx,
            'pending': pending_rx,
            'fulfillment_rate': fulfillment_rate
        },
        'clinical_visits': visits_count,
        'most_active_clinician': most_active_clinician,
        'active_users': active_users_count,
        'department_breakdown': department_breakdown,
        'status_distribution': status_distribution,
        'departments': departments
    })
