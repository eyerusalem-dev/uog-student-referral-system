from rest_framework import viewsets
from .models import ClinicalVisit
from .serializers import ClinicalVisitSerializer
from rest_framework.permissions import IsAuthenticated
from config.permissions import IsAdminRole, IsAdminOrClinician

class ClinicalVisitViewSet(viewsets.ModelViewSet):
    queryset = ClinicalVisit.objects.all()
    serializer_class = ClinicalVisitSerializer
    permission_classes = [IsAuthenticated]

    def get_permissions(self):
        if self.action == 'create':
            return [IsAuthenticated(), IsAdminOrClinician()]
        if self.action in ['update', 'partial_update']:
            # Logic: Only admin can edit if is_locked is True
            return [IsAuthenticated()] 
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        # AUTO-SET clinician to current user and lock the visit
        serializer.save(clinician=self.request.user, is_locked=True)