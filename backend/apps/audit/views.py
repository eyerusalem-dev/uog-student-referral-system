import csv
import io
from datetime import datetime

from django.db.models import Count, Q
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.views import APIView

from config.permissions import IsAdminRole
from .models import AuditLog, ACTION_TYPES, RESOURCE_TYPES
from .serializers import AuditLogSerializer


# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

def _apply_filters(qs, params):
    """Apply all query-string filters to a queryset."""

    # Keyword search across actor_username, action, resource_repr, resource_id
    q = params.get('q', '').strip()
    if q:
        qs = qs.filter(
            Q(actor_username__icontains=q) |
            Q(resource_repr__icontains=q)  |
            Q(resource_id__icontains=q)    |
            Q(action__icontains=q)
        )

    user_id = params.get('user_id', '').strip()
    if user_id:
        qs = qs.filter(actor_id=user_id)

    action = params.get('action', '').strip()
    if action:
        qs = qs.filter(action=action)

    resource_type = params.get('resource_type', '').strip()
    if resource_type:
        qs = qs.filter(resource_type=resource_type)

    date_from = params.get('date_from', '').strip()
    if date_from:
        try:
            dt = datetime.fromisoformat(date_from).replace(tzinfo=timezone.utc)
            qs = qs.filter(timestamp__gte=dt)
        except ValueError:
            pass

    date_to = params.get('date_to', '').strip()
    if date_to:
        try:
            dt = datetime.fromisoformat(date_to).replace(tzinfo=timezone.utc)
            qs = qs.filter(timestamp__lte=dt)
        except ValueError:
            pass

    return qs


# ─────────────────────────────────────────────────────────────────────────────
# List endpoint (read-only, admin-only, paginated)
# ─────────────────────────────────────────────────────────────────────────────

class AuditLogListView(APIView):
    permission_classes = [IsAdminRole]

    PAGE_SIZE = 50

    def get(self, request):
        qs = AuditLog.objects.select_related('actor').all()
        qs = _apply_filters(qs, request.query_params)

        total = qs.count()

        try:
            page = max(1, int(request.query_params.get('page', 1)))
        except (ValueError, TypeError):
            page = 1

        start = (page - 1) * self.PAGE_SIZE
        end   = start + self.PAGE_SIZE

        serializer = AuditLogSerializer(qs[start:end], many=True)

        return Response({
            'count':    total,
            'page':     page,
            'page_size': self.PAGE_SIZE,
            'num_pages': max(1, -(-total // self.PAGE_SIZE)),  # ceil division
            'results':  serializer.data,
        })


# ─────────────────────────────────────────────────────────────────────────────
# Detail endpoint (read-only, admin-only)
# ─────────────────────────────────────────────────────────────────────────────

class AuditLogDetailView(APIView):
    permission_classes = [IsAdminRole]

    def get(self, request, pk):
        try:
            entry = AuditLog.objects.get(pk=pk)
        except AuditLog.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(AuditLogSerializer(entry).data)


# ─────────────────────────────────────────────────────────────────────────────
# Aggregate metrics endpoint
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def audit_metrics(request):
    if not request.user or not request.user.is_authenticated or getattr(request.user, 'role', '') != 'admin':
        return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    qs = AuditLog.objects.all()
    qs = _apply_filters(qs, request.query_params)

    total = qs.count()

    by_action = list(
        qs.values('action').annotate(count=Count('id')).order_by('-count')
    )
    by_resource = list(
        qs.values('resource_type').annotate(count=Count('id')).order_by('-count')
    )
    by_actor = list(
        qs.values('actor_username', 'actor_role')
          .annotate(count=Count('id'))
          .order_by('-count')[:10]
    )

    return Response({
        'total':        total,
        'by_action':    by_action,
        'by_resource':  by_resource,
        'top_actors':   by_actor,
    })


# ─────────────────────────────────────────────────────────────────────────────
# CSV export endpoint (admin-only, streaming-friendly)
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def audit_export_csv(request):
    if not request.user or not request.user.is_authenticated or getattr(request.user, 'role', '') != 'admin':
        return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    from apps.audit.logger import AuditLogger
    AuditLogger.log(
        action='DATA_EXPORT',
        resource_type='system',
        resource_repr='Audit Log CSV Export',
        request=request,
        extra={'filters': dict(request.query_params)},
    )

    qs = AuditLog.objects.select_related('actor').all()
    qs = _apply_filters(qs, request.query_params)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'id', 'timestamp_utc', 'actor_username', 'actor_role',
        'action', 'resource_type', 'resource_id', 'resource_repr',
        'ip_address', 'user_agent',
        'before_state', 'after_state', 'extra',
    ])

    for entry in qs.iterator(chunk_size=500):
        writer.writerow([
            entry.id,
            entry.timestamp.strftime('%Y-%m-%dT%H:%M:%S.%f') + 'Z',
            entry.actor_username,
            entry.actor_role,
            entry.action,
            entry.resource_type,
            entry.resource_id,
            entry.resource_repr,
            entry.ip_address or '',
            entry.user_agent,
            entry.before_state or '',
            entry.after_state or '',
            entry.extra or '',
        ])

    response = HttpResponse(output.getvalue(), content_type='text/csv')
    filename = f"audit_log_{timezone.now().strftime('%Y%m%d_%H%M%S')}.csv"
    response['Content-Disposition'] = f'attachment; filename="{filename}"'
    return response


# ─────────────────────────────────────────────────────────────────────────────
# Enum helper endpoints
# ─────────────────────────────────────────────────────────────────────────────

@api_view(['GET'])
def audit_enums(request):
    """Return available action/resource enum values for filter dropdowns."""
    if not request.user or not request.user.is_authenticated or getattr(request.user, 'role', '') != 'admin':
        return Response({'detail': 'Forbidden.'}, status=status.HTTP_403_FORBIDDEN)

    return Response({
        'actions':        [(v, l) for v, l in ACTION_TYPES.choices],
        'resource_types': [(v, l) for v, l in RESOURCE_TYPES.choices],
    })
