from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from config.permissions import IsAdminRole
from .models import HospitalDepartment
from .serializers import DepartmentSerializer


class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = HospitalDepartment.objects.all().order_by('name')
    serializer_class = DepartmentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]