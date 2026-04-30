from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from config.permissions import IsAdminOrClinician, IsAdminRole
from .models import Student
from .serializers import StudentSerializer, StudentDetailSerializer


class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all().order_by('-created_at')
    lookup_field = 'university_id'

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return StudentDetailSerializer
        return StudentSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update']:
            return [IsAuthenticated(), IsAdminOrClinician()]
        if self.action == 'destroy':
            return [IsAuthenticated(), IsAdminRole()]
        return [IsAuthenticated()]