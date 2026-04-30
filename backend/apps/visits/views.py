from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from config.permissions import IsAdminOrClinician, IsAdminRole
from .models import ClinicalVisit
from .serializers import ClinicalVisitSerializer


class ClinicalVisitViewSet(viewsets.ModelViewSet):
    queryset = ClinicalVisit.objects.select_related('student', 'clinician').all().order_by('-visit_date')
    serializer_class = ClinicalVisitSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAuthenticated(), IsAdminOrClinician()]
        if self.action == 'destroy':
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        serializer.save(clinician=self.request.user, is_locked=True)

    def update(self, request, *args, **kwargs):
        visit = self.get_object()

        if visit.is_locked and getattr(request.user, 'role', None) != 'admin':
            return Response(
                {'detail': 'This visit is locked. Only admin can edit it.'},
                status=status.HTTP_403_FORBIDDEN
            )

        return super().update(request, *args, **kwargs)